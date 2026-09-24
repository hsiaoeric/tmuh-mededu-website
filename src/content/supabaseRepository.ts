import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type { PublishedContentRepository } from './domain';
import { ContentRepositoryError } from './errors';
import { comparePublishedContent } from './order';
import { parsePublishedContentBatch } from './parsers';

type ClientFactory = () => Promise<SupabaseClient<Database>>;

type PublishedRequestResult = {
  readonly data: unknown;
  readonly error: { readonly code: string; readonly message: string } | null;
};

type PublishedRequest = (signal: AbortSignal) => Promise<PublishedRequestResult>;

export function createSupabaseContentRepositoryFromRequest(
  request: PublishedRequest,
): PublishedContentRepository {
  return {
    async listPublished(signal) {
      const { data, error } = await request(signal);
      if (error !== null) {
        throw new ContentRepositoryError(error.code, error.message);
      }
      const batch = parsePublishedContentBatch(data);
      return {
        content: [...batch.content].sort(comparePublishedContent),
        failures: batch.failures,
      };
    },
  };
}

export function createSupabaseContentRepository(
  getClient: ClientFactory,
): PublishedContentRepository {
  return createSupabaseContentRepositoryFromRequest(async (signal) => {
    const client = await getClient();
    return client
      .rpc('cms_get_published_content', {
        p_kind: null,
        p_stable_key: null,
      })
      .abortSignal(signal);
  });
}
