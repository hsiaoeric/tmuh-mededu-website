import { useEffect, useReducer, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CMS_DOCUMENT_STABLE_KEYS, type CmsDocumentKind } from '@/content/contracts/kinds';
import { useOptionalAdminDocumentRepository } from './repository/AdminDocumentRepositoryProvider';

/** Fired after a save, publish or archive so navigation re-reads which documents await publishing. */
export const DOCUMENTS_CHANGED_EVENT = 'admin:documents-changed';

export function announceDocumentsChanged(): void {
  window.dispatchEvent(new Event(DOCUMENTS_CHANGED_EVENT));
}

const NONE: ReadonlySet<CmsDocumentKind> = new Set();

/**
 * Kinds with a saved draft that is not published yet. Empty when the repository cannot list
 * revision statuses, so navigation simply shows no markers.
 */
export function useUnpublishedDraftKinds(): ReadonlySet<CmsDocumentKind> {
  const context = useOptionalAdminDocumentRepository();
  const repository = context?.state.status === 'ready' ? context.state.repository : null;
  const { pathname } = useLocation();
  const [generation, refresh] = useReducer((value: number) => value + 1, 0);
  const [kinds, setKinds] = useState<ReadonlySet<CmsDocumentKind>>(NONE);

  useEffect(() => {
    window.addEventListener(DOCUMENTS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(DOCUMENTS_CHANGED_EVENT, refresh);
  }, []);

  useEffect(() => {
    const listStatuses = repository?.listRevisionStatuses?.bind(repository);
    if (repository === null || listStatuses === undefined) return undefined;
    const controller = new AbortController();
    void Promise.all([repository.listDocuments(controller.signal), listStatuses(controller.signal)]).then(([documents, statuses]) => {
      if (controller.signal.aborted || !documents.ok || !statuses.ok) return;
      const drafted = new Set(statuses.value.filter((status) => status.status === 'draft').map((status) => status.documentId));
      const next = new Set(documents.value
        .filter((document) => drafted.has(document.id) && CMS_DOCUMENT_STABLE_KEYS[document.kind] === document.stableKey)
        .map((document) => document.kind));
      setKinds((current) => (current.size === next.size && [...next].every((kind) => current.has(kind)) ? current : next));
    });
    return () => controller.abort();
  }, [generation, pathname, repository]);

  return kinds;
}
