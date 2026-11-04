import { LEGACY_PATH_PREFIXES } from './routes';

/*
 * Old-site (tmuh-education.tmuh.org.tw) path handling shared by the importer, which writes the
 * redirect table, and the SPA, which reads it. Both sides must normalize identically, so this
 * module is plain functions with no browser or Node dependencies.
 */

/** The one query the old site's routing depended on: `other/downloadfile?fName=…`. */
export const DOWNLOAD_FILE_PATH = '/other/downloadfile';
export const DOWNLOAD_FILE_QUERY_KEY = 'fName';

export type LegacyQueryRule = {
  readonly path: string;
  readonly key: string;
  readonly value: string;
  readonly to: string;
};

/** `src/data/legacy/redirects.json`, written by `npm run content:import-legacy`. */
export type LegacyRedirectTable = {
  readonly version: 1;
  /** normalized old path → new path */
  readonly exact: Readonly<Record<string, string>>;
  /** Old paths whose query selects the destination (the download handler's `fName`). */
  readonly query: readonly LegacyQueryRule[];
};

export type LegacyQuery = readonly (readonly [string, string])[];

export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function stripHtmlSuffix(path: string): string {
  return path.replace(/\.html?$/i, '');
}

/**
 * The redirect-table key for an old path: percent-decoded, lowercase, no repeated or trailing
 * slash, no `.html`. The query and hash are dropped; only the download handler's `fName` is
 * matched, by the query rules.
 */
export function normalizeLegacyPath(path: string): string {
  const decoded = safeDecode(path.split('#')[0]?.split('?')[0] ?? '');
  const collapsed = `/${decoded.split('/').filter(Boolean).join('/')}`;
  return stripHtmlSuffix(collapsed).toLowerCase();
}

/** Whether a path's first segment is one the old site used, so the table could hold it. */
export function hasLegacyPrefix(path: string): boolean {
  const first = normalizeLegacyPath(path).split('/')[1] ?? '';
  return (LEGACY_PATH_PREFIXES as readonly string[]).includes(first);
}

/** Query rules first (key compared case-insensitively, value exactly), then the exact table. */
export function resolveInLegacyTable(
  table: Pick<LegacyRedirectTable, 'exact' | 'query'>,
  path: string,
  query: LegacyQuery,
): string | undefined {
  const normalized = normalizeLegacyPath(path);
  for (const rule of table.query) {
    if (rule.path !== normalized) continue;
    if (query.some(([key, value]) => key.toLowerCase() === rule.key.toLowerCase() && value === rule.value)) return rule.to;
  }
  return Object.prototype.hasOwnProperty.call(table.exact, normalized) ? table.exact[normalized] : undefined;
}
