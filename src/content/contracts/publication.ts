import { z } from 'zod';

export const PUBLISH_ERROR_CODES = [
  'authentication-required', 'administrator-required', 'origin-denied',
  'method-not-allowed', 'body-too-large', 'invalid-request',
  'invalid-draft-reference', 'draft-owner-mismatch', 'too-many-media',
  'draft-media-missing', 'invalid-image', 'image-too-large',
  'draft-media-mismatch', 'public-integrity-conflict', 'storage-failure',
  'stale-edit-version', 'superseded-revision', 'deadline-exceeded',
  'publication-failed',
] as const;

export const PublishErrorCodeSchema = z.enum(PUBLISH_ERROR_CODES);
export type PublishErrorCode = z.infer<typeof PublishErrorCodeSchema>;

export const PublishFailureResponseSchema = z.strictObject({
  ok: z.literal(false),
  error: z.strictObject({
    code: PublishErrorCodeSchema,
    retryable: z.boolean(),
  }).readonly(),
}).readonly();

export const PublishMediaCountsSchema = z.strictObject({
  draftReferences: z.number().int().nonnegative(),
  objectsCreated: z.number().int().nonnegative().nullable(),
  objectsReused: z.number().int().nonnegative().nullable(),
}).readonly();
