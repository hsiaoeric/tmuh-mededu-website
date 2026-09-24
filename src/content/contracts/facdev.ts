import { z } from 'zod';
import {
  addDuplicateIssues,
  addLocaleLengthParityIssue,
  addPersonParityIssue,
  bilingual,
  PersonSchema,
  PublishedPersonSchema,
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

function facdevPayload<
  K extends typeof EditableKpiSchema | typeof KpiSchema,
  P extends typeof PersonSchema | typeof PublishedPersonSchema,
>(schemas: {
  readonly kpi: K;
  readonly person: P;
}) {
  const ServiceSchema = z.strictObject({ desc: TextSchema, title: TextSchema }).readonly();
  const GroupSchema = z.strictObject({
    desc: TextSchema, lead: schemas.person, name: TextSchema,
  }).readonly();
  const LocaleSchema = z.strictObject({
    aboutBody: TextSchema, aboutBody2: TextSchema, aboutEyebrow: TextSchema, aboutTitle: TextSchema,
    actEyebrow: TextSchema, actTitle: TextSchema, closingBody: TextSchema, closingTitle: TextSchema,
    contactExt: TextSchema, contactPerson: TextSchema, contactPlace: TextSchema,
    contactQuote: TextSchema, eyebrow: TextSchema, groupLeadLabel: TextSchema, groupRoot: TextSchema,
    groups: z.array(GroupSchema).readonly(), groupsDesc: TextSchema, groupsEyebrow: TextSchema,
    groupsTitle: TextSchema, heroTag: TextSchema, heroTitle: TextSchema,
    kpis: z.array(schemas.kpi).readonly(), membersTitle: TextSchema, newsEyebrow: TextSchema,
    newsTitle: TextSchema, reservedNote: TextSchema, reservedTag: TextSchema,
    services: z.array(ServiceSchema).readonly(), servicesDesc: TextSchema,
    servicesEyebrow: TextSchema, servicesTitle: TextSchema,
  }).readonly();
  return bilingual(LocaleSchema).check((context) => {
    addLocaleLengthParityIssue(context.value.zh.kpis, context.value.en.kpis, ['en', 'kpis'], context);
    addLocaleLengthParityIssue(context.value.zh.services, context.value.en.services, ['en', 'services'], context);
    addLocaleLengthParityIssue(context.value.zh.groups, context.value.en.groups, ['en', 'groups'], context);
  });
}

export const EditableFacdevPayloadSchema = facdevPayload({
  kpi: EditableKpiSchema,
  person: PersonSchema,
});
const FacdevPayloadBaseSchema = facdevPayload({ kpi: KpiSchema, person: PersonSchema });
export const FacdevPayloadSchema = FacdevPayloadBaseSchema.check((context) => {
  context.value.zh.groups.forEach((group, index) => {
    const other = context.value.en.groups[index];
    if (other !== undefined) addPersonParityIssue(group.lead, other.lead, ['en', 'groups', index, 'lead'], context);
  });
});
const PublishedFacdevPayloadBaseSchema = facdevPayload({
  kpi: KpiSchema,
  person: PublishedPersonSchema,
});
export const PublishedFacdevPayloadSchema = PublishedFacdevPayloadBaseSchema.check((context) => {
  context.value.zh.groups.forEach((group, index) => {
    const other = context.value.en.groups[index];
    if (other !== undefined) addPersonParityIssue(group.lead, other.lead, ['en', 'groups', index, 'lead'], context);
  });
  for (const locale of ['zh', 'en'] as const) {
    addDuplicateIssues({
      values: context.value[locale].groups.map((group) => group.lead.id),
      path: [locale, 'groups'],
      field: 'lead',
    }, context);
  }
});
