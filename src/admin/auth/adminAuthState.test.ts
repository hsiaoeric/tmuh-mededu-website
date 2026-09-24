import { describe, expect, it } from 'vitest';
import {
  INITIAL_ADMIN_AUTH_STATE,
  reduceAdminAuthState,
  type AdminAuthAction,
  type AdminAuthState,
} from './adminAuthState';

describe('reduceAdminAuthState', () => {
  it('starts in booting state', () => {
    expect(INITIAL_ADMIN_AUTH_STATE).toEqual({ status: 'booting' });
  });

  const cases: readonly {
    readonly name: string;
    readonly action: AdminAuthAction;
    readonly expected: AdminAuthState;
  }[] = [
    {
      name: 'restarts booting',
      action: { type: 'boot' },
      expected: { status: 'booting' },
    },
    {
      name: 'reports disabled configuration',
      action: { type: 'configuration-failed', failure: { kind: 'disabled' } },
      expected: { status: 'config-error', failure: { kind: 'disabled' } },
    },
    {
      name: 'reports partial configuration',
      action: {
        type: 'configuration-failed',
        failure: { kind: 'invalid', reason: 'partial' },
      },
      expected: {
        status: 'config-error',
        failure: { kind: 'invalid', reason: 'partial' },
      },
    },
    {
      name: 'reports invalid configuration',
      action: {
        type: 'configuration-failed',
        failure: { kind: 'invalid', reason: 'invalid' },
      },
      expected: {
        status: 'config-error',
        failure: { kind: 'invalid', reason: 'invalid' },
      },
    },
    {
      name: 'clears a session',
      action: { type: 'session-cleared' },
      expected: { status: 'anonymous' },
    },
    {
      name: 'starts sign in',
      action: { type: 'sign-in-started' },
      expected: { status: 'authenticating' },
    },
    {
      name: 'starts sign out',
      action: { type: 'sign-out-started' },
      expected: { status: 'signing-out' },
    },
    {
      name: 'starts verification',
      action: { type: 'verification-started' },
      expected: { status: 'verifying' },
    },
    {
      name: 'grants authorization with normalized identity',
      action: {
        type: 'authorization-granted',
        user: { id: 'admin-id', email: null },
      },
      expected: {
        status: 'authorized',
        user: { id: 'admin-id', email: null },
      },
    },
    {
      name: 'reauthorizes the previously authorized identity',
      action: {
        type: 'reauthorization-started',
        user: { id: 'admin-id', email: null },
      },
      expected: {
        status: 'reauthorizing',
        user: { id: 'admin-id', email: null },
      },
    },
    {
      name: 'denies authorization',
      action: { type: 'authorization-denied' },
      expected: { status: 'denied' },
    },
    {
      name: 'expires a session',
      action: { type: 'session-expired' },
      expected: { status: 'expired' },
    },
    {
      name: 'reports only a machine failure code',
      action: { type: 'operation-failed', failure: 'identity-check-failed' },
      expected: { status: 'error', failure: 'identity-check-failed' },
    },
  ];

  for (const testCase of cases) {
    it(testCase.name, () => {
      const result = reduceAdminAuthState(
        { status: 'authorized', user: { id: 'previous', email: 'old@example.com' } },
        testCase.action,
      );

      expect(result).toEqual(testCase.expected);
    });
  }
});
