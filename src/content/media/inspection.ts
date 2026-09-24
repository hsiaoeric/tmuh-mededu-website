import type { DraftMediaReference, MediaReference } from './references';
import { DraftMediaReferenceSchema, MediaReferenceSchema } from './references';

export type PayloadMediaInspection = {
  readonly references: readonly MediaReference[];
  readonly draftReferences: readonly DraftMediaReference[];
  readonly malformedDraftLike: readonly Readonly<Record<string, unknown>>[];
};

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDraftLike(value: Readonly<Record<string, unknown>>): boolean {
  return value['kind'] === 'draft' || value['bucket'] === 'draft-media';
}

export function inspectPayloadMedia(payload: unknown): PayloadMediaInspection {
  const references = new Map<string, MediaReference>();
  const draftReferences = new Map<string, DraftMediaReference>();
  const malformedDraftLike: Readonly<Record<string, unknown>>[] = [];

  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!isRecord(value)) return;

    if (isDraftLike(value)) {
      const parsedDraft = DraftMediaReferenceSchema.safeParse(value);
      if (!parsedDraft.success) {
        malformedDraftLike.push(value);
        return;
      }
      references.set(`draft:${parsedDraft.data.path}`, parsedDraft.data);
      draftReferences.set(parsedDraft.data.path, parsedDraft.data);
      return;
    }

    const parsedReference = MediaReferenceSchema.safeParse(value);
    if (parsedReference.success) {
      references.set(`${parsedReference.data.kind}:${parsedReference.data.path}`, parsedReference.data);
      return;
    }
    Object.values(value).forEach(visit);
  };

  visit(payload);
  return {
    references: [...references.values()],
    draftReferences: [...draftReferences.values()],
    malformedDraftLike,
  };
}
