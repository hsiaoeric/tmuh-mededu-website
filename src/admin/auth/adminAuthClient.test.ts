import { describe, expect, it, vi } from 'vitest';
import {
  createAdminAuthClient,
  type AdminAuthEvent,
  type AdminAuthSupabaseOperations,
} from './adminAuthClient';

function operations(
  overrides: Partial<AdminAuthSupabaseOperations> = {},
): AdminAuthSupabaseOperations {
  return {
    subscribe: () => ({ unsubscribe: () => undefined }),
    getUser: () => Promise.resolve({ user: null, error: null }),
    rpc: () => Promise.resolve({ data: false, error: null }),
    signInWithPassword: () => Promise.resolve({ error: null }),
    signOut: () => Promise.resolve({ error: null }),
    ...overrides,
  };
}

describe('createAdminAuthClient', () => {
  it.each([
    ['INITIAL_SESSION', 'INITIAL_SESSION'],
    ['SIGNED_IN', 'SIGNED_IN'],
    ['SIGNED_OUT', 'SIGNED_OUT'],
    ['TOKEN_REFRESHED', 'TOKEN_REFRESHED'],
    ['USER_UPDATED', 'USER_UPDATED'],
    ['PASSWORD_RECOVERY', 'PASSWORD_RECOVERY'],
    ['MFA_CHALLENGE_VERIFIED', 'UNSUPPORTED'],
    ['FUTURE_EVENT', 'UNSUPPORTED'],
  ] satisfies readonly (readonly [string, AdminAuthEvent])[])(
    'maps %s to %s synchronously',
    (rawEvent, expectedEvent) => {
      let rawListener: Parameters<AdminAuthSupabaseOperations['subscribe']>[0] | undefined;
      const client = createAdminAuthClient(
        operations({
          subscribe: (listener) => {
            rawListener = listener;
            return { unsubscribe: () => undefined };
          },
        }),
      );
      const listener = vi.fn();
      client.subscribe(listener);

      rawListener?.(rawEvent, {
        user: { id: '11111111-1111-4111-8111-111111111111' },
      });

      expect(listener).toHaveBeenCalledWith({
        event: expectedEvent,
        sessionPresent: true,
        sessionUserId: '11111111-1111-4111-8111-111111111111',
      });
    },
  );

  it.each([
    [null, false, null],
    [{ user: { id: '' } }, true, null],
    [{ user: { id: 'not-a-uuid' } }, true, null],
  ] as const)(
    'normalizes session identity %#',
    (session, sessionPresent, sessionUserId) => {
      let rawListener: Parameters<AdminAuthSupabaseOperations['subscribe']>[0] | undefined;
      const client = createAdminAuthClient(operations({
        subscribe: (listener) => {
          rawListener = listener;
          return { unsubscribe: () => undefined };
        },
      }));
      const listener = vi.fn();
      client.subscribe(listener);

      rawListener?.('SIGNED_IN', session);

      expect(listener).toHaveBeenCalledWith({
        event: 'SIGNED_IN',
        sessionPresent,
        sessionUserId,
      });
    },
  );

  it.each([
    {
      result: { user: { id: 'user-id', email: 'admin@example.com' }, error: null },
      expected: {
        kind: 'authenticated',
        user: { id: 'user-id', email: 'admin@example.com' },
      },
    },
    {
      result: { user: { id: 'user-id', email: undefined }, error: null },
      expected: { kind: 'authenticated', user: { id: 'user-id', email: null } },
    },
    {
      result: { user: null, error: null },
      expected: { kind: 'expired' },
    },
    {
      result: { user: { id: 'user-id', email: 'admin@example.com' }, error: {} },
      expected: { kind: 'error' },
    },
  ])('normalizes authenticated-user result %#', async ({ result, expected }) => {
    const client = createAdminAuthClient(
      operations({ getUser: () => Promise.resolve(result) }),
    );

    await expect(client.getAuthenticatedUser()).resolves.toEqual(expected);
  });

  it('normalizes a rejected authenticated-user request', async () => {
    const client = createAdminAuthClient(
      operations({ getUser: () => Promise.reject(new Error('raw identity error')) }),
    );

    await expect(client.getAuthenticatedUser()).resolves.toEqual({ kind: 'error' });
  });

  it('normalizes a synchronous authenticated-user throw', async () => {
    const client = createAdminAuthClient(
      operations({ getUser: () => { throw new Error('raw identity throw'); } }),
    );

    await expect(client.getAuthenticatedUser()).resolves.toEqual({ kind: 'error' });
  });

  it.each([
    [{ data: true, error: null }, { kind: 'allowed' }],
    [{ data: false, error: null }, { kind: 'denied' }],
    [{ data: null, error: null }, { kind: 'denied' }],
    [{ data: true, error: {} }, { kind: 'error' }],
  ] satisfies readonly (readonly [
    { readonly data: boolean | null; readonly error: unknown | null },
    { readonly kind: 'allowed' | 'denied' | 'error' },
  ])[])('normalizes allowlist result %#', async (result, expected) => {
    const rpc = vi.fn(() => Promise.resolve(result));
    const client = createAdminAuthClient(operations({ rpc }));

    await expect(client.checkAdminAllowlist()).resolves.toEqual(expected);
    expect(rpc).toHaveBeenCalledWith('is_cms_admin');
  });

  it('normalizes a rejected allowlist request', async () => {
    const client = createAdminAuthClient(
      operations({
        rpc: () => Promise.reject(new Error('raw allowlist error')),
      }),
    );

    await expect(client.checkAdminAllowlist()).resolves.toEqual({ kind: 'error' });
  });

  it('normalizes a synchronous allowlist throw', async () => {
    const client = createAdminAuthClient(
      operations({ rpc: () => { throw new Error('raw allowlist throw'); } }),
    );

    await expect(client.checkAdminAllowlist()).resolves.toEqual({ kind: 'error' });
  });

  it('forwards credentials and normalizes sign-in failures', async () => {
    const signInWithPassword = vi.fn(() => Promise.resolve({ error: {} }));
    const client = createAdminAuthClient(operations({ signInWithPassword }));

    await expect(client.signIn('admin@example.com', 'secret')).resolves.toEqual({
      kind: 'error',
    });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'secret',
    });
  });

  it.each([
    ['synchronous throw', () => { throw new Error('raw sign-in throw'); }],
    ['rejection', () => Promise.reject(new Error('raw sign-in rejection'))],
  ])('normalizes sign-in %s', async (_name, signInWithPassword) => {
    const client = createAdminAuthClient(operations({ signInWithPassword }));

    await expect(client.signIn('admin@example.com', 'secret')).resolves.toEqual({
      kind: 'error',
    });
  });

  it('uses local scope and normalizes sign-out rejection', async () => {
    const signOut = vi.fn(() => Promise.reject(new Error('raw sign-out error')));
    const client = createAdminAuthClient(operations({ signOut }));

    await expect(client.signOutLocal()).resolves.toEqual({ kind: 'error' });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('normalizes a synchronous sign-out throw', async () => {
    const client = createAdminAuthClient(
      operations({ signOut: () => { throw new Error('raw sign-out throw'); } }),
    );

    await expect(client.signOutLocal()).resolves.toEqual({ kind: 'error' });
  });
});
