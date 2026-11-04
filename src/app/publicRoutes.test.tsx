// @vitest-environment jsdom

import { createRoutesFromChildren, matchRoutes, type RouteObject } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PUBLIC_ROUTES } from './App';
import {
  ANNOUNCEMENTS_PATH,
  LEGACY_PATH_PREFIXES,
  LEGACY_REDIRECTS,
  albumPath,
  announcementPath,
  centerArticlePath,
  departmentPagePath,
  holisticDetailPath,
  honorPostPath,
  postPath,
  programPath,
} from './routes';

vi.mock('@/webgl/TissueField', () => ({ TissueField: () => null }));
vi.mock('@/motion/gsap', () => ({
  gsap: { context: () => ({ revert: () => undefined }), registerPlugin: () => undefined, ticker: { add: () => undefined, remove: () => undefined } },
  ScrollTrigger: { refresh: () => undefined, update: () => undefined },
  EASE: { out: 'expo.out', soft: 'power3.out', inOut: 'power2.inOut' },
  prefersReducedMotion: () => true,
}));

/** Routes that exist on purpose to catch old URLs, plus the catch-all that resolves the rest. */
const DELIBERATE_LEGACY_PATHS = new Set(['*', '/center/:id', ...Object.keys(LEGACY_REDIRECTS)]);

function flatten(routes: readonly RouteObject[]): string[] {
  return routes.flatMap((route) => [
    ...(route.path === undefined ? [] : [route.path]),
    ...flatten(route.children ?? []),
  ]);
}

const ROUTES = createRoutesFromChildren(PUBLIC_ROUTES);
const PATHS = flatten(ROUTES);

function matchedPath(pathname: string): string | undefined {
  const matches = matchRoutes(ROUTES, pathname);
  return matches?.[matches.length - 1]?.route.path;
}

describe('public route table', () => {
  it('starts no new route with a segment the old site used', () => {
    const prefixes = new Set<string>(LEGACY_PATH_PREFIXES);
    const offenders = PATHS
      .filter((path) => !DELIBERATE_LEGACY_PATHS.has(path))
      .filter((path) => {
        const first = path.split('/').filter((segment) => segment !== '')[0] ?? '';
        return prefixes.has(first.toLowerCase());
      });

    expect(PATHS.length).toBeGreaterThan(15);
    expect(offenders).toEqual([]);
  });

  it('leaves every old-site path to the catch-all route', () => {
    const legacy = [
      '/about/detail/28',
      '/About/Detail/31',
      '/news',
      '/news/info/185',
      '/news/info/N001/185',
      '/board/info/board/BOARD01/150',
      '/student/stu02',
      '/other/link',
      '/album/info/ALB01',
      '/home/video',
      '/Center/info/medical/ABT01/12',
      '/center/info/care/EVT01/5',
      '/contact',
      '/index',
      '/UploadFile/news/a.jpg',
      '/scripts/downloadfile',
    ];
    for (const path of legacy) expect(matchedPath(path), path).toBe('*');
  });

  it('routes every page builder to a real page', () => {
    const post = { id: '185', channel: 'news', owner: 'department' } as const;
    const built = [
      departmentPagePath('director-message'),
      announcementPath('185'),
      honorPostPath('150'),
      programPath('pgy'),
      albumPath('pgy-orientation-2024'),
      centerArticlePath('ebm', '120'),
      centerArticlePath('digital_materials', '119'),
      postPath(post),
      ANNOUNCEMENTS_PATH,
    ];
    for (const path of built) {
      const route = matchedPath(path);
      expect(route, path).toBeDefined();
      expect(route, path).not.toBe('*');
    }
  });

  it('routes holistic year pages by static segment, apart from center articles', () => {
    expect(matchedPath(holisticDetailPath('symposia', 2024))).toBe('/centers/holistic-care/symposia/:year');
    expect(matchedPath(holisticDetailPath('research', 2023))).toBe('/centers/holistic-care/research/:year');
    expect(matchedPath(centerArticlePath('holistic', '77'))).toBe('/centers/:slug/articles/:postId');
    expect(PATHS).not.toContain('/centers/holistic-care/:kind/:year');
  });
});
