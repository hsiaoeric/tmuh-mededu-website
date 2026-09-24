import type { CmsDocumentKind, CmsStableKey } from './contracts/kinds';
import type { PublicContentIdentity } from './contracts/public';
import type { CmsDocumentId, CmsRevisionId } from './contracts/primitives';
import type { PublishedCmsPayloadByKind } from './contracts/registry';
import type { ContentBoundaryError } from './errors';

export {
  CMS_DOCUMENT_KINDS,
  CMS_DOCUMENT_STABLE_KEYS,
  CmsDocumentKindSchema,
} from './contracts/kinds';
export type { CmsDocumentKind, CmsStableKey } from './contracts/kinds';

export { CmsDocumentIdSchema, CmsRevisionIdSchema } from './contracts/primitives';
export type { CmsDocumentId, CmsRevisionId } from './contracts/primitives';

export type { CmsPayload, CmsPayloadByKind, PublishedCmsPayloadByKind } from './contracts/registry';

export type PublishedContentByKind<K extends CmsDocumentKind> = {
  readonly documentId: CmsDocumentId;
  readonly kind: K;
  readonly stableKey: CmsStableKey<K>;
  readonly revisionId: CmsRevisionId;
  readonly version: number;
  readonly payload: PublishedCmsPayloadByKind[K];
  readonly publishedAt: string;
};

export type PublishedContent = {
  readonly [K in CmsDocumentKind]: PublishedContentByKind<K>;
}[CmsDocumentKind];

export type ContentIdentity = PublicContentIdentity;

export type PublishedContentRowFailureReason =
  | 'invalid-row'
  | 'duplicate-identity'
  | 'duplicate-document-id'
  | 'duplicate-revision-id';

export type PublishedContentRowFailure = {
  readonly index: number;
  readonly identity: ContentIdentity | null;
  readonly reasons: readonly PublishedContentRowFailureReason[];
  readonly error: ContentBoundaryError;
};

export type PublishedContentBatch = {
  readonly content: readonly PublishedContent[];
  readonly failures: readonly PublishedContentRowFailure[];
};

export interface PublishedContentRepository {
  listPublished(signal: AbortSignal): Promise<PublishedContentBatch>;
}

export interface ContentSnapshotRepository {
  listPublished(): readonly PublishedContent[];
}
