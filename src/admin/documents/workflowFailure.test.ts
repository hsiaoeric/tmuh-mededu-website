import { describe, expect, it } from 'vitest';
import type { AdminDocumentFailure } from '@/admin/repository';
import { mapRepositoryFailure } from './workflowFailure';

describe('repository failure mapping', () => {
  it.each([
    'active-draft-exists',
    'stale-edit-version',
    'forbidden',
    'not-found',
    'invalid-request',
    'validation-failed',
    'schema-unavailable',
    'transport-error',
    'malformed-payload',
    'aborted',
  ] satisfies readonly AdminDocumentFailure['kind'][])(
    'maps %s without collapsing repository failure meaning',
    (kind) => {
      const failure = kind === 'malformed-payload' || kind === 'aborted'
        ? { kind }
        : { kind, error: { code: null, details: null, hint: null, message: kind } };

      expect(mapRepositoryFailure(failure).kind).toBe(kind);
    },
  );

  it('preserves stable publication failure details', () => {
    const failure = {
      kind: 'publication-error',
      code: 'draft-media-missing',
      retryable: false,
    } as const satisfies AdminDocumentFailure;

    expect(mapRepositoryFailure(failure)).toEqual(failure);
  });

  it('maps Edge edit conflicts into the existing recovery state', () => {
    const failure = {
      kind: 'publication-error',
      code: 'stale-edit-version',
      retryable: false,
    } as const satisfies AdminDocumentFailure;

    expect(mapRepositoryFailure(failure)).toEqual({ kind: 'stale-edit-version' });
  });
});
