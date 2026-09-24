import { z } from 'zod';
import { addLocaleLengthParityIssue, bilingual, TextListSchema, TextSchema } from './common';

const MemberSchema = z.strictObject({
  person: TextSchema,
  role: TextSchema,
  unit: TextSchema,
}).readonly();
const ProjectSchema = z.strictObject({
  badgeLabel: TextSchema,
  certYear: TextSchema,
  members: z.array(MemberSchema).readonly(),
  renewal: TextSchema,
  title: TextSchema,
}).readonly();
const NhqaSchema = z.strictObject({
  awardNote: TextSchema,
  domain: TextSchema,
  event: TextSchema,
  group: TextSchema,
  keywords: TextListSchema,
  leads: TextListSchema,
  project: TextSchema,
  year: TextSchema,
}).readonly();
const LocaleSchema = z.strictObject({
  colPerson: TextSchema, colRole: TextSchema, colUnit: TextSchema, dataSource: TextSchema,
  desc: TextSchema, eyebrow: TextSchema, nhqa: NhqaSchema, nhqaEbmLink: TextSchema,
  nhqaTitle: TextSchema, renewalLabel: TextSchema, snqProjects: z.array(ProjectSchema).readonly(),
  snqTitle: TextSchema,
  snqYearCounts: z.array(z.strictObject({ count: z.number(), year: TextSchema }).readonly()).readonly(),
  title: TextSchema,
}).readonly();

const HonorsStructureSchema = bilingual(LocaleSchema);

function checkHonorsParity(context: z.core.ParsePayload<z.output<typeof HonorsStructureSchema>>): void {
  addLocaleLengthParityIssue(context.value.zh.snqProjects, context.value.en.snqProjects, ['en', 'snqProjects'], context);
  context.value.zh.snqProjects.forEach((project, index) => {
    const translated = context.value.en.snqProjects[index];
    if (translated === undefined) return;
    addLocaleLengthParityIssue(project.members, translated.members, ['en', 'snqProjects', index, 'members'], context);
  });
  addLocaleLengthParityIssue(context.value.zh.snqYearCounts, context.value.en.snqYearCounts, ['en', 'snqYearCounts'], context);
  addLocaleLengthParityIssue(context.value.zh.nhqa.leads, context.value.en.nhqa.leads, ['en', 'nhqa', 'leads'], context);
  addLocaleLengthParityIssue(context.value.zh.nhqa.keywords, context.value.en.nhqa.keywords, ['en', 'nhqa', 'keywords'], context);
}

export const EditableHonorsPayloadSchema = HonorsStructureSchema.check(checkHonorsParity);
export const HonorsPayloadSchema = EditableHonorsPayloadSchema;
