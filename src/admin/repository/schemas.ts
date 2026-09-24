import { z } from 'zod';
import {
  CMS_DOCUMENT_KINDS,
  CMS_DOCUMENT_STABLE_KEYS,
  CmsDocumentKindSchema,
} from '@/content/contracts/kinds';
import {
  CalendarDateTimeSchema,
  CmsDocumentIdSchema,
  CmsRevisionIdSchema,
} from '@/content/contracts/primitives';

const NullableUuidSchema = z.uuid().nullable();

export const AdminDocumentRowSchema = z.strictObject({
  id: CmsDocumentIdSchema,
  kind: CmsDocumentKindSchema,
  stable_key: z.string(),
  created_at: CalendarDateTimeSchema,
  created_by: NullableUuidSchema,
  updated_at: CalendarDateTimeSchema,
  updated_by: NullableUuidSchema,
}).check((context) => {
  if (context.value.stable_key !== CMS_DOCUMENT_STABLE_KEYS[context.value.kind]) {
    context.issues.push({
      code: 'custom',
      message: 'CMS document does not have its canonical stable key',
      path: ['stable_key'],
      input: context.value,
    });
  }
}).transform((row) => ({
  id: row.id,
  kind: row.kind,
  stableKey: row.stable_key,
  createdAt: row.created_at,
  createdBy: row.created_by,
  updatedAt: row.updated_at,
  updatedBy: row.updated_by,
}));

export const AdminRevisionRowSchema = z.strictObject({
  id: CmsRevisionIdSchema,
  document_id: CmsDocumentIdSchema,
  version: z.number().int().positive(),
  edit_version: z.number().int().positive(),
  status: z.enum(['draft', 'published', 'archived']),
  payload: z.record(z.string(), z.json()),
  created_at: CalendarDateTimeSchema,
  created_by: NullableUuidSchema,
  updated_at: CalendarDateTimeSchema,
  updated_by: NullableUuidSchema,
  published_at: CalendarDateTimeSchema.nullable(),
  published_by: NullableUuidSchema,
  archived_at: CalendarDateTimeSchema.nullable(),
  archived_by: NullableUuidSchema,
  publication_expected_edit_version: z.number().int().positive().nullable(),
  publication_replacements: z.record(z.string(), z.json()).nullable(),
  publication_actor_id: NullableUuidSchema,
}).transform((row) => ({
  id: row.id,
  documentId: row.document_id,
  version: row.version,
  editVersion: row.edit_version,
  status: row.status,
  payload: row.payload,
  createdAt: row.created_at,
  createdBy: row.created_by,
  updatedAt: row.updated_at,
  updatedBy: row.updated_by,
  publishedAt: row.published_at,
  publishedBy: row.published_by,
  archivedAt: row.archived_at,
  archivedBy: row.archived_by,
  publicationExpectedEditVersion: row.publication_expected_edit_version,
  publicationReplacements: row.publication_replacements,
  publicationActorId: row.publication_actor_id,
}));

export const AdminDocumentRowsSchema = z.array(AdminDocumentRowSchema).transform(
  (documents) => [...documents].sort(
    (left, right) => CMS_DOCUMENT_KINDS.indexOf(left.kind) - CMS_DOCUMENT_KINDS.indexOf(right.kind),
  ),
);

export const AdminDocumentDetailSchema = z.strictObject({
  document: AdminDocumentRowSchema,
  revisions: z.array(AdminRevisionRowSchema),
}).check((context) => {
  context.value.revisions.forEach((revision, index) => {
    if (revision.documentId !== context.value.document.id) {
      context.issues.push({
        code: 'custom',
        message: 'CMS revision does not belong to the requested document',
        path: ['revisions', index, 'document_id'],
        input: revision,
      });
    }
  });
});
