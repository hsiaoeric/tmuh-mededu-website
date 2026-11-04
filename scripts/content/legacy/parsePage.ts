import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { JSDOM, type LegacyDocument, type LegacyElement } from 'jsdom';
import type { OwnerId } from '../../../src/content/contracts/archiveIds';
import type { LegacyView } from './classify';
import { parseLegacyDate, singleLine } from './text';
import type { MirrorPage } from './walk';

let parser: { parseFromString(html: string, type: 'text/html'): LegacyDocument } | undefined;

/**
 * Parses markup into an inert document (no scripts, no subresources). Every document comes from
 * one shared jsdom window's DOMParser: separate JSDOM instances are never freed once queried,
 * which exhausts the heap over a few hundred pages.
 */
export function parseHtml(html: string): LegacyDocument {
  parser ??= new (new JSDOM('').window.DOMParser)();
  return parser.parseFromString(html, 'text/html');
}

export const INLINE_IMAGE_SCHEME = 'legacy-inline:';
const inlineImages = new Map<string, { readonly type: string; readonly data: Buffer }>();

/**
 * Moves inline `data:` images out of the markup before jsdom sees it. Pasted screenshots made
 * some old pages several megabytes of base64, which jsdom multiplies many times over in memory.
 * Each image is replaced by `legacy-inline:<sha256>` and kept once, by digest.
 */
export function extractInlineImages(html: string): string {
  return html.replace(/(\ssrc\s*=\s*)(["'])data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)\2/gi, (_match, prefix: string, quote: string, type: string, base64: string) => {
    const data = Buffer.from(base64.replace(/\s+/g, ''), 'base64');
    const digest = createHash('sha256').update(data).digest('hex');
    inlineImages.set(digest, { type: type.toLowerCase(), data });
    return `${prefix}${quote}${INLINE_IMAGE_SCHEME}${digest}${quote}`;
  });
}

/** The inline image behind a `legacy-inline:` reference. */
export function inlineImage(src: string): { readonly type: string; readonly data: Buffer; readonly digest: string } | undefined {
  if (!src.startsWith(INLINE_IMAGE_SCHEME)) return undefined;
  const digest = src.slice(INLINE_IMAGE_SCHEME.length);
  const image = inlineImages.get(digest);
  return image === undefined ? undefined : { ...image, digest };
}

/** Parses a mirror file (data only; nothing in it runs). */
export function loadMirrorDocument(file: string): LegacyDocument {
  return parseHtml(extractInlineImages(readFileSync(file, 'utf8')));
}

export function elements(list: ArrayLike<LegacyElement>): LegacyElement[] {
  return Array.from(list);
}

const PLACEHOLDER_IMAGE = /(?:^|\/)assets\/images\/no-image\.[a-z]+$/i;

/** An `src` worth importing: present and not the theme's "no image" placeholder. */
export function meaningfulImageSource(src: string | null | undefined): string | undefined {
  const trimmed = (src ?? '').trim();
  if (trimmed.length === 0 || PLACEHOLDER_IMAGE.test(trimmed.split('?')[0] ?? '')) return undefined;
  return trimmed;
}

export type ArticleFields = {
  readonly title: string;
  readonly date?: string;
  /** Category code from the article's own category link (`N002`, `BOARD01`). */
  readonly categoryCode?: string;
  readonly coverSrc?: string;
  readonly portraitSrc?: string;
  readonly body?: LegacyElement;
};

/** The article body: the first `.post__desc` that is not the centred "back" button row. */
export function articleBody(document: LegacyDocument): LegacyElement | undefined {
  return elements(document.querySelectorAll('.post__desc')).find((element) => !element.classList.contains('text-center')
    && element.querySelector('a[href^="javascript:history"]') === null);
}

/** Reads the fields every old article template shares. */
export function extractArticle(document: LegacyDocument): ArticleFields {
  const titleElement = elements(document.querySelectorAll('.post__title'))
    .find((element) => element.closest('.widget, aside, .sidebar') === null);
  const title = singleLine(titleElement?.textContent);
  const date = parseLegacyDate(document.querySelector('.post__meta-date')?.textContent);
  const categoryHref = document.querySelector('.post__meta-cat a')?.getAttribute('href') ?? '';
  const categoryCode = /\/cate\/([A-Za-z0-9]+)\.html/.exec(categoryHref.trim())?.[1]?.toUpperCase();
  const coverSrc = meaningfulImageSource(document.querySelector('.post-item .post__img img')?.getAttribute('src'));
  const portraitSrc = meaningfulImageSource(document.querySelector('img.photo')?.getAttribute('src'));
  const body = articleBody(document);
  return {
    title,
    ...(date === undefined ? {} : { date }),
    ...(categoryCode === undefined ? {} : { categoryCode }),
    ...(coverSrc === undefined ? {} : { coverSrc }),
    ...(portraitSrc === undefined ? {} : { portraitSrc }),
    ...(body === undefined ? {} : { body }),
  };
}

export type PostViewGroup = {
  readonly postId: string;
  /** Every mirror page that showed this article, primary first. */
  readonly pages: readonly MirrorPage[];
  /** `N00x`, `BOARD0x`, or a center section code (`ABT05`, `EVT03`). */
  readonly code?: string;
  readonly centerOwner?: OwnerId;
};

type PostView = Extract<LegacyView, { kind: 'post' }>;

export class LegacyImportError extends Error {
  readonly name = 'LegacyImportError';
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/**
 * Groups the duplicate views of one article (`/news/info/185`, `/news/info/news/185`,
 * `/news/info/n007/185`, …) by their numeric id. The old site drew every article from one
 * table, so an id seen under two different codes or centers is a data error and fails the import.
 */
export function groupPostViews(entries: readonly { readonly page: MirrorPage; readonly view: PostView }[]): PostViewGroup[] {
  const groups = new Map<string, { pages: MirrorPage[]; codes: Set<string>; owners: Set<OwnerId> }>();
  for (const { page, view } of entries) {
    const group = groups.get(view.postId) ?? { pages: [], codes: new Set<string>(), owners: new Set<OwnerId>() };
    group.pages.push(page);
    if (view.code !== undefined) group.codes.add(view.code);
    if (view.centerOwner !== undefined) group.owners.add(view.centerOwner);
    groups.set(view.postId, group);
  }
  const result: PostViewGroup[] = [];
  for (const [postId, group] of groups) {
    if (group.codes.size > 1 || group.owners.size > 1) {
      throw new LegacyImportError(`Article ${postId} appears under conflicting codes: ${[...group.codes, ...group.owners].join(', ')}`);
    }
    const [code] = group.codes;
    const [centerOwner] = group.owners;
    // A coded view (n00x, BOARD0x, a center section) carries the category; list it first.
    const pages = [...group.pages].sort((left, right) => {
      const leftCoded = /\/(?:n00\d|board0\d|abt0\d|evt0\d)\//i.test(left.location.path) ? 0 : 1;
      const rightCoded = /\/(?:n00\d|board0\d|abt0\d|evt0\d)\//i.test(right.location.path) ? 0 : 1;
      return leftCoded - rightCoded || compareText(left.relativeFile, right.relativeFile);
    });
    result.push({
      postId,
      pages,
      ...(code === undefined ? {} : { code }),
      ...(centerOwner === undefined ? {} : { centerOwner }),
    });
  }
  return result.sort((left, right) => Number(left.postId) - Number(right.postId));
}
