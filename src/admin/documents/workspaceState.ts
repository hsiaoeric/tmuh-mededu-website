import type {
  CmsAdminDocumentDetail,
  CmsAdminRevision,
} from '@/admin/repository';
import { assertNever } from './assertNever';
import {
  isWorkflowConflict,
  type WorkflowConflict,
  type WorkflowFailure,
} from './workflowFailure';
import {
  completedWorkspace,
  replaceRevision,
  workspaceFromRevisions,
} from './workspaceRevisionState';
import type {
  DocumentMutation,
  DocumentOperationState,
  DocumentWorkspace,
} from './workspaceTypes';

export type {
  DocumentMutation,
  DocumentOperationState,
  DocumentWorkspace,
} from './workspaceTypes';

export type DocumentLoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'missing' }
  | { readonly status: 'load-error'; readonly failure: WorkflowFailure }
  | { readonly status: 'ready'; readonly workspace: DocumentWorkspace };

type ActiveDocumentOperation =
  | { readonly status: 'saving'; readonly mutationId: number; readonly submittedEditorText: string }
  | { readonly status: 'publishing'; readonly mutationId: number; readonly submittedEditorText: string }
  | { readonly status: 'archiving'; readonly mutationId: number; readonly submittedEditorText: string };

export type DocumentWorkspaceAction =
  | { readonly type: 'editor-changed'; readonly editorText: string }
  | { readonly type: 'mutation-started'; readonly operation: DocumentMutation; readonly mutationId: number; readonly submittedEditorText: string }
  | {
      readonly type: 'mutation-failed';
      readonly operation: DocumentMutation;
      readonly mutationId: number;
      readonly failure: WorkflowFailure;
    }
  | { readonly type: 'draft-created'; readonly operation: 'save'; readonly mutationId: number; readonly revision: CmsAdminRevision }
  | { readonly type: 'save-succeeded'; readonly operation: 'save'; readonly mutationId: number; readonly revision: CmsAdminRevision }
  | { readonly type: 'publish-succeeded'; readonly operation: 'publish'; readonly mutationId: number; readonly revision: CmsAdminRevision }
  | { readonly type: 'archive-succeeded'; readonly operation: 'archive'; readonly mutationId: number; readonly revision: CmsAdminRevision }
  | { readonly type: 'conflict-recovery-started'; readonly mutationId: number; readonly submittedEditorText: string; readonly failure: WorkflowConflict }
  | { readonly type: 'conflict-recovery-succeeded'; readonly mutationId: number; readonly detail: CmsAdminDocumentDetail }
  | { readonly type: 'conflict-recovery-failed'; readonly mutationId: number }
  | { readonly type: 'operation-reset' };

const IDLE_OPERATION = { status: 'idle' } as const;

export function createDocumentWorkspace(detail: CmsAdminDocumentDetail): DocumentWorkspace {
  return workspaceFromRevisions(detail.document, detail.revisions, IDLE_OPERATION);
}

export function isWorkspaceDirty(workspace: DocumentWorkspace): boolean {
  return workspace.editorText !== workspace.baselineText;
}

export function pendingDocumentMutation(operation: DocumentOperationState): DocumentMutation | null {
  switch (operation.status) {
    case 'saving': return 'save';
    case 'publishing': return 'publish';
    case 'archiving': return 'archive';
    case 'idle':
    case 'recovering':
    case 'saved':
    case 'conflict':
    case 'error':
      return null;
    default:
      return assertNever(operation, 'document operation state');
  }
}

function operationAfterEditorChange(operation: DocumentOperationState): DocumentOperationState {
  switch (operation.status) {
    case 'saved': return IDLE_OPERATION;
    case 'idle':
    case 'saving':
    case 'publishing':
    case 'archiving':
    case 'recovering':
    case 'conflict':
    case 'error':
      return operation;
    default:
      return assertNever(operation, 'document operation state');
  }
}

