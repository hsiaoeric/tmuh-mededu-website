// @vitest-environment jsdom

import { createRoutesFromChildren, matchRoutes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import table from '@/data/legacy/redirects.json';
import snapshot from '@/content/generated/cms-snapshot.json';
import { PUBLIC_ROUTES } from './App';
import { hasLegacyPrefix, normalizeLegacyPath, type LegacyRedirectTable } from './legacyPaths';
import {
  classifyLegacyTarget,
  loadLegacyRedirectTable,
  mayBeLegacyPath,
  resolveLegacyPath,
  resolveLegacyPathIn,
  stripDeploymentBase,
} from './legacyRedirects';
import { SLUG_TO_CENTER } from './routes';

vi.mock('@/webgl/TissueField', () => ({ TissueField: () => null }));
vi.mock('@/motion/gsap', () => ({
  gsap: { context: () => ({ revert: () => undefined }), registerPlugin: () => undefined, ticker: { add: () => undefined, remove: () => undefined } },
  ScrollTrigger: { refresh: () => undefined, update: () => undefined },
  EASE: { out: 'expo.out', soft: 'power3.out', inOut: 'power2.inOut' },
  prefersReducedMotion: () => true,
}));

const TABLE = table as LegacyRedirectTable;
const PAGES_BASE = '/tmuh-mededu-website/';
const ROUTES = createRoutesFromChildren(PUBLIC_ROUTES);

type Row = { readonly kind: string; readonly payload: Record<string, unknown> };
const payloadOf = (kind: string) => (snapshot as readonly Row[]).find((row) => row.kind === kind)!.payload;
const posts = payloadOf('posts').posts as readonly { id: string; channel: string; owner: string; categoryId: string }[];
const categories = payloadOf('posts').categories as readonly { id: string; channel: string }[];
const departmentInfo = payloadOf('department_info') as {
  pages: readonly { id: string }[];
  programs: readonly { id: string }[];
};
const albums = (payloadOf('gallery').albums as readonly { id: string }[]).map((album) => album.id);
const OWNERS = new Set(['department', 'digital_materials', ...Object.values(SLUG_TO_CENTER), ...departmentInfo.programs.map((program) => program.id)]);

function resolve(pathname: string, search = '', base = '/') {
  return resolveLegacyPathIn(TABLE, pathname, search, base);
}

/** Why a route target cannot render the content it names, or undefined when it can. */
function routeProblem(to: string): string | undefined {
  const url = new URL(to, 'https://example.test');
  const matches = matchRoutes(ROUTES, url.pathname);
  const leaf = matches?.[matches.length - 1];
  if (leaf === undefined || leaf.route.path === '*' || leaf.route.path === '/center/:id') return 'no declared route';
  const { params } = leaf;
  const owner = url.searchParams.get('owner');
  if (owner !== null && !OWNERS.has(owner)) return `unknown owner ${owner}`;
  const category = url.searchParams.get('category');
  if (category !== null && !categories.some((candidate) => candidate.id === category)) return `unknown category ${category}`;
  const post = params.postId === undefined ? undefined : posts.find((candidate) => candidate.id === params.postId);
  switch (leaf.route.path) {
    case '/announcements/:postId':
      return post?.channel === 'news' ? undefined : 'no such announcement';
    case '/honors/:postId':
      return post?.channel === 'honors' ? undefined : 'no such honor';
    case '/centers/:slug/articles/:postId':
      return post?.channel === 'center' && SLUG_TO_CENTER[params.slug ?? ''] === post.owner ? undefined : 'no such center article';
    case '/digital-materials/articles/:postId':
      return post?.channel === 'center' && post.owner === 'digital_materials' ? undefined : 'no such digital materials article';
    case '/centers/:slug':
      return SLUG_TO_CENTER[params.slug ?? ''] === undefined ? 'unknown center' : undefined;
    case '/department/:pageId':
      return departmentInfo.pages.some((page) => page.id === params.pageId) ? undefined : 'no such department page';
    case '/trainees/:programId':
      return departmentInfo.programs.some((program) => program.id === params.programId) ? undefined : 'no such program';
    case '/gallery/:albumId':
      return albums.includes(params.albumId ?? '') ? undefined : 'no such album';
    default:
      return undefined;
  }
}

describe('legacy path normalization', () => {
  it('ignores case, trailing slashes, .html, the query and the hash', () => {
    for (const variant of ['/News/Info/N002/4', '/news/info/n002/4/', '/news/info/n002/4.html', '/NEWS//info/n002/4?page=2#top']) {
      expect(normalizeLegacyPath(variant), variant).toBe('/news/info/n002/4');
    }
    expect(resolve('/News/Info/N002/4/')).toEqual({ kind: 'route', to: '/announcements/4' });
    expect(resolve('/news', '?page=2')).toEqual({ kind: 'route', to: '/announcements' });
    expect(resolve('/student/video/stu04/vdo04', '?page=3')).toEqual(resolve('/student/video/stu04/vdo04'));
  });

  it('decodes percent escapes once, as the importer did', () => {
    const [key] = Object.entries(TABLE.exact).find(([from]) => /[^\x00-\x7f]/.test(from)) ?? [];
    expect(key).toBeDefined();
    const encoded = key!.split('/').map(encodeURIComponent).join('/');
    expect(resolve(encoded)?.kind).toBe('file');
  });

  it('strips the Pages base only when the path still carries it', () => {
    expect(stripDeploymentBase('/tmuh-mededu-website/news/cate/N006', PAGES_BASE)).toBe('/news/cate/N006');
    expect(stripDeploymentBase('/tmuh-mededu-website', PAGES_BASE)).toBe('/');
    expect(stripDeploymentBase('/news/cate/N006', PAGES_BASE)).toBe('/news/cate/N006');
    expect(stripDeploymentBase('/news/cate/N006', '/')).toBe('/news/cate/N006');
    expect(resolve('/tmuh-mededu-website/news/cate/N006', '', PAGES_BASE)).toEqual(resolve('/news/cate/N006'));
    expect(resolve('/news/cate/N006', '', PAGES_BASE)).toEqual({ kind: 'route', to: '/announcements?category=trainee-notices' });
  });

  it('only consults the table for the old site prefixes', () => {
    expect(mayBeLegacyPath('/Board/Info/board/BOARD02/153', '/')).toBe(true);
    expect(mayBeLegacyPath('/centers/clinical-skills', '/')).toBe(false);
    expect(mayBeLegacyPath('/administrator', '/')).toBe(false);
    expect(resolve('/department/unknown')).toBeUndefined();
    expect(resolve('/news/info/n002/999999')).toBeUndefined();
    const outside = Object.keys(TABLE.exact).filter((from) => !hasLegacyPrefix(from));
    expect(outside).toEqual([]);
  });

  it('matches download rules on fName before the plain download path', () => {
    const [rule] = TABLE.query;
    expect(rule).toBeDefined();
    expect(resolve('/Other/DownloadFile', `?fName=${encodeURIComponent(rule!.value)}`)).toEqual(classifyLegacyTarget(rule!.to));
    expect(resolve('/other/downloadfile', '?fName=%2Fmissing.pdf')).toEqual(classifyLegacyTarget(TABLE.exact['/other/downloadfile']!));
  });

  it('classifies targets: routes, home sections, and static files', () => {
    expect(classifyLegacyTarget('/#contact')).toEqual({ kind: 'home-section', section: 'contact' });
    expect(classifyLegacyTarget('/honors?category=competitions-awards#board')).toEqual({ kind: 'route', to: '/honors?category=competitions-awards#board' });
    expect(classifyLegacyTarget('/assets/legacy/album/abc.webp')).toEqual({ kind: 'file', path: '/assets/legacy/album/abc.webp' });
    expect(classifyLegacyTarget('/files/legacy/downloads/a.pdf')).toEqual({ kind: 'file', path: '/files/legacy/downloads/a.pdf' });
    expect(classifyLegacyTarget('/')).toEqual({ kind: 'route', to: '/' });
  });

  it('loads the same table lazily', async () => {
    await expect(loadLegacyRedirectTable()).resolves.toEqual(TABLE);
    await expect(resolveLegacyPath('/center/medical', '', '/')).resolves.toEqual({ kind: 'route', to: '/centers/evidence-based-medicine' });
    await expect(resolveLegacyPath('/centers/evidence-based-medicine', '', '/')).resolves.toBeUndefined();
  });
});

describe('legacy redirect table', () => {
  it('resolves every old path it lists to that entry', () => {
    const wrong = Object.entries(TABLE.exact).filter(([from, to]) => {
      const resolved = resolve(from);
      return resolved === undefined || JSON.stringify(resolved) !== JSON.stringify(classifyLegacyTarget(to));
    });
    expect(Object.keys(TABLE.exact).length).toBeGreaterThan(400);
    expect(wrong).toEqual([]);
  });

  it('sends every route target to a declared route whose ids exist in the committed snapshot', () => {
    const targets = [...Object.values(TABLE.exact), ...TABLE.query.map((rule) => rule.to)];
    const problems = targets
      .map((to) => classifyLegacyTarget(to))
      .flatMap((redirect) => {
        if (redirect.kind !== 'route') return [];
        const problem = routeProblem(redirect.to);
        return problem === undefined ? [] : [`${redirect.to}: ${problem}`];
      });
    expect(problems).toEqual([]);
  });

  it('sends home-section targets to sections the home page declares', async () => {
    const { HOME_SECTIONS } = await import('./routes');
    const sections = Object.values(TABLE.exact)
      .map((to) => classifyLegacyTarget(to))
      .flatMap((redirect) => (redirect.kind === 'home-section' ? [redirect.section] : []));
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) expect(HOME_SECTIONS as readonly string[]).toContain(section);
  });
});
