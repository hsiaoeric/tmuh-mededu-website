import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import sharp from 'sharp';
import { inlineImage, INLINE_IMAGE_SCHEME } from './parsePage';
import { legacyLocationFromHref } from './paths';

/** Where an image is used; it decides the output folder under `public/assets/legacy/`. */
export type ImageCategory = 'article' | 'album' | 'board' | 'page';

export const IMAGE_SETTINGS = { maxEdge: 1600, quality: 78, effort: 6 } as const;

export type ImageManifestEntry = {
  /** `/UploadFile/…` (decoded) for mirror files, `data:<type>;sha256=<hex>` for inline images. */
  readonly source: string;
  /** Path under `public/`, as a local media reference uses it. */
  readonly path: string;
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
};

export type ImageManifest = { readonly version: 1; readonly settings: typeof IMAGE_SETTINGS; readonly images: readonly ImageManifestEntry[] };

export type ImageSource =
  | { readonly status: 'file'; readonly key: string; readonly file: string }
  | { readonly status: 'data'; readonly key: string; readonly data: Buffer }
  | { readonly status: 'missing'; readonly key: string }
  | { readonly status: 'external'; readonly url: string }
  | { readonly status: 'invalid'; readonly src: string };

function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Locates the bytes behind an `<img src>` on a mirror page: inline `data:` images are decoded;
 * paths on the old host are looked up in the mirror. Nothing is fetched — other hosts, and old
 * host files the mirror lacks, are reported instead.
 */
export function locateImage(src: string, pageRelativeFile: string, mirrorRoot: string): ImageSource {
  const trimmed = src.trim();
  if (trimmed.startsWith(INLINE_IMAGE_SCHEME)) {
    const inline = inlineImage(trimmed);
    return inline === undefined
      ? { status: 'invalid', src: trimmed }
      : { status: 'data', key: `data:${inline.type};sha256=${inline.digest}`, data: inline.data };
  }
  const data = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(trimmed);
  if (data !== null) {
    const bytes = Buffer.from((data[2] ?? '').replace(/\s+/g, ''), 'base64');
    if (bytes.length === 0) return { status: 'invalid', src: trimmed.slice(0, 60) };
    return { status: 'data', key: `data:${(data[1] ?? '').toLowerCase()};sha256=${sha256(bytes)}`, data: bytes };
  }
  if (/^data:/i.test(trimmed)) return { status: 'invalid', src: trimmed.slice(0, 60) };
  const location = legacyLocationFromHref(trimmed, pageRelativeFile);
  if (location === undefined) return { status: 'external', url: trimmed };
  const file = join(mirrorRoot, ...location.path.split('/').filter(Boolean));
  if (!existsSync(file) || !statSync(file).isFile()) return { status: 'missing', key: location.path };
  return { status: 'file', key: location.path, file };
}

export class ImageStoreError extends Error {
  readonly name = 'ImageStoreError';
}

export type ImageStoreOptions = {
  /** The repository's `public/` directory. */
  readonly publicRoot: string;
  /** Convert images (`--images`); otherwise every image must already be in the manifest. */
  readonly convert: boolean;
  /** Reuse an existing output file when the manifest already lists it (`--skip-existing`). */
  readonly skipExisting: boolean;
  readonly previous: readonly ImageManifestEntry[];
};

/**
 * Converts mirror images to content-addressed WebP under `public/assets/legacy/<category>/`:
 * EXIF orientation applied, metadata stripped, alpha kept, long edge at most 1600 px.
 */
export class ImageStore {
  private readonly entries = new Map<string, ImageManifestEntry>();
  private readonly previous: Map<string, ImageManifestEntry>;

  constructor(private readonly options: ImageStoreOptions) {
    this.previous = new Map(options.previous.map((entry) => [entry.source, entry]));
  }

  get(key: string): ImageManifestEntry | undefined {
    return this.entries.get(key);
  }

  async ensure(source: Extract<ImageSource, { status: 'file' | 'data' }>, category: ImageCategory): Promise<ImageManifestEntry> {
    const existing = this.entries.get(source.key);
    if (existing !== undefined) return existing;
    const input = source.status === 'file' ? readFileSync(source.file) : source.data;
    const path = `assets/legacy/${category}/${sha256(input).slice(0, 20)}.webp`;
    const output = join(this.options.publicRoot, ...path.split('/'));
    const previous = this.previous.get(source.key);
    let entry: ImageManifestEntry;
    if (!this.options.convert || (this.options.skipExisting && previous?.path === path && existsSync(output))) {
      if (previous === undefined || previous.path !== path) {
        throw new ImageStoreError(`Image ${source.key} is not in the manifest; rerun with --images`);
      }
      entry = previous;
    } else {
      const { data, info } = await sharp(input, { failOn: 'none', animated: false })
        .rotate()
        .resize({ width: IMAGE_SETTINGS.maxEdge, height: IMAGE_SETTINGS.maxEdge, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: IMAGE_SETTINGS.quality, effort: IMAGE_SETTINGS.effort })
        .toBuffer({ resolveWithObject: true });
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, data);
      entry = { source: source.key, path, width: info.width, height: info.height, bytes: data.length };
    }
    this.entries.set(source.key, entry);
    return entry;
  }

  manifest(): ImageManifest {
    const images = [...this.entries.values()].sort((left, right) => (left.source < right.source ? -1 : left.source > right.source ? 1 : 0));
    return { version: 1, settings: IMAGE_SETTINGS, images };
  }

  /** Deletes converted files no manifest entry points at any more. Returns the removed paths. */
  pruneOutputs(): string[] {
    const keep = new Set([...this.entries.values()].map((entry) => entry.path));
    const root = join(this.options.publicRoot, 'assets', 'legacy');
    const removed: string[] = [];
    if (!existsSync(root)) return removed;
    const visit = (directory: string): void => {
      for (const item of readdirSync(directory, { withFileTypes: true })) {
        const file = join(directory, item.name);
        if (item.isDirectory()) visit(file);
        else {
          const path = relative(this.options.publicRoot, file).split(sep).join('/');
          if (!keep.has(path)) {
            rmSync(file);
            removed.push(path);
          }
        }
      }
    };
    visit(root);
    return removed.sort();
  }
}
