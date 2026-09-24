import { z } from 'zod';
import { CMS_DOCUMENT_KINDS } from './kinds';
import type { CmsSourceDocument } from './registry';
import { CMS_PAYLOAD_REGISTRY } from './registry';

function sourceSchema<K extends typeof CMS_DOCUMENT_KINDS[number], S extends z.ZodType>(
  kind: K,
  stableKey: (typeof CMS_PAYLOAD_REGISTRY)[K]['stableKey'],
  payload: S,
) {
  return z.strictObject({ kind: z.literal(kind), stableKey: z.literal(stableKey), payload });
}

const GeneralSourceDocumentSchema = z.discriminatedUnion('kind', [
  sourceSchema('site_copy', 'global', CMS_PAYLOAD_REGISTRY.site_copy.schema),
  sourceSchema('centers', 'directory', CMS_PAYLOAD_REGISTRY.centers.schema),
  sourceSchema('people', 'directory', CMS_PAYLOAD_REGISTRY.people.schema),
  sourceSchema('news', 'announcements', CMS_PAYLOAD_REGISTRY.news.schema),
  sourceSchema('activities', 'calendar', CMS_PAYLOAD_REGISTRY.activities.schema),
  sourceSchema('kpis', 'department', CMS_PAYLOAD_REGISTRY.kpis.schema),
  sourceSchema('honors', 'department', CMS_PAYLOAD_REGISTRY.honors.schema),
  sourceSchema('digital_materials', 'page', CMS_PAYLOAD_REGISTRY.digital_materials.schema),
  sourceSchema('facdev', 'page', CMS_PAYLOAD_REGISTRY.facdev.schema),
  sourceSchema('ebm', 'page', CMS_PAYLOAD_REGISTRY.ebm.schema),
  sourceSchema('holistic', 'page', CMS_PAYLOAD_REGISTRY.holistic.schema),
  sourceSchema('holistic_research', 'registry', CMS_PAYLOAD_REGISTRY.holistic_research.schema),
]);

const PublishedSourceDocumentSchema = z.discriminatedUnion('kind', [
  sourceSchema('site_copy', 'global', CMS_PAYLOAD_REGISTRY.site_copy.publishedSchema),
  sourceSchema('centers', 'directory', CMS_PAYLOAD_REGISTRY.centers.publishedSchema),
  sourceSchema('people', 'directory', CMS_PAYLOAD_REGISTRY.people.publishedSchema),
  sourceSchema('news', 'announcements', CMS_PAYLOAD_REGISTRY.news.publishedSchema),
  sourceSchema('activities', 'calendar', CMS_PAYLOAD_REGISTRY.activities.publishedSchema),
  sourceSchema('kpis', 'department', CMS_PAYLOAD_REGISTRY.kpis.publishedSchema),
  sourceSchema('honors', 'department', CMS_PAYLOAD_REGISTRY.honors.publishedSchema),
  sourceSchema('digital_materials', 'page', CMS_PAYLOAD_REGISTRY.digital_materials.publishedSchema),
  sourceSchema('facdev', 'page', CMS_PAYLOAD_REGISTRY.facdev.publishedSchema),
  sourceSchema('ebm', 'page', CMS_PAYLOAD_REGISTRY.ebm.publishedSchema),
  sourceSchema('holistic', 'page', CMS_PAYLOAD_REGISTRY.holistic.publishedSchema),
  sourceSchema('holistic_research', 'registry', CMS_PAYLOAD_REGISTRY.holistic_research.publishedSchema),
]);

const GeneralSourceDocumentsSchema = z.array(GeneralSourceDocumentSchema).check((context) => {
  const kinds = new Set<string>();
  context.value.forEach((document, index) => {
    if (kinds.has(document.kind)) {
      context.issues.push({
        code: 'custom', message: `Duplicate source kind: ${document.kind}`,
        path: [index, 'kind'], input: document,
      });
    }
    kinds.add(document.kind);
  });
  for (const kind of CMS_DOCUMENT_KINDS) {
    if (!kinds.has(kind)) {
      context.issues.push({ code: 'custom', message: `Missing source kind: ${kind}`, input: context.value });
    }
  }
});

const PublishedSourceDocumentsSchema = z.array(PublishedSourceDocumentSchema);

export class ContentFixtureError extends Error {
  readonly name = 'ContentFixtureError';
  constructor(readonly validationError: z.ZodError) {
    super('Generated CMS fixtures did not match all source contracts');
  }
}

export function parseCmsSourceDocuments(input: unknown): readonly CmsSourceDocument[] {
  const general = GeneralSourceDocumentsSchema.safeParse(input);
  if (!general.success) throw new ContentFixtureError(general.error);
  const published = PublishedSourceDocumentsSchema.safeParse(general.data);
  if (!published.success) throw new ContentFixtureError(published.error);
  return published.data;
}
