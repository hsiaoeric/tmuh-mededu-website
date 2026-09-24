// @vitest-environment jsdom

import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AdminAuthClient, AdminAuthEvent } from './adminAuthClient';
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

async function runVerification(): Promise<void> {
  await act(async () => vi.runOnlyPendingTimersAsync());
}

function retainListener(
  client: FakeAdminAuthClient,
): (payload: ReturnType<typeof authEvent>) => void {
  const result = client.listeners.values().next();
  if (result.done) throw new TypeError('Expected an active auth listener');
  return result.value;
}

describe('AdminAuthProvider load and action generations', () => {
  it.each(['signIn', 'signOut'] as const)(
    'keeps initial loading current when %s has no client',
    async (action) => {
      const pendingClient = deferred<AdminAuthClient>();
      const client = new FakeAdminAuthClient();
      const auth = renderAuth({ loadClient: () => pendingClient.promise });

      await act(() =>
        action === 'signIn'
          ? auth.current().signIn('admin@example.com', 'secret')
          : auth.current().signOut(),
      );
      expect(auth.current().state).toEqual({ status: 'booting' });
      pendingClient.resolve(client);
      await waitFor(() => expect(client.subscriptionCount).toBe(1));

      expect(client.listeners.size).toBe(1);
      expect(auth.current().state.status).not.toBe('authorized');
    },
  );

  it('keeps retry loading current when sign-out has no client', async () => {
    const retryClient = deferred<AdminAuthClient>();
    const client = new FakeAdminAuthClient();
    const loadClient = vi
      .fn<() => Promise<AdminAuthClient>>()
      .mockRejectedValueOnce(new Error('initial load failure'))
      .mockReturnValueOnce(retryClient.promise);
    const auth = renderAuth({ loadClient });
    await waitFor(() => expect(auth.current().state).toEqual({
      status: 'error',
      failure: 'client-unavailable',
    }));
    let retryPromise: Promise<void> = Promise.resolve();
    act(() => {
      retryPromise = auth.current().retry();
    });

    await act(() => auth.current().signOut());
    expect(auth.current().state).toEqual({ status: 'booting' });
    retryClient.resolve(client);
    await act(() => retryPromise);

    expect(client.subscriptionCount).toBe(1);
    expect(client.listeners.size).toBe(1);
    expect(auth.current().state).toEqual({ status: 'booting' });
  });

  it.each([
    'SIGNED_IN',
    'TOKEN_REFRESHED',
    'USER_UPDATED',
  ] satisfies readonly AdminAuthEvent[])(
    'keeps rejected sign-out fail-closed across %s',
    async (event) => {
      const client = new FakeAdminAuthClient();
      const pendingSignOut = deferred<{ readonly kind: 'error' }>();
      client.signOutResults.push(pendingSignOut.promise);
      client.userResults.push(Promise.resolve({
        kind: 'authenticated',
        user: { id: 'admin-id', email: null },
      }));
      client.allowlistResults.push(Promise.resolve({ kind: 'allowed' }));
      const auth = renderAuth({ loadClient: () => Promise.resolve(client) });
      await waitFor(() => expect(client.subscriptionCount).toBe(1));
      let signOutPromise: Promise<void> = Promise.resolve();
      act(() => {
        signOutPromise = auth.current().signOut();
      });
      vi.useFakeTimers();

      act(() => client.emit(authEvent(event, 'session-user-id')));
      await runVerification();
      pendingSignOut.resolve({ kind: 'error' });
      await act(() => signOutPromise);

      expect(client.userCallCount).toBe(0);
      expect(client.allowlistCallCount).toBe(0);
      expect(auth.current().state).toEqual({
        status: 'error',
        failure: 'sign-out-failed',
      });
    },
  );

  it('permits verification after successful local sign-out and explicit sign-in', async () => {
    const client = new FakeAdminAuthClient();
    client.userResults.push(Promise.resolve({
      kind: 'authenticated',
      user: { id: 'signed-in-admin', email: null },
    }));
    client.allowlistResults.push(Promise.resolve({ kind: 'allowed' }));
    const auth = renderAuth({ loadClient: () => Promise.resolve(client) });
    await waitFor(() => expect(client.subscriptionCount).toBe(1));

    await act(() => auth.current().signOut());
    await act(() => auth.current().signIn('admin@example.com', 'secret'));
    vi.useFakeTimers();
    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
    await runVerification();

    expect(client.allowlistCallCount).toBe(1);
    expect(auth.current().state).toEqual({
      status: 'authorized',
      user: { id: 'signed-in-admin', email: null },
    });
  });

  it('permits verification after definitive signed-out and explicit sign-in', async () => {
    const client = new FakeAdminAuthClient();
    const pendingSignOut = deferred<{ readonly kind: 'error' }>();
    client.signOutResults.push(pendingSignOut.promise);
    client.userResults.push(Promise.resolve({
      kind: 'authenticated',
      user: { id: 'returned-admin', email: null },
    }));
    client.allowlistResults.push(Promise.resolve({ kind: 'allowed' }));
    const auth = renderAuth({ loadClient: () => Promise.resolve(client) });
    await waitFor(() => expect(client.subscriptionCount).toBe(1));
    let signOutPromise: Promise<void> = Promise.resolve();
    act(() => {
      signOutPromise = auth.current().signOut();
    });

    act(() => client.emit(authEvent('SIGNED_OUT', null)));
    pendingSignOut.resolve({ kind: 'error' });
    await act(() => signOutPromise);
    await act(() => auth.current().signIn('admin@example.com', 'secret'));
    vi.useFakeTimers();
    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
    await runVerification();

    expect(client.allowlistCallCount).toBe(1);
    expect(auth.current().state).toEqual({
      status: 'authorized',
      user: { id: 'returned-admin', email: null },
    });
  });

  it('lets a newer auth event supersede pending verification retry', async () => {
    const client = new FakeAdminAuthClient();
    client.userResults.push(Promise.resolve({ kind: 'expired' }));
    const auth = renderAuth({ loadClient: () => Promise.resolve(client) });
    await waitFor(() => expect(client.subscriptionCount).toBe(1));
    vi.useFakeTimers();
    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
    await runVerification();
    const staleRetry = deferred<{ readonly kind: 'expired' }>();
    client.userResults.push(
      staleRetry.promise,
      Promise.resolve({
        kind: 'authenticated',
        user: { id: 'current-admin', email: null },
      }),
    );
    client.allowlistResults.push(Promise.resolve({ kind: 'allowed' }));
    let retryPromise: Promise<void> = Promise.resolve();
    act(() => {
      retryPromise = auth.current().retry();
    });

    act(() => client.emit(authEvent('TOKEN_REFRESHED', 'session-user-id')));
    await runVerification();
    staleRetry.resolve({ kind: 'expired' });
    await act(() => retryPromise);

    expect(auth.current().state).toEqual({
      status: 'authorized',
      user: { id: 'current-admin', email: null },
    });
  });

  it('ignores stale client load after configuration replacement', async () => {
    const staleLoad = deferred<AdminAuthClient>();
    const staleClient = new FakeAdminAuthClient();
    const currentClient = new FakeAdminAuthClient();
    const auth = renderAuth({ loadClient: () => staleLoad.promise });
    const currentConfiguration = {
      kind: 'configured',
      config: {
        url: 'https://replacement.supabase.co',
        publishableKey: 'sb_publishable_replacement',
      },
    } as const;

    auth.rerender({
      configuration: currentConfiguration,
      loadClient: () => Promise.resolve(currentClient),
    });
    await waitFor(() => expect(currentClient.subscriptionCount).toBe(1));
    staleLoad.resolve(staleClient);
    await act(async () => staleLoad.promise);

    expect(staleClient.subscriptionCount).toBe(0);
    expect(currentClient.listeners.size).toBe(1);
  });

  it('keeps disabled configuration current when a retired listener emits', async () => {
    const retiredClient = new FakeAdminAuthClient();
    const auth = renderAuth({ loadClient: () => Promise.resolve(retiredClient) });
    await waitFor(() => expect(retiredClient.subscriptionCount).toBe(1));
    const retiredListener = retainListener(retiredClient);

    auth.rerender({ configuration: { kind: 'disabled' } });
    await waitFor(() => expect(auth.current().state).toEqual({
      status: 'config-error',
      failure: { kind: 'disabled' },
    }));
    act(() => retiredListener(authEvent('SIGNED_OUT', null)));

    expect(auth.current().state).toEqual({
      status: 'config-error',
      failure: { kind: 'disabled' },
    });
  });

  it('keeps replacement loading current when a retired listener emits', async () => {
    const retiredClient = new FakeAdminAuthClient();
    const replacementLoad = deferred<AdminAuthClient>();
    const replacementClient = new FakeAdminAuthClient();
    const auth = renderAuth({ loadClient: () => Promise.resolve(retiredClient) });
    await waitFor(() => expect(retiredClient.subscriptionCount).toBe(1));
    const retiredListener = retainListener(retiredClient);

    auth.rerender({
      configuration: {
        kind: 'configured',
        config: {
          url: 'https://replacement.supabase.co',
          publishableKey: 'sb_publishable_replacement',
        },
      },
      loadClient: () => replacementLoad.promise,
    });
    act(() => retiredListener(authEvent('SIGNED_OUT', null)));
    replacementLoad.resolve(replacementClient);
    await act(async () => replacementLoad.promise);

    expect(replacementClient.subscriptionCount).toBe(1);
    expect(replacementClient.listeners.size).toBe(1);
  });
});
