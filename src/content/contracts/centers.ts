import { z } from 'zod';
import { CENTER_BRANCH_IDS, CENTER_IDS } from '@/data/centerIdentities';
import { addDuplicateIssues, addLocaleParityIssue, bilingual, TextSchema } from './common';
import { HttpsUrlSchema } from './primitives';

const BranchFields = {
  id: TextSchema,
  name: TextSchema,
  description: TextSchema,
} as const;
const BranchSchema = z.strictObject(BranchFields).readonly();

const CenterFields = {
  id: TextSchema,
  name: TextSchema,
  intro: TextSchema,
  contact: TextSchema,
  ext: TextSchema,
  externalUrl: HttpsUrlSchema.optional(),
  deep: z.boolean().optional(),
  branches: z.array(BranchSchema).readonly(),
} as const;
const CenterSchema = z.strictObject(CenterFields).readonly();

const EditableCenterSchema = z.strictObject({
  ...CenterFields,
  externalUrl: TextSchema.optional(),
}).readonly();

const CentersLocaleSchema = z.strictObject({ centers: z.array(CenterSchema).readonly() }).readonly();
const EditableCentersLocaleSchema = z.strictObject({
  centers: z.array(EditableCenterSchema).readonly(),
}).readonly();
const CentersStructureSchema = bilingual(EditableCentersLocaleSchema);

function checkCenterParity(context: z.core.ParsePayload<z.output<typeof CentersStructureSchema>>): void {
  addLocaleParityIssue(
    context.value.zh.centers.map((center) => center.id),
    context.value.en.centers.map((center) => center.id),
    ['en', 'centers'],
    context,
  );
  context.value.zh.centers.forEach((center, centerIndex) => {
    const translated = context.value.en.centers[centerIndex];
    if (translated?.id !== center.id) return;
    addLocaleParityIssue(
      center.branches.map((branch) => branch.id),
      translated.branches.map((branch) => branch.id),
      ['en', 'centers', centerIndex, 'branches'],
      context,
    );
  });
}

export const EditableCentersPayloadSchema = CentersStructureSchema.check(checkCenterParity);

type ExactIdentities = {
  readonly values: readonly string[];
  readonly expected: readonly string[];
  readonly path: readonly PropertyKey[];
  readonly message: string;
};

function addExactIdentityIssue(
  identities: ExactIdentities,
  context: { readonly value: unknown; readonly issues: z.core.$ZodRawIssue[] },
): void {
  const exact = identities.values.length === identities.expected.length
    && identities.values.every((value) => identities.expected.some((expected) => expected === value));
  if (exact) return;
  context.issues.push({
    code: 'custom',
    message: identities.message,
    path: [...identities.path],
    input: context.value,
  });
}

export const CentersPayloadSchema = bilingual(CentersLocaleSchema).check((context) => {
  for (const locale of ['zh', 'en'] as const) {
    const centers = context.value[locale].centers;
    addDuplicateIssues(
      { values: centers.map((center) => center.id), path: [locale, 'centers'], field: 'id' },
      context,
    );
    centers.forEach((center, centerIndex) => {
      addDuplicateIssues({
        values: center.branches.map((branch) => branch.id),
        path: [locale, 'centers', centerIndex, 'branches'],
        field: 'id',
      }, context);
    });
  }
  checkCenterParity(context);
});

export const PublishedCentersPayloadSchema = bilingual(CentersLocaleSchema).check((context) => {
  for (const locale of ['zh', 'en'] as const) {
    const centers = context.value[locale].centers;
    addDuplicateIssues(
      { values: centers.map((center) => center.id), path: [locale, 'centers'], field: 'id' },
      context,
    );
    addExactIdentityIssue({
      values: centers.map((center) => center.id),
      expected: CENTER_IDS,
      path: [locale, 'centers'],
      message: 'Published centers must contain every canonical center identifier exactly once',
    }, context);
    centers.forEach((center, centerIndex) => {
      addDuplicateIssues({
        values: center.branches.map((branch) => branch.id),
        path: [locale, 'centers', centerIndex, 'branches'],
        field: 'id',
      }, context);
      const centerId = CENTER_IDS.find((candidate) => candidate === center.id);
      if (centerId === undefined) return;
      addExactIdentityIssue({
        values: center.branches.map((branch) => branch.id),
        expected: CENTER_BRANCH_IDS[centerId],
        path: [locale, 'centers', centerIndex, 'branches'],
        message: `Published center ${centerId} must contain its canonical branch identifiers exactly once`,
      }, context);
    });
  }
});
