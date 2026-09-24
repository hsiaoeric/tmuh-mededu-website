// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AdminProtectedLayout } from '@/app/AdminProtectedLayout';
import { SiteProvider } from '@/app/site';
import { AdminAuthProvider, useAdminAuth } from './auth';
import { CONFIGURED_AUTH, FakeAdminAuthClient, authEvent, deferred } from './auth/testHarness';
import { AdminAppShell, AdminPageHeader } from './AdminShell';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function ProtectedShell() {
  return (
    <AdminAppShell showcaseNavigation={false}>
      <AdminPageHeader eyebrow="ADMIN / TEST" title="Protected workspace" description="Session test" />
    </AdminAppShell>
  );
}

function LoginRoute() {
  const { state } = useAdminAuth();
  return state.status === 'authorized'
    ? <Navigate to="/admin" replace />
    : <p>Administrator sign-in</p>;
}

async function authorize(client: FakeAdminAuthClient): Promise<void> {
  await waitFor(() => expect(client.subscriptionCount).toBe(1));
  client.userResults.push(Promise.resolve({
    kind: 'authenticated',
    user: { id: 'admin-id', email: 'admin@example.test' },
  }));
  client.allowlistResults.push(Promise.resolve({ kind: 'allowed' }));
  vi.useFakeTimers();
  act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
  await act(async () => vi.runOnlyPendingTimersAsync());
  vi.useRealTimers();
}

function renderProtectedShell(client: FakeAdminAuthClient) {
  return render(
    <SiteProvider>
      <MemoryRouter initialEntries={['/admin']}>
        <AdminAuthProvider configuration={CONFIGURED_AUTH} loadClient={() => Promise.resolve(client)}>
          <LocationProbe />
          <Routes>
            <Route path="/admin/login" element={<LoginRoute />} />
            <Route element={<AdminProtectedLayout />}>
              <Route path="/admin" element={<ProtectedShell />} />
            </Route>
          </Routes>
        </AdminAuthProvider>
      </MemoryRouter>
    </SiteProvider>,
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});

describe('AdminAppShell authorized session controls', () => {
  it('calls local sign-out, disables while pending, and redirects after success', async () => {
    // Given
    const client = new FakeAdminAuthClient();
    const pendingSignOut = deferred<{ readonly kind: 'success' }>();
    client.signOutResults.push(pendingSignOut.promise);
    const view = renderProtectedShell(client);
    await authorize(client);
    const signOut = await view.findByRole('button', { name: '登出' });

    // When
    fireEvent.click(signOut);

    // Then
    await waitFor(() => expect(client.signOutCallCount).toBe(1));
    expect(signOut.hasAttribute('disabled')).toBe(true);
    expect(signOut.getAttribute('aria-busy')).toBe('true');
    expect(view.getByTestId('location').textContent).toBe('/admin');

    pendingSignOut.resolve({ kind: 'success' });
    await waitFor(() => expect(view.getByTestId('location').textContent).toBe('/admin/login'));
  });

  it.each([
    {
      lang: 'zh',
      signOut: '登出',
      failure: '無法登出',
      recovery: '重試登出',
    },
    {
      lang: 'en',
      signOut: 'Sign out',
      failure: 'Unable to sign out',
      recovery: 'Retry sign out',
    },
  ] as const)('keeps localized recovery available after sign-out failure in $lang', async ({ lang, signOut, failure, recovery }) => {
    // Given
    localStorage.setItem('tmuh.lang', lang);
    const client = new FakeAdminAuthClient();
    client.signOutResults.push(Promise.resolve({ kind: 'error' }));
    const view = renderProtectedShell(client);
    await authorize(client);

    // When
    fireEvent.click(await view.findByRole('button', { name: signOut }));

    // Then
    expect((await view.findByRole('alert')).textContent).toContain(failure);
    expect(view.getByRole('button', { name: recovery })).toBeTruthy();
  });

  it('keeps the shell and sign-out available while a refreshed session is re-verified', async () => {
    // Given
    const client = new FakeAdminAuthClient();
    const view = renderProtectedShell(client);
    await authorize(client);
    await view.findByRole('button', { name: '登出' });
    const pendingUser = deferred<{ readonly kind: 'authenticated'; readonly user: { readonly id: string; readonly email: string } }>();
    client.userResults.push(pendingUser.promise);
    client.allowlistResults.push(Promise.resolve({ kind: 'allowed' }));

    // When
    vi.useFakeTimers();
    act(() => client.emit(authEvent('TOKEN_REFRESHED', 'admin-id')));
    await act(async () => vi.runOnlyPendingTimersAsync());
    vi.useRealTimers();

    // Then
    expect(view.getByRole('heading', { name: 'Protected workspace' })).toBeTruthy();
    expect(view.getByRole('button', { name: '登出' }).hasAttribute('disabled')).toBe(false);
    expect(view.getByTestId('location').textContent).toBe('/admin');

    pendingUser.resolve({ kind: 'authenticated', user: { id: 'admin-id', email: 'admin@example.test' } });
    await waitFor(() => expect(view.getByRole('button', { name: '登出' })).toBeTruthy());
  });

  it('retries local sign-out from the recovery action', async () => {
    // Given
    const client = new FakeAdminAuthClient();
    client.signOutResults.push(Promise.resolve({ kind: 'error' }));
    const retrySignOut = deferred<{ readonly kind: 'success' }>();
    client.signOutResults.push(retrySignOut.promise);
    const view = renderProtectedShell(client);
    await authorize(client);
    fireEvent.click(await view.findByRole('button', { name: '登出' }));
    const retry = await view.findByRole('button', { name: '重試登出' });

    // When
    fireEvent.click(retry);

    // Then
    await waitFor(() => expect(client.signOutCallCount).toBe(2));
    const pendingSignOut = view.getByRole('button', { name: '登出' });
    expect(pendingSignOut.hasAttribute('disabled')).toBe(true);
    expect(pendingSignOut.getAttribute('aria-busy')).toBe('true');
  });
});
