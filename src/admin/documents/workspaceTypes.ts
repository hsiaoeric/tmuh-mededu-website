import type { CmsAdminDocument, CmsAdminRevision } from '@/admin/repository';
import type { WorkflowConflict, WorkflowError } from './workflowFailure';

export type DocumentMutation = 'save' | 'publish' | 'archive';

export type DocumentOperationState =
  | { readonly status: 'idle' }
  | { readonly status: 'saving'; readonly mutationId: number; readonly submittedEditorText: string }
  | { readonly status: 'publishing'; readonly mutationId: number; readonly submittedEditorText: string }
  | { readonly status: 'archiving'; readonly mutationId: number; readonly submittedEditorText: string }
  | { readonly status: 'recovering'; readonly mutationId: number; readonly submittedEditorText: string; readonly failure: WorkflowConflict }
  | { readonly status: 'saved'; readonly operation: DocumentMutation }
  | { readonly status: 'conflict'; readonly failure: WorkflowConflict }
  | { readonly status: 'error'; readonly failure: WorkflowError };

export type DocumentWorkspace = {
  readonly document: CmsAdminDocument;
  readonly revisions: readonly CmsAdminRevision[];
  readonly activeDraft: CmsAdminRevision | null;
  readonly actionableRevision: CmsAdminRevision | null;
  readonly referenceRevision: CmsAdminRevision | null;
  readonly editorText: string;
  readonly baselineText: string;
  readonly expectedEditVersion: number | null;
  readonly operation: DocumentOperationState;
};
