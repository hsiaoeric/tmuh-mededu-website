import { useCallback } from 'react';
import { useAdminProtectedAccess } from '@/admin/auth';
import type { AdminDocumentRepository } from '@/admin/repository';
import type { CmsDocumentKind } from '@/content/contracts/kinds';
import type { DocumentLoadState } from '@/admin/documents';
import { useDocumentLoader } from './useDocumentLoader';
import { useDocumentMutations } from './useDocumentMutations';

export type DocumentWorkspaceOptions = {
  readonly repository: AdminDocumentRepository;
  readonly kind: CmsDocumentKind;
};

export type DocumentWorkspaceController = {
  readonly state: DocumentLoadState;
  readonly reload: () => void;
  readonly setEditorText: (editorText: string) => void;
  readonly save: () => Promise<void>;
  readonly publish: () => Promise<void>;
  readonly archive: () => Promise<void>;
  readonly recoverConflict: () => Promise<void>;
};

export function useDocumentWorkspace(
  options: DocumentWorkspaceOptions,
): DocumentWorkspaceController {
  const { mutationsAllowed } = useAdminProtectedAccess();
  const loader = useDocumentLoader(options);
  const mutations = useDocumentMutations({
    mutationsAllowed,
    repository: options.repository,
    state: loader.state,
    routeGeneration: loader.routeGeneration,
    applyWorkspaceAction: loader.applyWorkspaceAction,
  });
  const setEditorText = useCallback((editorText: string): void => {
    loader.applyWorkspaceAction(
      { type: 'editor-changed', editorText },
      loader.routeGeneration,
    );
  }, [loader.applyWorkspaceAction, loader.routeGeneration]);
  return {
    state: loader.state,
    reload: loader.reload,
    setEditorText,
    save: mutations.save,
    publish: mutations.publish,
    archive: mutations.archive,
    recoverConflict: mutations.recoverConflict,
  };
}
