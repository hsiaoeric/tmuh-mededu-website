// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AdminAuthProvider } from '@/admin/auth';
import {
  CONFIGURED_AUTH,
  FakeAdminAuthClient,
  authEvent,
  deferred,
} from '@/admin/auth/testHarness';
import { SiteProvider } from '@/app/site';
import { MemoryRouter } from 'react-router-dom';
import { AdminLoginPage } from './AdminLoginPage';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

async function renderAnonymous(client: FakeAdminAuthClient) {
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
  act(() => client.emit(authEvent('INITIAL_SESSION', null)));
  await waitFor(() => expect(view.getByRole('form')).toBeTruthy());
  return view;
}

describe('AdminLoginPage form', () => {
  it('renders a focused, skippable login landmark with persistent native labels', async () => {
    // Given
    const view = await renderAnonymous(new FakeAdminAuthClient());

    // When
    const heading = view.getByRole('heading', { level: 1 });
    const main = view.getByRole('main');
    const email = view.getByRole('textbox', { name: /^電子郵件/ });
    const password = view.getByLabelText(/^密碼/);

    // Then
    expect(view.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.activeElement).toBe(heading);
    expect(heading.textContent).toBe('管理員登入');
    expect(main.id).toBe('admin-login-main');
    expect(view.getByRole('link', { name: '跳到登入內容' }).getAttribute('href')).toBe('#admin-login-main');
    expect(email.getAttribute('type')).toBe('email');
    expect(email.getAttribute('autocomplete')).toBe('username');
    expect(password.getAttribute('type')).toBe('password');
    expect(password.getAttribute('autocomplete')).toBe('current-password');
    expect(
      [...view.container.querySelectorAll(
        '.admin-auth-heading p .admin-phrase-group[lang="zh-Hant"]',
      )].map((group) => group.textContent),
    ).toContain('管理員帳號登入');
  });

  it('moves focus to the login landmark on skip-link activation, then tabs into the form', async () => {
    // Given
    const user = userEvent.setup();
    const view = await renderAnonymous(new FakeAdminAuthClient());
    const skipLink = view.getByRole('link', { name: '跳到登入內容' });
    const main = view.getByRole('main');
    const email = view.getByRole('textbox', { name: /^電子郵件/ });
    skipLink.focus();

    // When
    await user.keyboard('{Enter}');

    // Then
    expect(document.activeElement).toBe(main);
    await user.tab();
    expect(document.activeElement).toBe(email);
  });

  it('updates runtime language and theme without stealing focus back to the heading', async () => {
    // Given
    localStorage.setItem('tmuh.theme', 'light');
    const user = userEvent.setup();
    const view = await renderAnonymous(new FakeAdminAuthClient());
    const heading = view.getByRole('heading', { level: 1 });

    // When
    await user.click(view.getByRole('button', { name: 'EN' }));
    await user.click(view.getByRole('button', { name: 'Toggle theme' }));

    // Then
    await waitFor(() => expect(document.documentElement.lang).toBe('en'));
    expect(view.getByRole('heading', { level: 1 }).textContent).toBe('Administrator sign-in');
    expect(view.container.querySelector('.admin-auth-heading p')?.getAttribute('lang')).toBe('en');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(view.getByRole('textbox', { name: /^Email/ })).toBeTruthy();
    expect(document.activeElement).not.toBe(heading);
  });

  it('submits once on Enter, exposes busy controls, then retains email and clears password', async () => {
    // Given
    const user = userEvent.setup();
    const client = new FakeAdminAuthClient();
    const signInResult = deferred<{ readonly kind: 'error' }>();
    client.signInResults.push(signInResult.promise);
    const view = await renderAnonymous(client);
    const email = view.getByRole('textbox', { name: /^電子郵件/ });
    const password = view.getByLabelText(/^密碼/);
    const liveRegion = view.container.querySelector('.admin-auth-live-region');
    await user.type(email, 'admin@example.com');
    await user.type(password, 'not-the-password');

    // When
    await user.keyboard('{Enter}');
    const form = view.getByRole('form');
    fireEvent.submit(form);

    // Then
    await waitFor(() => expect(client.signInCalls).toHaveLength(1));
    expect(client.signInCalls[0]).toEqual({
      email: 'admin@example.com',
      password: 'not-the-password',
    });
    expect(email.hasAttribute('disabled')).toBe(true);
    expect(password.hasAttribute('disabled')).toBe(true);
    const busyButton = view.getByRole('button', { name: '正在登入' });
    expect(busyButton.getAttribute('aria-busy')).toBe('true');
    expect(busyButton.hasAttribute('disabled')).toBe(true);

    act(() => signInResult.resolve({ kind: 'error' }));
    const alert = await view.findByRole('alert');
    await waitFor(() => expect(password.getAttribute('value')).toBe(''));
    expect(email.getAttribute('value')).toBe('admin@example.com');
    expect(document.activeElement).toBe(alert);
    expect(view.container.querySelector('.admin-auth-live-region')).toBe(liveRegion);
    expect(liveRegion?.textContent).toBe('');
    expect(email.getAttribute('aria-describedby')).toBe(alert.id);
    expect(password.getAttribute('aria-describedby')).toBe(alert.id);
    expect(
      [...alert.querySelectorAll('.admin-phrase-group[lang="zh-Hant"]')]
        .map((group) => group.textContent),
    ).toContain('再試一次。');
  });
});
