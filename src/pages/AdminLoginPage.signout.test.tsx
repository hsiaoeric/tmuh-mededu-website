// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AdminAuthProvider } from '@/admin/auth';
import {
  CONFIGURED_AUTH,
  FakeAdminAuthClient,
  authEvent,
  deferred,
  type Deferred,
} from '@/admin/auth/testHarness';
import { SiteProvider } from '@/app/site';
import { MemoryRouter } from 'react-router-dom';
import { AdminLoginPage } from './AdminLoginPage';

type PendingFailure = Deferred<{ readonly kind: 'error' }>;
type SignOutSettlement = {
  readonly name: string;
  readonly settle: (pending: PendingFailure) => void;
};

const SIGN_OUT_SETTLEMENTS = [
  {
    name: 'resolved failure',
    settle: (pending) => pending.resolve({ kind: 'error' }),
  },
  {
    name: 'rejected operation',
    settle: (pending) => pending.reject(new Error('Local sign-out rejected')),
  },
] satisfies readonly SignOutSettlement[];

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AdminLoginPage sign-out transition', () => {
  it.each(SIGN_OUT_SETTLEMENTS)(
    'announces a real focused sign-out and clears after $name',
    async ({ settle }) => {
      // Given
      const user = userEvent.setup();
      const client = new FakeAdminAuthClient();
      const pendingSignOut = deferred<{ readonly kind: 'error' }>();
      client.signOutResults.push(pendingSignOut.promise);
      const view = render(
        <SiteProvider>
          <MemoryRouter initialEntries={['/admin/login']}>
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
    act(() => client.emit(authEvent('UNSUPPORTED', 'session-user-id')));
      const signOut = await view.findByRole('button', { name: '登出' });
      const liveRegion = view.container.querySelector('.admin-auth-live-region');
      expect(liveRegion?.textContent).toBe('');
      signOut.focus();

      // When
      await user.click(signOut);

      // Then
      await waitFor(() => expect(client.signOutCallCount).toBe(1));
      expect(view.queryByRole('button', { name: '登出' })).toBeNull();
      expect(document.activeElement).toBe(document.body);
      expect(view.container.querySelector('.admin-auth-live-region')).toBe(liveRegion);
      expect(liveRegion?.textContent).toBe(
        '正在安全登出 請稍候，系統正在安全結束目前的工作階段。',
      );
      expect(view.queryByRole('form')).toBeNull();
      expect(view.container.querySelectorAll('.admin-auth-mode button')).toHaveLength(0);

      // When
      act(() => settle(pendingSignOut));
      await view.findByText('登出尚未完成');

      // Then
      expect(view.container.querySelector('.admin-auth-live-region')).toBe(liveRegion);
      expect(liveRegion?.textContent).toBe('');
    },
  );
});
