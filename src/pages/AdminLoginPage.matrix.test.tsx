// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAdminAuthPresentation, type AdminAuthState } from '@/admin/auth';
import { SiteProvider } from '@/app/site';
import { MemoryRouter } from 'react-router-dom';
import { AdminLoginPage } from './AdminLoginPage';

const authHarness = vi.hoisted(() => {
  let state: unknown = { status: 'booting' };
  const signIn = vi.fn<(email: string, password: string) => Promise<void>>();
  const signOut = vi.fn<() => Promise<void>>();
  const retry = vi.fn<() => Promise<void>>();
  return {
    read: () => ({ state, signIn, signOut, retry }),
    setState: (nextState: unknown) => { state = nextState; },
    reset: () => {
      signIn.mockReset();
      signOut.mockReset();
      retry.mockReset();
    },
  };
});

vi.mock('@/admin/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/admin/auth')>();
  return { ...actual, useAdminAuth: authHarness.read };
});

type MatrixRow = {
  readonly name: string;
  readonly state: AdminAuthState;
  readonly mode: 'loading' | 'form' | 'recovery' | 'redirect';
  readonly form: boolean;
  readonly actions: number;
};

const MATRIX = [
  { name: 'booting', state: { status: 'booting' }, mode: 'loading', form: false, actions: 0 },
  { name: 'disabled configuration', state: { status: 'config-error', failure: { kind: 'disabled' } }, mode: 'recovery', form: false, actions: 0 },
  { name: 'partial configuration', state: { status: 'config-error', failure: { kind: 'invalid', reason: 'partial' } }, mode: 'recovery', form: false, actions: 0 },
  { name: 'invalid configuration', state: { status: 'config-error', failure: { kind: 'invalid', reason: 'invalid' } }, mode: 'recovery', form: false, actions: 0 },
  { name: 'anonymous', state: { status: 'anonymous' }, mode: 'form', form: true, actions: 1 },
  { name: 'authenticating', state: { status: 'authenticating' }, mode: 'loading', form: true, actions: 1 },
  { name: 'signing out', state: { status: 'signing-out' }, mode: 'loading', form: false, actions: 0 },
  { name: 'verifying', state: { status: 'verifying' }, mode: 'loading', form: false, actions: 0 },
  { name: 'authorized', state: { status: 'authorized', user: { id: 'admin-id', email: null } }, mode: 'redirect', form: false, actions: 0 },
  { name: 'denied', state: { status: 'denied' }, mode: 'recovery', form: false, actions: 2 },
  { name: 'expired', state: { status: 'expired' }, mode: 'recovery', form: false, actions: 2 },
  { name: 'client unavailable', state: { status: 'error', failure: 'client-unavailable' }, mode: 'recovery', form: false, actions: 1 },
  { name: 'sign in failed', state: { status: 'error', failure: 'sign-in-failed' }, mode: 'form', form: true, actions: 1 },
  { name: 'identity check failed', state: { status: 'error', failure: 'identity-check-failed' }, mode: 'recovery', form: false, actions: 2 },
  { name: 'allowlist check failed', state: { status: 'error', failure: 'allowlist-check-failed' }, mode: 'recovery', form: false, actions: 2 },
  { name: 'sign out failed', state: { status: 'error', failure: 'sign-out-failed' }, mode: 'recovery', form: false, actions: 1 },
  { name: 'unsupported event', state: { status: 'error', failure: 'unsupported-auth-event' }, mode: 'recovery', form: false, actions: 1 },
] as const satisfies readonly MatrixRow[];

afterEach(() => {
  cleanup();
  localStorage.clear();
  authHarness.reset();
});

