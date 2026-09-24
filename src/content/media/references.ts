import { z } from 'zod';

export const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MediaTypeSchema = z.enum(MEDIA_TYPES);
export type MediaType = z.infer<typeof MediaTypeSchema>;

export const MediaOwnerIdSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  .brand('MediaOwnerId');
export const Sha256Schema = z.string().regex(/^[0-9a-f]{64}$/).brand('Sha256');
export type MediaOwnerId = z.infer<typeof MediaOwnerIdSchema>;
export type Sha256 = z.infer<typeof Sha256Schema>;

const MEDIA_EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const satisfies Readonly<Record<MediaType, string>>;

export const LocalMediaPathSchema = z
  .string()
  .regex(/^assets\/(?:[a-zA-Z0-9._-]+\/)*[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:jpe?g|png|webp)$/i)
  .check((context) => {
    if (context.value.split('/').some((segment) => segment === '.' || segment === '..')) {
      context.issues.push({ code: 'custom', message: 'Invalid local media path', input: context.value });
    }
  })
  .brand('LocalMediaPath');

export const DraftMediaPathSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{64}\.(?:jpg|png|webp)$/)
  .brand('DraftMediaPath');

export const PublicMediaPathSchema = z
  .string()
  .check((context) => {
    const match = /^([0-9a-f]{64})\/([0-9a-f]{64})\.(jpg|png|webp)$/.exec(context.value);
    if (match === null || match[1] !== match[2]) {
      context.issues.push({ code: 'custom', message: 'Invalid public media path', input: context.value });
    }
  })
  .brand('PublicMediaPath');

export const LocalMediaReferenceSchema = z.strictObject({
  kind: z.literal('local'),
  path: LocalMediaPathSchema,
}).readonly();

export const PublicMediaReferenceSchema = z.strictObject({
  kind: z.literal('public'),
  bucket: z.literal('public-media'),
  path: PublicMediaPathSchema,
}).readonly();

export const DraftMediaReferenceSchema = z.strictObject({
  kind: z.literal('draft'),
  bucket: z.literal('draft-media'),
  path: DraftMediaPathSchema,
}).readonly();

export const MediaReferenceSchema = z.discriminatedUnion('kind', [
  LocalMediaReferenceSchema,
  PublicMediaReferenceSchema,
  DraftMediaReferenceSchema,
]);

export const PublishedMediaReferenceSchema = z.discriminatedUnion('kind', [
  LocalMediaReferenceSchema,
  PublicMediaReferenceSchema,
]);

export type LocalMediaReference = z.infer<typeof LocalMediaReferenceSchema>;
export type PublicMediaReference = z.infer<typeof PublicMediaReferenceSchema>;
export type DraftMediaReference = z.infer<typeof DraftMediaReferenceSchema>;
export type MediaReference = z.infer<typeof MediaReferenceSchema>;
export type PublishedMediaReference = z.infer<typeof PublishedMediaReferenceSchema>;

export function buildDraftMediaReference(input: {
  readonly ownerId: string;
  readonly sha256: string;
  readonly mediaType: MediaType;
}): DraftMediaReference {
  const ownerId = MediaOwnerIdSchema.parse(input.ownerId);
  const digest = Sha256Schema.parse(input.sha256);
  const extension = MEDIA_EXTENSION_BY_TYPE[input.mediaType];
  return DraftMediaReferenceSchema.parse({
    kind: 'draft',
    bucket: 'draft-media',
    path: `${ownerId}/${digest}.${extension}`,
  });
}

export function buildPublicMediaReference(
  sha256: string,
  mediaType: MediaType,
): PublicMediaReference {
  const digest = Sha256Schema.parse(sha256);
  const extension = MEDIA_EXTENSION_BY_TYPE[mediaType];
  return PublicMediaReferenceSchema.parse({
    kind: 'public',
    bucket: 'public-media',
    path: `${digest}/${digest}.${extension}`,
  });
}
