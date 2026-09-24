import { z } from 'zod';
import { ROLE_KEYS } from '@/data/people';
import { HexColorSchema, MediaReferenceSchema, PublishedMediaReferenceSchema } from './primitives';

export const TextSchema = z.string();
export const TextListSchema = z.array(TextSchema).readonly();

export function bilingual<S extends z.ZodType>(schema: S) {
  return z.strictObject({ zh: schema, en: schema }).readonly();
}

export const KpiSchema = z.strictObject({
  num: z.number(),
  suffix: TextSchema,
  label: TextSchema,
  en: TextSchema,
  color: HexColorSchema,
  delay: z.number(),
}).readonly();

export const EditableKpiSchema = z.strictObject({
  num: z.union([z.number(), TextSchema]),
  suffix: TextSchema,
  label: TextSchema,
  en: TextSchema,
  color: TextSchema,
  delay: z.union([z.number(), TextSchema]),
}).readonly();

const PersonFields = {
  id: z.string().min(1),
  name: TextSchema,
  alternateName: TextSchema,
  roleKey: TextSchema,
  role: TextSchema,
  department: TextSchema,
  slug: TextSchema,
  hubId: TextSchema,
  duty: TextSchema,
  ext: TextSchema,
  email: TextSchema,
} as const;

export const PersonSchema = z.strictObject({
  ...PersonFields,
  portrait: MediaReferenceSchema.nullable().optional(),
}).readonly();

export const PublishedPersonSchema = z.strictObject({
  ...PersonFields,
  roleKey: z.enum(ROLE_KEYS),
  portrait: PublishedMediaReferenceSchema.nullable().optional(),
}).readonly();

type PersonParityValue = z.infer<typeof PersonSchema>;

export function addPersonParityIssue(
  zh: PersonParityValue,
  en: PersonParityValue,
  path: readonly (string | number)[],
  context: { readonly value: unknown; readonly issues: z.core.$ZodRawIssue[] },
): void {
  const sharedKeys = ['id', 'roleKey', 'slug', 'hubId', 'ext', 'email'] as const;
  const differs = sharedKeys.some((key) => zh[key] !== en[key])
    || en.alternateName !== zh.name
    || zh.alternateName !== en.name;
  if (differs) context.issues.push({
    code: 'custom',
    message: 'Localized person identity and shared metadata must match',
    path: [...path],
    input: context.value,
  });
}

export function addPersonIdDuplicateIssues(
  people: readonly PersonParityValue[],
  path: readonly (string | number)[],
  context: { readonly value: unknown; readonly issues: z.core.$ZodRawIssue[] },
): void {
  addDuplicateIssues({ values: people.map((person) => person.id), path, field: 'id' }, context);
}

export function addDuplicateIssues(
  check: {
    readonly values: readonly string[];
    readonly path: readonly (string | number)[];
    readonly field: string;
  },
  context: { readonly value: unknown; readonly issues: z.core.$ZodRawIssue[] },
): void {
  const seen = new Set<string>();
  check.values.forEach((value, index) => {
    if (seen.has(value)) {
      context.issues.push({
        code: 'custom',
        message: `Duplicate identifier: ${value}`,
        path: [...check.path, index, check.field],
        input: context.value,
      });
    }
    seen.add(value);
  });
}

export function addLocaleParityIssue(
  zh: readonly string[],
  en: readonly string[],
  path: readonly (string | number)[],
  context: { readonly value: unknown; readonly issues: z.core.$ZodRawIssue[] },
): void {
  if (zh.length !== en.length || zh.some((value, index) => value !== en[index])) {
    context.issues.push({
      code: 'custom',
      message: 'Localized identifiers must match and remain in the same order',
      path: [...path],
      input: context.value,
    });
  }
}

export function addLocaleLengthParityIssue(
  zh: readonly unknown[],
  en: readonly unknown[],
  path: readonly (string | number)[],
  context: { readonly value: unknown; readonly issues: z.core.$ZodRawIssue[] },
): void {
  if (zh.length !== en.length) {
    context.issues.push({
      code: 'custom',
      message: 'Localized collections must contain the same number of items',
      path: [...path],
      input: context.value,
    });
  }
}
