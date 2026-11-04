import {
  hasLegacyPrefix,
  resolveInLegacyTable,
  safeDecode,
  type LegacyQuery,
  type LegacyRedirectTable,
} from './legacyPaths';

/*
 * Old-site URLs (tmuh-education.tmuh.org.tw) reach the catch-all route; this resolves them
 * against the importer's redirect table. The table is loaded on demand so its ~700 entries stay
 * out of the main chunk, and only for paths whose first segment the old site used.
 */

export type LegacyRedirect =
  /** A page or section of this app: navigate there with the router. */
  | { readonly kind: 'route'; readonly to: string }
  /** A home-page section (`/#contact`): scrolled to by the home page. */
  | { readonly kind: 'home-section'; readonly section: string }
  /** A static file under `public/` (converted images, copied downloads): leave the app. */
  | { readonly kind: 'file'; readonly path: string };

let tablePromise: Promise<LegacyRedirectTable> | undefined;

/** The redirect table, fetched once as its own chunk. */
export function loadLegacyRedirectTable(): Promise<LegacyRedirectTable> {
  tablePromise ??= import('@/data/legacy/redirects.json').then(
    (module) => module.default as LegacyRedirectTable,
    (error: unknown) => {
      tablePromise = undefined;
      throw error;
    },
  );
  return tablePromise;
}

/**
 * Removes the deployment base (`/tmuh-mededu-website/` on Pages) from a pathname that still
 * carries it. The router's `location.pathname` is already relative to its basename, which is
 * the same `BASE_URL`, so for router paths this is a no-op.
 */
export function stripDeploymentBase(pathname: string, base: string): string {
  const prefix = base.replace(/\/+$/, '');
  if (prefix === '') return pathname;
  if (pathname === prefix) return '/';
  return pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname;
}

function queryPairs(search: string): LegacyQuery {
  return [...new URLSearchParams(search)].map(([key, value]) => [key, value] as const);
}

/** Targets under `public/` that the router must not try to render. */
const STATIC_FILE_PATTERN = /^\/(?:assets|files)\//;

export function classifyLegacyTarget(to: string): LegacyRedirect {
  if (STATIC_FILE_PATTERN.test(to)) return { kind: 'file', path: to };
  const home = /^\/#(.+)$/.exec(to);
  if (home !== null) return { kind: 'home-section', section: safeDecode(home[1] ?? '') };
  return { kind: 'route', to };
}

/** Whether the path could be an old-site URL at all; anything else is simply not found. */
export function mayBeLegacyPath(pathname: string, base: string = import.meta.env.BASE_URL): boolean {
  return hasLegacyPrefix(stripDeploymentBase(pathname, base));
}

/** Resolves an old URL against an already loaded table. The old query is never carried over. */
export function resolveLegacyPathIn(
  table: LegacyRedirectTable,
  pathname: string,
  search: string,
  base: string = import.meta.env.BASE_URL,
): LegacyRedirect | undefined {
  const path = stripDeploymentBase(pathname, base);
  if (!hasLegacyPrefix(path)) return undefined;
  const to = resolveInLegacyTable(table, path, queryPairs(search));
  return to === undefined ? undefined : classifyLegacyTarget(to);
}

/** Resolves an old URL (`/news/info/N002/4`, `/Other/Links?page=1`, …) to its new location. */
export async function resolveLegacyPath(
  pathname: string,
  search: string,
  base: string = import.meta.env.BASE_URL,
): Promise<LegacyRedirect | undefined> {
  if (!mayBeLegacyPath(pathname, base)) return undefined;
  return resolveLegacyPathIn(await loadLegacyRedirectTable(), pathname, search, base);
}
