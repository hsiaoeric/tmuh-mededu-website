import { useCallback, useEffect, useState } from 'react';
import { assertNever } from '@/admin/documents/assertNever';
import type { DraftMediaReference, MediaReference } from '@/content/media';
import type { DraftMediaOwnershipRegistry } from './draftMediaOwnership';
import type { PortraitSlot } from './mediaWorkbenchTypes';

type SlotIdentity = {
  readonly key: string;
  readonly slotKind: PortraitSlot['slotKind'];
  readonly personName: string;
  readonly locale: PortraitSlot['locale'];
  readonly contextLabel: string;
};

type ProposalBase = {
  readonly proposedEditorText: string;
  readonly slot: SlotIdentity;
  readonly startingRevision: number;
};

type PendingProposal =
  | (ProposalBase & {
      readonly kind: 'adopt';
      readonly reference: DraftMediaReference;
    })
  | (ProposalBase & {
      readonly kind: 'unlink';
      readonly reference: MediaReference;
    });

type ProposalInput =
  | Omit<Extract<PendingProposal, { readonly kind: 'adopt' }>, 'slot'>
  | Omit<Extract<PendingProposal, { readonly kind: 'unlink' }>, 'slot'>;

type AcceptedOutcome =
  | { readonly kind: 'adopted'; readonly reference: DraftMediaReference; readonly revision: number }
  | { readonly kind: 'unlinked'; readonly revision: number };

type PortraitProposalOptions = {
  readonly editorText: string;
  readonly editorRevision: number;
  readonly slot: PortraitSlot;
  readonly ownership: DraftMediaOwnershipRegistry;
  readonly discardAdoption: () => void;
};

type PortraitProposalController = {
  readonly outcome: 'adopted' | 'unlinked' | null;
  readonly propose: (proposal: ProposalInput) => void;
  readonly clearOutcome: () => void;
};

function identityOf(slot: PortraitSlot): SlotIdentity {
  return {
    key: slot.key,
    slotKind: slot.slotKind,
    personName: slot.personName,
    locale: slot.locale,
    contextLabel: slot.contextLabel,
  };
}

function matchesSlot(slot: PortraitSlot, identity: SlotIdentity): boolean {
  return slot.key === identity.key
    && slot.slotKind === identity.slotKind
    && slot.personName === identity.personName
    && slot.locale === identity.locale
    && slot.contextLabel === identity.contextLabel;
}

function isAccepted(proposal: PendingProposal, editorText: string, slot: PortraitSlot): boolean {
  if (editorText !== proposal.proposedEditorText || !matchesSlot(slot, proposal.slot)) return false;
  switch (proposal.kind) {
    case 'adopt':
      return slot.reference?.kind === 'draft'
        && slot.reference.bucket === proposal.reference.bucket
        && slot.reference.path === proposal.reference.path;
    case 'unlink':
      return slot.reference === null;
    default:
      return assertNever(proposal, 'portrait proposal');
  }
}

export function usePortraitProposal(options: PortraitProposalOptions): PortraitProposalController {
  const [pending, setPending] = useState<PendingProposal | null>(null);
  const [accepted, setAccepted] = useState<AcceptedOutcome | null>(null);
  const propose = useCallback((proposal: ProposalInput): void => {
    setPending({ ...proposal, slot: identityOf(options.slot) });
  }, [options.slot]);
  const clearOutcome = useCallback((): void => setAccepted(null), []);

  useEffect(() => {
    if (pending === null || options.editorRevision <= pending.startingRevision) return;
    setPending(null);
    if (!isAccepted(pending, options.editorText, options.slot)) {
      if (pending.kind === 'adopt') {
        options.ownership.reopen(pending.reference);
        options.discardAdoption();
      }
      setAccepted(null);
      return;
    }
    switch (pending.kind) {
      case 'adopt':
        options.ownership.resolve(pending.reference);
        setAccepted({ kind: 'adopted', reference: pending.reference, revision: options.editorRevision });
        return;
      case 'unlink':
        if (pending.reference.kind === 'draft') options.ownership.reopen(pending.reference);
        setAccepted({ kind: 'unlinked', revision: options.editorRevision });
        return;
      default:
        return assertNever(pending, 'portrait proposal settlement');
    }
  }, [options.discardAdoption, options.editorRevision, options.editorText, options.ownership, options.slot, pending]);

  useEffect(() => {
    if (accepted === null || options.editorRevision <= accepted.revision) return;
    switch (accepted.kind) {
      case 'adopted':
        if (slotReferencePath(options.slot) !== accepted.reference.path) setAccepted(null);
        return;
      case 'unlinked':
        if (options.slot.reference !== null) setAccepted(null);
        return;
      default:
        return assertNever(accepted, 'portrait outcome');
    }
  }, [accepted, options.editorRevision, options.slot]);

  return { outcome: accepted?.kind ?? null, propose, clearOutcome };
}

function slotReferencePath(slot: PortraitSlot): string | null {
  return slot.reference?.path ?? null;
}
