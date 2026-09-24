import type { z } from 'zod';
import {
  AdminDocumentDetailSchema,
  AdminDocumentRowsSchema,
  AdminRevisionRowSchema,
} from './schemas';
import { mapPostgrestFailure, mapThrownFailure } from './failures';
import type { PublicationClient } from './publicationClient';
import type {
  AdminDocumentOperations,
  AdminDocumentRepository,
  OperationResponse,
  RepositoryResult,
} from './types';

async function execute<Schema extends z.ZodType>(
  operation: () => Promise<OperationResponse>,
  schema: Schema,
  signal?: AbortSignal,
): Promise<RepositoryResult<z.output<Schema>>> {
  let response: OperationResponse;
  try {
    response = await operation();
  } catch (error: unknown) {
    return { ok: false, failure: mapThrownFailure(error, signal) };
  }
  if (signal?.aborted === true) {
    return { ok: false, failure: { kind: 'aborted' } };
  }
  if (response.error !== null) {
    return { ok: false, failure: mapPostgrestFailure(response.error) };
  }
  const parsed = schema.safeParse(response.data);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, failure: { kind: 'malformed-payload' } };
}

export function createAdminDocumentRepository(
  operations: AdminDocumentOperations,
  publicationClient: PublicationClient,
): AdminDocumentRepository {
  return {
    listDocuments(signal) {
      return execute(() => operations.listDocuments(signal), AdminDocumentRowsSchema, signal);
    },
    readDocument(documentId, signal) {
      return execute(
        () => operations.readDocument(documentId, signal),
        AdminDocumentDetailSchema,
        signal,
      );
    },
    clone(input, signal) {
      const args = input.sourceRevisionId === undefined
        ? { p_document_id: input.documentId }
        : { p_document_id: input.documentId, p_source_revision_id: input.sourceRevisionId };
      return execute(
        () => operations.rpc('cms_clone_revision', args, signal),
        AdminRevisionRowSchema,
        signal,
      );
    },
    save(input, signal) {
      return execute(
        () => operations.rpc('cms_save_draft', {
          p_document_id: input.documentId,
          p_revision_id: input.revisionId,
          p_expected_edit_version: input.expectedEditVersion,
          p_payload: structuredClone(input.payload),
        }, signal),
        AdminRevisionRowSchema,
        signal,
      );
    },
    publish(input, signal) {
      return publicationClient.publish(input, signal);
    },
    archive(input, signal) {
      return execute(
        () => operations.rpc('cms_archive_revision', {
          p_document_id: input.documentId,
          p_revision_id: input.revisionId,
          p_expected_edit_version: input.expectedEditVersion,
        }, signal),
        AdminRevisionRowSchema,
        signal,
      );
    },
  };
}
