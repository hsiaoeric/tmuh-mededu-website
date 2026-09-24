import { useEffect, useReducer, useState } from 'react';
import type { AdminDocumentFailure, AdminDocumentRepository, CmsAdminDocument } from './types';

export type AdminDocumentListState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly documents: readonly CmsAdminDocument[] }
  | { readonly status: 'error'; readonly failure: AdminDocumentFailure };

export function useAdminDocumentList(repository: AdminDocumentRepository): {
  readonly state: AdminDocumentListState;
  readonly retry: () => void;
} {
  const [state, setState] = useState<AdminDocumentListState>({ status: 'loading' });
  const [retryGeneration, retry] = useReducer((generation: number) => generation + 1, 0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    void repository.listDocuments(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setState(result.ok
        ? { status: 'ready', documents: result.value }
        : { status: 'error', failure: result.failure });
    });
    return () => controller.abort();
  }, [repository, retryGeneration]);

  return { state, retry };
}
