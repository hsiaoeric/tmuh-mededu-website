import type { DraftMediaReference } from '@/content/media';
import type { DraftUploadResult } from './types';

const ownershipScopeBrand: unique symbol = Symbol('DraftMediaOwnershipScope');

export type DraftMediaOwnershipScope = {
  readonly [ownershipScopeBrand]: true;
};

type OwnershipListener = (references: readonly DraftMediaReference[]) => void;

type CreatedDraftUpload = Omit<Extract<DraftUploadResult, { readonly ok: true }>, 'outcome'> & {
  readonly outcome: 'created';
};

export type DraftMediaOwnershipRegistry = {
  readonly snapshot: () => readonly DraftMediaReference[];
  readonly register: (uploaded: CreatedDraftUpload) => void;
  readonly resolve: (reference: DraftMediaReference) => void;
  readonly forget: (reference: DraftMediaReference) => void;
  readonly reopen: (reference: DraftMediaReference) => void;
  readonly synchronize: (isClaimed: (reference: DraftMediaReference) => boolean) => void;
  readonly subscribe: (listener: OwnershipListener) => () => void;
  readonly reset: () => void;
};

export function addUnresolvedReference(
  references: readonly DraftMediaReference[],
  reference: DraftMediaReference,
): readonly DraftMediaReference[] {
  return references.some((candidate) => candidate.path === reference.path)
    ? references
    : [...references, reference];
}

export function removeUnresolvedReference(
  references: readonly DraftMediaReference[],
  reference: DraftMediaReference,
): readonly DraftMediaReference[] {
  return references.filter((candidate) => candidate.path !== reference.path);
}

function createDraftMediaOwnershipRegistry(): DraftMediaOwnershipRegistry {
  let references: readonly DraftMediaReference[] = [];
  const createdReferences = new Map<string, DraftMediaReference>();
  const listeners = new Set<OwnershipListener>();
  const publish = (): void => {
    for (const listener of listeners) listener(references);
  };

  return {
    snapshot: () => references,
    register: (uploaded) => {
      const { reference } = uploaded;
      createdReferences.set(reference.path, reference);
      const next = addUnresolvedReference(references, reference);
      if (next === references) return;
      references = next;
      publish();
    },
    reopen: (reference) => {
      if (!createdReferences.has(reference.path)) return;
      const next = addUnresolvedReference(references, reference);
      if (next === references) return;
      references = next;
      publish();
    },
    resolve: (reference) => {
      const next = removeUnresolvedReference(references, reference);
      if (next.length === references.length) return;
      references = next;
      publish();
    },
    forget: (reference) => {
      createdReferences.delete(reference.path);
      const next = removeUnresolvedReference(references, reference);
      if (next.length === references.length) return;
      references = next;
      publish();
    },
    synchronize: (isClaimed) => {
      const next = [...createdReferences.values()].reduce<readonly DraftMediaReference[]>(
        (current, reference) => isClaimed(reference)
          ? current
          : addUnresolvedReference(current, reference),
        references,
      );
      if (next === references) return;
      references = next;
      publish();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    reset: () => {
      const hadReferences = references.length > 0;
      references = [];
      createdReferences.clear();
      if (hadReferences) publish();
    },
  };
}

const ownershipByScope = new WeakMap<DraftMediaOwnershipScope, DraftMediaOwnershipRegistry>();

export function createDraftMediaOwnershipScope(): DraftMediaOwnershipScope {
  return { [ownershipScopeBrand]: true };
}

export function draftMediaOwnershipFor(scope: DraftMediaOwnershipScope): DraftMediaOwnershipRegistry {
  const existing = ownershipByScope.get(scope);
  if (existing !== undefined) return existing;
  const registry = createDraftMediaOwnershipRegistry();
  ownershipByScope.set(scope, registry);
  return registry;
}

export function resetDraftMediaOwnership(scope: DraftMediaOwnershipScope): void {
  ownershipByScope.get(scope)?.reset();
}
