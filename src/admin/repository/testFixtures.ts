import type { Json } from '@/content/database.types';
import {
  CmsDocumentIdSchema,
  CmsRevisionIdSchema,
} from '@/content/contracts/primitives';

export const DOCUMENT_ID = CmsDocumentIdSchema.parse(
  '11111111-1111-4111-8111-111111111111',
);
export const REVISION_ID = CmsRevisionIdSchema.parse(
  '22222222-2222-4222-8222-222222222222',
);

export const DOCUMENT_ROW = {
  id: DOCUMENT_ID,
  kind: 'news',
  stable_key: 'announcements',
  created_at: '2026-08-22T01:00:00Z',
  created_by: null,
  updated_at: '2026-08-22T02:00:00Z',
  updated_by: null,
} as const;

export const REVISION_ROW = {
  id: REVISION_ID,
  document_id: DOCUMENT_ID,
  version: 3,
  edit_version: 2,
  status: 'draft',
  payload: { zh: {}, en: {} } satisfies Json,
  created_at: '2026-08-22T01:00:00Z',
  created_by: null,
  updated_at: '2026-08-22T02:00:00Z',
  updated_by: null,
  published_at: null,
  published_by: null,
  archived_at: null,
  archived_by: null,
  publication_expected_edit_version: null,
  publication_replacements: null,
  publication_actor_id: null,
} as const;

export function postgrestError(
  code: string,
  details: string | null,
  hint: string | null = null,
) {
  return { code, details, hint, message: `database error ${code}` };
}
