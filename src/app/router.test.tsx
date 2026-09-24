// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouterProvider, useBlocker, useLocation } from 'react-router-dom';
import { CONFIGURED_AUTH, FakeAdminAuthClient } from '@/admin/auth/testHarness';
import { App } from './App';
import { createAppMemoryRouter } from './router';

const routeHarness = vi.hoisted(() => {
  let state: unknown = { status: 'authorized', user: { id: 'admin-id', email: null } };
  return {
    auth: () => ({
      state,
      signIn: async () => undefined,
      signOut: async () => undefined,
      retry: async () => undefined,
    }),
    setState: (nextState: unknown) => { state = nextState; },
  };
});

vi.mock('@/admin/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/admin/auth')>();
  return { ...actual, useAdminAuth: routeHarness.auth };
});
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

function BlockerProbe() {
  const blocker = useBlocker(true);
  return <output data-testid="blocker-state">{blocker.state}</output>;
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="route-location">{location.pathname}</output>;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('application data router', () => {
  it('renders the public app through the browser-router-compatible factory', () => {
    const view = render(
      <RouterProvider router={createAppMemoryRouter({ initialEntries: ['/'] })} />,
    );

    expect(view.getByTestId('public-home')).toBeTruthy();
  });

  it('preserves protected admin routing and injected auth dependencies', async () => {
    routeHarness.setState({ status: 'authorized', user: { id: 'admin-id', email: null } });
    const loadClient = vi.fn(async () => new FakeAdminAuthClient());
    const view = render(
      <RouterProvider
        router={createAppMemoryRouter({
          initialEntries: ['/admin'],
          adminAuth: { configuration: CONFIGURED_AUTH, loadClient },
        })}
      />,
    );

    expect(await view.findByRole('heading', { name: '內容管理總覽' })).toBeTruthy();
    expect(loadClient).toHaveBeenCalledTimes(1);
  });

  it('applies the basename while retaining a mounted useBlocker descendant', () => {
    const view = render(
      <RouterProvider
        router={createAppMemoryRouter({
          basename: '/tmuh-mededu-website/',
          initialEntries: ['/tmuh-mededu-website/announcements'],
          rootElement: <><App /><BlockerProbe /><LocationProbe /></>,
        })}
      />,
    );

    expect(view.getByTestId('blocker-state').textContent).toBe('unblocked');
    expect(view.getByTestId('route-location').textContent).toBe('/announcements');
  });
});
