import { render, type RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { SupabaseConfiguration } from '@/content/env';
import {
  AdminAuthProvider,
  useAdminAuth,
  type AdminAuthContextValue,
} from './AdminAuthProvider';
import type {
  AdminAllowlistResult,
  AdminAuthClient,
  AdminAuthClientLoader,
  AdminAuthEvent,
  AdminAuthEventPayload,
  AdminAuthOperationResult,
  AdminAuthSubscription,
  AdminAuthUserResult,
} from './adminAuthClient';

export const CONFIGURED_AUTH = {
  kind: 'configured',
  config: {
    url: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
  },
} satisfies SupabaseConfiguration;

export type Deferred<Value> = {
  readonly promise: Promise<Value>;
  readonly resolve: (value: Value) => void;
  readonly reject: (error: Error) => void;
};

export function deferred<Value>(): Deferred<Value> {
  let resolvePromise: (value: Value) => void = () => undefined;
  let rejectPromise: (error: Error) => void = () => undefined;
  const promise = new Promise<Value>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

export function authEvent(
  event: AdminAuthEvent,
  sessionUserId: string | null,
): AdminAuthEventPayload {
  return {
    event,
    sessionPresent: sessionUserId !== null,
    sessionUserId,
  };
}

function nextResult<Value>(queue: Promise<Value>[], fallback: Value): Promise<Value> {
  const result = queue.shift();
  return result ?? Promise.resolve(fallback);
}

export class FakeAdminAuthClient implements AdminAuthClient {
  readonly userResults: Promise<AdminAuthUserResult>[] = [];
  readonly allowlistResults: Promise<AdminAllowlistResult>[] = [];
  readonly signInResults: Promise<AdminAuthOperationResult>[] = [];
  readonly signOutResults: Promise<AdminAuthOperationResult>[] = [];
  readonly signInCalls: { readonly email: string; readonly password: string }[] = [];
  readonly listeners = new Set<
    (payload: AdminAuthEventPayload) => void
  >();
  userCallCount = 0;
  allowlistCallCount = 0;
  signOutCallCount = 0;
  subscriptionCount = 0;
  unsubscribeCount = 0;

  subscribe(
    listener: (payload: AdminAuthEventPayload) => void,
  ): AdminAuthSubscription {
    this.subscriptionCount += 1;
    this.listeners.add(listener);
    return {
      unsubscribe: () => {
        this.unsubscribeCount += 1;
        this.listeners.delete(listener);
      },
    };
  }

  emit(payload: AdminAuthEventPayload): void {
    for (const listener of [...this.listeners]) listener(payload);
  }

  getAuthenticatedUser(): Promise<AdminAuthUserResult> {
    this.userCallCount += 1;
    return nextResult(this.userResults, { kind: 'expired' });
  }

  checkAdminAllowlist(): Promise<AdminAllowlistResult> {
    this.allowlistCallCount += 1;
    return nextResult(this.allowlistResults, { kind: 'denied' });
  }

  signIn(email: string, password: string): Promise<AdminAuthOperationResult> {
    this.signInCalls.push({ email, password });
    return nextResult(this.signInResults, { kind: 'success' });
  }

  signOutLocal(): Promise<AdminAuthOperationResult> {
    this.signOutCallCount += 1;
    return nextResult(this.signOutResults, { kind: 'success' });
  }
}

type RenderAuthOptions = {
  readonly configuration?: SupabaseConfiguration;
  readonly loadClient?: AdminAuthClientLoader;
  readonly wrapper?: (children: ReactNode) => ReactNode;
};

function Probe({ values }: { readonly values: AdminAuthContextValue[] }) {
  const value = useAdminAuth();
  values.push(value);
  return <output data-testid="auth-state">{JSON.stringify(value.state)}</output>;
}

export function renderAuth(options: RenderAuthOptions = {}): {
  readonly view: RenderResult;
  readonly current: () => AdminAuthContextValue;
  readonly renderCount: () => number;
  readonly rerender: (nextOptions: RenderAuthOptions) => void;
} {
  const values: AdminAuthContextValue[] = [];
  const content = (settings: RenderAuthOptions) => (
    <AdminAuthProvider
      configuration={settings.configuration ?? CONFIGURED_AUTH}
      loadClient={settings.loadClient}
    >
      <Probe values={values} />
    </AdminAuthProvider>
  );
  const wrap = (settings: RenderAuthOptions) =>
    settings.wrapper === undefined ? content(settings) : settings.wrapper(content(settings));
  const view = render(wrap(options));
  return {
    view,
    renderCount: () => values.length,
    rerender: (nextOptions) => view.rerender(wrap(nextOptions)),
    current: () => {
      const value = values[values.length - 1];
      if (value === undefined) throw new TypeError('Auth probe has not rendered');
      return value;
    },
  };
}
