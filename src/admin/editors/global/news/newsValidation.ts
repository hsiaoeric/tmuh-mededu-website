import { EditableNewsPayloadSchema, NewsPayloadSchema } from '@/content/contracts/news';
import {
  mapStructuredEditorIssues as mapGlobalEditorIssues,
  type StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';
import type { NewsPayload } from './newsTypes';

export function parseNewsEditorText(editorText: string): NewsPayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(editorText);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
  const result = EditableNewsPayloadSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

export function collectNewsIssues(payload: NewsPayload): readonly GlobalEditorIssueSummary[] {
  const result = NewsPayloadSchema.safeParse(payload);
  return result.success ? [] : mapGlobalEditorIssues(result.error.issues);
}
