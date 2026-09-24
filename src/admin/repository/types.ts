import type { Json, Database } from '@/content/database.types';
import type { CmsDocumentKind } from '@/content/contracts/kinds';
import type { PublishErrorCode } from '@/content/contracts/publication';
import type {
  CmsDocumentId,
  CmsRevisionId,
} from '@/content/contracts/primitives';

export type PostgrestErrorFields = {
  readonly code: string | null;
  readonly details: string | null;
  readonly hint: string | null;
  readonly message: string;
};

type DatabaseFailure<Kind extends string> = {
  readonly kind: Kind;
  readonly error: PostgrestErrorFields;
};

export type AdminDocumentFailure =
  | DatabaseFailure<'active-draft-exists'>
  | DatabaseFailure<'stale-edit-version'>
  | DatabaseFailure<'forbidden'>
  | DatabaseFailure<'not-found'>
  | DatabaseFailure<'invalid-request'>
  | DatabaseFailure<'validation-failed'>
  | DatabaseFailure<'schema-unavailable'>
  | DatabaseFailure<'transport-error'>
  | { readonly kind: 'publication-error'; readonly code: PublishErrorCode; readonly retryable: boolean }
  | { readonly kind: 'malformed-payload' }
  | { readonly kind: 'aborted' };

export type RepositoryResult<Value> =
  | { readonly ok: true; readonly value: Value }
  | { readonly ok: false; readonly failure: AdminDocumentFailure };

export type CmsAdminDocument = {
  readonly id: CmsDocumentId;
  readonly kind: CmsDocumentKind;
  readonly stableKey: string;
  readonly createdAt: string;
  readonly createdBy: string | null;
  readonly updatedAt: string;
  readonly updatedBy: string | null;
};

export type CmsAdminRevision = {
  readonly id: CmsRevisionId;
  readonly documentId: CmsDocumentId;
  readonly version: number;
  readonly editVersion: number;
  readonly status: Database['public']['Enums']['cms_revision_status'];
  readonly payload: Json;
  readonly createdAt: string;
  readonly createdBy: string | null;
  readonly updatedAt: string;
  readonly updatedBy: string | null;
  readonly publishedAt: string | null;
  readonly publishedBy: string | null;
  readonly archivedAt: string | null;
  readonly archivedBy: string | null;
  readonly publicationExpectedEditVersion: number | null;
  readonly publicationReplacements: Json | null;
  readonly publicationActorId: string | null;
};

/** One revision's lifecycle status without its payload, for dashboard overviews. */
export type CmsRevisionStatusSummary = {
  readonly documentId: CmsDocumentId;
  readonly version: number;
  readonly status: Database['public']['Enums']['cms_revision_status'];
  readonly updatedAt: string;
};

export type CmsAdminDocumentDetail = {
  readonly document: CmsAdminDocument;
  readonly revisions: readonly CmsAdminRevision[];
};

export type CloneRevisionInput = {
  readonly documentId: CmsDocumentId;
  readonly sourceRevisionId?: CmsRevisionId;
};

export type RevisionMutationInput = {
  readonly documentId: CmsDocumentId;
  readonly revisionId: CmsRevisionId;
  readonly expectedEditVersion: number;
};

export type SaveDraftInput = RevisionMutationInput & {
  readonly payload: Json;
};

export interface AdminDocumentRepository {
  listDocuments(signal?: AbortSignal): Promise<RepositoryResult<readonly CmsAdminDocument[]>>;
  /** Optional: draft and published revision statuses across all documents, without payloads. */
  listRevisionStatuses?(signal?: AbortSignal): Promise<RepositoryResult<readonly CmsRevisionStatusSummary[]>>;
  readDocument(documentId: CmsDocumentId, signal?: AbortSignal): Promise<RepositoryResult<CmsAdminDocumentDetail>>;
  clone(input: CloneRevisionInput, signal?: AbortSignal): Promise<RepositoryResult<CmsAdminRevision>>;
  save(input: SaveDraftInput, signal?: AbortSignal): Promise<RepositoryResult<CmsAdminRevision>>;
  publish(input: RevisionMutationInput, signal?: AbortSignal): Promise<RepositoryResult<CmsAdminRevision>>;
  archive(input: RevisionMutationInput, signal?: AbortSignal): Promise<RepositoryResult<CmsAdminRevision>>;
}

export type OperationResponse = {
  readonly data: unknown;
  readonly error: unknown | null;
};

export type Wave3RpcName =
  | 'cms_clone_revision'
  | 'cms_save_draft'
  | 'cms_archive_revision';

export type Wave3RpcArgs<Name extends Wave3RpcName> =
  Database['public']['Functions'][Name]['Args'];

export interface AdminDocumentOperations {
  listDocuments(signal?: AbortSignal): Promise<OperationResponse>;
  listRevisionStatuses?(signal?: AbortSignal): Promise<OperationResponse>;
  readDocument(documentId: CmsDocumentId, signal?: AbortSignal): Promise<OperationResponse>;
  rpc<Name extends Wave3RpcName>(
    name: Name,
    args: Wave3RpcArgs<Name>,
    signal?: AbortSignal,
  ): Promise<OperationResponse>;
}
