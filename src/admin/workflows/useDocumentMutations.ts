import { useCallback, useEffect, useRef } from 'react';
import type { AdminDocumentRepository, CmsAdminRevision } from '@/admin/repository';
import {
  getWorkspaceCapabilities,
  mapRepositoryFailure,
  type DocumentLoadState,
  type DocumentMutation,
  type DocumentWorkspaceAction,
} from '@/admin/documents';

type ActiveMutation = {
  readonly controller: AbortController;
  readonly generation: number;
  readonly mutationId: number;
  readonly operation: DocumentMutation | 'recover';
  readonly submittedEditorText: string;
};

export type DocumentMutationOptions = {
  readonly mutationsAllowed: boolean;
  readonly repository: AdminDocumentRepository;
  readonly state: DocumentLoadState;
  readonly routeGeneration: number;
  readonly applyWorkspaceAction: (
    action: DocumentWorkspaceAction,
    expectedGeneration: number,
  ) => void;
};

export type DocumentMutations = {
  readonly save: () => Promise<void>;
  readonly publish: () => Promise<void>;
  readonly archive: () => Promise<void>;
  readonly recoverConflict: () => Promise<void>;
};

export function useDocumentMutations(options: DocumentMutationOptions): DocumentMutations {
  const { mutationsAllowed, repository, state, routeGeneration, applyWorkspaceAction } = options;
  const activeRef = useRef<ActiveMutation | null>(null);
  const nextMutationId = useRef(0);

  useEffect(() => () => {
    activeRef.current?.controller.abort();
    activeRef.current = null;
  }, [routeGeneration]);

  const begin = useCallback((operation: DocumentMutation | 'recover', submittedEditorText: string): ActiveMutation | null => {
    if (!mutationsAllowed || activeRef.current !== null) return null;
    const active = {
      controller: new AbortController(),
      generation: routeGeneration,
      mutationId: nextMutationId.current + 1,
      operation,
      submittedEditorText,
    };
    nextMutationId.current = active.mutationId;
    activeRef.current = active;
    return active;
  }, [mutationsAllowed, routeGeneration]);

  const finish = useCallback((active: ActiveMutation): void => {
    if (activeRef.current === active) activeRef.current = null;
  }, []);

  const dispatch = useCallback((active: ActiveMutation, action: DocumentWorkspaceAction): boolean => {
    if (activeRef.current !== active || active.controller.signal.aborted) return false;
    applyWorkspaceAction(action, active.generation);
    return true;
  }, [applyWorkspaceAction]);

  const save = useCallback(async (): Promise<void> => {
    if (state.status !== 'ready') return;
    const capabilities = getWorkspaceCapabilities(state.workspace);
    if (!capabilities.canSave || capabilities.draftPayload === null) return;
    const active = begin('save', state.workspace.editorText);
    if (active === null) return;
    dispatch(active, {
      type: 'mutation-started',
      operation: 'save',
      mutationId: active.mutationId,
      submittedEditorText: active.submittedEditorText,
    });
    let draft: CmsAdminRevision | null = state.workspace.activeDraft;
    if (draft === null) {
      const source = state.workspace.actionableRevision;
      const cloned = await repository.clone(
        source === null
          ? { documentId: state.workspace.document.id }
          : { documentId: state.workspace.document.id, sourceRevisionId: source.id },
        active.controller.signal,
      );
      if (activeRef.current !== active || active.controller.signal.aborted) return;
      if (!cloned.ok) {
        dispatch(active, {
          type: 'mutation-failed', operation: 'save',
          mutationId: active.mutationId,
          failure: mapRepositoryFailure(cloned.failure),
        });
        finish(active);
        return;
      }
      draft = cloned.value;
      dispatch(active, {
        type: 'draft-created',
        operation: 'save',
        mutationId: active.mutationId,
        revision: draft,
      });
    }
    const saved = await repository.save({
      documentId: state.workspace.document.id,
      revisionId: draft.id,
      expectedEditVersion: draft.editVersion,
      payload: capabilities.draftPayload,
    }, active.controller.signal);
    dispatch(active, saved.ok
      ? { type: 'save-succeeded', operation: 'save', mutationId: active.mutationId, revision: saved.value }
      : {
          type: 'mutation-failed',
          operation: 'save',
          mutationId: active.mutationId,
          failure: mapRepositoryFailure(saved.failure),
        });
    finish(active);
  }, [begin, dispatch, finish, repository, state]);

  const publish = useCallback(async (): Promise<void> => {
    if (state.status !== 'ready') return;
    const capabilities = getWorkspaceCapabilities(state.workspace);
    const draft = state.workspace.activeDraft;
    if (!capabilities.canPublish || draft === null) return;
    const active = begin('publish', state.workspace.editorText);
    if (active === null) return;
    dispatch(active, {
      type: 'mutation-started',
      operation: 'publish',
      mutationId: active.mutationId,
      submittedEditorText: active.submittedEditorText,
    });
    const result = await repository.publish({
      documentId: state.workspace.document.id,
      revisionId: draft.id,
      expectedEditVersion: draft.editVersion,
    }, active.controller.signal);
    dispatch(active, result.ok
      ? { type: 'publish-succeeded', operation: 'publish', mutationId: active.mutationId, revision: result.value }
      : {
          type: 'mutation-failed',
          operation: 'publish',
          mutationId: active.mutationId,
          failure: mapRepositoryFailure(result.failure),
        });
    finish(active);
  }, [begin, dispatch, finish, repository, state]);

  const archive = useCallback(async (): Promise<void> => {
    if (state.status !== 'ready') return;
    const capabilities = getWorkspaceCapabilities(state.workspace);
    const revision = state.workspace.actionableRevision;
    if (!capabilities.canArchive || revision === null) return;
    const active = begin('archive', state.workspace.editorText);
    if (active === null) return;
    dispatch(active, {
      type: 'mutation-started',
      operation: 'archive',
      mutationId: active.mutationId,
      submittedEditorText: active.submittedEditorText,
    });
    const result = await repository.archive({
      documentId: state.workspace.document.id,
      revisionId: revision.id,
      expectedEditVersion: revision.editVersion,
    }, active.controller.signal);
    dispatch(active, result.ok
      ? { type: 'archive-succeeded', operation: 'archive', mutationId: active.mutationId, revision: result.value }
      : {
          type: 'mutation-failed',
          operation: 'archive',
          mutationId: active.mutationId,
          failure: mapRepositoryFailure(result.failure),
        });
    finish(active);
  }, [begin, dispatch, finish, repository, state]);

  const recoverConflict = useCallback(async (): Promise<void> => {
    if (state.status !== 'ready' || state.workspace.operation.status !== 'conflict') return;
    const active = begin('recover', state.workspace.editorText);
    if (active === null) return;
    dispatch(active, {
      type: 'conflict-recovery-started',
      mutationId: active.mutationId,
      submittedEditorText: active.submittedEditorText,
      failure: state.workspace.operation.failure,
    });
    const result = await repository.readDocument(
      state.workspace.document.id,
      active.controller.signal,
    );
    dispatch(active, result.ok
      ? { type: 'conflict-recovery-succeeded', mutationId: active.mutationId, detail: result.value }
      : { type: 'conflict-recovery-failed', mutationId: active.mutationId });
    finish(active);
  }, [begin, dispatch, finish, repository, state]);

  return { save, publish, archive, recoverConflict };
}
