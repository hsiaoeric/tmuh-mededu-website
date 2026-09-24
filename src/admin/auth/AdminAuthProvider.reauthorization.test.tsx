// @vitest-environment jsdom

import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AdminAuthEvent } from './adminAuthClient';
import {
  FakeAdminAuthClient,
  authEvent,
  deferred,
  renderAuth,
} from './testHarness';

const ADMIN_ID = 'admin-id';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function runVerification(): Promise<void> {
  await act(async () => vi.runOnlyPendingTimersAsync());
}

async function authorizedAuth(client: FakeAdminAuthClient) {
  client.userResults.push(Promise.resolve({
    kind: 'authenticated',
    user: { id: ADMIN_ID, email: null },
  }));
  client.allowlistResults.push(Promise.resolve({ kind: 'allowed' }));
  const auth = renderAuth({ loadClient: () => Promise.resolve(client) });
  await waitFor(() => expect(client.subscriptionCount).toBe(1));
  vi.useFakeTimers();
  act(() => client.emit(authEvent('SIGNED_IN', 'initial-session-user')));
  await runVerification();
  expect(auth.current().state.status).toBe('authorized');
  return auth;
}

describe('AdminAuthProvider reauthorization', () => {
  it.each([
    'SIGNED_IN',
    'TOKEN_REFRESHED',
    'USER_UPDATED',
  ] satisfies readonly AdminAuthEvent[])(
    'retains the previously authorized user during same-user %s verification',
    async (event) => {
      // Given
      const client = new FakeAdminAuthClient();
      const auth = await authorizedAuth(client);
      const allowlist = deferred<{ readonly kind: 'allowed' }>();
      client.userResults.push(Promise.resolve({
        kind: 'authenticated',
        user: { id: ADMIN_ID, email: 'updated@example.com' },
      }));
      client.allowlistResults.push(allowlist.promise);

      // When
      act(() => client.emit(authEvent(event, ADMIN_ID)));

      // Then
      expect(auth.current().state).toEqual({
        status: 'reauthorizing',
        user: { id: ADMIN_ID, email: null },
      });
      await runVerification();
      allowlist.resolve({ kind: 'allowed' });
      await act(async () => allowlist.promise);
      expect(auth.current().state).toEqual({
        status: 'authorized',
        user: { id: ADMIN_ID, email: 'updated@example.com' },
      });
    },
  );

  it.each([
    { name: 'changed user', sessionUserId: 'other-user' },
    { name: 'missing user', sessionUserId: null },
  ])('uses ordinary verification for $name', async ({ sessionUserId }) => {
    // Given
    const client = new FakeAdminAuthClient();
    const auth = await authorizedAuth(client);

    // When
    act(() => client.emit({
      event: 'TOKEN_REFRESHED',
      sessionPresent: true,
      sessionUserId,
    }));

    // Then
    expect(auth.current().state).toEqual({ status: 'verifying' });
  });

  it.each([
    [{ kind: 'expired' }, { status: 'expired' }],
    [{ kind: 'error' }, { status: 'error', failure: 'identity-check-failed' }],
  ] as const)('fails closed when same-user identity verification returns %#', async (
    userResult,
    expected,
  ) => {
    // Given
    const client = new FakeAdminAuthClient();
    const auth = await authorizedAuth(client);
    client.userResults.push(Promise.resolve(userResult));

    // When
    act(() => client.emit(authEvent('TOKEN_REFRESHED', ADMIN_ID)));
    await runVerification();

    // Then
    expect(auth.current().state).toEqual(expected);
  });

  it('rejects a verified identity that differs from the same-user event', async () => {
    // Given
    const client = new FakeAdminAuthClient();
    const auth = await authorizedAuth(client);
    client.userResults.push(Promise.resolve({
      kind: 'authenticated',
      user: { id: 'other-user', email: null },
    }));

    // When
    act(() => client.emit(authEvent('USER_UPDATED', ADMIN_ID)));
    await runVerification();

    // Then
    expect(auth.current().state).toEqual({ status: 'anonymous' });
    expect(client.allowlistCallCount).toBe(1);
  });

  it.each([
    [{ kind: 'denied' }, { status: 'denied' }],
    [{ kind: 'error' }, { status: 'error', failure: 'allowlist-check-failed' }],
  ] as const)('fails closed when same-user authorization returns %#', async (
    allowlistResult,
    expected,
  ) => {
    // Given
    const client = new FakeAdminAuthClient();
    const auth = await authorizedAuth(client);
    client.userResults.push(Promise.resolve({
      kind: 'authenticated',
      user: { id: ADMIN_ID, email: null },
    }));
    client.allowlistResults.push(Promise.resolve(allowlistResult));

    // When
    act(() => client.emit(authEvent('TOKEN_REFRESHED', ADMIN_ID)));
    await runVerification();

    // Then
    expect(auth.current().state).toEqual(expected);
  });

  it('ignores a stale same-user denial after a newer user is authorized', async () => {
    // Given
    const client = new FakeAdminAuthClient();
    const auth = await authorizedAuth(client);
    const staleAllowlist = deferred<{ readonly kind: 'denied' }>();
    client.userResults.push(
      Promise.resolve({ kind: 'authenticated', user: { id: ADMIN_ID, email: null } }),
      Promise.resolve({ kind: 'authenticated', user: { id: 'other-user', email: null } }),
    );
    client.allowlistResults.push(
      staleAllowlist.promise,
      Promise.resolve({ kind: 'allowed' }),
    );
    act(() => client.emit(authEvent('TOKEN_REFRESHED', ADMIN_ID)));
    await runVerification();

    // When
    act(() => client.emit(authEvent('SIGNED_IN', 'other-user')));
    await runVerification();
    staleAllowlist.resolve({ kind: 'denied' });
    await act(async () => staleAllowlist.promise);

    // Then
    expect(auth.current().state).toEqual({
      status: 'authorized',
      user: { id: 'other-user', email: null },
    });
  });
});
