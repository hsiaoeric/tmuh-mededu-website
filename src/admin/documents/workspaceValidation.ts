import type { Json } from '@/content/database.types';
import type { CmsDocumentKind } from '@/content/contracts/kinds';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { DraftMediaReferenceSchema } from '@/content/media';
import { assertNever } from './assertNever';
import { generalSchemaResult, parseEditorJson } from './editorTextCache';
import {
  isWorkspaceDirty,
  type DocumentOperationState,
  type DocumentWorkspace,
} from './workspaceState';

function isJsonObject(value: unknown): value is { readonly [key: string]: Json } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const PUBLISHED_MEDIA_PLACEHOLDER = {
  kind: 'local',
  path: 'assets/validation-placeholder.jpg',
} as const;

export function withPublishableMediaReferences(value: Json): Json {
  if (Array.isArray(value)) return value.map(withPublishableMediaReferences);
  if (value === null || typeof value !== 'object') return value;
  // Only an object tagged `kind: "draft"` can be a draft reference. Checking the tag first keeps a
  // failed schema parse, which is costly, off every other node of a large payload.
  if (value.kind === 'draft' && DraftMediaReferenceSchema.safeParse(value).success) return PUBLISHED_MEDIA_PLACEHOLDER;
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
  const json = parseEditorJson(editorText);
  if (!json.ok) {
    if (json.error instanceof SyntaxError) {
      return { ok: false, failure: { kind: 'invalid-json-object' } };
    }
    throw json.error;
  }
  const parsed = json.value;
  // JSON.parse only ever yields JSON values, so checking for a plain object is enough; a full
  // z.json() walk of a large payload on every keystroke cost several milliseconds.
  return isJsonObject(parsed)
    ? { ok: true, payload: parsed }
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

type DraftValidity = {
  readonly payload: Json;
  readonly generalValid: boolean;
  /** Computed on first use: only a saved (clean) draft can be published, so typing never needs it. */
  readonly publishedValid: () => boolean;
};

let lastValidity: { readonly kind: CmsDocumentKind; readonly editorText: string; readonly result: DraftValidity | null } | null = null;

/**
 * Whether the editor text saves and publishes. The view asks on every render and each mutation
 * asks again, while the text changes only on edits, so the last answer is kept.
 */
function draftValidity(kind: CmsDocumentKind, editorText: string): DraftValidity | null {
  if (lastValidity !== null && lastValidity.kind === kind && lastValidity.editorText === editorText) return lastValidity.result;
  const parsed = parseDraftPayload(editorText);
  let result: DraftValidity | null = null;
  if (parsed.ok) {
    let published: boolean | undefined;
    result = {
      payload: parsed.payload,
      generalValid: generalSchemaResult(kind, editorText, parsed.payload).success,
      publishedValid: () => {
        published ??= CMS_PAYLOAD_REGISTRY[kind].publishedSchema.safeParse(withPublishableMediaReferences(parsed.payload)).success;
        return published;
      },
    };
  }
  lastValidity = { kind, editorText, result };
  return result;
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
  const validity = draftValidity(workspace.document.kind, workspace.editorText);
  const dirty = isWorkspaceDirty(workspace);
  if (validity === null) {
    return { canSave: false, canPublish: false, canArchive: !dirty && workspace.actionableRevision !== null, draftPayload: null };
  }
  const { payload, generalValid, publishedValid } = validity;
  return {
    canSave: dirty && generalValid,
    canPublish: !dirty && workspace.activeDraft !== null && generalValid && publishedValid(),
    canArchive: !dirty && workspace.actionableRevision !== null,
    draftPayload: payload,
  };
}
