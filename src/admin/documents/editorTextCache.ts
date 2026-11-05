import type { CmsDocumentKind } from '@/content/contracts/kinds';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';

/**
 * One keystroke changes the editor text once, but the structured editor, the save and publish
 * checks, and the changed-field markers each read it. On a large document (the posts archive is
 * about 180 KB) parsing and validating it three times dominated typing, so the latest text's
 * JSON and its general-schema result are kept here and shared. Values are treated as immutable.
 */
type JsonParse = { readonly ok: true; readonly value: unknown } | { readonly ok: false; readonly error: unknown };

let lastJson: { readonly text: string; readonly result: JsonParse } | null = null;

export function parseEditorJson(text: string): JsonParse {
  if (lastJson !== null && lastJson.text === text) return lastJson.result;
  let result: JsonParse;
  try {
    result = { ok: true, value: JSON.parse(text) };
  } catch (error: unknown) {
    result = { ok: false, error };
  }
  lastJson = { text, result };
  return result;
}

type SchemaResult = ReturnType<(typeof CMS_PAYLOAD_REGISTRY)[CmsDocumentKind]['schema']['safeParse']>;

let lastSchema: { readonly kind: CmsDocumentKind; readonly text: string; readonly result: SchemaResult } | null = null;

/** The general-tier schema result for `text`, which must parse as JSON. */
export function generalSchemaResult(kind: CmsDocumentKind, text: string, value: unknown): SchemaResult {
  if (lastSchema !== null && lastSchema.kind === kind && lastSchema.text === text) return lastSchema.result;
  const result = CMS_PAYLOAD_REGISTRY[kind].schema.safeParse(value) as SchemaResult;
  lastSchema = { kind, text, result };
  return result;
}
