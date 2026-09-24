import { z } from 'zod';
import { addDuplicateIssues, addLocaleParityIssue, bilingual, TextListSchema, TextSchema } from './common';
import { CalendarDateSchema, NonEmptyStringSchema } from './primitives';

const AuthoredNumberSchema = z.union([z.number(), TextSchema]);
const CountSchema = z.number().int().nonnegative();
const PublishedYearSchema = z.number().int().min(1900).max(2100);

const PublishedPaperSchema = z.strictObject({
    id: NonEmptyStringSchema,
    authors: TextListSchema,
    byline: TextSchema,
    journal: TextSchema,
    month: z.number().int().min(1).max(12),
    title: TextSchema,
    year: PublishedYearSchema,
  }).readonly().check((context) => {
  const date = `${context.value.year}-${String(context.value.month).padStart(2, '0')}-01`;
  if (!CalendarDateSchema.safeParse(date).success) context.issues.push({ code: 'custom', message: 'Invalid research publication month', input: context.value });
});
const EditablePaperSchema = z.strictObject({
  id: TextSchema,
  authors: TextListSchema,
  byline: TextSchema,
  journal: TextSchema,
  month: AuthoredNumberSchema,
  title: TextSchema,
  year: AuthoredNumberSchema,
}).readonly();

function researchPayload(schemas: {
  readonly integer: typeof AuthoredNumberSchema | typeof PublishedYearSchema;
  readonly count: typeof AuthoredNumberSchema | typeof CountSchema;
  readonly paper: typeof EditablePaperSchema | typeof PublishedPaperSchema;
  readonly id: typeof TextSchema;
  readonly enforcePaperTotal: boolean;
}) {
  const LocaleSchema = z.strictObject({
    authorsLabel: TextSchema,
    byYear: z.array(z.strictObject({ id: schemas.id, clinical: schemas.count, edu: schemas.count, year: schemas.integer }).readonly()).readonly(),
    byYearTitle: TextSchema,
    clinicalDesc: TextSchema,
    clinicalLegend: TextSchema,
    clinicalStats: z.array(z.strictObject({ id: schemas.id, label: TextSchema, num: schemas.count }).readonly()).readonly(),
    clinicalTitle: TextSchema,
    desc: TextSchema,
    eduDesc: TextSchema,
    eduLegend: TextSchema,
    eduTitle: TextSchema,
    eyebrow: TextSchema,
    papers: z.array(schemas.paper).readonly(),
    title: TextSchema,
    totalLabel: TextSchema,
  }).readonly();
  return bilingual(LocaleSchema).check((context) => {
    for (const field of ['byYear', 'clinicalStats', 'papers'] as const) {
      const zh = context.value.zh[field];
      const en = context.value.en[field];
      addLocaleParityIssue(zh.map((row) => row.id), en.map((row) => row.id), ['en', field], context);
      for (const locale of ['zh', 'en'] as const) {
        addDuplicateIssues({ values: context.value[locale][field].map((row) => row.id), path: [locale, field], field: 'id' }, context);
      }
    }
    if (schemas.enforcePaperTotal) {
      for (const locale of ['zh', 'en'] as const) {
        addDuplicateIssues({ values: context.value[locale].byYear.map((row) => String(row.year)), path: [locale, 'byYear'], field: 'year' }, context);
      }
    }
    const enYears = new Map(context.value.en.byYear.map((row) => [row.id, row]));
    context.value.zh.byYear.forEach((row, index) => {
      const paired = enYears.get(row.id);
      if (paired === undefined || row.year !== paired.year || row.edu !== paired.edu || row.clinical !== paired.clinical) {
        context.issues.push({ code: 'custom', message: 'Localized yearly research semantics must match', path: ['en', 'byYear', index], input: context.value });
      }
    });
    const enStats = new Map(context.value.en.clinicalStats.map((row) => [row.id, row]));
    context.value.zh.clinicalStats.forEach((row, index) => {
      if (row.num !== enStats.get(row.id)?.num) context.issues.push({ code: 'custom', message: 'Localized clinical statistics must match', path: ['en', 'clinicalStats', index], input: context.value });
    });
    const enPapers = new Map(context.value.en.papers.map((row) => [row.id, row]));
    context.value.zh.papers.forEach((row, index) => {
      const paired = enPapers.get(row.id);
      const shared = paired !== undefined && row.year === paired.year && row.month === paired.month
        && row.journal === paired.journal && row.title === paired.title && row.byline === paired.byline
        && row.authors.length === paired.authors.length;
      if (!shared) context.issues.push({ code: 'custom', message: 'Localized research paper semantics must match', path: ['en', 'papers', index], input: context.value });
    });
    if (schemas.enforcePaperTotal && context.value.zh.byYear.every((row) => typeof row.edu === 'number')) {
      const paperCounts = new Map<number, number>();
      for (const paper of context.value.zh.papers) {
        const year = Number(paper.year);
        paperCounts.set(year, (paperCounts.get(year) ?? 0) + 1);
      }
      const authoredYears = new Set(context.value.zh.byYear.map((row) => Number(row.year)));
      context.value.zh.byYear.forEach((row, index) => {
        if (row.edu !== (paperCounts.get(Number(row.year)) ?? 0)) context.issues.push({
          code: 'custom', message: 'Yearly education count must match paper records for that year', path: ['zh', 'byYear', index, 'edu'], input: context.value,
        });
      });
      const unrepresentedYear = context.value.zh.papers.find((paper) => !authoredYears.has(Number(paper.year)));
      if (unrepresentedYear !== undefined) context.issues.push({
        code: 'custom', message: 'Every paper year must have a yearly research record', path: ['zh', 'papers'], input: context.value,
      });
    }
  });
}

export const EditableHolisticResearchPayloadSchema = researchPayload({ integer: AuthoredNumberSchema, count: AuthoredNumberSchema, paper: EditablePaperSchema, id: TextSchema, enforcePaperTotal: false });
export const HolisticResearchPayloadSchema = researchPayload({ integer: PublishedYearSchema, count: CountSchema, paper: PublishedPaperSchema, id: NonEmptyStringSchema, enforcePaperTotal: true });
