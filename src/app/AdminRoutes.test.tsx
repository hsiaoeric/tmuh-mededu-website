// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import type { AdminAuthState } from '@/admin/auth';
import { CONFIGURED_AUTH, FakeAdminAuthClient } from '@/admin/auth/testHarness';
import { SiteProvider } from './site';
import { App } from './App';

const routeHarness = vi.hoisted(() => {
  let state: unknown = { status: 'authorized', user: { id: 'admin-id', email: null } };
  const designSystemMount = vi.fn();
  const signOut = vi.fn(async () => undefined);
  return {
    auth: () => ({
      state,
      signIn: async () => undefined,
      signOut,
      retry: async () => undefined,
    }),
    designSystemMount,
    signOut,
    setState: (nextState: unknown) => { state = nextState; },
  };
});

vi.mock('@/admin/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/admin/auth')>();
  return { ...actual, useAdminAuth: routeHarness.auth, useOptionalAdminAuth: routeHarness.auth };
});
vi.mock('@/pages/AdminDesignSystemPage', () => ({
  AdminDesignSystemPage: () => {
    routeHarness.designSystemMount();
    return <main data-testid="design-system" />;
  },
}));
vi.mock('@/webgl/TissueField', () => ({ TissueField: () => null }));
vi.mock('@/pages/CenterPage', () => ({ CenterPage: () => <main data-testid="center" /> }));
vi.mock('@/pages/Home', () => ({ Home: () => <main data-testid="public-home" /> }));
vi.mock('@/pages/AnnouncementsPage', () => ({ AnnouncementsPage: () => <main /> }));
vi.mock('@/pages/DigitalMaterialsPage', () => ({ DigitalMaterialsPage: () => <main /> }));
vi.mock('@/pages/HonorsPage', () => ({ HonorsPage: () => <main /> }));
vi.mock('@/pages/NotFound', () => ({ NotFound: () => <main data-testid="public-not-found" /> }));
vi.mock('@/pages/centers/holistic/Detail', () => ({ HolisticDetail: () => <main /> }));
vi.mock('@/ui/Nav', () => ({ Nav: () => <nav /> }));
vi.mock('@/ui/Footer', () => ({ Footer: () => <footer /> }));
vi.mock('@/ui/Chrome', () => ({ Cursor: () => null, RouteCurtain: () => null, ScrollProgress: () => null }));
vi.mock('@/motion/smoothScroll', () => ({ useSmoothScroll: () => undefined }));
vi.mock('./navigation', () => ({ useRouteScrollReset: () => undefined }));

type InitialEntry = string | {
  readonly pathname: string;
  readonly state: unknown;
};

function LocationProbe() {
  const location = useLocation();
  return (
    <>
      <output data-testid="route-location">{`${location.pathname}${location.search}${location.hash}`}</output>
      <output data-testid="route-state">{JSON.stringify(location.state)}</output>
    </>
  );
}

function BackProbe() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(-1)}>Back</button>;
}

function renderRoute(entry: InitialEntry, state: AdminAuthState) {
  routeHarness.setState(state);
  const client = new FakeAdminAuthClient();
  const loadClient = vi.fn(async () => client);
  const view = render(
    <SiteProvider>
      <MemoryRouter initialEntries={[entry]}>
        <LocationProbe />
        <App adminAuth={{ configuration: CONFIGURED_AUTH, loadClient }} />
      </MemoryRouter>
    </SiteProvider>,
  );
  return { view, loadClient };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  routeHarness.designSystemMount.mockClear();
  routeHarness.signOut.mockClear();
  document.documentElement.classList.remove('admin-route');
  document.body.classList.remove('admin-route');
});

