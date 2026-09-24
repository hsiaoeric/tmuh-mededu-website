import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/content/database.types';
import { createSupabaseContentRepository } from '../../src/content/supabaseRepository';
import {
  CHECKPOINT_SUPABASE_OPTIONS,
  type CheckpointConfiguration,
  type CheckpointSession,
} from './checkpoint-command';

export type CheckpointSupabaseClientCreator = (
  url: string,
  publishableKey: string,
  options: typeof CHECKPOINT_SUPABASE_OPTIONS,
) => SupabaseClient<Database>;

export function createSupabaseCheckpointSession(
  configuration: CheckpointConfiguration,
  createSupabaseClient: CheckpointSupabaseClientCreator = createClient<Database>,
): CheckpointSession {
  const client = createSupabaseClient(
    configuration.url,
    configuration.publishableKey,
    CHECKPOINT_SUPABASE_OPTIONS,
  );
  return {
    client: {
      async signInWithPassword(credentials) {
        const { error } = await client.auth.signInWithPassword(credentials);
        return { error: error === null ? null : { message: error.message } };
      },
      async getUser() {
        const { data, error } = await client.auth.getUser();
        return {
          data: { user: data.user === null ? null : { id: data.user.id } },
          error: error === null ? null : { message: error.message },
        };
      },
      async isCmsAdmin() {
        const { data, error } = await client.rpc('is_cms_admin');
        return { data, error: error === null ? null : { message: error.message } };
      },
      async signOutLocally() {
        const { error } = await client.auth.signOut({ scope: 'local' });
        return { error: error === null ? null : { message: error.message } };
      },
    },
    repository: createSupabaseContentRepository(() => Promise.resolve(client)),
  };
}
