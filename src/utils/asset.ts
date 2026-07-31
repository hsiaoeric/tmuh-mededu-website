/**
 * Build a URL for a file in `public/`.
 *
 * Vite rewrites asset URLs in index.html and in bundled imports, but not
 * strings assembled at runtime — a root-absolute `/assets/…` would therefore
 * 404 wherever the site is served from a sub-path, as it is on GitHub Pages.
 * `BASE_URL` already ends in a slash.
 */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
