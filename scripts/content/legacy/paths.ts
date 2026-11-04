import {
  DOWNLOAD_FILE_PATH,
  DOWNLOAD_FILE_QUERY_KEY,
  normalizeLegacyPath,
  safeDecode,
  stripHtmlSuffix,
} from '../../../src/app/legacyPaths';

/** The old site's origin. Links to it are rewritten; it is never contacted. */
export const LEGACY_ORIGIN = 'https://tmuh-education.tmuh.org.tw';
export const LEGACY_HOSTS = new Set(['tmuh-education.tmuh.org.tw']);

// The normalizer and the download-handler constants are shared with the SPA's redirect resolver,
// so the table's keys and the browser's lookups cannot drift apart.
export { DOWNLOAD_FILE_PATH, DOWNLOAD_FILE_QUERY_KEY, normalizeLegacyPath };

export type LegacyLocation = {
  /** Decoded path with a leading slash, original case, without `.html` or query. */
  readonly path: string;
  /** Decoded query parameters in their original order. */
  readonly query: readonly (readonly [string, string])[];
};

function splitQuery(raw: string): (readonly [string, string])[] {
  if (raw.length === 0) return [];
  return raw.split('&').filter((pair) => pair.length > 0).map((pair) => {
    const index = pair.indexOf('=');
    const key = index === -1 ? pair : pair.slice(0, index);
    const value = index === -1 ? '' : pair.slice(index + 1);
    return [safeDecode(key.replace(/\+/g, ' ')), safeDecode(value.replace(/\+/g, ' '))] as const;
  });
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
