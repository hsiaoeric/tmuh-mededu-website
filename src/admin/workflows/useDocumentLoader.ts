import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { AdminDocumentRepository } from '@/admin/repository';
import type { CmsDocumentKind } from '@/content/contracts/kinds';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import {
  createDocumentWorkspace,
  documentWorkspaceReducer,
  mapRepositoryFailure,
  type DocumentLoadState,
  type DocumentWorkspaceAction,
} from '@/admin/documents';

export type DocumentLoaderOptions = {
  readonly repository: AdminDocumentRepository;
  readonly kind: CmsDocumentKind;
};

export type DocumentLoader = {
  readonly state: DocumentLoadState;
  readonly routeGeneration: number;
  readonly reload: () => void;
  readonly applyWorkspaceAction: (
    action: DocumentWorkspaceAction,
    expectedGeneration: number,
  ) => void;
};

export function useDocumentLoader({ repository, kind }: DocumentLoaderOptions): DocumentLoader {
  const [state, setState] = useState<DocumentLoadState>({ status: 'loading' });
  const [routeGeneration, setRouteGeneration] = useState(0);
  const [reloadGeneration, reload] = useReducer((generation: number) => generation + 1, 0);
  const generationRef = useRef(0);

  const applyWorkspaceAction = useCallback((
    action: DocumentWorkspaceAction,
    expectedGeneration: number,
  ): void => {
    if (generationRef.current !== expectedGeneration) return;
    setState((current) => current.status === 'ready'
      ? { status: 'ready', workspace: documentWorkspaceReducer(current.workspace, action) }
      : current);
  }, []);

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    setRouteGeneration(generation);
    setState({ status: 'loading' });
    const controller = new AbortController();
    const isCurrent = () => generationRef.current === generation && !controller.signal.aborted;

    async function load(): Promise<void> {
      const listed = await repository.listDocuments(controller.signal);
      if (!isCurrent()) return;
      if (!listed.ok) {
        setState({ status: 'load-error', failure: mapRepositoryFailure(listed.failure) });
        return;
      }
      const stableKey = CMS_PAYLOAD_REGISTRY[kind].stableKey;
      const document = listed.value.find(
        (candidate) => candidate.kind === kind && candidate.stableKey === stableKey,
      );
      if (document === undefined) {
        setState({ status: 'missing' });
        return;
      }
      const read = await repository.readDocument(document.id, controller.signal);
      if (!isCurrent()) return;
      setState(read.ok
        ? { status: 'ready', workspace: createDocumentWorkspace(read.value) }
        : { status: 'load-error', failure: mapRepositoryFailure(read.failure) });
    }

    void load();
    return () => {
      controller.abort();
      if (generationRef.current === generation) generationRef.current += 1;
    };
  }, [kind, reloadGeneration, repository]);

  return { state, routeGeneration, reload, applyWorkspaceAction };
}
