import { z } from 'zod';
import {
  addLocaleLengthParityIssue,
  bilingual,
  TextListSchema,
  TextSchema,
} from './common';

const KpiFields = {
  num: z.number(), suffix: TextSchema, label: TextSchema, en: TextSchema,
} as const;
const KpiSchema = z.strictObject(KpiFields).readonly();
const EditableKpiSchema = z.strictObject({
  ...KpiFields,
  num: z.union([z.number(), TextSchema]),
}).readonly();

const MissionSchema = z.strictObject({ tag: TextSchema, title: TextSchema, desc: TextSchema }).readonly();
const CourseRowsParitySchema = z.object({ rows: z.array(z.unknown()).readonly() }).readonly();
const StageItemsParitySchema = z.object({ items: z.array(z.unknown()).readonly() }).readonly();

function ebmPayload<
  K extends typeof EditableKpiSchema | typeof KpiSchema,
>(schemas: {
  readonly kpi: K;
}) {
  const AwardSchema = z.strictObject({
    sess: TextSchema, award: TextSchema, note: TextSchema.optional(),
  }).readonly();
  const StageSchema = z.strictObject({
    phase: TextSchema, name: TextSchema, years: TextSchema, items: TextListSchema,
  }).readonly();
  const CourseGroupSchema = z.strictObject({
    title: TextSchema,
    rows: z.array(z.strictObject({ name: TextSchema, detail: TextSchema }).readonly()).readonly(),
  }).readonly();
  const LocaleSchema = z.strictObject({
  eyebrow: TextSchema, heroTitle: TextSchema, heroTag: TextSchema, aboutEyebrow: TextSchema,
  aboutTitle: TextSchema, aboutBody: TextSchema, aboutBody2: TextSchema, membersTitle: TextSchema,
  missionsEyebrow: TextSchema, missionsTitle: TextSchema, missionsDesc: TextSchema,
  awardsEyebrow: TextSchema, awardsTitle: TextSchema, awardsDesc: TextSchema,
  awardsLitTitle: TextSchema, awardsClinTitle: TextSchema, awardsTransTitle: TextSchema,
  colSession: TextSchema, colAward: TextSchema, journeyEyebrow: TextSchema, journeyTitle: TextSchema,
  journeyDesc: TextSchema, coursesEyebrow: TextSchema, coursesTitle: TextSchema,
  coursesDesc: TextSchema, closingTitle: TextSchema, closingBody: TextSchema,
  contactPerson: TextSchema, contactExt: TextSchema, contactPlace: TextSchema, contactQuote: TextSchema,
  kpis: z.array(schemas.kpi).readonly(), missions: z.array(MissionSchema).readonly(),
  awardsLit: z.array(AwardSchema).readonly(), awardsClin: z.array(AwardSchema).readonly(),
  awardsTrans: z.array(AwardSchema).readonly(), stages: z.array(StageSchema).readonly(),
  courseGroups: z.array(CourseGroupSchema).readonly(),
  }).readonly();
  return bilingual(LocaleSchema).check((context) => {
    const fields = ['kpis', 'missions', 'awardsLit', 'awardsClin', 'awardsTrans', 'stages', 'courseGroups'] as const;
    fields.forEach((field) => addLocaleLengthParityIssue(
      context.value.zh[field], context.value.en[field], ['en', field], context,
    ));
    context.value.zh.stages.forEach((stage, index) => {
      const paired = context.value.en.stages[index];
      if (paired !== undefined) addLocaleLengthParityIssue(
        StageItemsParitySchema.parse(stage).items,
        StageItemsParitySchema.parse(paired).items,
        ['en', 'stages', index, 'items'],
        context,
      );
    });
    context.value.zh.courseGroups.forEach((group, index) => {
      const paired = context.value.en.courseGroups[index];
      if (paired !== undefined) addLocaleLengthParityIssue(
        CourseRowsParitySchema.parse(group).rows,
        CourseRowsParitySchema.parse(paired).rows,
        ['en', 'courseGroups', index, 'rows'],
        context,
      );
    });
  });
}

export const EditableEbmPayloadSchema = ebmPayload({ kpi: EditableKpiSchema });
export const EbmPayloadSchema = ebmPayload({ kpi: KpiSchema });
