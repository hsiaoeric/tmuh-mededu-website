// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { AdminAuthState } from '@/admin/auth';
import {
  useAdminMediaOwnershipScope,
  useAdminMediaRuntime,
  type DraftMediaOwnershipScope,
} from '@/admin/media';
import { AdminProtectedLayout } from './AdminProtectedLayout';
import { SiteProvider } from './site';

const authHarness = vi.hoisted(() => {
  let state: unknown = { status: 'booting' };
  return {
    read: () => ({
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
  return { ...actual, useAdminAuth: authHarness.read };
});

const FAIL_CLOSED_STATES = [
  { name: 'disabled configuration', state: { status: 'config-error', failure: { kind: 'disabled' } } },
  { name: 'partial configuration', state: { status: 'config-error', failure: { kind: 'invalid', reason: 'partial' } } },
  { name: 'invalid configuration', state: { status: 'config-error', failure: { kind: 'invalid', reason: 'invalid' } } },
  { name: 'anonymous', state: { status: 'anonymous' } },
  { name: 'authenticating', state: { status: 'authenticating' } },
  { name: 'denied', state: { status: 'denied' } },
  { name: 'expired', state: { status: 'expired' } },
  { name: 'client unavailable', state: { status: 'error', failure: 'client-unavailable' } },
  { name: 'sign in failed', state: { status: 'error', failure: 'sign-in-failed' } },
  { name: 'identity check failed', state: { status: 'error', failure: 'identity-check-failed' } },
  { name: 'allowlist check failed', state: { status: 'error', failure: 'allowlist-check-failed' } },
  { name: 'unsupported event', state: { status: 'error', failure: 'unsupported-auth-event' } },
] as const satisfies readonly { readonly name: string; readonly state: AdminAuthState }[];

/** A stored session is still being checked: wait in place instead of flashing the login page. */
const SESSION_CHECK_STATES = [
  { name: 'booting', state: { status: 'booting' } },
  { name: 'verifying', state: { status: 'verifying' } },
] as const satisfies readonly { readonly name: string; readonly state: AdminAuthState }[];

function LocationProbe() {
  const location = useLocation();
  return (
    <output
      data-testid="location"
      data-path={`${location.pathname}${location.search}${location.hash}`}
      data-state={JSON.stringify(location.state)}
    />
  );
}

function BackProbe() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(-1)}>Back</button>;
}

function ProtectedOwnershipProbe({
  scopes,
}: {
  readonly scopes: DraftMediaOwnershipScope[];
}) {
  const scope = useAdminMediaOwnershipScope();
  scopes.push(scope);
  return <main data-testid="protected-workspace" />;
}

function ProtectedMediaRuntimeProbe() {
  const runtime = useAdminMediaRuntime();
  return <output data-testid="media-runtime" data-status={runtime.status} />;
}

function LoginReturnProbe() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate('/admin/content/news')}>
      Return
    </button>
  );
}

afterEach(cleanup);

