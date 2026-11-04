// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import { Suspense, createElement, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { Routes, RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentProvider } from '@/content/ContentProvider';
import { parseSupabaseConfiguration } from '@/content/env';
import { committedSnapshotRepository } from '@/content/snapshotRepository';
import table from '@/data/legacy/redirects.json';
import { legacyNavigation } from '@/ui/LegacyOrNotFound';
import { assetUrl } from '@/utils/asset';
import { PUBLIC_ROUTES } from './App';
import { PublicSiteProvider } from './PublicSiteProvider';
import type { LegacyRedirectTable } from './legacyPaths';

// Old-site URLs through the real route table, pages and committed snapshot: where each lands, and
// that every `#section` a redirect names is rendered by its page for the committed data.

const smoothScroll = vi.hoisted(() => ({ scrollToId: vi.fn() }));

vi.hoisted(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    }),
  });
});

vi.mock('@/webgl/TissueField', () => ({ TissueField: () => null }));
vi.mock('@/motion/Counter', () => ({ Counter: ({ to }: { readonly to: number }) => <>{to}</> }));
vi.mock('@/motion/Reveal', () => ({
  Reveal: ({ children, className, style, id }: {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly id?: string;
  }) => <div className={className} style={style} id={id}>{children}</div>,
}));
vi.mock('@/motion/SplitLines', () => ({
  SplitLines: ({ as: element = 'span', children, className, style }: {
    readonly as?: ElementType;
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
  }) => createElement(element, { className, style }, children),
}));
vi.mock('@/motion/gsap', () => ({
  gsap: {
    context: () => ({ revert: () => undefined }),
    registerPlugin: () => undefined,
    ticker: { add: () => undefined, remove: () => undefined, lagSmoothing: () => undefined },
  },
  ScrollTrigger: { refresh: () => undefined, update: () => undefined },
  EASE: { out: 'expo.out', soft: 'power3.out', inOut: 'power2.inOut' },
  prefersReducedMotion: () => true,
}));
vi.mock('@/motion/smoothScroll', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/motion/smoothScroll')>(),
  scrollToId: smoothScroll.scrollToId,
}));

const TABLE = table as LegacyRedirectTable;
const OFFLINE = parseSupabaseConfiguration({});

function renderRoute(path: string, previous?: string) {
  const router = createMemoryRouter([{
    path: '*',
    element: (
      <ContentProvider configuration={OFFLINE} snapshotRepository={committedSnapshotRepository}>
        <PublicSiteProvider>
          <Suspense fallback={null}>
            <Routes>{PUBLIC_ROUTES}</Routes>
          </Suspense>
        </PublicSiteProvider>
      </ContentProvider>
    ),
  }], {
    initialEntries: previous === undefined ? [path] : [previous, path],
    initialIndex: previous === undefined ? 0 : 1,
  });
  const view = render(<RouterProvider router={router} />);
  const href = () => `${router.state.location.pathname}${router.state.location.search}${router.state.location.hash}`;
  return { router, view, href };
}

const NOT_FOUND = '這個頁面不存在';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('tmuh.lang', 'zh');
  smoothScroll.scrollToId.mockClear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('old-site URLs in the app', () => {
  it.each([
    ['/news/info/n002/4', TABLE.exact['/news/info/n002/4']],
    ['/News/Cate/N006', '/announcements?category=trainee-notices'],
    ['/board/info/board/BOARD02/39?x=1', TABLE.exact['/board/info/board/board02/39']],
    ['/center/info/develop/EVT03/145', '/centers/faculty-development/articles/145'],
    ['/other/Links?page=1', '/resources#links'],
    ['/center/medical', '/centers/evidence-based-medicine'],
    ['/center/about', '/'],
    ['/center/ebm', '/centers/evidence-based-medicine'],
  ])('replaces %s with %s', async (from, to) => {
    expect(to).toBeDefined();
    const { router, href } = renderRoute(from, '/start');
    await waitFor(() => expect(href()).toBe(to));
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('sends a home-section target home and scrolls to the section', async () => {
    const { router, href, view } = renderRoute('/contact', '/start');
    await waitFor(() => expect(href()).toBe('/'));
    expect(router.state.historyAction).toBe('REPLACE');
    await waitFor(() => expect(smoothScroll.scrollToId).toHaveBeenCalledWith('contact'));
    expect(view.container.querySelector('#contact')).not.toBeNull();
  });

  it('hands converted images to the browser as static files', async () => {
    const leaveTo = vi.spyOn(legacyNavigation, 'leaveTo').mockImplementation(() => undefined);
    const [from, to] = Object.entries(TABLE.exact).find(([key]) => key.startsWith('/uploadfile/'))!;
    const encoded = from.replace('/uploadfile/', '/UploadFile/').split('/').map(encodeURIComponent).join('/');
    const { href } = renderRoute(encoded);
    await waitFor(() => expect(leaveTo).toHaveBeenCalledWith(assetUrl(to)));
    expect(href()).toBe(encoded);
  });

  it('shows not found for unknown old paths once the table has loaded', async () => {
    const { view } = renderRoute('/news/info/n002/999999');
    expect(view.queryByText(NOT_FOUND)).toBeNull();
    expect(await view.findByText(NOT_FOUND)).toBeTruthy();
  });

  it('shows not found at once for paths the old site never had', () => {
    const { view } = renderRoute('/administrator');
    expect(view.getByText(NOT_FOUND)).toBeTruthy();
  });
});

describe('redirect anchors', () => {
  const hashed = [...new Set([...Object.values(TABLE.exact), ...TABLE.query.map((rule) => rule.to)].filter((to) => to.includes('#')))].sort();

  it('lists the anchors under test', () => {
    expect(hashed.length).toBeGreaterThan(5);
  });

  it.each(hashed)('%s renders its section for the committed content', async (target) => {
    const [path = '/', hash = ''] = target.split('#');
    const { view } = renderRoute(path);
    await waitFor(() => expect(view.container.querySelector(`[id="${hash}"]`)).not.toBeNull(), { timeout: 5000 });
  });
});