describe('AdminLoginPage state matrix', () => {
  it.each(MATRIX)('renders $name through one visible transient surface and the approved actions', (row) => {
    // Given
    authHarness.setState(row.state);

    // When
    const view = render(
      <SiteProvider>
        <MemoryRouter initialEntries={['/admin/login']}>
          <AdminLoginPage />
        </MemoryRouter>
      </SiteProvider>,
    );
    const mode = view.container.querySelector(`[data-auth-mode="${row.mode}"]`);
    const form = view.queryByRole('form');
    const actions = view.container.querySelectorAll('.admin-auth-mode .admin-button');
    const presentation = getAdminAuthPresentation(row.state, 'zh');
    const modeText = mode?.textContent ?? '';
    const visibleStatusSurfaces = mode?.querySelectorAll(
      ':scope > .admin-state-panel, :scope > .admin-notice, '
      + ':scope > form > .admin-auth-form-intro, :scope > form > .admin-auth-alert',
    );

    // Then
    expect(mode).not.toBeNull();
    expect(mode?.querySelector('.sr-only')).toBeNull();
    expect(visibleStatusSurfaces).toHaveLength(1);
    expect(view.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(view.getByRole('heading', { level: 1 }).textContent).toBe('管理員登入');
    expect(view.container.querySelector('.admin-auth-heading p')?.textContent).toBe(
      '此頁供已授權的管理員帳號登入管理後台。',
    );
    expect(view.container.querySelector('.admin-auth-heading p')?.getAttribute('lang')).toBe('zh-Hant');
    expect(modeText.split(presentation.title)).toHaveLength(
      presentation.title === '管理員登入' ? 1 : 2,
    );
    expect(modeText.split(presentation.description)).toHaveLength(2);
    expect(form !== null).toBe(row.form);
    expect(actions).toHaveLength(row.actions);
    if (row.name === 'authenticating') {
      expect(actions[0]?.getAttribute('aria-busy')).toBe('true');
      expect(actions[0]?.hasAttribute('disabled')).toBe(true);
    }
  });

  it('keeps the denied recovery instruction as semantic Chinese phrases', () => {
    // Given
    authHarness.setState({ status: 'denied' });

    // When
    const view = render(
      <SiteProvider>
        <MemoryRouter initialEntries={['/admin/login']}>
          <AdminLoginPage />
        </MemoryRouter>
      </SiteProvider>,
    );
    const groupedInstructions = [
      ...view.container.querySelectorAll(
        '.admin-auth-heading p .admin-phrase-group[lang="zh-Hant"], '
        + '.admin-notice p .admin-phrase-group[lang="zh-Hant"]',
      ),
    ].map((group) => group.textContent);

    // Then
    expect(groupedInstructions.filter((text) => text === '重新確認，')).toHaveLength(1);
  });

  it('keeps the disabled configuration instruction as semantic Chinese phrases', () => {
    // Given
    authHarness.setState({ status: 'config-error', failure: { kind: 'disabled' } });

    // When
    const view = render(
      <SiteProvider>
        <MemoryRouter initialEntries={['/admin/login']}>
          <AdminLoginPage />
        </MemoryRouter>
      </SiteProvider>,
    );
    const groupedInstructions = [
      ...view.container.querySelectorAll(
        '.admin-auth-heading p .admin-phrase-group[lang="zh-Hant"], '
        + '.admin-notice p .admin-phrase-group[lang="zh-Hant"]',
      ),
    ].map((group) => group.textContent);

    // Then
    expect(groupedInstructions.filter((text) => text === '目前無法使用管理員登入，')).toHaveLength(1);
    expect(groupedInstructions.filter((text) => text === '網站管理人員。')).toHaveLength(1);
    expect(view.container.textContent).not.toContain('管理登入');
    expect(
      view.getByRole('heading', { level: 1 }).querySelector('.admin-auth-focus-label')?.textContent,
    ).toBe('管理員登入');
  });

  it('keeps one polite live-region node while authentication states change without focus', () => {
    // Given
    authHarness.setState({ status: 'booting' });
    const content = () => (
      <SiteProvider>
        <MemoryRouter initialEntries={['/admin/login']}>
          <AdminLoginPage />
        </MemoryRouter>
      </SiteProvider>
    );
    const view = render(content());
    const liveRegion = view.container.querySelector('.admin-auth-live-region');

    // When
    authHarness.setState({ status: 'anonymous' });
    view.rerender(content());
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    authHarness.setState({ status: 'authenticating' });
    view.rerender(content());

    // Then
    expect(view.container.querySelectorAll('.admin-auth-live-region')).toHaveLength(1);
    expect(view.container.querySelector('.admin-auth-live-region')).toBe(liveRegion);
    expect(liveRegion?.getAttribute('role')).toBe('status');
    expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
    expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
    expect(liveRegion?.textContent).toBe('正在登入 請稍候，系統正在確認帳號資料。');
    expect(document.activeElement).toBe(document.body);

    authHarness.setState({ status: 'verifying' });
    view.rerender(content());
    expect(view.container.querySelector('.admin-auth-live-region')).toBe(liveRegion);
    expect(liveRegion?.textContent).toBe('正在確認管理權限 請稍候，系統正在確認你的管理權限。');

    authHarness.setState({ status: 'signing-out' });
    view.rerender(content());
    expect(view.container.querySelector('.admin-auth-live-region')).toBe(liveRegion);
    expect(liveRegion?.textContent).toBe('正在安全登出 請稍候，系統正在安全結束目前的工作階段。');
  });

  it('keeps the signing-out session unit together in the visible loading panel', () => {
    // Given
    authHarness.setState({ status: 'signing-out' });

    // When
    const view = render(
      <SiteProvider>
        <MemoryRouter initialEntries={['/admin/login']}>
          <AdminLoginPage />
        </MemoryRouter>
      </SiteProvider>,
    );
    const groups = [...view.container.querySelectorAll(
      '.admin-auth-mode .admin-phrase-group[lang="zh-Hant"]',
    )].map((group) => group.textContent);

    // Then
    expect(groups).toContain('目前的工作階段。');
    expect(view.container.querySelector('[data-state="loading"]')?.hasAttribute('aria-live')).toBe(false);
    expect(view.queryByRole('form')).toBeNull();
    expect(view.container.querySelectorAll('.admin-auth-mode input')).toHaveLength(0);
    expect(view.container.querySelectorAll('.admin-auth-mode button')).toHaveLength(0);
  });
});
