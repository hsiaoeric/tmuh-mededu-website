import { z } from 'zod';
import type {
  AdminDocumentFailure,
  PostgrestErrorFields,
} from './types';

const PostgrestErrorSchema = z.object({
  code: z.string(),
  details: z.string().nullable(),
  hint: z.string().nullable(),
  message: z.string(),
});

function databaseFailure(
  kind: Extract<AdminDocumentFailure, { readonly error: PostgrestErrorFields }>['kind'],
  error: PostgrestErrorFields,
): AdminDocumentFailure {
  return { kind, error };
}

export function mapPostgrestFailure(input: unknown): AdminDocumentFailure {
  const parsed = PostgrestErrorSchema.safeParse(input);
  if (!parsed.success) {
    return databaseFailure('transport-error', {
      code: null,
      details: null,
      hint: null,
      message: 'Supabase returned an unreadable error response',
    });
  }
  const error = parsed.data;
  if (error.code === 'PT409' && error.details === 'active_draft_exists') {
    return databaseFailure('active-draft-exists', error);
  }
  if (error.code === 'PT409' && error.details === 'stale_edit_version') {
    return databaseFailure('stale-edit-version', error);
  }
  switch (error.code) {
    case '42501':
      return databaseFailure('forbidden', error);
    case 'P0002':
    case 'PGRST116':
      return databaseFailure('not-found', error);
    case '22023':
      return databaseFailure('invalid-request', error);
    case '23514':
      return databaseFailure('validation-failed', error);
    case 'PGRST202':
      return databaseFailure('schema-unavailable', error);
    default:
      return databaseFailure('transport-error', error);
  }
}

export function mapThrownFailure(
  input: unknown,
  signal?: AbortSignal,
): AdminDocumentFailure {
  if (signal?.aborted === true || (input instanceof DOMException && input.name === 'AbortError')) {
    return { kind: 'aborted' };
  }
  return databaseFailure('transport-error', {
    code: null,
    details: null,
    hint: null,
    message: input instanceof Error ? input.message : 'Unknown repository transport failure',
  });
}
