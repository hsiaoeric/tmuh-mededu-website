import type {
  CmsAdminDocument,
  CmsAdminDocumentDetail,
  CmsAdminRevision,
} from '@/admin/repository';
import { CmsDocumentIdSchema, CmsRevisionIdSchema } from '@/content/contracts/primitives';
import { assertNever } from './assertNever';
import {
  createDocumentWorkspace,
  documentWorkspaceReducer,
  type DocumentMutation,
  type DocumentWorkspace,
  type DocumentWorkspaceAction,
} from './workspaceState';

export const DOCUMENT_ID = CmsDocumentIdSchema.parse('11111111-1111-4111-8111-111111111111');
export const DRAFT_ID = CmsRevisionIdSchema.parse('22222222-2222-4222-8222-222222222222');
export const PUBLISHED_ID = CmsRevisionIdSchema.parse('33333333-3333-4333-8333-333333333333');
export const ARCHIVED_ID = CmsRevisionIdSchema.parse('44444444-4444-4444-8444-444444444444');

export const DOCUMENT: CmsAdminDocument = {
  id: DOCUMENT_ID,
  kind: 'news',
  stableKey: 'announcements',
  createdAt: '2026-08-22T01:00:00Z',
  createdBy: null,
  updatedAt: '2026-08-22T02:00:00Z',
  updatedBy: null,
};

export function revision(
  options: {
    readonly id: typeof DRAFT_ID | typeof PUBLISHED_ID | typeof ARCHIVED_ID;
    readonly status: CmsAdminRevision['status'];
    readonly editVersion: number;
    readonly payload: CmsAdminRevision['payload'];
  },
): CmsAdminRevision {
  const { id, status, editVersion, payload } = options;
  return {
    id,
    documentId: DOCUMENT_ID,
    version: status === 'draft' ? 3 : 2,
    editVersion,
    status,
    payload,
    createdAt: '2026-08-22T01:00:00Z',
    createdBy: null,
    updatedAt: '2026-08-22T02:00:00Z',
    updatedBy: null,
    publishedAt: status === 'published' ? '2026-08-22T02:00:00Z' : null,
    publishedBy: null,
    archivedAt: status === 'archived' ? '2026-08-22T02:00:00Z' : null,
    archivedBy: null,
    publicationExpectedEditVersion: null,
    publicationReplacements: null,
    publicationActorId: null,
  };
}

export function detail(draftPayload: CmsAdminRevision['payload'] = { title: 'draft' }): CmsAdminDocumentDetail {
  return {
    document: DOCUMENT,
    revisions: [
      revision({ id: DRAFT_ID, status: 'draft', editVersion: 4, payload: draftPayload }),
      revision({ id: PUBLISHED_ID, status: 'published', editVersion: 1, payload: { title: 'published' } }),
    ],
  };
}

export type LaterEditCase = {
  readonly activeStatus: 'saving' | 'publishing' | 'archiving';
  readonly completion: DocumentWorkspaceAction;
  readonly baselineText: string;
  readonly expectedEditVersion: number | null;
  readonly activeDraftStatus: CmsAdminRevision['status'] | null;
  readonly actionableStatus: CmsAdminRevision['status'] | null;
};

export function laterEditCase(operation: DocumentMutation): LaterEditCase {
  switch (operation) {
    case 'save':
      return { activeStatus: 'saving', completion: { type: 'save-succeeded', operation, mutationId: 1, revision: revision({ id: DRAFT_ID, status: 'draft', editVersion: 5, payload: { title: 'submitted' } }) }, baselineText: 'submitted', expectedEditVersion: 5, activeDraftStatus: 'draft', actionableStatus: 'draft' };
    case 'publish':
      return { activeStatus: 'publishing', completion: { type: 'publish-succeeded', operation, mutationId: 1, revision: revision({ id: DRAFT_ID, status: 'published', editVersion: 5, payload: { title: 'published next' } }) }, baselineText: 'published next', expectedEditVersion: 5, activeDraftStatus: null, actionableStatus: 'published' };
    case 'archive':
      return { activeStatus: 'archiving', completion: { type: 'archive-succeeded', operation, mutationId: 1, revision: revision({ id: DRAFT_ID, status: 'archived', editVersion: 5, payload: { title: 'draft' } }) }, baselineText: 'published', expectedEditVersion: 1, activeDraftStatus: null, actionableStatus: 'published' };
    default:
      return assertNever(operation, 'document mutation');
  }
}

export function startMutation(
  workspace: DocumentWorkspace,
  operation: DocumentMutation,
  submittedEditorText = workspace.editorText,
): DocumentWorkspace {
  return documentWorkspaceReducer(workspace, {
    type: 'mutation-started', operation, mutationId: 1, submittedEditorText,
  });
}

export function workspace(): DocumentWorkspace {
  return createDocumentWorkspace(detail());
}
