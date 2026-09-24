import { z } from 'zod';
import { addDuplicateIssues, addLocaleParityIssue, TextSchema } from './common';
import { CalendarDateSchema, ChineseActivityDateSchema, EnglishActivityDateSchema, HttpsUrlSchema, NonEmptyStringSchema } from './primitives';

function activitySchema(dateSchema: typeof ChineseActivityDateSchema | typeof EnglishActivityDateSchema) {
  return z.strictObject({
    id: NonEmptyStringSchema,
    sortDate: CalendarDateSchema,
    cat: TextSchema,
    date: dateSchema,
    enrolled: TextSchema,
    link: z.union([z.literal(''), HttpsUrlSchema]),
    place: TextSchema,
    speaker: TextSchema,
    status: TextSchema,
    title: TextSchema,
    topic: TextSchema,
  }).readonly();
}

const EditableActivitySchema = z.strictObject({
  id: TextSchema,
  sortDate: TextSchema,
  cat: TextSchema,
  date: TextSchema,
  enrolled: TextSchema,
  link: TextSchema,
  place: TextSchema,
  speaker: TextSchema,
  status: TextSchema,
  title: TextSchema,
  topic: TextSchema,
}).readonly();

function activityLocale<S extends ReturnType<typeof activitySchema> | typeof EditableActivitySchema>(schema: S) {
  return z.strictObject({ department: z.array(schema).readonly(), holistic: z.array(schema).readonly() }).readonly();
}

function checkActivityParity(context: z.core.ParsePayload<{
  readonly zh: { readonly department: readonly z.infer<typeof EditableActivitySchema>[]; readonly holistic: readonly z.infer<typeof EditableActivitySchema>[] };
  readonly en: { readonly department: readonly z.infer<typeof EditableActivitySchema>[]; readonly holistic: readonly z.infer<typeof EditableActivitySchema>[] };
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
      if (paired === undefined || row.sortDate !== paired.sortDate || row.link !== paired.link) {
        context.issues.push({ code: 'custom', message: 'Localized activity semantics must match', path: ['en', scope, index], input: context.value });
      }
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

function embeddedCalendarDate(date: string): string | undefined {
  return date.match(/\d{4}\/\d{2}\/\d{2}/)?.[0]?.replace(/\//g, '-');
}

function checkActivityDates(context: z.core.ParsePayload<{
  readonly zh: { readonly department: readonly z.infer<ReturnType<typeof activitySchema>>[]; readonly holistic: readonly z.infer<ReturnType<typeof activitySchema>>[] };
  readonly en: { readonly department: readonly z.infer<ReturnType<typeof activitySchema>>[]; readonly holistic: readonly z.infer<ReturnType<typeof activitySchema>>[] };
}>): void {
  for (const locale of ['zh', 'en'] as const) {
    for (const scope of ['department', 'holistic'] as const) {
      context.value[locale][scope].forEach((row, index) => {
        if (embeddedCalendarDate(row.date) !== row.sortDate) context.issues.push({
          code: 'custom',
          message: 'Activity sort date must match its localized display date',
          path: [locale, scope, index, 'sortDate'],
          input: context.value,
        });
      });
    }
  }
}

function activityPayload<Z extends ReturnType<typeof activitySchema> | typeof EditableActivitySchema, E extends ReturnType<typeof activitySchema> | typeof EditableActivitySchema>(zhSchema: Z, enSchema: E) {
  return z.strictObject({ zh: activityLocale(zhSchema), en: activityLocale(enSchema) }).readonly().check(checkActivityParity);
}

export const EditableActivitiesPayloadSchema = activityPayload(EditableActivitySchema, EditableActivitySchema);
export const ActivitiesPayloadSchema = activityPayload(
  activitySchema(ChineseActivityDateSchema),
  activitySchema(EnglishActivityDateSchema),
).check(checkActivityDates);
