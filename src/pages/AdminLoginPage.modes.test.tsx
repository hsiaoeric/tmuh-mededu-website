// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminAuthProvider } from '@/admin/auth';
import {
  CONFIGURED_AUTH,
  FakeAdminAuthClient,
  authEvent,
  deferred,
} from '@/admin/auth/testHarness';
import { SiteProvider } from '@/app/site';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AdminLoginPage } from './AdminLoginPage';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});

function Destination() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <main>
      <output>{`${location.pathname}${location.search}${location.hash}`}</output>
      <button type="button" onClick={() => navigate(-1)}>Back</button>
    </main>
  );
}

describe('AdminLoginPage presentation modes', () => {
  it('renders textual loading state while the auth client is booting', () => {
    // Given
    const pendingClient = deferred<FakeAdminAuthClient>();

    // When
    const view = render(
      <SiteProvider>
        <MemoryRouter>
          <AdminAuthProvider
            configuration={CONFIGURED_AUTH}
            loadClient={() => pendingClient.promise}
          >
            <AdminLoginPage />
          </AdminAuthProvider>
        </MemoryRouter>
      </SiteProvider>,
    );

    // Then
    expect(view.container.querySelector('[data-state="loading"]')).not.toBeNull();
    expect(view.queryByRole('form')).toBeNull();
    expect(view.getByRole('heading', { level: 1 })).toBeTruthy();
  });

  it('renders configuration recovery without credentials or a fake retry', () => {
    // Given
    const configuration = { kind: 'disabled' } as const;

    // When
    const view = render(
      <SiteProvider>
        <MemoryRouter>
          <AdminAuthProvider configuration={configuration}>
            <AdminLoginPage />
          </AdminAuthProvider>
        </MemoryRouter>
      </SiteProvider>,
    );

    // Then
    expect(view.container.querySelector('.admin-notice[role="status"]')).not.toBeNull();
    expect(view.queryByRole('form')).toBeNull();
    expect(view.queryByRole('button', { name: '登入' })).toBeNull();
    expect(view.queryByRole('button', { name: '再試一次' })).toBeNull();
  });

  it('offers only the presentation sign-out recovery for unsupported auth events', async () => {
    // Given
    const client = new FakeAdminAuthClient();
    const view = render(
      <SiteProvider>
        <MemoryRouter>
          <AdminAuthProvider
            configuration={CONFIGURED_AUTH}
            loadClient={() => Promise.resolve(client)}
          >
            <AdminLoginPage />
          </AdminAuthProvider>
        </MemoryRouter>
      </SiteProvider>,
    );
    await waitFor(() => expect(client.subscriptionCount).toBe(1));

    // When
    act(() => client.emit(authEvent('UNSUPPORTED', 'session-user-id')));

    // Then
    expect(await view.findByRole('button', { name: '登出' })).toBeTruthy();
    expect(view.queryByRole('form')).toBeNull();
    expect(view.queryByRole('button', { name: '再試一次' })).toBeNull();
    expect(view.container.textContent).not.toMatch(/註冊|重設密碼|signup|reset password/i);
  });

  it('redirects an authorized user to the sanitized return path with history replacement', async () => {
    // Given
    const user = userEvent.setup();
    const client = new FakeAdminAuthClient();
    client.userResults.push(Promise.resolve({
      kind: 'authenticated',
      user: { id: 'admin-id', email: 'admin@example.com' },
    }));
    client.allowlistResults.push(Promise.resolve({ kind: 'allowed' }));
    const view = render(
      <SiteProvider>
        <MemoryRouter
          initialEntries={[
            '/before',
            {
              pathname: '/admin/login',
              state: { returnTo: '/admin/editor?lang=zh#title' },
            },
          ]}
          initialIndex={1}
        >
          <AdminAuthProvider
            configuration={CONFIGURED_AUTH}
            loadClient={() => Promise.resolve(client)}
          >
            <Routes>
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/editor" element={<Destination />} />
              <Route path="/before" element={<main>Before</main>} />
            </Routes>
          </AdminAuthProvider>
        </MemoryRouter>
      </SiteProvider>,
    );
    await waitFor(() => expect(client.subscriptionCount).toBe(1));

    // When
    vi.useFakeTimers();
    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
    await act(async () => vi.runOnlyPendingTimersAsync());
    vi.useRealTimers();

    // Then
    expect(await view.findByText('/admin/editor?lang=zh#title')).toBeTruthy();
    await user.click(view.getByRole('button', { name: 'Back' }));
    expect(await view.findByText('Before')).toBeTruthy();
  });

  it('defaults hostile navigation state to the administrator root', async () => {
    // Given
    const client = new FakeAdminAuthClient();
    client.userResults.push(Promise.resolve({
      kind: 'authenticated',
      user: { id: 'admin-id', email: null },
    }));
    client.allowlistResults.push(Promise.resolve({ kind: 'allowed' }));
    const view = render(
      <SiteProvider>
        <MemoryRouter initialEntries={[{
          pathname: '/admin/login',
          state: { returnTo: '//outside.example/admin' },
        }]}>
          <AdminAuthProvider
            configuration={CONFIGURED_AUTH}
            loadClient={() => Promise.resolve(client)}
          >
            <Routes>
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<main>Admin root</main>} />
            </Routes>
          </AdminAuthProvider>
        </MemoryRouter>
      </SiteProvider>,
    );
    await waitFor(() => expect(client.subscriptionCount).toBe(1));

    // When
    vi.useFakeTimers();
    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
    await act(async () => vi.runOnlyPendingTimersAsync());
    vi.useRealTimers();

    // Then
    expect(await view.findByText('Admin root')).toBeTruthy();
  });
});