describe('AdminProtectedLayout', () => {
  it.each(FAIL_CLOSED_STATES)('fails closed for $name with a serializable return target', ({ state }) => {
    // Given
    authHarness.setState(state);
    const protectedMount = vi.fn();

    // When
    const view = render(
      <MemoryRouter initialEntries={['/admin/content/news?draft=1#translation']}>
        <Routes>
          <Route path="/admin/login" element={<LocationProbe />} />
          <Route element={<AdminProtectedLayout />}>
            <Route path="*" element={<span ref={() => protectedMount()}>Protected</span>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Then
    const location = view.getByTestId('location');
    expect(location.getAttribute('data-path')).toBe('/admin/login');
    expect(location.getAttribute('data-state')).toBe(
      JSON.stringify({ returnTo: '/admin/content/news?draft=1#translation' }),
    );
    expect(protectedMount).not.toHaveBeenCalled();
  });

  it.each(SESSION_CHECK_STATES)('waits without redirecting or mounting protected content while $name', ({ state }) => {
    // Given
    authHarness.setState(state);
    const protectedMount = vi.fn();

    // When
    const view = render(
      <SiteProvider>
        <MemoryRouter initialEntries={['/admin/content/news?draft=1#translation']}>
          <Routes>
            <Route path="/admin/login" element={<LocationProbe />} />
            <Route element={<AdminProtectedLayout />}>
              <Route path="*" element={<span ref={() => protectedMount()}>Protected</span>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </SiteProvider>,
    );

    // Then
    expect(view.getByRole('status').textContent).toContain('正在確認登入狀態');
    expect(view.queryByTestId('location')).toBeNull();
    expect(protectedMount).not.toHaveBeenCalled();
  });

  it('renders the outlet only for an authorized administrator', () => {
    // Given
    authHarness.setState({ status: 'authorized', user: { id: 'admin-id', email: null } });

    // When
    const view = render(
      <MemoryRouter initialEntries={['/admin/content/news']}>
        <Routes>
          <Route element={<AdminProtectedLayout />}>
            <Route path="*" element={<main data-testid="protected-workspace" />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Then
    expect(view.getByTestId('protected-workspace')).toBeTruthy();
  });

  it('provides the media runtime to an authorized workspace', () => {
    // Given
    authHarness.setState({ status: 'authorized', user: { id: 'admin-id', email: null } });

    // When
    const view = render(
      <MemoryRouter initialEntries={['/admin/content/people']}>
        <Routes>
          <Route element={<AdminProtectedLayout />}>
            <Route path="*" element={<ProtectedMediaRuntimeProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Then
    expect([
      'disabled',
      'configuration-error',
      'loading',
      'load-error',
      'ready',
    ]).toContain(view.getByTestId('media-runtime').getAttribute('data-status'));
  });

  it('rotates ownership scope after authorization ends and the same user returns', () => {
    // Given
    const scopes: DraftMediaOwnershipScope[] = [];
    authHarness.setState({ status: 'authorized', user: { id: 'admin-id', email: null } });
    const routes = (
      <Routes>
        <Route path="/admin/login" element={<LoginReturnProbe />} />
        <Route element={<AdminProtectedLayout />}>
          <Route path="*" element={<ProtectedOwnershipProbe scopes={scopes} />} />
        </Route>
      </Routes>
    );
    const view = render(
      <MemoryRouter initialEntries={['/admin/content/news']}>
        {routes}
      </MemoryRouter>,
    );
    const retiredScope = scopes[0];
    authHarness.setState({ status: 'anonymous' });
    view.rerender(
      <MemoryRouter key="anonymous" initialEntries={['/admin/content/news']}>
        {routes}
      </MemoryRouter>,
    );
    authHarness.setState({ status: 'authorized', user: { id: 'admin-id', email: null } });

    // When
    fireEvent.click(view.getByRole('button', { name: 'Return' }));

    // Then
    expect(scopes).toHaveLength(2);
    expect(scopes[1]).not.toBe(retiredScope);
  });

  it.each([
    { name: 'pending sign-out', state: { status: 'signing-out' } },
    { name: 'failed sign-out recovery', state: { status: 'error', failure: 'sign-out-failed' } },
  ] as const satisfies readonly { readonly name: string; readonly state: AdminAuthState }[])('keeps the protected outlet mounted during $name', ({ state }) => {
    // Given
    authHarness.setState(state);

    // When
    const view = render(
      <MemoryRouter initialEntries={['/admin/content/news']}>
        <Routes>
          <Route element={<AdminProtectedLayout />}>
            <Route path="*" element={<main data-testid="protected-workspace" />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Then
    expect(view.getByTestId('protected-workspace')).toBeTruthy();
  });

  it('replaces the protected history entry when redirecting to login', async () => {
    // Given
    authHarness.setState({ status: 'anonymous' });

    // When
    const view = render(
      <MemoryRouter initialEntries={['/before', '/admin/content/news']} initialIndex={1}>
        <Routes>
          <Route path="/before" element={<LocationProbe />} />
          <Route path="/admin/login" element={<><LocationProbe /><BackProbe /></>} />
          <Route element={<AdminProtectedLayout />}>
            <Route path="*" element={<span>Protected</span>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(view.getByRole('button', { name: 'Back' }));

    // Then
    await waitFor(() => {
      expect(view.getByTestId('location').getAttribute('data-path')).toBe('/before');
    });
  });
});
