// @vitest-environment jsdom

import { act, cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContentConfigurationError } from '@/content/errors';
import type { SupabaseConfiguration } from '@/content/env';
import {
  authEvent,
  FakeAdminAuthClient,
  deferred,
  renderAuth,
} from './testHarness';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function runDeferredVerification(): Promise<void> {
  await act(async () => {
    await vi.runOnlyPendingTimersAsync();
  });
}

describe('AdminAuthProvider lifecycle', () => {
  it('stays booting while client loading is unresolved', () => {
    const pending = deferred<FakeAdminAuthClient>();
    renderAuth({ loadClient: () => pending.promise });

    expect(screen.getByTestId('auth-state').textContent).toBe('{"status":"booting"}');
  });

  it.each([
    [{ kind: 'disabled' }, { kind: 'disabled' }],
    [
      {
        kind: 'invalid',
        error: new ContentConfigurationError('partial', 'raw partial details'),
      },
      { kind: 'invalid', reason: 'partial' },
    ],
    [
      {
        kind: 'invalid',
        error: new ContentConfigurationError('invalid', 'raw invalid details'),
      },
      { kind: 'invalid', reason: 'invalid' },
    ],
  ] satisfies readonly (readonly [SupabaseConfiguration, object])[])(
    'fails closed for configuration %# without loading a client',
    async (configuration, failure) => {
      const loadClient = vi.fn(() => Promise.resolve(new FakeAdminAuthClient()));
      renderAuth({ configuration, loadClient });

      await waitFor(() =>
        expect(JSON.parse(screen.getByTestId('auth-state').textContent ?? '')).toEqual({
          status: 'config-error',
          failure,
        }),
      );
      expect(loadClient).not.toHaveBeenCalled();
    },
  );

  it('normalizes client-load failure and subscribes immediately after a later load', async () => {
    const client = new FakeAdminAuthClient();
    const loadClient = vi
      .fn<() => Promise<FakeAdminAuthClient>>()
      .mockRejectedValueOnce(new Error('raw client failure'))
      .mockResolvedValueOnce(client);
    const auth = renderAuth({ loadClient });
    await waitFor(() => expect(auth.current().state).toEqual({
      status: 'error',
      failure: 'client-unavailable',
    }));

    await act(() => auth.current().retry());

    expect(client.subscriptionCount).toBe(1);
    expect(client.userCallCount).toBe(0);
  });

  it('normalizes a synchronous client-loader throw', async () => {
    const auth = renderAuth({
      loadClient: () => { throw new Error('raw loader throw'); },
    });

    await waitFor(() => expect(auth.current().state).toEqual({
      status: 'error',
      failure: 'client-unavailable',
    }));
  });

  it('normalizes a synchronous subscription throw', async () => {
    class ThrowingSubscriptionClient extends FakeAdminAuthClient {
      subscribe(): never {
        throw new Error('raw subscription throw');
      }
    }
    const client = new ThrowingSubscriptionClient();
    const auth = renderAuth({ loadClient: () => Promise.resolve(client) });

    await waitFor(() => expect(auth.current().state).toEqual({
      status: 'error',
      failure: 'client-unavailable',
    }));
    expect(client.listeners.size).toBe(0);
  });

  it('keeps client-unavailable when subscription emits then throws', async () => {
    vi.useFakeTimers();
    class EmittingThrowingSubscriptionClient extends FakeAdminAuthClient {
      subscribe(listener: Parameters<FakeAdminAuthClient['subscribe']>[0]): never {
        listener(authEvent('SIGNED_IN', 'session-user-id'));
        throw new Error('raw subscription throw after event');
      }
    }
    const client = new EmittingThrowingSubscriptionClient();
    client.userResults.push(Promise.resolve({
      kind: 'authenticated',
      user: { id: 'admin-id', email: 'admin@example.com' },
    }));
    client.allowlistResults.push(Promise.resolve({ kind: 'allowed' }));
    const auth = renderAuth({ loadClient: () => Promise.resolve(client) });

    await act(async () => { await Promise.resolve(); });
    expect(auth.current().state).toEqual({ status: 'error', failure: 'client-unavailable' });
    await runDeferredVerification();
    expect(client.userCallCount).toBe(0);
    expect(auth.current().state).toEqual({ status: 'error', failure: 'client-unavailable' });
  });

  it.each(['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'] as const)(
    'verifies identity then allowlist for %s outside the callback',
    async (event) => {
      const client = new FakeAdminAuthClient();
      client.userResults.push(Promise.resolve({
        kind: 'authenticated',
        user: { id: 'admin-id', email: 'admin@example.com' },
      }));
      client.allowlistResults.push(Promise.resolve({ kind: 'allowed' }));
      const auth = renderAuth({ loadClient: () => Promise.resolve(client) });
      await waitFor(() => expect(client.subscriptionCount).toBe(1));
      vi.useFakeTimers();

      act(() => client.emit(authEvent(event, 'session-user-id')));

      expect(auth.current().state).toEqual({ status: 'verifying' });
      expect(client.userCallCount).toBe(0);
      await runDeferredVerification();
      expect(auth.current().state).toEqual({
        status: 'authorized',
        user: { id: 'admin-id', email: 'admin@example.com' },
      });
      expect(client.allowlistCallCount).toBe(1);
    },
  );

  it.each([
    [{ kind: 'expired' }, undefined, { status: 'expired' }],
    [
      { kind: 'authenticated', user: { id: 'user-id', email: null } },
      { kind: 'denied' },
      { status: 'denied' },
    ],
    [{ kind: 'error' }, undefined, { status: 'error', failure: 'identity-check-failed' }],
    [
      { kind: 'authenticated', user: { id: 'user-id', email: null } },
      { kind: 'error' },
      { status: 'error', failure: 'allowlist-check-failed' },
    ],
  ] as const)('maps verification outcome %#', async (userResult, allowlistResult, expected) => {
    const client = new FakeAdminAuthClient();
    client.userResults.push(Promise.resolve(userResult));
    if (allowlistResult !== undefined) {
      client.allowlistResults.push(Promise.resolve(allowlistResult));
    }
    const auth = renderAuth({ loadClient: () => Promise.resolve(client) });
    await waitFor(() => expect(client.subscriptionCount).toBe(1));
    vi.useFakeTimers();

    act(() => client.emit(authEvent('INITIAL_SESSION', 'session-user-id')));
    await runDeferredVerification();

    expect(auth.current().state).toEqual(expected);
  });

  it('normalizes an injected identity rejection', async () => {
    const client = new FakeAdminAuthClient();
    const pendingIdentity = deferred<{ readonly kind: 'expired' }>();
    client.userResults.push(pendingIdentity.promise);
    const auth = renderAuth({ loadClient: () => Promise.resolve(client) });
    await waitFor(() => expect(client.subscriptionCount).toBe(1));
    vi.useFakeTimers();
    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
    act(() => vi.runOnlyPendingTimers());

    await act(async () => pendingIdentity.reject(new Error('raw identity rejection')));

    expect(auth.current().state).toEqual({
      status: 'error',
      failure: 'identity-check-failed',
    });
  });

  it('normalizes an injected allowlist rejection', async () => {
    const client = new FakeAdminAuthClient();
    const pendingAllowlist = deferred<{ readonly kind: 'denied' }>();
    client.userResults.push(Promise.resolve({
      kind: 'authenticated',
      user: { id: 'admin-id', email: null },
    }));
    client.allowlistResults.push(pendingAllowlist.promise);
    const auth = renderAuth({ loadClient: () => Promise.resolve(client) });
    await waitFor(() => expect(client.subscriptionCount).toBe(1));
    vi.useFakeTimers();
    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
    act(() => vi.runOnlyPendingTimers());
    await act(async () => Promise.resolve());

    await act(async () => pendingAllowlist.reject(new Error('raw allowlist rejection')));

    expect(auth.current().state).toEqual({
      status: 'error',
      failure: 'allowlist-check-failed',
    });
  });

  it.each([
    ['INITIAL_SESSION', false, { status: 'anonymous' }],
    ['PASSWORD_RECOVERY', true, { status: 'error', failure: 'unsupported-auth-event' }],
    ['UNSUPPORTED', true, { status: 'error', failure: 'unsupported-auth-event' }],
    ['SIGNED_OUT', true, { status: 'anonymous' }],
  ] as const)('fails closed for %s with session=%s', async (event, present, expected) => {
    const client = new FakeAdminAuthClient();
    const auth = renderAuth({ loadClient: () => Promise.resolve(client) });
    await waitFor(() => expect(client.subscriptionCount).toBe(1));

    act(() => client.emit(authEvent(event, present ? 'session-user-id' : null)));

    expect(auth.current().state).toEqual(expected);
    expect(client.userCallCount).toBe(0);
  });
});
