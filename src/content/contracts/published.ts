import { z } from 'zod';
import type { PublishedContent } from '../domain';
import { CMS_PAYLOAD_REGISTRY } from './registry';
import { CalendarDateTimeSchema, CmsDocumentIdSchema, CmsRevisionIdSchema } from './primitives';

const RowMetadataShape = {
  document_id: CmsDocumentIdSchema,
  revision_id: CmsRevisionIdSchema,
  version: z.number().int().positive(),
  published_at: CalendarDateTimeSchema,
} as const;

export const PublishedContentRowSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...RowMetadataShape, kind: z.literal('site_copy'), stable_key: z.literal('global'), payload: CMS_PAYLOAD_REGISTRY.site_copy.publishedSchema }),
  z.strictObject({ ...RowMetadataShape, kind: z.literal('centers'), stable_key: z.literal('directory'), payload: CMS_PAYLOAD_REGISTRY.centers.publishedSchema }),
  z.strictObject({ ...RowMetadataShape, kind: z.literal('people'), stable_key: z.literal('directory'), payload: CMS_PAYLOAD_REGISTRY.people.publishedSchema }),
  z.strictObject({ ...RowMetadataShape, kind: z.literal('news'), stable_key: z.literal('announcements'), payload: CMS_PAYLOAD_REGISTRY.news.publishedSchema }),
  z.strictObject({ ...RowMetadataShape, kind: z.literal('activities'), stable_key: z.literal('calendar'), payload: CMS_PAYLOAD_REGISTRY.activities.publishedSchema }),
  z.strictObject({ ...RowMetadataShape, kind: z.literal('kpis'), stable_key: z.literal('department'), payload: CMS_PAYLOAD_REGISTRY.kpis.publishedSchema }),
  z.strictObject({ ...RowMetadataShape, kind: z.literal('honors'), stable_key: z.literal('department'), payload: CMS_PAYLOAD_REGISTRY.honors.publishedSchema }),
  z.strictObject({ ...RowMetadataShape, kind: z.literal('digital_materials'), stable_key: z.literal('page'), payload: CMS_PAYLOAD_REGISTRY.digital_materials.publishedSchema }),
  z.strictObject({ ...RowMetadataShape, kind: z.literal('facdev'), stable_key: z.literal('page'), payload: CMS_PAYLOAD_REGISTRY.facdev.publishedSchema }),
  z.strictObject({ ...RowMetadataShape, kind: z.literal('ebm'), stable_key: z.literal('page'), payload: CMS_PAYLOAD_REGISTRY.ebm.publishedSchema }),
  z.strictObject({ ...RowMetadataShape, kind: z.literal('holistic'), stable_key: z.literal('page'), payload: CMS_PAYLOAD_REGISTRY.holistic.publishedSchema }),
  z.strictObject({ ...RowMetadataShape, kind: z.literal('holistic_research'), stable_key: z.literal('registry'), payload: CMS_PAYLOAD_REGISTRY.holistic_research.publishedSchema }),
]);

type PublishedContentRow = z.output<typeof PublishedContentRowSchema>;

function metadata(row: PublishedContentRow) {
  return {
    documentId: row.document_id,
    revisionId: row.revision_id,
    version: row.version,
    publishedAt: row.published_at,
  };
}

function assertNever(value: never): never {
  throw new TypeError(`Unexpected CMS document kind: ${String(value)}`);
}

function toPublishedContent(row: PublishedContentRow): PublishedContent {
  switch (row.kind) {
    case 'site_copy': return { ...metadata(row), kind: row.kind, stableKey: row.stable_key, payload: row.payload };
    case 'centers': return { ...metadata(row), kind: row.kind, stableKey: row.stable_key, payload: row.payload };
    case 'people': return { ...metadata(row), kind: row.kind, stableKey: row.stable_key, payload: row.payload };
    case 'news': return { ...metadata(row), kind: row.kind, stableKey: row.stable_key, payload: row.payload };
    case 'activities': return { ...metadata(row), kind: row.kind, stableKey: row.stable_key, payload: row.payload };
    case 'kpis': return { ...metadata(row), kind: row.kind, stableKey: row.stable_key, payload: row.payload };
    case 'honors': return { ...metadata(row), kind: row.kind, stableKey: row.stable_key, payload: row.payload };
    case 'digital_materials': return { ...metadata(row), kind: row.kind, stableKey: row.stable_key, payload: row.payload };
    case 'facdev': return { ...metadata(row), kind: row.kind, stableKey: row.stable_key, payload: row.payload };
    case 'ebm': return { ...metadata(row), kind: row.kind, stableKey: row.stable_key, payload: row.payload };
    case 'holistic': return { ...metadata(row), kind: row.kind, stableKey: row.stable_key, payload: row.payload };
    case 'holistic_research': return { ...metadata(row), kind: row.kind, stableKey: row.stable_key, payload: row.payload };
    default: return assertNever(row);
  }
}

export function safeParsePublishedContentRow(input: unknown) {
  return PublishedContentRowSchema.safeParse(input);
}

export function publishedContentFromRow(row: PublishedContentRow): PublishedContent {
  return toPublishedContent(row);
}

export const PublishedContentRowsSchema = z.array(PublishedContentRowSchema).check((context) => {
  const documentIds = new Set<string>();
  const revisionIds = new Set<string>();
  const stableIdentities = new Set<string>();
  context.value.forEach((row, index) => {
    const identity = `${row.kind}:${row.stable_key}`;
    for (const duplicate of [
      { seen: documentIds, value: row.document_id, path: 'document_id' },
      { seen: revisionIds, value: row.revision_id, path: 'revision_id' },
      { seen: stableIdentities, value: identity, path: 'stable_key' },
    ]) {
      if (duplicate.seen.has(duplicate.value)) {
        context.issues.push({
          code: 'custom', message: `Duplicate published identity: ${duplicate.value}`,
          path: [index, duplicate.path], input: row,
        });
      }
      duplicate.seen.add(duplicate.value);
    }
  });
}).transform((rows) => rows.map(toPublishedContent));

export function safeParsePublishedContentRows(input: unknown) {
  return PublishedContentRowsSchema.safeParse(input);
}
