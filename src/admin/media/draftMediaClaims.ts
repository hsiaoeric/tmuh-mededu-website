import { parseDraftPayload } from '@/admin/documents';
import type { Json } from '@/content/database.types';
import type { CmsDocumentId } from '@/content/contracts/primitives';
import { inspectPayloadMedia, type DraftMediaReference } from '@/content/media';
import type { DraftDeleteGuard } from './types';
import type { DraftMediaOwnershipScope } from './draftMediaOwnership';

export type DraftMediaDocumentClaims = {
  readonly documentId: CmsDocumentId;
  readonly editorPaths: readonly string[];
  readonly savedPaths: readonly string[];
  readonly editorValid: boolean;
};

type ClaimsListener = () => void;

export type DraftMediaClaimsRegistry = {
  readonly snapshot: () => readonly DraftMediaDocumentClaims[];
  readonly updateEditor: (documentId: CmsDocumentId, editorText: string) => void;
  readonly updateSaved: (documentId: CmsDocumentId, payload: Json | null) => void;
  readonly discardEditor: (documentId: CmsDocumentId) => void;
  readonly guard: (reference: DraftMediaReference) => DraftDeleteGuard;
  readonly subscribe: (listener: ClaimsListener) => () => void;
};

function pathsIn(payload: Json): readonly string[] {
  return inspectPayloadMedia(payload).draftReferences.map((reference) => reference.path);
}

function createDraftMediaClaimsRegistry(): DraftMediaClaimsRegistry {
  const claims = new Map<CmsDocumentId, DraftMediaDocumentClaims>();
  const listeners = new Set<ClaimsListener>();
  const publish = (): void => {
    for (const listener of listeners) listener();
  };
  const current = (documentId: CmsDocumentId): DraftMediaDocumentClaims => claims.get(documentId) ?? {
    documentId, editorPaths: [], savedPaths: [], editorValid: true,
  };
  const store = (next: DraftMediaDocumentClaims): void => {
    claims.set(next.documentId, next);
    publish();
  };

  return {
    snapshot: () => [...claims.values()],
    updateEditor: (documentId, editorText) => {
      const parsed = parseDraftPayload(editorText);
      store({
        ...current(documentId),
        editorPaths: parsed.ok ? pathsIn(parsed.payload) : [],
        editorValid: parsed.ok,
      });
    },
    updateSaved: (documentId, payload) => {
      store({ ...current(documentId), savedPaths: payload === null ? [] : pathsIn(payload) });
    },
    discardEditor: (documentId) => {
      const existing = claims.get(documentId);
      if (existing === undefined) return;
      store({ ...existing, editorPaths: [], editorValid: true });
    },
    guard: (reference) => ({
      referencedByEditor: [...claims.values()].some((claim) => (
        !claim.editorValid || claim.editorPaths.includes(reference.path)
      )),
      referencedBySavedDraft: [...claims.values()].some((claim) => (
        claim.savedPaths.includes(reference.path)
      )),
    }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const claimsByScope = new WeakMap<DraftMediaOwnershipScope, DraftMediaClaimsRegistry>();

export function draftMediaClaimsFor(scope: DraftMediaOwnershipScope): DraftMediaClaimsRegistry {
  const existing = claimsByScope.get(scope);
  if (existing !== undefined) return existing;
  const registry = createDraftMediaClaimsRegistry();
  claimsByScope.set(scope, registry);
  return registry;
}
