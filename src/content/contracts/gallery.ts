import { z } from 'zod';
import { AudienceOwnerSchema, SlugIdSchema } from './archiveIds';
import { YoutubeIdSchema } from './blocks';
import { addDuplicateIssues } from './common';
import {
  ContentModelSchema,
  EditableLocalizedTextSchema,
  LocalizedAltSchema,
  LocalizedCaptionSchema,
  LocalizedSummarySchema,
  LocalizedTitleSchema,
} from './localized';
import { CalendarDateSchema, MediaReferenceSchema, PublishedMediaReferenceSchema } from './primitives';

export const GALLERY_LIMITS = { photosPerAlbum: 500 } as const;

type IssueContext = { readonly value: unknown; readonly issues: z.core.$ZodRawIssue[] };

type CheckedGallery = {
  readonly albums: readonly { readonly id: string; readonly photos: readonly { readonly id: string }[] }[];
  readonly videos: readonly { readonly id: string; readonly youtubeId: string }[];
};

function checkGallery(value: CheckedGallery, context: IssueContext): void {
  addDuplicateIssues({ values: value.albums.map((album) => album.id), path: ['albums'], field: 'id' }, context);
  value.albums.forEach((album, index) => {
    addDuplicateIssues({ values: album.photos.map((photo) => photo.id), path: ['albums', index, 'photos'], field: 'id' }, context);
  });
  addDuplicateIssues({ values: value.videos.map((video) => video.id), path: ['videos'], field: 'id' }, context);
  addDuplicateIssues({ values: value.videos.map((video) => video.youtubeId), path: ['videos'], field: 'youtubeId' }, context);
}

const PositiveIntSchema = z.number().int().positive();

const VideoSchema = z.strictObject({
  id: SlugIdSchema,
  owner: AudienceOwnerSchema,
  title: LocalizedTitleSchema,
  youtubeId: YoutubeIdSchema,
  publishedOn: CalendarDateSchema.optional(),
  description: LocalizedSummarySchema.optional(),
}).readonly();

const PhotoFields = {
  id: SlugIdSchema,
  alt: LocalizedAltSchema.optional(),
  caption: LocalizedCaptionSchema.optional(),
  width: PositiveIntSchema.optional(),
  height: PositiveIntSchema.optional(),
} as const;

const AlbumFields = {
  id: SlugIdSchema,
  owner: AudienceOwnerSchema,
  title: LocalizedTitleSchema,
  date: CalendarDateSchema.optional(),
  description: LocalizedSummarySchema.optional(),
} as const;

const PhotoSchema = z.strictObject({ ...PhotoFields, media: MediaReferenceSchema }).readonly();
const PublishedPhotoSchema = z.strictObject({ ...PhotoFields, media: PublishedMediaReferenceSchema }).readonly();

const AlbumSchema = z.strictObject({
  ...AlbumFields,
  cover: MediaReferenceSchema.optional(),
  photos: z.array(PhotoSchema).min(1).max(GALLERY_LIMITS.photosPerAlbum).readonly(),
}).readonly();
const PublishedAlbumSchema = z.strictObject({
  ...AlbumFields,
  cover: PublishedMediaReferenceSchema.optional(),
  photos: z.array(PublishedPhotoSchema).min(1).max(GALLERY_LIMITS.photosPerAlbum).readonly(),
}).readonly();

export const EditableGalleryPayloadSchema = z.strictObject({
  contentModel: ContentModelSchema,
  albums: z.array(z.strictObject({
    id: z.string(),
    owner: z.string(),
    title: EditableLocalizedTextSchema,
    date: z.string().optional(),
    description: EditableLocalizedTextSchema.optional(),
    cover: MediaReferenceSchema.optional(),
    photos: z.array(z.strictObject({
      id: z.string(),
      media: MediaReferenceSchema,
      alt: EditableLocalizedTextSchema.optional(),
      caption: EditableLocalizedTextSchema.optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    }).readonly()).readonly(),
  }).readonly()).readonly(),
  videos: z.array(z.strictObject({
    id: z.string(),
    owner: z.string(),
    title: EditableLocalizedTextSchema,
    youtubeId: z.string(),
    publishedOn: z.string().optional(),
    description: EditableLocalizedTextSchema.optional(),
  }).readonly()).readonly(),
}).readonly();

export const GalleryPayloadSchema = z.strictObject({
  contentModel: ContentModelSchema,
  albums: z.array(AlbumSchema).readonly(),
  videos: z.array(VideoSchema).readonly(),
}).readonly().check((context) => checkGallery(context.value, context));

export const PublishedGalleryPayloadSchema = z.strictObject({
  contentModel: ContentModelSchema,
  albums: z.array(PublishedAlbumSchema).readonly(),
  videos: z.array(VideoSchema).readonly(),
}).readonly().check((context) => checkGallery(context.value, context));

export type PublishedGalleryPayload = z.output<typeof PublishedGalleryPayloadSchema>;
