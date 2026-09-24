// @vitest-environment jsdom

import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { AdminAuthEvent } from './adminAuthClient';
import {
  authEvent,
  FakeAdminAuthClient,
  deferred,
  renderAuth,
} from './testHarness';

afterEach(cleanup);

const NON_SIGNED_OUT_EVENTS = [
  'INITIAL_SESSION',
  'SIGNED_IN',
  'TOKEN_REFRESHED',
  'USER_UPDATED',
  'PASSWORD_RECOVERY',
  'UNSUPPORTED',
] as const satisfies readonly AdminAuthEvent[];

const EVENT_SESSION_CASES = NON_SIGNED_OUT_EVENTS.flatMap((event) => [
  { event, sessionPresent: false },
  { event, sessionPresent: true },
]);

async function load(client: FakeAdminAuthClient) {
  const auth = renderAuth({ loadClient: () => Promise.resolve(client) });
  await waitFor(() => expect(client.subscriptionCount).toBe(1));
  return auth;
}

describe('AdminAuthProvider sticky sign-out intent', () => {
  it('blocks sign-in while sign-out is pending', async () => {
    // Given: a local sign-out whose result has not settled.
    const client = new FakeAdminAuthClient();
    const pendingSignOut = deferred<{ readonly kind: 'error' }>();
    client.signOutResults.push(pendingSignOut.promise);
    const auth = await load(client);
    let signOutPromise: Promise<void> = Promise.resolve();
    act(() => {
      signOutPromise = auth.current().signOut();
    });

    // When: another caller attempts to sign in before sign-out completes.
    await act(() => auth.current().signIn('admin@example.com', 'secret'));

    // Then: sign-out keeps ownership and the client never receives sign-in.
    expect(auth.current().state).toEqual({ status: 'signing-out' });
    expect(client.signInCalls).toHaveLength(0);
    pendingSignOut.resolve({ kind: 'error' });
    await act(() => signOutPromise);
    expect(auth.current().state).toEqual({
      status: 'error',
      failure: 'sign-out-failed',
    });
  });

  it.each(EVENT_SESSION_CASES)(
    'ignores $event with session=$sessionPresent while sign-out is pending',
    async ({ event, sessionPresent }) => {
      // Given: a pending sign-out with an authenticated callback source.
      const client = new FakeAdminAuthClient();
      const pendingSignOut = deferred<{ readonly kind: 'error' }>();
      client.signOutResults.push(pendingSignOut.promise);
      const auth = await load(client);
      let signOutPromise: Promise<void> = Promise.resolve();
      act(() => {
        signOutPromise = auth.current().signOut();
      });

      // When: any non-definitive auth event arrives with either session value.
      act(() => client.emit(authEvent(
        event,
        sessionPresent ? 'session-user-id' : null,
      )));

      // Then: the event cannot replace intent or launch verification.
      expect(auth.current().state).toEqual({ status: 'signing-out' });
      expect(client.userCallCount).toBe(0);
      pendingSignOut.resolve({ kind: 'error' });
      await act(() => signOutPromise);
      expect(auth.current().state).toEqual({
        status: 'error',
        failure: 'sign-out-failed',
      });
    },
  );

  it.each(EVENT_SESSION_CASES)(
    'keeps failed sign-out intent across $event with session=$sessionPresent',
    async ({ event, sessionPresent }) => {
      // Given: sign-out failed and the sticky intent remains active.
      const client = new FakeAdminAuthClient();
      client.signOutResults.push(Promise.resolve({ kind: 'error' }));
      const auth = await load(client);
      await act(() => auth.current().signOut());

      // When: a non-definitive event arrives after the failure.
      act(() => client.emit(authEvent(
        event,
        sessionPresent ? 'session-user-id' : null,
      )));

      // Then: failure remains fail-closed without identity work.
      expect(auth.current().state).toEqual({
        status: 'error',
        failure: 'sign-out-failed',
      });
      expect(client.userCallCount).toBe(0);
    },
  );

  it('recovers failed intent through retry and definitive signed-out', async () => {
    // Given: one failed attempt followed by a pending retry.
    const client = new FakeAdminAuthClient();
    const retrySignOut = deferred<{ readonly kind: 'error' }>();
    client.signOutResults.push(
      Promise.resolve({ kind: 'error' }),
      retrySignOut.promise,
    );
    const auth = await load(client);
    await act(() => auth.current().signOut());
    let retryPromise: Promise<void> = Promise.resolve();
    act(() => {
      retryPromise = auth.current().signOut();
    });

    // When: the provider receives definitive session removal.
    act(() => client.emit(authEvent('SIGNED_OUT', null)));
    retrySignOut.resolve({ kind: 'error' });
    await act(() => retryPromise);
    await act(() => auth.current().signIn('admin@example.com', 'secret'));

    // Then: stale retry failure is ignored and sign-in is enabled again.
    expect(auth.current().state).toEqual({ status: 'authenticating' });
    expect(client.signInCalls).toHaveLength(1);
  });

  it('clears intent when configuration replaces the active client', async () => {
    // Given: a pending sign-out on the original configured client.
    const originalClient = new FakeAdminAuthClient();
    const replacementClient = new FakeAdminAuthClient();
    const pendingSignOut = deferred<{ readonly kind: 'error' }>();
    originalClient.signOutResults.push(pendingSignOut.promise);
    const auth = await load(originalClient);
    let signOutPromise: Promise<void> = Promise.resolve();
    act(() => {
      signOutPromise = auth.current().signOut();
    });

    // When: configuration resets the controller and the old attempt settles.
    auth.rerender({
      configuration: {
        kind: 'configured',
        config: {
          url: 'https://replacement.supabase.co',
          publishableKey: 'sb_publishable_replacement',
        },
      },
      loadClient: () => Promise.resolve(replacementClient),
    });
    await waitFor(() => expect(replacementClient.subscriptionCount).toBe(1));
    pendingSignOut.resolve({ kind: 'error' });
    await act(() => signOutPromise);
    await act(() => auth.current().signIn('replacement@example.com', 'secret'));

    // Then: only the replacement client receives the fresh sign-in.
    expect(originalClient.signInCalls).toHaveLength(0);
    expect(replacementClient.signInCalls).toHaveLength(1);
    expect(auth.current().state).toEqual({ status: 'authenticating' });
  });

  it('ignores pending sign-out completion after unmount', async () => {
    // Given: a pending attempt owned by a mounted controller.
    const client = new FakeAdminAuthClient();
    const pendingSignOut = deferred<{ readonly kind: 'error' }>();
    client.signOutResults.push(pendingSignOut.promise);
    const auth = await load(client);
    let signOutPromise: Promise<void> = Promise.resolve();
    act(() => {
      signOutPromise = auth.current().signOut();
    });

    // When: the controller unmounts before completion.
    auth.view.unmount();
    pendingSignOut.resolve({ kind: 'error' });
    await act(() => signOutPromise);

    // Then: lifecycle cleanup unsubscribes and stale completion is inert.
    expect(client.unsubscribeCount).toBe(1);
    expect(client.listeners.size).toBe(0);
  });

  it('lets the latest concurrent failure own completion', async () => {
    // Given: two sign-out attempts with independently deferred outcomes.
    const client = new FakeAdminAuthClient();
    const first = deferred<{ readonly kind: 'success' }>();
    const second = deferred<{ readonly kind: 'error' }>();
    client.signOutResults.push(first.promise, second.promise);
    const auth = await load(client);
    let firstPromise: Promise<void> = Promise.resolve();
    let secondPromise: Promise<void> = Promise.resolve();
    act(() => {
      firstPromise = auth.current().signOut();
      secondPromise = auth.current().signOut();
    });

    // When: the stale first success settles before the latest failure.
    first.resolve({ kind: 'success' });
    await act(() => firstPromise);
    second.resolve({ kind: 'error' });
    await act(() => secondPromise);

    // Then: only the latest attempt determines the visible state.
    expect(auth.current().state).toEqual({
      status: 'error',
      failure: 'sign-out-failed',
    });
  });

  it('lets the latest concurrent success own completion', async () => {
    // Given: two sign-out attempts where the latest will succeed first.
    const client = new FakeAdminAuthClient();
    const first = deferred<{ readonly kind: 'error' }>();
    const second = deferred<{ readonly kind: 'success' }>();
    client.signOutResults.push(first.promise, second.promise);
    const auth = await load(client);
    let firstPromise: Promise<void> = Promise.resolve();
    let secondPromise: Promise<void> = Promise.resolve();
    act(() => {
      firstPromise = auth.current().signOut();
      secondPromise = auth.current().signOut();
    });

    // When: the current success settles before the stale first failure.
    second.resolve({ kind: 'success' });
    await act(() => secondPromise);
    first.resolve({ kind: 'error' });
    await act(() => firstPromise);

    // Then: success clears intent and the stale failure cannot replace it.
    expect(auth.current().state).toEqual({ status: 'anonymous' });
  });
});
