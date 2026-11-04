function trimmed(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

/** True when `pathname` is `section` itself or a page beneath it (whole segments only). */
export function isWithin(pathname: string, section: string): boolean {
  const path = trimmed(pathname);
  return path === section || path.startsWith(`${section}/`);
}

/**
 * Current-location attributes for a nav entry: `data-active` lights it for the whole section, and
 * `aria-current` says `page` on the exact page and `true` on a page beneath it.
 */
export function currentProps(pathname: string, section: string) {
  const path = trimmed(pathname);
  const within = isWithin(path, section);
  return {
    'data-active': within,
    'aria-current': path === section ? ('page' as const) : within ? ('true' as const) : undefined,
  };
}
