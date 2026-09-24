import { describe, expect, it } from 'vitest';
import type { Json } from '@/content/database.types';
import {
  createAdminDocumentRepository as createRepository,
  type AdminDocumentOperations,
  type OperationResponse,
} from './index';
import {
  DOCUMENT_ID,
  DOCUMENT_ROW,
  REVISION_ID,
  REVISION_ROW,
  postgrestError,
} from './testFixtures';

function createAdminDocumentRepository(operations: AdminDocumentOperations) {
  return createRepository(operations, {
    publish: () => Promise.resolve({ ok: false, failure: { kind: 'aborted' } }),
  });
}

function operations(response: () => Promise<OperationResponse>): AdminDocumentOperations {
  return {
    listDocuments: response,
    readDocument: response,
    rpc: response,
  };
}

describe('createAdminDocumentRepository failures', () => {
  it.each([
    [postgrestError('PT409', 'active_draft_exists'), 'active-draft-exists'],
    [postgrestError('PT409', 'stale_edit_version'), 'stale-edit-version'],
    [postgrestError('42501', null), 'forbidden'],
    [postgrestError('P0002', null), 'not-found'],
    [postgrestError('22023', null), 'invalid-request'],
    [postgrestError('23514', null), 'validation-failed'],
    [postgrestError('PGRST202', null, 'Reload the schema cache'), 'schema-unavailable'],
    [postgrestError('XX000', 'connection reset'), 'transport-error'],
  ] as const)('maps PostgREST error %# to %s', async (error, expectedKind) => {
    // Given
    const client = createAdminDocumentRepository(operations(() => Promise.resolve({ data: null, error })));

    // When
    const result = await client.clone({ documentId: DOCUMENT_ID });

    // Then
    expect(result).toEqual({ ok: false, failure: {
      kind: expectedKind,
      error: {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      },
    } });
  });

  it('maps a missing primary-key document response to not-found', async () => {
    // Given
    const error = postgrestError('PGRST116', 'The result contains 0 rows');
    const client = createAdminDocumentRepository(operations(() => Promise.resolve({
      data: null,
      error,
    })));

    // When
    const result = await client.readDocument(DOCUMENT_ID);

    // Then
    expect(result).toEqual({
      ok: false,
      failure: { kind: 'not-found', error },
    });
  });

  it('returns malformed-payload for a non-canonical document list', async () => {
    // Given
    const client = createAdminDocumentRepository(operations(() => Promise.resolve({
      data: [{ ...DOCUMENT_ROW, stable_key: 'wrong-key' }],
      error: null,
    })));

    // When
    const result = await client.listDocuments();

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'malformed-payload' } });
  });

  it('returns malformed-payload when a read row has an invalid edit version', async () => {
    // Given
    const client = createAdminDocumentRepository(operations(() => Promise.resolve({
      data: { document: DOCUMENT_ROW, revisions: [{ ...REVISION_ROW, edit_version: 0 }] },
      error: null,
    })));

    // When
    const result = await client.readDocument(DOCUMENT_ID);

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'malformed-payload' } });
  });

  it('returns malformed-payload for a malformed RPC row', async () => {
    // Given
    const client = createAdminDocumentRepository(operations(() => Promise.resolve({
      data: { ...REVISION_ROW, edit_version: '2' },
      error: null,
    })));

    // When
    const result = await client.clone({ documentId: DOCUMENT_ID });

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'malformed-payload' } });
  });

  it('returns aborted when the caller signal is aborted', async () => {
    // Given
    const controller = new AbortController();
    controller.abort();
    const client = createAdminDocumentRepository(operations(() => Promise.reject(new DOMException('Aborted', 'AbortError'))));

    // When
    const result = await client.listDocuments(controller.signal);

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'aborted' } });
  });

  it('prefers aborted over a resolved transport error after cancellation', async () => {
    // Given
    const controller = new AbortController();
    const client = createAdminDocumentRepository(operations(() => {
      controller.abort();
      return Promise.resolve({ data: null, error: postgrestError('XX000', null) });
    }));

    // When
    const result = await client.listDocuments(controller.signal);

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'aborted' } });
  });

  it('returns transport-error when an operation rejects', async () => {
    // Given
    const client = createAdminDocumentRepository(operations(() => Promise.reject(new TypeError('Failed to fetch'))));

    // When
    const result = await client.readDocument(DOCUMENT_ID);

    // Then
    expect(result).toEqual({ ok: false, failure: {
      kind: 'transport-error',
      error: { code: null, details: null, hint: null, message: 'Failed to fetch' },
    } });
  });

  it('does not mutate the caller payload when save fails', async () => {
    // Given
    const payload: Json = { zh: { entries: ['原始'] }, en: { entries: ['Original'] } };
    const original = structuredClone(payload);
    const client = createAdminDocumentRepository(operations(() => Promise.resolve({
      data: null,
      error: postgrestError('PT409', 'stale_edit_version'),
    })));

    // When
    await client.save({ documentId: DOCUMENT_ID, revisionId: REVISION_ID, expectedEditVersion: 2, payload });

    // Then
    expect(payload).toEqual(original);
  });
});
