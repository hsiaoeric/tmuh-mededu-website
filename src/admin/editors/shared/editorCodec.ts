import { assertNever } from '@/admin/documents/assertNever';
import type { CmsDocumentKind } from '@/content/contracts/kinds';
import type {
  CmsPayloadByKind,
  EditableCmsPayloadByKind,
} from '@/content/contracts/registry';
import {
  CMS_PAYLOAD_REGISTRY,
  safeParseContractPayload,
} from '@/content/contracts/registry';
import type {
  StructuredEditorIssue,
  StructuredEditorParseResult,
} from './types';

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPayloadForKind<K extends CmsDocumentKind>(
  kind: K,
  value: unknown,
): value is CmsPayloadByKind[K] {
  return safeParseContractPayload(CMS_PAYLOAD_REGISTRY[kind].schema, value).success;
}

function isEditablePayloadForKind<K extends CmsDocumentKind>(
  kind: K,
  value: unknown,
): value is EditableCmsPayloadByKind[K] {
  return safeParseContractPayload(CMS_PAYLOAD_REGISTRY[kind].editableSchema, value).success;
}

function issuesFor(
  schema: Parameters<typeof safeParseContractPayload>[0],
  value: unknown,
): readonly StructuredEditorIssue[] {
  const validation = safeParseContractPayload(schema, value);
  return validation.success ? [] : validation.error.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
    code: issue.code,
  }));
}

export function parseStructuredEditorText<K extends CmsDocumentKind>(
  kind: K,
  editorText: string,
): StructuredEditorParseResult<K> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(editorText);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return {
        status: 'malformed-json',
        kind,
        editorText,
        issues: [{ path: [], message: 'Malformed JSON', code: 'invalid_json' }],
      };
    }
    throw error;
  }

  if (!isJsonObject(parsed)) {
    return {
      status: 'invalid-root',
      kind,
      editorText,
      issues: [{ path: [], message: 'Expected a JSON object', code: 'invalid_type' }],
    };
  }

  if (isPayloadForKind(kind, parsed)) {
    return { status: 'valid', kind, payload: parsed };
  }

  if (isEditablePayloadForKind(kind, parsed)) {
    return {
      status: 'editable-invalid',
      kind,
      editorText,
      payload: parsed,
      issues: issuesFor(CMS_PAYLOAD_REGISTRY[kind].schema, parsed),
    };
  }

  return {
    status: 'invalid-payload',
    kind,
    editorText,
    issues: issuesFor(CMS_PAYLOAD_REGISTRY[kind].editableSchema, parsed),
  };
}

export function emitStructuredEditorText<K extends CmsDocumentKind>(
  kind: K,
  payload: EditableCmsPayloadByKind[NoInfer<K>],
): string {
  switch (kind) {
    case 'site_copy':
    case 'centers':
    case 'people':
    case 'news':
    case 'activities':
    case 'kpis':
    case 'honors':
    case 'digital_materials':
    case 'facdev':
    case 'ebm':
    case 'holistic':
    case 'holistic_research':
      return JSON.stringify(payload, null, 2);
    default:
      return assertNever(kind, 'structured editor kind');
  }
}
