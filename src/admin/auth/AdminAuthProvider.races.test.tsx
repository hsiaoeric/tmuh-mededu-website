// @vitest-environment jsdom

import { StrictMode, type ReactNode } from 'react';
import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AdminAllowlistResult } from './adminAuthClient';
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

async function load(client: FakeAdminAuthClient) {
  const auth = renderAuth({ loadClient: () => Promise.resolve(client) });
  await waitFor(() => expect(client.subscriptionCount).toBe(1));
  vi.useFakeTimers();
  return auth;
}

async function startScheduledVerification(): Promise<void> {
  act(() => vi.runOnlyPendingTimers());
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('AdminAuthProvider generations and cleanup', () => {
  it('prevents stale getUser from starting an RPC after a duplicate event', async () => {
    const client = new FakeAdminAuthClient();
    const staleUser = deferred<{ readonly kind: 'expired' }>();
    client.userResults.push(
      staleUser.promise,
      Promise.resolve({
        kind: 'authenticated',
        user: { id: 'current-admin', email: null },
      }),
    );
    client.allowlistResults.push(Promise.resolve({ kind: 'allowed' }));
    const auth = await load(client);
    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
    await startScheduledVerification();

    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
    await startScheduledVerification();
    staleUser.resolve({ kind: 'expired' });
    await act(async () => staleUser.promise);

    expect(client.userCallCount).toBe(2);
    expect(client.allowlistCallCount).toBe(1);
    expect(auth.current().state).toEqual({
      status: 'authorized',
      user: { id: 'current-admin', email: null },
    });
  });

  it('prevents a stale RPC from restoring authorization', async () => {
    const client = new FakeAdminAuthClient();
    const staleAllowlist = deferred<{ readonly kind: 'allowed' }>();
    client.userResults.push(
      Promise.resolve({
        kind: 'authenticated',
        user: { id: 'stale-admin', email: null },
      }),
      Promise.resolve({ kind: 'expired' }),
    );
    client.allowlistResults.push(staleAllowlist.promise);
    const auth = await load(client);
    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
    await startScheduledVerification();
    expect(client.allowlistCallCount).toBe(1);

    act(() => client.emit(authEvent('TOKEN_REFRESHED', 'session-user-id')));
    await startScheduledVerification();
    expect(auth.current().state).toEqual({ status: 'expired' });
    staleAllowlist.resolve({ kind: 'allowed' });
    await act(async () => staleAllowlist.promise);

    expect(auth.current().state).toEqual({ status: 'expired' });
  });

  it('does not dispatch resolved verification after a newer auth generation', async () => {
    const client = new FakeAdminAuthClient();
    const newerEventRan = deferred<void>();
    const interleavedAllowlist: AdminAllowlistResult = {
      get kind(): 'allowed' {
        queueMicrotask(() => {
          client.emit(authEvent('SIGNED_OUT', null));
          newerEventRan.resolve(undefined);
        });
        return 'allowed';
      },
    };
    client.userResults.push(Promise.resolve({
      kind: 'authenticated',
      user: { id: 'stale-admin', email: null },
    }));
    client.allowlistResults.push(Promise.resolve(interleavedAllowlist));
    const auth = await load(client);

    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
    act(() => vi.runOnlyPendingTimers());
    await act(async () => newerEventRan.promise);

    expect(auth.current().state).toEqual({ status: 'anonymous' });
  });

  it.each(['getUser', 'allowlist'] as const)(
    'keeps SIGNED_OUT authoritative during %s',
    async (stage) => {
      const client = new FakeAdminAuthClient();
      const staleUser = deferred<{
        readonly kind: 'authenticated';
        readonly user: { readonly id: string; readonly email: null };
      }>();
      const staleAllowlist = deferred<{ readonly kind: 'allowed' }>();
      client.userResults.push(
        stage === 'getUser'
          ? staleUser.promise
          : Promise.resolve({
              kind: 'authenticated',
              user: { id: 'admin-id', email: null },
            }),
      );
      client.allowlistResults.push(staleAllowlist.promise);
      const auth = await load(client);
      act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
      await startScheduledVerification();

      act(() => client.emit(authEvent('SIGNED_OUT', null)));
      staleUser.resolve({
        kind: 'authenticated',
        user: { id: 'admin-id', email: null },
      });
      staleAllowlist.resolve({ kind: 'allowed' });
      await act(async () => {
        await staleUser.promise;
        await staleAllowlist.promise;
      });

      expect(auth.current().state).toEqual({ status: 'anonymous' });
      if (stage === 'getUser') expect(client.allowlistCallCount).toBe(0);
    },
  );

  it('sign-out invalidates in-flight verification before its request', async () => {
    const client = new FakeAdminAuthClient();
    const staleUser = deferred<{ readonly kind: 'expired' }>();
    const pendingSignOut = deferred<{ readonly kind: 'success' }>();
    client.userResults.push(staleUser.promise);
    client.signOutResults.push(pendingSignOut.promise);
    const auth = await load(client);
    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
    await startScheduledVerification();
    let signOutPromise: Promise<void> = Promise.resolve();

    act(() => {
      signOutPromise = auth.current().signOut();
    });
    staleUser.resolve({ kind: 'expired' });
    pendingSignOut.resolve({ kind: 'success' });
    await act(async () => signOutPromise);

    expect(auth.current().state).toEqual({ status: 'anonymous' });
    expect(client.allowlistCallCount).toBe(0);
  });

  it('unsubscribes and cancels deferred verification on cleanup', async () => {
    const client = new FakeAdminAuthClient();
    const auth = await load(client);
    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));

    auth.view.unmount();
    act(() => vi.runOnlyPendingTimers());

    expect(client.unsubscribeCount).toBe(1);
    expect(client.listeners.size).toBe(0);
    expect(client.userCallCount).toBe(0);
  });

  it('does not start RPC or render after getUser resolves post-unmount', async () => {
    const client = new FakeAdminAuthClient();
    const pendingUser = deferred<{
      readonly kind: 'authenticated';
      readonly user: { readonly id: string; readonly email: null };
    }>();
    client.userResults.push(pendingUser.promise);
    const auth = await load(client);
    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
    await startScheduledVerification();
    const renderCount = auth.renderCount();
    auth.view.unmount();

    pendingUser.resolve({
      kind: 'authenticated',
      user: { id: 'admin-id', email: null },
    });
    await act(async () => pendingUser.promise);

    expect(client.allowlistCallCount).toBe(0);
    expect(auth.renderCount()).toBe(renderCount);
  });

  it('does not render after RPC resolves post-unmount', async () => {
    const client = new FakeAdminAuthClient();
    const pendingAllowlist = deferred<{ readonly kind: 'allowed' }>();
    client.userResults.push(Promise.resolve({
      kind: 'authenticated',
      user: { id: 'admin-id', email: null },
    }));
    client.allowlistResults.push(pendingAllowlist.promise);
    const auth = await load(client);
    act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
    await startScheduledVerification();
    const renderCount = auth.renderCount();
    auth.view.unmount();

    pendingAllowlist.resolve({ kind: 'allowed' });
    await act(async () => pendingAllowlist.promise);

    expect(auth.renderCount()).toBe(renderCount);
  });

  it('keeps only the current subscription active under React Strict Mode', async () => {
    vi.useRealTimers();
    const client = new FakeAdminAuthClient();
    const strictWrapper = (children: ReactNode) => <StrictMode>{children}</StrictMode>;
    const auth = renderAuth({
      loadClient: () => Promise.resolve(client),
      wrapper: strictWrapper,
    });
    await waitFor(() => expect(client.listeners.size).toBe(1));

    act(() => client.emit(authEvent('INITIAL_SESSION', null)));

    expect(auth.current().state).toEqual({ status: 'anonymous' });
    expect(client.listeners.size).toBe(1);
  });
});
