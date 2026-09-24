// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AdminAuthState } from '@/admin/auth';
import { SiteProvider } from '@/app/site';
import { MemoryRouter } from 'react-router-dom';
import { AdminLoginPage } from './AdminLoginPage';

const authHarness = vi.hoisted(() => {
  let state: AdminAuthState = { status: 'booting' };
  return {
    read: () => ({
      state,
      signIn: vi.fn<(email: string, password: string) => Promise<void>>(),
      signOut: vi.fn<() => Promise<void>>(),
      retry: vi.fn<() => Promise<void>>(),
    }),
    setState: (nextState: AdminAuthState) => { state = nextState; },
  };
});

vi.mock('@/admin/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/admin/auth')>();
  return { ...actual, useAdminAuth: authHarness.read };
});

const NON_TRANSITION_STATES = [
  { status: 'anonymous' },
  { status: 'config-error', failure: { kind: 'disabled' } },
  { status: 'denied' },
  { status: 'expired' },
  { status: 'error', failure: 'sign-in-failed' },
  { status: 'error', failure: 'client-unavailable' },
  { status: 'error', failure: 'identity-check-failed' },
  { status: 'error', failure: 'allowlist-check-failed' },
  { status: 'error', failure: 'sign-out-failed' },
  { status: 'error', failure: 'unsupported-auth-event' },
  { status: 'authorized', user: { id: 'admin-id', email: null } },
] as const satisfies readonly AdminAuthState[];

function Login() {
  return (
    <SiteProvider>
      <MemoryRouter initialEntries={['/admin/login']}>
        <AdminLoginPage />
      </MemoryRouter>
    </SiteProvider>
  );
}

function getLiveRegion(container: HTMLElement): HTMLElement {
  const region = container.querySelector('.admin-auth-live-region');
  if (!(region instanceof HTMLElement)) {
    throw new TypeError('Administrator login live region was not rendered');
  }
  return region;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  authHarness.setState({ status: 'booting' });
});

describe('AdminLoginPage live-region policy', () => {
  it('keeps the same mounted live region empty throughout non-transition states', () => {
    // Given
    authHarness.setState({ status: 'booting' });
    const view = render(<Login />);
    const liveRegion = getLiveRegion(view.container);

    // Then
    expect(liveRegion.textContent).toBe('');

    for (const state of NON_TRANSITION_STATES) {
      // When
      authHarness.setState(state);
      view.rerender(<Login />);

      // Then
      expect(getLiveRegion(view.container)).toBe(liveRegion);
      expect(liveRegion.textContent).toBe('');
    }
  });

  it('announces authenticating and verifying with a separator, then clears on exit', () => {
    // Given
    authHarness.setState({ status: 'anonymous' });
    const view = render(<Login />);
    const liveRegion = getLiveRegion(view.container);

    // When
    authHarness.setState({ status: 'authenticating' });
    view.rerender(<Login />);

    // Then
    expect(getLiveRegion(view.container)).toBe(liveRegion);
    expect(liveRegion.textContent).toBe('正在登入 請稍候，系統正在確認帳號資料。');

    // When
    authHarness.setState({ status: 'anonymous' });
    view.rerender(<Login />);

    // Then
    expect(liveRegion.textContent).toBe('');

    // When
    authHarness.setState({ status: 'verifying' });
    view.rerender(<Login />);

    // Then
    expect(getLiveRegion(view.container)).toBe(liveRegion);
    expect(liveRegion.textContent).toBe(
      '正在確認管理權限 請稍候，系統正在確認你的管理權限。',
    );

    // When
    authHarness.setState({ status: 'denied' });
    view.rerender(<Login />);

    // Then
    expect(liveRegion.textContent).toBe('');
  });

  it('stays empty for non-transition language changes and localizes active transitions', async () => {
    // Given
    const user = userEvent.setup();
    authHarness.setState({ status: 'anonymous' });
    const view = render(<Login />);
    const liveRegion = getLiveRegion(view.container);

    // When
    await user.click(view.getByRole('button', { name: 'EN' }));

    // Then
    expect(getLiveRegion(view.container)).toBe(liveRegion);
    expect(liveRegion.textContent).toBe('');

    // When
    authHarness.setState({ status: 'authenticating' });
    view.rerender(<Login />);

    // Then
    expect(liveRegion.textContent).toBe(
      'Signing in Please wait while the account details are checked.',
    );

    // When
    await user.click(view.getByRole('button', { name: '中' }));

    // Then
    expect(getLiveRegion(view.container)).toBe(liveRegion);
    expect(liveRegion.textContent).toBe('正在登入 請稍候，系統正在確認帳號資料。');
  });
});
