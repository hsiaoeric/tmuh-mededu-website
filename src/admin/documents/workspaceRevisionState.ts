import type { CmsAdminDocument, CmsAdminRevision } from '@/admin/repository';
import type {
  DocumentMutation,
  DocumentOperationState,
  DocumentWorkspace,
} from './workspaceTypes';

type WorkspaceCompletion = {
  readonly operation: DocumentMutation;
  readonly submittedEditorText: string;
};

function serializePayload(revision: CmsAdminRevision | null): string {
  return JSON.stringify(revision?.payload ?? {}, null, 2);
}

function newest(revisions: readonly CmsAdminRevision[], status: CmsAdminRevision['status']) {
  return revisions
    .filter((revision) => revision.status === status)
    .reduce<CmsAdminRevision | null>(
      (current, revision) => current === null || revision.version > current.version
        ? revision
        : current,
      null,
    );
}

export function workspaceFromRevisions(
  document: CmsAdminDocument,
  revisions: readonly CmsAdminRevision[],
  operation: DocumentOperationState,
): DocumentWorkspace {
  const activeDraft = newest(revisions, 'draft');
  const actionableRevision = activeDraft ?? newest(revisions, 'published');
  const referenceRevision = actionableRevision ?? newest(revisions, 'archived');
  const baselineText = serializePayload(referenceRevision);
  return {
    document,
    revisions,
    activeDraft,
    actionableRevision,
    referenceRevision,
    editorText: baselineText,
    baselineText,
    expectedEditVersion: actionableRevision?.editVersion ?? null,
    operation,
  };
}

export function replaceRevision(
  revisions: readonly CmsAdminRevision[],
  replacement: CmsAdminRevision,
): readonly CmsAdminRevision[] {
  return [replacement, ...revisions.filter((revision) => revision.id !== replacement.id)];
}

export function completedWorkspace(
  state: DocumentWorkspace,
  revisions: readonly CmsAdminRevision[],
  completion: WorkspaceCompletion,
): DocumentWorkspace {
  const completed = workspaceFromRevisions(state.document, revisions, {
    status: 'saved',
    operation: completion.operation,
  });
  return state.editorText === completion.submittedEditorText
    ? completed
    : { ...completed, editorText: state.editorText };
}
