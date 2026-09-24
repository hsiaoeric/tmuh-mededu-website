import { z } from 'zod';
import { ICON_NAMES } from '@/data/iconNames';
import { addLocaleLengthParityIssue, bilingual, TextListSchema, TextSchema } from './common';
import { calendarDateFromParts, HexColorSchema, isOrderedClockRange } from './primitives';

const AuthoredNumberSchema = z.union([z.number(), TextSchema]);
const NumberSchema = z.number();
const IconNameSchema = z.enum(ICON_NAMES);

function symposiumDates(value: string): readonly string[] | undefined {
  const patterns = [
    /^(?<year>\d{4})\/(?<month>\d{2})\/(?<day>\d{2})（[日一二三四五六]）– (?<endMonth>\d{2})\/(?<endDay>\d{2})（[日一二三四五六]）$/,
    /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)–(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (?<year>\d{4})\/(?<month>\d{2})\/(?<day>\d{2})–(?<endDay>\d{2})$/,
    /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (?<year>\d{4})\/(?<month>\d{2})\/(?<day>\d{2})$/,
    /^(?<year>\d{4})\/(?<month>\d{2})\/(?<day>\d{2})(?:（[日一二三四五六]）)?$/,
  ] as const;
  for (const pattern of patterns) {
    const groups = pattern.exec(value)?.groups;
    if (groups?.year === undefined || groups.month === undefined || groups.day === undefined) continue;
    const start = calendarDateFromParts(groups.year, groups.month, groups.day);
    if (start === undefined) return undefined;
    if (groups.endDay === undefined) return [start];
    const end = calendarDateFromParts(groups.year, groups.endMonth ?? groups.month, groups.endDay);
    return end === undefined || end <= start ? undefined : [start, end];
  }
  return undefined;
}

function validSymposiumTimes(value: string, dateCount: number): boolean {
  const ranges = value.split(' / ');
  return ranges.length === dateCount && ranges.every((range) => {
    const match = /^(\d{2}:\d{2})–(\d{2}:\d{2})$/.exec(range);
    if (match?.[1] === undefined || match[2] === undefined) return false;
    return isOrderedClockRange(match[1], match[2]);
  });
}

const SymposiumSchema = z.strictObject({
  attendees: z.number().optional(),
  dates: TextSchema,
  edition: TextSchema,
  satisfaction: z.number().optional(),
  time: TextSchema,
  title: TextSchema,
  year: z.number().int(),
}).readonly().check((context) => {
  const dates = symposiumDates(context.value.dates);
  const year = String(context.value.year);
  const validDates = dates !== undefined && dates.every((date) => date.startsWith(`${year}-`));
  const validTimes = dates !== undefined && validSymposiumTimes(context.value.time, dates.length);
  if (!validDates || !validTimes) {
    context.issues.push({ code: 'custom', message: 'Invalid symposium date or time', input: context.value });
  }
});
const EditableSymposiumSchema = z.strictObject({
  attendees: AuthoredNumberSchema.optional(),
  dates: TextSchema,
  edition: TextSchema,
  satisfaction: AuthoredNumberSchema.optional(),
  time: TextSchema,
  title: TextSchema,
  year: AuthoredNumberSchema,
}).readonly();

function holisticPayload<
  C extends typeof TextSchema | typeof HexColorSchema,
  I extends typeof TextSchema | typeof IconNameSchema,
  N extends typeof AuthoredNumberSchema | typeof NumberSchema,
  S extends typeof EditableSymposiumSchema | typeof SymposiumSchema,
>(schemas: {
  readonly color: C;
  readonly complete: boolean;
  readonly icon: I;
  readonly number: N;
  readonly symposium: S;
}) {
  const StatSchema = z.strictObject({ label: TextSchema, num: schemas.number }).readonly();
  const AlgeeStepSchema = z.strictObject({
    description: TextSchema, letter: TextSchema, title: TextSchema,
  }).readonly();
  const AlgeeSchema = schemas.complete
    ? z.array(AlgeeStepSchema).min(1).readonly()
    : z.array(AlgeeStepSchema).readonly();
  const LocaleSchema = z.strictObject({
    kpis: z.array(z.strictObject({
      num: schemas.number, display: TextSchema, isStatic: z.boolean(), label: TextSchema,
      color: schemas.color, subtitle: TextSchema.optional(),
    }).readonly()).readonly(),
    features: z.array(z.strictObject({
      delay: schemas.number, desc: TextSchema, iconId: schemas.icon, title: TextSchema,
    }).readonly()).readonly(),
    algee: AlgeeSchema,
    aiEcosystem: z.strictObject({
      body: TextSchema,
      flow: z.array(z.strictObject({
        color: schemas.color, role: TextSchema, text: TextSchema, title: TextSchema,
      }).readonly()).readonly(),
      problems: TextListSchema, problemsTitle: TextSchema, teamLabel: TextSchema, title: TextSchema,
    }).readonly(),
    outcomes: z.strictObject({
      attendeesLabel: TextSchema, hostLabel: TextSchema, satisfactionLabel: TextSchema,
      symposiumDesc: TextSchema, symposiumEyebrow: TextSchema, symposiumTitle: TextSchema,
      symposiums: z.array(schemas.symposium).readonly(), trainingDesc: TextSchema,
      trainingEyebrow: TextSchema, trainingParticipants: StatSchema,
      trainingSatisfaction: z.strictObject({
        label: TextSchema, num: schemas.number, suffix: TextSchema,
      }).readonly(),
      trainingSessions: StatSchema, trainingTitle: TextSchema,
    }).readonly(),
  }).readonly();
  return bilingual(LocaleSchema).check((context) => {
    const fields = ['kpis', 'features', 'algee'] as const;
    fields.forEach((field) => addLocaleLengthParityIssue(
      context.value.zh[field], context.value.en[field], ['en', field], context,
    ));
    addLocaleLengthParityIssue(
      context.value.zh.aiEcosystem.flow, context.value.en.aiEcosystem.flow, ['en', 'aiEcosystem', 'flow'], context,
    );
    addLocaleLengthParityIssue(
      context.value.zh.aiEcosystem.problems, context.value.en.aiEcosystem.problems, ['en', 'aiEcosystem', 'problems'], context,
    );
    addLocaleLengthParityIssue(
      context.value.zh.outcomes.symposiums, context.value.en.outcomes.symposiums, ['en', 'outcomes', 'symposiums'], context,
    );
  });
}

export const EditableHolisticPayloadSchema = holisticPayload({
  color: TextSchema,
  complete: false,
  icon: TextSchema,
  number: AuthoredNumberSchema,
  symposium: EditableSymposiumSchema,
});
export const HolisticPayloadSchema = holisticPayload({
  color: HexColorSchema,
  complete: true,
  icon: IconNameSchema,
  number: NumberSchema,
  symposium: SymposiumSchema,
});
