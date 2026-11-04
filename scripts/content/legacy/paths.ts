/** The old site's origin. Links to it are rewritten; it is never contacted. */
export const LEGACY_ORIGIN = 'https://tmuh-education.tmuh.org.tw';
export const LEGACY_HOSTS = new Set(['tmuh-education.tmuh.org.tw']);

/** The one query the old site's routing depended on: `other/downloadfile?fName=…`. */
export const DOWNLOAD_FILE_PATH = '/other/downloadfile';
export const DOWNLOAD_FILE_QUERY_KEY = 'fName';

export type LegacyLocation = {
  /** Decoded path with a leading slash, original case, without `.html` or query. */
  readonly path: string;
  /** Decoded query parameters in their original order. */
  readonly query: readonly (readonly [string, string])[];
};

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function splitQuery(raw: string): (readonly [string, string])[] {
  if (raw.length === 0) return [];
  return raw.split('&').filter((pair) => pair.length > 0).map((pair) => {
    const index = pair.indexOf('=');
    const key = index === -1 ? pair : pair.slice(0, index);
    const value = index === -1 ? '' : pair.slice(index + 1);
    return [safeDecode(key.replace(/\+/g, ' ')), safeDecode(value.replace(/\+/g, ' '))] as const;
  });
}

function stripHtmlSuffix(path: string): string {
  return path.replace(/\.html?$/i, '');
}

/**
 * The old URL a mirror file was saved from. wget writes `news?page=3.html` for `/news?page=3`
 * and keeps percent escapes inside the query part of the file name, so the query is split off
 * first and decoded on its own.
 */
export function legacyLocationFromMirrorFile(relativeFile: string): LegacyLocation {
  const normalized = relativeFile.split(/[\\/]+/).filter(Boolean).join('/');
  const queryIndex = normalized.indexOf('?');
  const pathPart = queryIndex === -1 ? normalized : normalized.slice(0, queryIndex);
  const queryPart = queryIndex === -1 ? '' : normalized.slice(queryIndex + 1);
  if (queryIndex === -1) return { path: `/${stripHtmlSuffix(pathPart)}`, query: [] };
  return { path: `/${pathPart}`, query: splitQuery(stripHtmlSuffix(queryPart)) };
}

/**
 * Resolves an href found on a mirror page (relative to that page's file, or an absolute URL on
 * the old host) to the old-site location it points at. Returns undefined for other hosts.
 */
export function legacyLocationFromHref(href: string, pageRelativeFile: string): LegacyLocation | undefined {
  let url: URL;
  try {
    url = new URL(href, `${LEGACY_ORIGIN}/${pageRelativeFile.split(/[\\/]+/).map(encodeURIComponent).join('/')}`);
  } catch {
    return undefined;
  }
  if (!LEGACY_HOSTS.has(url.hostname.toLowerCase())) return undefined;
  // wget rewrites `downloadfile?fName=…` links to `downloadfile%3FfName=%252F…` file names, so a
  // decoded path may still carry the original query.
  let path = safeDecode(url.pathname);
  let queryPart = url.search.replace(/^\?/, '');
  const embedded = path.indexOf('?');
  if (embedded !== -1) {
    queryPart = [path.slice(embedded + 1), queryPart].filter(Boolean).join('&');
    path = path.slice(0, embedded);
  }
  return { path: stripHtmlSuffix(path) || '/', query: splitQuery(stripHtmlSuffix(queryPart)) };
}

/**
 * The redirect-table key for an old path: lowercase, no trailing slash, no `.html`. The query is
 * ignored except for the download handler, whose `fName` selects the file.
 */
export function normalizeLegacyPath(path: string): string {
  const decoded = safeDecode(path.split('#')[0]?.split('?')[0] ?? '');
  const collapsed = `/${decoded.split('/').filter(Boolean).join('/')}`;
  return stripHtmlSuffix(collapsed).toLowerCase();
}

/** The decoded `fName` of a download-handler location, if that is what it is. */
export function downloadFileName(location: LegacyLocation): string | undefined {
  if (normalizeLegacyPath(location.path) !== DOWNLOAD_FILE_PATH) return undefined;
  return location.query.find(([key]) => key.toLowerCase() === DOWNLOAD_FILE_QUERY_KEY.toLowerCase())?.[1];
}

/** Display form of a location, for reports. */
export function formatLegacyLocation(location: LegacyLocation): string {
  if (location.query.length === 0) return location.path;
  return `${location.path}?${location.query.map(([key, value]) => `${key}=${value}`).join('&')}`;
}