function activeOperation(
  action: Extract<DocumentWorkspaceAction, { readonly type: 'mutation-started' }>,
): ActiveDocumentOperation {
  const active = {
    mutationId: action.mutationId,
    submittedEditorText: action.submittedEditorText,
  };
  switch (action.operation) {
    case 'save':
      return { status: 'saving', ...active };
    case 'publish':
      return { status: 'publishing', ...active };
    case 'archive':
      return { status: 'archiving', ...active };
    default:
      return assertNever(action.operation, 'document mutation');
  }
}

function matchesActiveOperation(
  operation: DocumentOperationState,
  expectedOperation: DocumentMutation,
  expectedMutationId: number,
): operation is ActiveDocumentOperation {
  switch (operation.status) {
    case 'saving':
      return expectedOperation === 'save' && operation.mutationId === expectedMutationId;
    case 'publishing':
      return expectedOperation === 'publish' && operation.mutationId === expectedMutationId;
    case 'archiving':
      return expectedOperation === 'archive' && operation.mutationId === expectedMutationId;
    case 'recovering':
    case 'idle':
    case 'saved':
    case 'conflict':
    case 'error':
      return false;
    default:
      return assertNever(operation, 'document operation state');
  }
}

export function documentWorkspaceReducer(
  state: DocumentWorkspace,
  action: DocumentWorkspaceAction,
): DocumentWorkspace {
  switch (action.type) {
    case 'editor-changed':
      return {
        ...state,
        editorText: action.editorText,
        operation: operationAfterEditorChange(state.operation),
      };
    case 'mutation-started':
      return { ...state, operation: activeOperation(action) };
    case 'mutation-failed': {
      if (!matchesActiveOperation(state.operation, action.operation, action.mutationId)) return state;
      return {
        ...state,
        operation: isWorkflowConflict(action.failure)
          ? { status: 'conflict', failure: action.failure }
          : { status: 'error', failure: action.failure },
      };
    }
    case 'draft-created': {
      if (!matchesActiveOperation(state.operation, action.operation, action.mutationId)) return state;
      return {
        ...state,
        revisions: replaceRevision(state.revisions, action.revision),
        activeDraft: action.revision,
        actionableRevision: action.revision,
        referenceRevision: action.revision,
        expectedEditVersion: action.revision.editVersion,
      };
    }
    case 'save-succeeded': {
      if (!matchesActiveOperation(state.operation, action.operation, action.mutationId)) return state;
      return completedWorkspace(
        state,
        replaceRevision(state.revisions, action.revision),
        { operation: action.operation, submittedEditorText: state.operation.submittedEditorText },
      );
    }
    case 'publish-succeeded': {
      if (!matchesActiveOperation(state.operation, action.operation, action.mutationId)) return state;
      const remaining = state.revisions.filter(
        (revision) => revision.status !== 'draft' && revision.status !== 'published',
      );
      return completedWorkspace(
        state,
        [action.revision, ...remaining],
        { operation: action.operation, submittedEditorText: state.operation.submittedEditorText },
      );
    }
    case 'archive-succeeded': {
      if (!matchesActiveOperation(state.operation, action.operation, action.mutationId)) return state;
      const remaining = state.revisions.filter((revision) => revision.id !== action.revision.id);
      return completedWorkspace(
        state,
        [action.revision, ...remaining],
        { operation: action.operation, submittedEditorText: state.operation.submittedEditorText },
      );
    }
    case 'conflict-recovery-started':
      if (state.operation.status !== 'conflict') return state;
      return {
        ...state,
        operation: {
          status: 'recovering',
          mutationId: action.mutationId,
          submittedEditorText: action.submittedEditorText,
          failure: action.failure,
        },
      };
    case 'conflict-recovery-succeeded': {
      if (state.operation.status !== 'recovering' || state.operation.mutationId !== action.mutationId) return state;
      const recovered = createDocumentWorkspace(action.detail);
      return { ...recovered, editorText: state.editorText };
    }
    case 'conflict-recovery-failed':
      if (state.operation.status !== 'recovering' || state.operation.mutationId !== action.mutationId) return state;
      return { ...state, operation: { status: 'conflict', failure: state.operation.failure } };
    case 'operation-reset':
      return { ...state, operation: IDLE_OPERATION };
    default:
      return assertNever(action, 'document workspace action');
  }
}
