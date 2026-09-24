import { z } from 'zod';
import { addDuplicateIssues, addLocaleParityIssue, TextListSchema, TextSchema } from './common';
import { CalendarDateSchema, HttpsUrlSchema, NonEmptyStringSchema } from './primitives';

export const AnnouncementCategorySchema = z.enum(['department', 'achievement', 'international']);

const AnnouncementFields = {
  id: NonEmptyStringSchema,
  publishedOn: CalendarDateSchema,
  pinned: z.boolean(),
  category: AnnouncementCategorySchema,
  tag: TextSchema,
  statTop: TextSchema.optional(),
  statTopLabel: TextSchema.optional(),
  statBot: TextSchema.optional(),
  statBotLabel: TextSchema.optional(),
  compactStat: z.boolean().optional(),
  title: TextSchema,
  lines: TextListSchema,
} as const;

const PublishedAnnouncementSchema = z.strictObject(AnnouncementFields).readonly();
const EditableAnnouncementSchema = z.strictObject({
  ...AnnouncementFields,
  id: TextSchema,
  publishedOn: TextSchema,
  category: TextSchema,
}).readonly();

function localeSchema<S extends typeof PublishedAnnouncementSchema | typeof EditableAnnouncementSchema>(row: S) {
  return z.strictObject({
    department: z.array(row).readonly(),
    holistic: z.array(row).readonly(),
  }).readonly();
}

function checkNewsParity(context: z.core.ParsePayload<{
  readonly zh: { readonly department: readonly z.infer<typeof EditableAnnouncementSchema>[]; readonly holistic: readonly z.infer<typeof EditableAnnouncementSchema>[] };
  readonly en: { readonly department: readonly z.infer<typeof EditableAnnouncementSchema>[]; readonly holistic: readonly z.infer<typeof EditableAnnouncementSchema>[] };
}>): void {
  for (const scope of ['department', 'holistic'] as const) {
    const zh = context.value.zh[scope];
    const en = context.value.en[scope];
    addLocaleParityIssue(zh.map((row) => row.id), en.map((row) => row.id), ['en', scope], context);
    for (const locale of ['zh', 'en'] as const) {
      addDuplicateIssues({ values: context.value[locale][scope].map((row) => row.id), path: [locale, scope], field: 'id' }, context);
    }
    const enById = new Map(en.map((row) => [row.id, row]));
    zh.forEach((row, index) => {
      const paired = enById.get(row.id);
      const shared = paired !== undefined
        && row.publishedOn === paired.publishedOn
        && row.pinned === paired.pinned
        && row.category === paired.category
        && row.statTop === paired.statTop
        && row.statBot === paired.statBot
        && row.compactStat === paired.compactStat;
      if (!shared) context.issues.push({
        code: 'custom', message: 'Localized announcement semantics must match', path: ['en', scope, index], input: context.value,
      });
    });
  }
  for (const locale of ['zh', 'en'] as const) {
    addDuplicateIssues({
      values: [...context.value[locale].department, ...context.value[locale].holistic].map((row) => row.id),
      path: [locale],
      field: 'id',
    }, context);
  }
}

const EditableNewsStructureSchema = z.strictObject({
  announcementBoardUrl: TextSchema,
  zh: localeSchema(EditableAnnouncementSchema),
  en: localeSchema(EditableAnnouncementSchema),
}).readonly();

export const EditableNewsPayloadSchema = EditableNewsStructureSchema.check(checkNewsParity);
export const NewsPayloadSchema = z.strictObject({
  announcementBoardUrl: HttpsUrlSchema,
  zh: localeSchema(PublishedAnnouncementSchema),
  en: localeSchema(PublishedAnnouncementSchema),
}).readonly().check(checkNewsParity);

export type PublishedAnnouncement = z.infer<typeof PublishedAnnouncementSchema>;
