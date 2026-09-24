import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import type { Database } from '../../src/content/database.types';
import {
  CHECKPOINT_SUPABASE_OPTIONS,
  runCheckpointCommand,
  type CheckpointConfiguration,
} from './checkpoint-command';
import {
  createSupabaseCheckpointSession,
  type CheckpointSupabaseClientCreator,
} from './checkpoint-supabase';

const CONFIGURATION = {
  url: 'https://example.supabase.co',
  publishableKey: 'sb_publishable_checkpoint_test',
  email: 'admin@example.com',
  password: 'correct horse battery staple',
} as const satisfies CheckpointConfiguration;

describe('createSupabaseCheckpointSession', () => {
  it('maps the authenticated checkpoint lifecycle to one injected Supabase client', async () => {
    // Given
    const calls: string[] = [];
    let checkpointSignal: AbortSignal | null | undefined;
    const fetchStub: typeof fetch = (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.pathname.endsWith('/rpc/is_cms_admin')) {
        calls.push('admin-check');
        return Promise.resolve(Response.json(true));
      }
      if (url.pathname.endsWith('/rpc/cms_get_published_content')) {
        calls.push('checkpoint');
        checkpointSignal = init?.signal;
        return Promise.resolve(Response.json([]));
      }
      return Promise.reject(new TypeError(`Unexpected Supabase request path: ${url.pathname}`));
    };
    const client = createClient<Database>(
      CONFIGURATION.url,
      CONFIGURATION.publishableKey,
      {
        ...CHECKPOINT_SUPABASE_OPTIONS,
        global: { fetch: fetchStub },
      },
    );
    const operatorUser = {
      id: 'operator-id',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2026-01-01T00:00:00.000Z',
    };
    const signIn = vi.spyOn(client.auth, 'signInWithPassword').mockImplementation(() => {
      calls.push('sign-in');
      return Promise.resolve({
        data: {
          user: operatorUser,
          session: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: operatorUser,
          },
        },
        error: null,
      });
    });
    const getUser = vi.spyOn(client.auth, 'getUser').mockImplementation(() => {
      calls.push('get-user');
      return Promise.resolve({
        data: { user: operatorUser },
        error: null,
      });
    });
    const signOut = vi.spyOn(client.auth, 'signOut').mockImplementation(() => {
      calls.push('sign-out');
      return Promise.resolve({ error: null });
    });
    const rpc = vi.spyOn(client, 'rpc');
    const createInjectedClient = vi.fn<CheckpointSupabaseClientCreator>(() => client);
    const session = createSupabaseCheckpointSession(CONFIGURATION, createInjectedClient);
    const signal = new AbortController().signal;

    // When
    await runCheckpointCommand({
      environment: {
        SUPABASE_URL: CONFIGURATION.url,
        SUPABASE_PUBLISHABLE_KEY: CONFIGURATION.publishableKey,
        CMS_ADMIN_EMAIL: CONFIGURATION.email,
        CMS_ADMIN_PASSWORD: CONFIGURATION.password,
      },
      createSession: () => session,
      checkpoint: async (repository) => {
        await repository.listPublished(signal);
      },
    });

    // Then
    expect(createInjectedClient).toHaveBeenCalledOnce();
    expect(createInjectedClient).toHaveBeenCalledWith(
      CONFIGURATION.url,
      CONFIGURATION.publishableKey,
      CHECKPOINT_SUPABASE_OPTIONS,
    );
    expect(signIn).toHaveBeenCalledWith({
      email: CONFIGURATION.email,
      password: CONFIGURATION.password,
    });
    expect(getUser).toHaveBeenCalledWith();
    expect(rpc).toHaveBeenNthCalledWith(1, 'is_cms_admin');
    expect(rpc).toHaveBeenNthCalledWith(2, 'cms_get_published_content', {
      p_kind: null,
      p_stable_key: null,
    });
    expect(checkpointSignal).toBe(signal);
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(calls).toEqual([
      'sign-in',
      'get-user',
      'admin-check',
      'checkpoint',
      'sign-out',
    ]);
  });
});
