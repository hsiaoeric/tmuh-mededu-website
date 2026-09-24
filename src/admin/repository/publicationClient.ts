import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { PublishFailureResponseSchema, PublishMediaCountsSchema } from '@/content/contracts/publication';
import type { Database } from '@/content/database.types';
import { mapThrownFailure } from './failures';
import { AdminRevisionRowSchema } from './schemas';
import type {
  AdminDocumentFailure,
  CmsAdminRevision,
  RepositoryResult,
  RevisionMutationInput,
} from './types';

const PublishSuccessResponseSchema = z.strictObject({
  ok: z.literal(true),
  revision: AdminRevisionRowSchema,
  media: PublishMediaCountsSchema,
}).readonly();

export type PublicationInvocationResult = {
  readonly data: unknown;
  readonly error: unknown | null;
  readonly errorBody: unknown | null;
};

export interface PublicationOperations {
  invoke(
    functionName: 'cms-publish',
    options: { readonly body: RevisionMutationInput; readonly signal?: AbortSignal },
  ): Promise<PublicationInvocationResult>;
}

export interface PublicationClient {
  publish(input: RevisionMutationInput, signal?: AbortSignal): Promise<RepositoryResult<CmsAdminRevision>>;
}

function publicationFailure(input: unknown): AdminDocumentFailure | null {
  const parsed = PublishFailureResponseSchema.safeParse(input);
  return parsed.success
    ? { kind: 'publication-error', code: parsed.data.error.code, retryable: parsed.data.error.retryable }
    : null;
}

export function createPublicationClient(operations: PublicationOperations): PublicationClient {
  return {
    async publish(input, signal) {
      let response: PublicationInvocationResult;
      try {
        response = await operations.invoke('cms-publish', { body: input, signal });
      } catch (error: unknown) {
        return { ok: false, failure: mapThrownFailure(error, signal) };
      }
      if (signal?.aborted === true) return { ok: false, failure: { kind: 'aborted' } };
      if (response.error !== null) {
        const failure = publicationFailure(response.errorBody);
        if (failure !== null) return { ok: false, failure };
        return response.errorBody === null
          ? { ok: false, failure: mapThrownFailure(response.error, signal) }
          : { ok: false, failure: { kind: 'malformed-payload' } };
      }
      const parsed = PublishSuccessResponseSchema.safeParse(response.data);
      return parsed.success
        ? { ok: true, value: parsed.data.revision }
        : { ok: false, failure: { kind: 'malformed-payload' } };
    },
  };
}

type FunctionsInvoker = {
  invoke(
    functionName: string,
    options: { readonly body: RevisionMutationInput; readonly signal?: AbortSignal },
  ): Promise<{ readonly data: unknown; readonly error: unknown | null; readonly response?: Response }>;
};

async function parseErrorBody(response?: Response): Promise<unknown | null> {
  if (response === undefined) return null;
  try {
    const body: unknown = await response.clone().json();
    return body;
  } catch (error: unknown) {
    if (error instanceof SyntaxError || error instanceof TypeError) return null;
    throw error;
  }
}

export function createSupabasePublicationOperations(functions: FunctionsInvoker): PublicationOperations {
  return {
    async invoke(functionName, options) {
      const response = await functions.invoke(functionName, options);
      return {
        data: response.data,
        error: response.error,
        errorBody: response.error === null ? null : await parseErrorBody(response.response),
      };
    },
  };
}

export function createSupabasePublicationClient(client: SupabaseClient<Database>): PublicationClient {
  return createPublicationClient(createSupabasePublicationOperations(client.functions));
}
