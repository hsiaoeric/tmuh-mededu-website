import { fieldIdForStructuredEditorIssuePath } from '@/admin/editors/shared';
import type { Json } from '@/content/database.types';
import { diffPayloads } from './payloadDiff';

/**
 * Field ids whose value differs from the published payload. Ids encode JSON paths segment by
 * segment, so an id prefix is a path prefix: a field inside an added item counts as changed, and
 * so does a field whose value is a list that changed deeper down.
 */
export function changedFieldIds(published: Json | null, editorText: string): readonly string[] {
  if (published === null) return [];
  let current: Json;
  try {
    current = JSON.parse(editorText) as Json;
  } catch {
    return [];
  }
  return diffPayloads(published, current).map((change) => fieldIdForStructuredEditorIssuePath(change.path));
}

export function isFieldChanged(changed: readonly string[], fieldId: string): boolean {
  return changed.some((id) => id === fieldId || fieldId.startsWith(`${id}-`) || id.startsWith(`${fieldId}-`));
}
