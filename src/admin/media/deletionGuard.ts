import { parseDraftPayload } from '@/admin/documents';
import type { Json } from '@/content/database.types';
import type { DraftDeleteGuard } from './types';
import { inspectPayloadMedia, type DraftMediaReference } from '@/content/media';
import type { DraftMediaClaimsRegistry } from './draftMediaClaims';

type DraftDeleteGuardInput = {
  readonly claims: DraftMediaClaimsRegistry;
  readonly editorText: string;
  readonly savedDraftPayload: Json | null;
  readonly reference: DraftMediaReference;
};

function includesPath(payload: Json, reference: DraftMediaReference): boolean {
  return inspectPayloadMedia(payload).draftReferences.some(
    (candidate) => candidate.path === reference.path,
  );
}

export function deriveDraftDeleteGuard(input: DraftDeleteGuardInput): DraftDeleteGuard {
  const claimed = input.claims.guard(input.reference);
  const editorPayload = parseDraftPayload(input.editorText);
  return {
    referencedByEditor: claimed.referencedByEditor || !editorPayload.ok
      || includesPath(editorPayload.payload, input.reference),
    referencedBySavedDraft: claimed.referencedBySavedDraft
      || (input.savedDraftPayload !== null && includesPath(input.savedDraftPayload, input.reference)),
  };
}
