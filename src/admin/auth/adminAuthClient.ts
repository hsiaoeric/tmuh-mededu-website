import { getAdminSupabaseClient } from '@/content/supabaseClient';
import { z } from 'zod';
import type { SupabaseConfig } from '@/content/env';
import { captureAsync } from './adminAuthSafety';
import type { AdminAuthUser } from './adminAuthState';

export type AdminAuthEvent =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | 'UNSUPPORTED';

export type AdminAuthEventPayload = {
  readonly event: AdminAuthEvent;
  readonly sessionPresent: boolean;
  readonly sessionUserId: string | null;
};

export type AdminAuthUserResult =
  | { readonly kind: 'authenticated'; readonly user: AdminAuthUser }
  | { readonly kind: 'expired' }
  | { readonly kind: 'error' };

export type AdminAllowlistResult =
  | { readonly kind: 'allowed' }
  | { readonly kind: 'denied' }
  | { readonly kind: 'error' };

export type AdminAuthOperationResult =
  | { readonly kind: 'success' }
  | { readonly kind: 'error' };

export interface AdminAuthSubscription {
  unsubscribe(): void;
}

export interface AdminAuthClient {
  subscribe(listener: (payload: AdminAuthEventPayload) => void): AdminAuthSubscription;
  getAuthenticatedUser(): Promise<AdminAuthUserResult>;
  checkAdminAllowlist(): Promise<AdminAllowlistResult>;
  signIn(email: string, password: string): Promise<AdminAuthOperationResult>;
  signOutLocal(): Promise<AdminAuthOperationResult>;
}

export type AdminAuthClientLoader = (
  config: SupabaseConfig,
) => Promise<AdminAuthClient>;

type RawUser = {
  readonly id: string;
  readonly email?: string | null;
};

type RawAuthSession = {
  readonly user: { readonly id: unknown };
};

type RawResult<Data> = {
  readonly data: Data;
  readonly error: unknown | null;
};

export interface AdminAuthSupabaseOperations {
  subscribe(listener: (event: string, session: RawAuthSession | null) => void): AdminAuthSubscription;
  getUser(): Promise<{ readonly user: RawUser | null; readonly error: unknown | null }>;
  rpc(functionName: 'is_cms_admin'): Promise<RawResult<boolean | null>>;
  signInWithPassword(credentials: {
    readonly email: string;
    readonly password: string;
  }): Promise<{ readonly error: unknown | null }>;
  signOut(options: {
    readonly scope: 'local';
  }): Promise<{ readonly error: unknown | null }>;
}

const SessionUserIdSchema = z.string().uuid();

function mapAuthEvent(event: string): AdminAuthEvent {
  switch (event) {
    case 'INITIAL_SESSION':
    case 'SIGNED_IN':
    case 'SIGNED_OUT':
    case 'TOKEN_REFRESHED':
    case 'USER_UPDATED':
    case 'PASSWORD_RECOVERY':
      return event;
    default:
      return 'UNSUPPORTED';
  }
}

function operationResult(error: unknown | null): AdminAuthOperationResult {
  return error === null ? { kind: 'success' } : { kind: 'error' };
}

export function createAdminAuthClient(
  operations: AdminAuthSupabaseOperations,
): AdminAuthClient {
  return {
    subscribe(listener) {
      return operations.subscribe((event, session) => {
        const sessionUserId = SessionUserIdSchema.safeParse(session?.user.id);
        listener({
          event: mapAuthEvent(event),
          sessionPresent: session !== null,
          sessionUserId: sessionUserId.success ? sessionUserId.data : null,
        });
      });
    },
    async getAuthenticatedUser() {
      const outcome = await captureAsync(() => operations.getUser());
      if (outcome.kind === 'failure') return { kind: 'error' };
      const { user, error } = outcome.value;
      if (error !== null) return { kind: 'error' };
      if (user === null) return { kind: 'expired' };
      return {
        kind: 'authenticated',
        user: { id: user.id, email: user.email ?? null },
      };
    },
    async checkAdminAllowlist() {
      const outcome = await captureAsync(() => operations.rpc('is_cms_admin'));
      if (outcome.kind === 'failure') return { kind: 'error' };
      const { data, error } = outcome.value;
      if (error !== null) return { kind: 'error' };
      return data === true ? { kind: 'allowed' } : { kind: 'denied' };
    },
    async signIn(email, password) {
      const outcome = await captureAsync(() =>
        operations.signInWithPassword({ email, password }),
      );
      return outcome.kind === 'success'
        ? operationResult(outcome.value.error)
        : { kind: 'error' };
    },
    async signOutLocal() {
      const outcome = await captureAsync(() => operations.signOut({ scope: 'local' }));
      return outcome.kind === 'success'
        ? operationResult(outcome.value.error)
        : { kind: 'error' };
    },
  };
}

export async function loadBrowserAdminAuthClient(
  config: SupabaseConfig,
): Promise<AdminAuthClient> {
  const client = await getAdminSupabaseClient(config);
  return createAdminAuthClient({
    subscribe(listener) {
      const { subscription } = client.auth.onAuthStateChange((event, session) => {
        listener(event, session);
      }).data;
      return subscription;
    },
    async getUser() {
      const { data, error } = await client.auth.getUser();
      return { user: data.user, error };
    },
    async rpc(functionName) {
      const { data, error } = await client.rpc(functionName);
      return { data, error };
    },
    async signInWithPassword(credentials) {
      const { error } = await client.auth.signInWithPassword(credentials);
      return { error };
    },
    async signOut(options) {
      const { error } = await client.auth.signOut(options);
      return { error };
    },
  });
}
