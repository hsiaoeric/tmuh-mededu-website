// @vitest-environment jsdom

import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AdminAuthClient } from './adminAuthClient';
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
  return auth;
}

async function verify(
  client: FakeAdminAuthClient,
  userResult: Parameters<FakeAdminAuthClient['userResults']['push']>[0],
  allowlistResult?: Parameters<FakeAdminAuthClient['allowlistResults']['push']>[0],
): Promise<void> {
  client.userResults.push(userResult);
  if (allowlistResult !== undefined) client.allowlistResults.push(allowlistResult);
  vi.useFakeTimers();
  act(() => client.emit(authEvent('SIGNED_IN', 'session-user-id')));
  await act(async () => vi.runOnlyPendingTimersAsync());
  vi.useRealTimers();
}

describe('AdminAuthProvider actions', () => {
  it('keeps successful sign-in authenticating until an auth event', async () => {
    const client = new FakeAdminAuthClient();
    const auth = await load(client);

    await act(() => auth.current().signIn('admin@example.com', 'secret'));

    expect(client.signInCalls).toEqual([
      { email: 'admin@example.com', password: 'secret' },
    ]);
    expect(auth.current().state).toEqual({ status: 'authenticating' });
    expect(client.userCallCount).toBe(0);
  });

  it('normalizes sign-in failure without identity verification', async () => {
    const client = new FakeAdminAuthClient();
    client.signInResults.push(Promise.resolve({ kind: 'error' }));
    const auth = await load(client);

    await act(() => auth.current().signIn('unknown@example.com', 'wrong'));

    expect(auth.current().state).toEqual({
      status: 'error',
      failure: 'sign-in-failed',
    });
    expect(client.userCallCount).toBe(0);
  });

  it('normalizes an injected sign-in rejection', async () => {
    const client = new FakeAdminAuthClient();
    const pendingSignIn = deferred<{ readonly kind: 'success' }>();
    client.signInResults.push(pendingSignIn.promise);
    const auth = await load(client);
    let signInPromise: Promise<void> = Promise.resolve();
    act(() => {
      signInPromise = auth.current().signIn('admin@example.com', 'secret');
    });

    pendingSignIn.reject(new Error('raw sign-in rejection'));
    await act(() => signInPromise);

    expect(auth.current().state).toEqual({
      status: 'error',
      failure: 'sign-in-failed',
    });
  });

  it('lets an auth event supersede a pending sign-in completion', async () => {
    const client = new FakeAdminAuthClient();
    const pendingSignIn = deferred<{ readonly kind: 'error' }>();
    client.signInResults.push(pendingSignIn.promise);
    const auth = await load(client);
    let signInPromise: Promise<void> = Promise.resolve();
    act(() => {
      signInPromise = auth.current().signIn('admin@example.com', 'secret');
    });
    await verify(
      client,
      Promise.resolve({
        kind: 'authenticated',
        user: { id: 'admin-id', email: null },
      }),
      Promise.resolve({ kind: 'allowed' }),
    );

    pendingSignIn.resolve({ kind: 'error' });
    await act(() => signInPromise);

    expect(auth.current().state).toEqual({
      status: 'authorized',
      user: { id: 'admin-id', email: null },
    });
  });

  it.each([
    [{ kind: 'success' }, { status: 'anonymous' }],
    [{ kind: 'error' }, { status: 'error', failure: 'sign-out-failed' }],
  ] as const)('shows pending sign-out before result %# and stays fail closed', async (result, expected) => {
    const client = new FakeAdminAuthClient();
    const pendingSignOut = deferred<typeof result>();
    client.signOutResults.push(pendingSignOut.promise);
    const auth = await load(client);
    await verify(
      client,
      Promise.resolve({
        kind: 'authenticated',
        user: { id: 'admin-id', email: null },
      }),
      Promise.resolve({ kind: 'allowed' }),
    );
    let signOutPromise: Promise<void> = Promise.resolve();

    act(() => {
      signOutPromise = auth.current().signOut();
    });

    expect(auth.current().state).toEqual({ status: 'signing-out' });
    expect(client.signOutCallCount).toBe(1);
    pendingSignOut.resolve(result);
    await act(() => signOutPromise);
    expect(auth.current().state).toEqual(expected);
  });

  it('normalizes an injected sign-out rejection', async () => {
    const client = new FakeAdminAuthClient();
    const pendingSignOut = deferred<{ readonly kind: 'success' }>();
    client.signOutResults.push(pendingSignOut.promise);
    const auth = await load(client);
    let signOutPromise: Promise<void> = Promise.resolve();
    act(() => {
      signOutPromise = auth.current().signOut();
    });

    pendingSignOut.reject(new Error('raw sign-out rejection'));
    await act(() => signOutPromise);

    expect(auth.current().state).toEqual({
      status: 'error',
      failure: 'sign-out-failed',
    });
  });

  it('retries client loading only after client-unavailable', async () => {
    const client = new FakeAdminAuthClient();
    const loadClient = vi
      .fn<() => Promise<AdminAuthClient>>()
      .mockRejectedValueOnce(new Error('raw load failure'))
      .mockResolvedValueOnce(client);
    const auth = renderAuth({ loadClient });
    await waitFor(() => expect(auth.current().state).toEqual({
      status: 'error',
      failure: 'client-unavailable',
    }));

    await act(() => auth.current().retry());

    expect(loadClient).toHaveBeenCalledTimes(2);
    expect(client.subscriptionCount).toBe(1);
  });

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
  ] as const)('re-verifies candidate session after retryable result %#', async (
    firstUser,
    firstAllowlist,
    firstState,
  ) => {
    const client = new FakeAdminAuthClient();
    const auth = await load(client);
    await verify(
      client,
      Promise.resolve(firstUser),
      firstAllowlist === undefined ? undefined : Promise.resolve(firstAllowlist),
    );
    expect(auth.current().state).toEqual(firstState);
    client.userResults.push(Promise.resolve({
      kind: 'authenticated',
      user: { id: 'admin-id', email: 'admin@example.com' },
    }));
    client.allowlistResults.push(Promise.resolve({ kind: 'allowed' }));

    await act(() => auth.current().retry());

    expect(auth.current().state).toEqual({
      status: 'authorized',
      user: { id: 'admin-id', email: 'admin@example.com' },
    });
  });

  it('does not retry anonymous state', async () => {
    const client = new FakeAdminAuthClient();
    const auth = await load(client);
    act(() => client.emit(authEvent('INITIAL_SESSION', null)));

    await act(() => auth.current().retry());

    expect(client.userCallCount).toBe(0);
    expect(auth.current().state).toEqual({ status: 'anonymous' });
  });
});
