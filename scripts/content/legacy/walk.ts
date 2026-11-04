import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { legacyLocationFromMirrorFile, type LegacyLocation } from './paths';

export type MirrorPage = {
  /** Absolute path of the saved file. */
  readonly file: string;
  /** Path relative to the mirror root, with forward slashes. */
  readonly relativeFile: string;
  readonly location: LegacyLocation;
};

/** Saved responses of the download handler keep the served file's extension, not `.html`. */
function isPageFile(name: string): boolean {
  return /\.html?$/i.test(name) || /^downloadfile\?/i.test(name);
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/**
 * Every page the mirror holds, in a stable order. The mirror is only read: nothing in it is
 * executed or imported.
 */
export function walkMirror(root: string): MirrorPage[] {
  const pages: MirrorPage[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && isPageFile(entry.name)) {
        const relativeFile = relative(root, file).split(sep).join('/');
        pages.push({ file, relativeFile, location: legacyLocationFromMirrorFile(relativeFile) });
      }
    }
  };
  visit(root);
  return pages.sort((left, right) => compareText(left.relativeFile, right.relativeFile));
}
