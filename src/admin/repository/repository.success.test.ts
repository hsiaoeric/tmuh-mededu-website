import { describe, expect, it, vi } from 'vitest';
import type { Json } from '@/content/database.types';
import {
  createAdminDocumentRepository,
  type AdminDocumentOperations,
  type OperationResponse,
  type PublicationClient,
  type Wave3RpcArgs,
  type Wave3RpcName,
} from './index';
import { DOCUMENT_ID, DOCUMENT_ROW, REVISION_ID, REVISION_ROW } from './testFixtures';
import { AdminRevisionRowSchema } from './schemas';

function success(data: unknown): Promise<OperationResponse> {
  return Promise.resolve({ data, error: null });
}

function operations(
  overrides: Partial<AdminDocumentOperations> = {},
): AdminDocumentOperations {
  return {
    listDocuments: () => success([DOCUMENT_ROW]),
    readDocument: () => success({ document: DOCUMENT_ROW, revisions: [REVISION_ROW] }),
    rpc: () => success(REVISION_ROW),
    ...overrides,
  };
}

function publicationClient(
  publish: PublicationClient['publish'] = () => Promise.resolve({ ok: false, failure: { kind: 'aborted' } }),
): PublicationClient {
  return { publish };
}

describe('createAdminDocumentRepository success paths', () => {
  it('lists only parsed canonical documents in canonical kind order', async () => {
    // Given
    const people = { ...DOCUMENT_ROW, id: '33333333-3333-4333-8333-333333333333', kind: 'people', stable_key: 'directory' };
    const client = createAdminDocumentRepository(operations({
      listDocuments: () => success([DOCUMENT_ROW, people]),
    }), publicationClient());

    // When
    const result = await client.listDocuments();

    // Then
    expect(result).toEqual({
      ok: true,
      value: [
        expect.objectContaining({ kind: 'people', stableKey: 'directory' }),
        expect.objectContaining({ kind: 'news', stableKey: 'announcements' }),
      ],
    });
  });

  it('lists payload-free revision statuses only when the operations support it', async () => {
    // Given
    const withStatuses = createAdminDocumentRepository(operations({
      listRevisionStatuses: () => success([
        { document_id: DOCUMENT_ID, version: 2, status: 'draft', updated_at: '2026-08-22T02:00:00Z' },
      ]),
    }), publicationClient());
    const withoutStatuses = createAdminDocumentRepository(operations(), publicationClient());
    const malformed = createAdminDocumentRepository(operations({
      listRevisionStatuses: () => success([{ document_id: DOCUMENT_ID, version: 2, status: 'draft', updated_at: 'yesterday' }]),
    }), publicationClient());

    // When
    const result = await withStatuses.listRevisionStatuses?.();

    // Then
    expect(result).toEqual({
      ok: true,
      value: [{ documentId: DOCUMENT_ID, version: 2, status: 'draft', updatedAt: '2026-08-22T02:00:00Z' }],
    });
    expect(withoutStatuses.listRevisionStatuses).toBeUndefined();
    expect(await malformed.listRevisionStatuses?.()).toEqual({ ok: false, failure: { kind: 'malformed-payload' } });
  });

  it('reads a canonical document with parsed revisions and edit versions', async () => {
    // Given
    const readDocument = vi.fn(() => success({ document: DOCUMENT_ROW, revisions: [REVISION_ROW] }));
    const client = createAdminDocumentRepository(operations({ readDocument }), publicationClient());
    const signal = new AbortController().signal;

    // When
    const result = await client.readDocument(DOCUMENT_ID, signal);

    // Then
    expect(result).toEqual({
      ok: true,
      value: {
        document: expect.objectContaining({ id: DOCUMENT_ID, kind: 'news' }),
        revisions: [expect.objectContaining({ id: REVISION_ID, editVersion: 2 })],
      },
    });
    expect(readDocument).toHaveBeenCalledWith(DOCUMENT_ID, signal);
  });

  it.each([
    {
      operation: 'clone' as const,
      input: { documentId: DOCUMENT_ID },
      name: 'cms_clone_revision' as const,
      args: { p_document_id: DOCUMENT_ID },
    },
    {
      operation: 'clone' as const,
      input: { documentId: DOCUMENT_ID, sourceRevisionId: REVISION_ID },
      name: 'cms_clone_revision' as const,
      args: { p_document_id: DOCUMENT_ID, p_source_revision_id: REVISION_ID },
    },
    {
      operation: 'archive' as const,
      input: { documentId: DOCUMENT_ID, revisionId: REVISION_ID, expectedEditVersion: 2 },
      name: 'cms_archive_revision' as const,
      args: { p_document_id: DOCUMENT_ID, p_revision_id: REVISION_ID, p_expected_edit_version: 2 },
    },
  ])('invokes the exact $name signature', async ({ operation, input, name, args }) => {
    // Given
    const calls: { readonly name: Wave3RpcName; readonly args: Wave3RpcArgs<Wave3RpcName> }[] = [];
    const rpc = <Name extends Wave3RpcName>(rpcName: Name, rpcArgs: Wave3RpcArgs<Name>) => {
      calls.push({ name: rpcName, args: rpcArgs });
      return success(REVISION_ROW);
    };
    const client = createAdminDocumentRepository(operations({ rpc }), publicationClient());

    // When
    const result = operation === 'clone'
      ? await client.clone(input)
      : await client.archive(input);

    // Then
    expect(result).toEqual({ ok: true, value: expect.objectContaining({ editVersion: 2 }) });
    expect(calls).toEqual([{ name, args }]);
  });

  it('invokes save with an isolated payload and the exact RPC signature', async () => {
    // Given
    const payload: Json = { zh: { title: '公告' }, en: { title: 'News' } };
    const original = structuredClone(payload);
    const calls: { readonly name: Wave3RpcName; readonly args: Wave3RpcArgs<Wave3RpcName> }[] = [];
    const rpc = <Name extends Wave3RpcName>(name: Name, args: Wave3RpcArgs<Name>) => {
      calls.push({ name, args });
      return success(REVISION_ROW);
    };
    const client = createAdminDocumentRepository(operations({ rpc }), publicationClient());

    // When
    const result = await client.save({ documentId: DOCUMENT_ID, revisionId: REVISION_ID, expectedEditVersion: 2, payload });

    // Then
    expect(result.ok).toBe(true);
    expect(calls).toEqual([{ name: 'cms_save_draft', args: {
      p_document_id: DOCUMENT_ID,
      p_revision_id: REVISION_ID,
      p_expected_edit_version: 2,
      p_payload: payload,
    } }]);
    expect(payload).toEqual(original);
  });

  it('routes publication through the injected Edge client without invoking RPC', async () => {
    // Given
    const rpc = vi.fn(() => success(REVISION_ROW));
    const publish = vi.fn(() => Promise.resolve({
      ok: true as const,
      value: AdminRevisionRowSchema.parse(REVISION_ROW),
    }));
    const client = createAdminDocumentRepository(operations({ rpc }), publicationClient(publish));
    const input = { documentId: DOCUMENT_ID, revisionId: REVISION_ID, expectedEditVersion: 2 };
    const signal = new AbortController().signal;

    // When
    await client.publish(input, signal);

    // Then
    expect(publish).toHaveBeenCalledWith(input, signal);
    expect(rpc).not.toHaveBeenCalled();
  });
});
