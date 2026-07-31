import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

/**
 * GitHub Pages serves static files only — there is no rewrite rule, so a deep
 * link like `/centers/holistic-care` never reaches index.html and the SPA never
 * boots. Pages does serve `404.html` for any unmatched path, so shipping a copy
 * of the app there makes deep links work: the app loads, react-router reads
 * `location.pathname` and renders the right page.
 *
 * Hosts that can rewrite (Vercel, via vercel.json) ignore this file entirely.
 */
function githubPagesFallback(): Plugin {
  return {
    name: 'github-pages-spa-fallback',
    apply: 'build',
    closeBundle() {
      copyFileSync('dist/index.html', 'dist/404.html');
    },
  };
}

export default defineConfig({
  /*
   * Root by default, which is what Vercel serves. The Pages workflow sets
   * VITE_BASE to the repository sub-path it publishes under. Keeping it an
   * environment variable rather than a hardcoded string means this branch can
   * still be deployed to the root of a custom domain unchanged.
   */
  base: process.env.VITE_BASE || '/',
  plugins: [react(), githubPagesFallback()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
