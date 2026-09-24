import { z } from 'zod';
import type { Json } from '@/content/database.types';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { DraftMediaReferenceSchema } from '@/content/media';
import { assertNever } from './assertNever';
import {
  isWorkspaceDirty,
  type DocumentOperationState,
  type DocumentWorkspace,
} from './workspaceState';

const JsonObjectSchema = z.record(z.string(), z.json());
const PUBLISHED_MEDIA_PLACEHOLDER = {
  kind: 'local',
  path: 'assets/validation-placeholder.jpg',
} as const;

function withPublishableMediaReferences(value: Json): Json {
  if (DraftMediaReferenceSchema.safeParse(value).success) return PUBLISHED_MEDIA_PLACEHOLDER;
  if (Array.isArray(value)) return value.map(withPublishableMediaReferences);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      child === undefined ? child : withPublishableMediaReferences(child),
    ]),
  );
}

export type DraftPayloadResult =
  | { readonly ok: true; readonly payload: Json }
  | { readonly ok: false; readonly failure: { readonly kind: 'invalid-json-object' } };

export type WorkspaceCapabilities = {
  readonly canSave: boolean;
  readonly canPublish: boolean;
  readonly canArchive: boolean;
  readonly draftPayload: Json | null;
};

export function parseDraftPayload(editorText: string): DraftPayloadResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(editorText);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return { ok: false, failure: { kind: 'invalid-json-object' } };
    }
    throw error;
  }
  const result = JsonObjectSchema.safeParse(parsed);
  return result.success
    ? { ok: true, payload: result.data }
    : { ok: false, failure: { kind: 'invalid-json-object' } };
}

function isOperationAvailable(operation: DocumentOperationState): boolean {
  switch (operation.status) {
    case 'idle':
    case 'saved':
    case 'error':
      return true;
    case 'conflict':
    case 'saving':
    case 'publishing':
    case 'archiving':
    case 'recovering':
      return false;
    default:
      return assertNever(operation, 'document operation state');
  }
}

export function getWorkspaceCapabilities(
  workspace: DocumentWorkspace,
  operation: DocumentOperationState = workspace.operation,
): WorkspaceCapabilities {
  if (!isOperationAvailable(operation)) {
    return { canSave: false, canPublish: false, canArchive: false, draftPayload: null };
  }
  if (workspace.actionableRevision === null) {
    return { canSave: false, canPublish: false, canArchive: false, draftPayload: null };
  }
  const parsed = parseDraftPayload(workspace.editorText);
  const dirty = isWorkspaceDirty(workspace);
  if (!parsed.ok) {
    return { canSave: false, canPublish: false, canArchive: !dirty && workspace.actionableRevision !== null, draftPayload: null };
  }
  const contract = CMS_PAYLOAD_REGISTRY[workspace.document.kind];
  const generalValid = contract.schema.safeParse(parsed.payload).success;
  const publishedValid = contract.publishedSchema.safeParse(
    withPublishableMediaReferences(parsed.payload),
  ).success;
  const publishable = generalValid && publishedValid;
  return {
    canSave: dirty && generalValid,
    canPublish: !dirty && workspace.activeDraft !== null && publishable,
    canArchive: !dirty && workspace.actionableRevision !== null,
    draftPayload: parsed.payload,
  };
}
