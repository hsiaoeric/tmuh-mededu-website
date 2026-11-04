import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { LegacyRedirectTable } from '../../../src/app/legacyPaths';
import {
  VERCEL_REDIRECT_BUDGET,
  VERCEL_REDIRECT_LIMIT,
  VercelRedirectError,
  buildVercelRedirects,
  caseInsensitiveSource,
  renderRedirectTsv,
  renderVercelConfig,
  type VercelRedirect,
} from './vercelRedirects';

const repo = (path: string) => fileURLToPath(new URL(`../../../${path}`, import.meta.url));
const read = (path: string) => readFileSync(repo(path), 'utf8');
const TABLE = JSON.parse(read('src/data/legacy/redirects.json')) as LegacyRedirectTable;
const VERCEL_TEXT = read('vercel.json');
const VERCEL = JSON.parse(VERCEL_TEXT) as { redirects: VercelRedirect[]; rewrites: unknown };

/**
 * Vercel compiles `source` with path-to-regexp; each of ours is `/(<regex>)`, one unnamed group,
 * which compiles to exactly `^/(?:<regex>)$`.
 */
function sourceRegex(source: string): RegExp {
  const match = /^\/\((.*)\)$/.exec(source);
  if (match === null) throw new Error(`unexpected source ${source}`);
  return new RegExp(`^/(?:${match[1]})$`);
}

/** The first redirect Vercel would apply, in file order. */
function vercelMatch(path: string, query: Readonly<Record<string, string>> = {}): string | undefined {
  return VERCEL.redirects.find((redirect) => sourceRegex(redirect.source).test(path)
    && (redirect.has ?? []).every((condition) => query[condition.key] !== undefined && new RegExp(condition.value).test(query[condition.key]!)))?.destination;
}

describe('vercel.json redirects', () => {
  it('is in sync with the redirect table and keeps the SPA rewrite as written', () => {
    expect(renderVercelConfig(VERCEL_TEXT, TABLE)).toBe(VERCEL_TEXT);
    expect(VERCEL_TEXT).toContain('  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]\n}\n');
    expect(VERCEL.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }]);
  });

  it('stays well inside Vercel’s limit, leaving per-image entries to the SPA', () => {
    const uploads = Object.keys(TABLE.exact).filter((from) => from.startsWith('/uploadfile/')).length;
    expect(VERCEL.redirects.length).toBe(Object.keys(TABLE.exact).length - uploads + TABLE.query.length);
    expect(VERCEL.redirects.length).toBeLessThanOrEqual(VERCEL_REDIRECT_BUDGET);
    expect(VERCEL_REDIRECT_BUDGET).toBeLessThan(VERCEL_REDIRECT_LIMIT);
    expect(VERCEL.redirects.every((redirect) => redirect.permanent === true)).toBe(true);
    expect(VERCEL.redirects.some((redirect) => /[Uu]\]\[[Pp]\]\[[Ll]\]\[[Oo]\]\[[Aa]\]\[[Dd]\]/.test(redirect.source))).toBe(false);
  });

  it('matches every listed old path in any case, with .html or a trailing slash', () => {
    const misses: string[] = [];
    for (const [from, to] of Object.entries(TABLE.exact)) {
      if (from.startsWith('/uploadfile/') || from === '/other/downloadfile') continue;
      for (const variant of [from, from.toUpperCase(), `${from}/`, `${from}.html`]) {
        if (vercelMatch(variant) !== to) misses.push(`${variant} → ${vercelMatch(variant)}`);
      }
    }
    expect(misses).toEqual([]);
    expect(vercelMatch('/News/Info/N002/4')).toBe(TABLE.exact['/news/info/n002/4']);
    expect(vercelMatch('/centers/clinical-skills')).toBeUndefined();
    expect(vercelMatch('/newsx')).toBeUndefined();
    expect(vercelMatch('/')).toBeUndefined();
  });

  it('checks download rules on fName before the plain download path', () => {
    for (const rule of TABLE.query) expect(vercelMatch('/Other/DownloadFile', { [rule.key]: rule.value })).toBe(rule.to);
    expect(vercelMatch('/other/downloadfile', { fName: '/elsewhere.pdf' })).toBe(TABLE.exact['/other/downloadfile']);
    expect(vercelMatch('/other/downloadfile')).toBe(TABLE.exact['/other/downloadfile']);
  });

  it('rejects keys it cannot express and self-redirects', () => {
    expect(caseInsensitiveSource('/news/cate/n006')).toBe('/([Nn][Ee][Ww][Ss]/[Cc][Aa][Tt][Ee]/[Nn]006(?:\\.[Hh][Tt][Mm][Ll]?)?/?)');
    expect(caseInsensitiveSource('/center/video/digital/youtube.com/watch')).toContain('[Bb][Ee]\\.[Cc][Oo][Mm]/');
    expect(() => caseInsensitiveSource('/news/(x)')).toThrow(VercelRedirectError);
    expect(() => buildVercelRedirects({ version: 1, exact: { '/news': '/news' }, query: [] })).toThrow(VercelRedirectError);
  });
});

describe('deploy/legacy-redirects.tsv', () => {
  it('is in sync with the redirect table and lists every entry once', () => {
    const text = read('deploy/legacy-redirects.tsv');
    expect(renderRedirectTsv(TABLE)).toBe(text);
    const rows = text.split('\n').filter((line) => line.length > 0 && !line.startsWith('#')).map((line) => line.split('\t'));
    expect(rows[0]).toEqual(['from', 'to', 'status']);
    const body = rows.slice(1);
    expect(body).toHaveLength(Object.keys(TABLE.exact).length + TABLE.query.length);
    expect(body.every((row) => row.length === 3 && row[2] === '301')).toBe(true);
    expect(body.slice(0, TABLE.query.length).every(([from]) => from?.startsWith('/other/downloadfile?fName='))).toBe(true);
  });
});