describe('administrator route topology', () => {
  it.each(['/admin', '/admin/'])('classifies exact %s as admin on both root elements', async (path) => {
    // Given / When
    const { view, loadClient } = renderRoute(
      path,
      { status: 'authorized', user: { id: 'admin-id', email: 'admin@example.test' } },
    );

    // Then
    expect(await view.findByRole('heading', { name: '內容管理總覽' })).toBeTruthy();
    expect(document.documentElement.classList.contains('admin-route')).toBe(true);
    expect(document.body.classList.contains('admin-route')).toBe(true);
    expect(loadClient).toHaveBeenCalledTimes(1);
  });

  it.each(['/', '/administrator', '/administer'])('keeps %s public without loading admin auth', (path) => {
    // Given / When
    const { view, loadClient } = renderRoute(path, { status: 'anonymous' });

    // Then
    expect(path === '/' ? view.getByTestId('public-home') : view.getByTestId('public-not-found')).toBeTruthy();
    expect(loadClient).not.toHaveBeenCalled();
    expect(document.documentElement.classList.contains('admin-route')).toBe(false);
    expect(document.body.classList.contains('admin-route')).toBe(false);
  });

  it('redirects a protected route before the lazy design system can mount', async () => {
    // Given / When
    const { view, loadClient } = renderRoute('/admin/design-system?panel=states#errors', { status: 'anonymous' });

    // Then
    expect(await view.findByRole('heading', { name: '管理員登入' })).toBeTruthy();
    expect(view.getByTestId('route-location').textContent).toBe('/admin/login');
    expect(routeHarness.designSystemMount).not.toHaveBeenCalled();
    expect(loadClient).toHaveBeenCalledTimes(1);
  });

  it.each([
    '/admin/Login?source=case#mixed',
    '/admin/%6cogin?source=encoded#lowercase',
    '/admin/login/?source=slash#trailing',
    '/admin/Login/session?source=case#descendant',
    '/admin/%6cogin/session?source=encoded#descendant',
  ])('routes anonymous login alias %s through the protected guard', async (path) => {
    // Given / When
    const { view } = renderRoute(path, { status: 'anonymous' });

    // Then
    expect(await view.findByRole('heading', { name: '管理員登入' })).toBeTruthy();
    expect(view.getByTestId('route-location').textContent).toBe('/admin/login');
    expect(view.getByTestId('route-state').textContent).toBe('{"returnTo":"/admin"}');
  });

  it.each([
    '/admin/Login',
    '/admin/%6cogin',
    '/admin/login/',
    '/admin/Login/session',
    '/admin/%6cogin/session',
  ])('routes authorized login alias %s through the protected catch-all', async (pathname) => {
    // Given / When
    const { view } = renderRoute(
      { pathname, state: { returnTo: '/admin/content/news' } },
      { status: 'authorized', user: { id: 'admin-id', email: null } },
    );

    // Then
      expect(await view.findByRole('heading', { name: '內容管理總覽' })).toBeTruthy();
    expect(view.getByTestId('route-location').textContent).toBe('/admin');
  });

  it('replaces an anonymous login alias before returning to the previous page', async () => {
    // Given
    routeHarness.setState({ status: 'anonymous' });
    const loadClient = vi.fn(async () => new FakeAdminAuthClient());

    // When
    const view = render(
      <SiteProvider>
        <MemoryRouter initialEntries={['/before', '/admin/Login?source=case#mixed']} initialIndex={1}>
          <LocationProbe />
          <BackProbe />
          <App adminAuth={{ configuration: CONFIGURED_AUTH, loadClient }} />
        </MemoryRouter>
      </SiteProvider>,
    );
    expect(await view.findByRole('heading', { name: '管理員登入' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Back' }));

    // Then
    await waitFor(() => {
      expect(view.getByTestId('route-location').textContent).toBe('/before');
    });
  });

  it('mounts the lazy design system after authorization', async () => {
    // Given / When
    const { view } = renderRoute(
      '/admin/design-system',
      { status: 'authorized', user: { id: 'admin-id', email: null } },
    );

    // Then
    expect(await view.findByTestId('design-system')).toBeTruthy();
    expect(routeHarness.designSystemMount).toHaveBeenCalledTimes(1);
  });

  it('continues an authorized login to a safe query and hash target', async () => {
    // Given / When
    const { view } = renderRoute(
      { pathname: '/admin/login', state: { returnTo: '/admin/content/news?draft=1#translation' } },
      { status: 'authorized', user: { id: 'admin-id', email: null } },
    );

    // Then
    expect(await view.findByRole('heading', { name: '公告 JSON 工作區' }, { timeout: 10_000 })).toBeTruthy();
    expect(view.getByTestId('route-location').textContent).toBe('/admin/content/news?draft=1#translation');
  });

  it('replaces the protected route and login while preserving one canonical history return', async () => {
    // Given
    routeHarness.setState({ status: 'anonymous' });
    const loadClient = vi.fn(async () => new FakeAdminAuthClient());
    const app = () => (
      <SiteProvider>
        <MemoryRouter
          initialEntries={['/', '/admin/content/news?draft=1#translation']}
          initialIndex={1}
        >
          <LocationProbe />
          <BackProbe />
          <App adminAuth={{ configuration: CONFIGURED_AUTH, loadClient }} />
        </MemoryRouter>
      </SiteProvider>
    );
    const view = render(app());
    await view.findByRole('heading', { name: '管理員登入' });

    // When
    const loginLocation = view.getByTestId('route-location').textContent;
    const loginState = view.getByTestId('route-state').textContent;
    routeHarness.setState({ status: 'authorized', user: { id: 'admin-id', email: null } });
    view.rerender(app());

    // Then
    expect(loginLocation).toBe('/admin/login');
    expect(loginState).toBe('{"returnTo":"/admin/content/news?draft=1#translation"}');
    expect(await view.findByRole('heading', { name: '公告 JSON 工作區' })).toBeTruthy();
    expect(view.getByTestId('route-location').textContent).toBe('/admin/content/news?draft=1#translation');
    expect(view.queryByRole('heading', { name: '內容管理總覽' })).toBeNull();

    fireEvent.click(view.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(view.getByTestId('route-location').textContent).toBe('/'));
    expect(view.getByTestId('public-home')).toBeTruthy();
  });

  it('does not introduce an admin news alias', async () => {
    // Given / When
    const { view } = renderRoute(
      '/admin/news',
      { status: 'authorized', user: { id: 'admin-id', email: null } },
    );

    // Then
    expect(await view.findByRole('heading', { name: '內容管理總覽' })).toBeTruthy();
    expect(view.getByTestId('route-location').textContent).toBe('/admin');
    expect(view.queryByRole('heading', { name: '公告 JSON 工作區' })).toBeNull();
  });

  it.each([
    { name: 'malicious return state', returnTo: 'https://attacker.example/admin' },
    { name: 'unknown safe admin target', returnTo: '/admin/unknown?draft=1#section' },
  ])('falls $name back to the dashboard placeholder', async ({ returnTo }) => {
    // Given / When
    const { view } = renderRoute(
      { pathname: '/admin/login', state: { returnTo } },
      { status: 'authorized', user: { id: 'admin-id', email: null } },
    );

    // Then
    expect(await view.findByRole('heading', { name: '內容管理總覽' })).toBeTruthy();
    await waitFor(() => {
      expect(view.getByTestId('route-location').textContent).toBe('/admin');
    });
  });

  it('replaces an authorized unknown route before returning to the previous page', async () => {
    // Given
    routeHarness.setState({ status: 'authorized', user: { id: 'admin-id', email: null } });
    const loadClient = vi.fn(async () => new FakeAdminAuthClient());

    // When
    const view = render(
      <SiteProvider>
        <MemoryRouter initialEntries={['/before', '/admin/unknown']} initialIndex={1}>
          <LocationProbe />
          <BackProbe />
          <App adminAuth={{ configuration: CONFIGURED_AUTH, loadClient }} />
        </MemoryRouter>
      </SiteProvider>,
    );
    expect(await view.findByRole('heading', { name: '內容管理總覽' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Back' }));

    // Then
    await waitFor(() => {
      expect(view.getByTestId('route-location').textContent).toBe('/before');
    });
  });

  it('renders the protected bilingual news workspace recovery state', async () => {
    // Given
    localStorage.setItem('tmuh.lang', 'en');

    // When
    const { view } = renderRoute(
      '/admin/content/news',
      { status: 'authorized', user: { id: 'admin-id', email: null } },
    );

    // Then
    expect(await view.findByRole('heading', { name: 'News JSON workspace' })).toBeTruthy();
    expect(view.queryByRole('form')).toBeNull();
    expect(view.queryByRole('button', { name: /save|publish|edit/i })).toBeNull();
  });

  it('moves focus to the destination heading after protected SPA navigation', async () => {
    // Given
    const { view } = renderRoute(
      '/admin',
      { status: 'authorized', user: { id: 'admin-id', email: null } },
    );
    await view.findByRole('heading', { name: '內容管理總覽' });

    // When
    fireEvent.click(view.getByRole('link', { name: '公告內容' }));

    // Then
    const destination = await view.findByRole('heading', { name: '公告 JSON 工作區' });
    await waitFor(() => expect(document.activeElement).toBe(destination));
  });

  it.each([
    { path: '/admin', heading: '內容管理總覽' },
    { path: '/admin/content/news', heading: '公告 JSON 工作區' },
  ])('exposes the localized sign-out action on $path', async ({ path, heading }) => {
    // Given / When
    const { view } = renderRoute(
      path,
      { status: 'authorized', user: { id: 'admin-id', email: null } },
    );
    await view.findByRole('heading', { name: heading });

    // Then
    expect(view.getByRole('button', { name: '登出' })).toBeTruthy();
  });
});
