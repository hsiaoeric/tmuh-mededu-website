import { z } from 'zod';
import {
  OrderSchema,
  OwnerIdSchema,
  POST_CATEGORY_CHANNELS,
  POST_CATEGORY_IDS,
  PostCategoryIdSchema,
  PostChannelSchema,
  ProgramIdSchema,
  SlugIdSchema,
} from './archiveIds';
import {
  EditableLocalizedBlocksSchema,
  FileHrefSchema,
  LocalizedBlocksSchema,
  PublishedLocalizedBlocksSchema,
} from './blocks';
import { addDuplicateIssues, addExactIdentitySetIssue } from './common';
import {
  ContentModelSchema,
  EditableLocalizedTextSchema,
  LocalizedLabelSchema,
  LocalizedSummarySchema,
  LocalizedTitleSchema,
} from './localized';
import { CalendarDateSchema, MediaReferenceSchema, PublishedMediaReferenceSchema } from './primitives';

export const POSTS_LIMITS = { posts: 3_000 } as const;

type IssueContext = { readonly value: unknown; readonly issues: z.core.$ZodRawIssue[] };

type CheckedPosts = {
  readonly categories: readonly { readonly id: string; readonly channel: string }[];
  readonly posts: readonly {
    readonly id: string;
    readonly channel: string;
    readonly categoryId: string;
    readonly owner: string;
    readonly audiences?: readonly string[];
    readonly attachments: readonly { readonly id: string }[];
  }[];
};

function checkPosts(value: CheckedPosts, context: IssueContext): void {
  addExactIdentitySetIssue({
    values: value.categories.map((category) => category.id),
    expected: POST_CATEGORY_IDS,
    path: ['categories'],
    message: 'Post categories must contain every canonical category exactly once',
  }, context);
  value.categories.forEach((category, index) => {
    const channel = (POST_CATEGORY_CHANNELS as Readonly<Record<string, string>>)[category.id];
    if (channel !== undefined && channel !== category.channel) {
      context.issues.push({ code: 'custom', message: `Category ${category.id} belongs to the ${channel} channel`, path: ['categories', index, 'channel'], input: context.value });
    }
  });
  const channels = new Map(value.categories.map((category) => [category.id, category.channel]));
  addDuplicateIssues({ values: value.posts.map((post) => post.id), path: ['posts'], field: 'id' }, context);
  value.posts.forEach((post, index) => {
    const channel = channels.get(post.categoryId);
    if (channel === undefined) {
      context.issues.push({ code: 'custom', message: `Unknown post category: ${post.categoryId}`, path: ['posts', index, 'categoryId'], input: context.value });
    } else if (channel !== post.channel) {
      context.issues.push({ code: 'custom', message: 'Post channel must match its category channel', path: ['posts', index, 'channel'], input: context.value });
    }
    if (post.channel === 'center' && post.owner === 'department') {
      context.issues.push({ code: 'custom', message: 'Center posts must belong to a center', path: ['posts', index, 'owner'], input: context.value });
    }
    addDuplicateIssues({ values: post.audiences ?? [], path: ['posts', index, 'audiences'], field: 'id' }, context);
    addDuplicateIssues({ values: post.attachments.map((attachment) => attachment.id), path: ['posts', index, 'attachments'], field: 'id' }, context);
  });
}

const PostCategorySchema = z.strictObject({
  id: PostCategoryIdSchema,
  channel: PostChannelSchema,
  label: LocalizedLabelSchema,
  order: OrderSchema,
}).readonly();

const PostAttachmentSchema = z.strictObject({
  id: SlugIdSchema,
  label: LocalizedLabelSchema,
  href: FileHrefSchema,
}).readonly();

const PostFields = {
  id: SlugIdSchema,
  channel: PostChannelSchema,
  categoryId: PostCategoryIdSchema,
  owner: OwnerIdSchema,
  audiences: z.array(ProgramIdSchema).readonly().optional(),
  publishedOn: CalendarDateSchema,
  pinned: z.boolean(),
  title: LocalizedTitleSchema,
  summary: LocalizedSummarySchema.optional(),
  attachments: z.array(PostAttachmentSchema).readonly(),
} as const;

const PostSchema = z.strictObject({
  ...PostFields,
  cover: MediaReferenceSchema.optional(),
  body: LocalizedBlocksSchema,
}).readonly();

const PublishedPostSchema = z.strictObject({
  ...PostFields,
  cover: PublishedMediaReferenceSchema.optional(),
  body: PublishedLocalizedBlocksSchema,
}).readonly();

const PostsDocumentFields = {
  contentModel: ContentModelSchema,
  categories: z.array(PostCategorySchema).readonly(),
} as const;

export const EditablePostsPayloadSchema = z.strictObject({
  contentModel: ContentModelSchema,
  categories: z.array(z.strictObject({
    id: z.string(),
    channel: z.string(),
    label: EditableLocalizedTextSchema,
    order: z.number(),
  }).readonly()).readonly(),
  posts: z.array(z.strictObject({
    id: z.string(),
    channel: z.string(),
    categoryId: z.string(),
    owner: z.string(),
    audiences: z.array(z.string()).readonly().optional(),
    publishedOn: z.string(),
    pinned: z.boolean(),
    title: EditableLocalizedTextSchema,
    summary: EditableLocalizedTextSchema.optional(),
    cover: MediaReferenceSchema.optional(),
    body: EditableLocalizedBlocksSchema,
    attachments: z.array(z.strictObject({
      id: z.string(),
      label: EditableLocalizedTextSchema,
      href: z.string(),
    }).readonly()).readonly(),
  }).readonly()).readonly(),
}).readonly();

export const PostsPayloadSchema = z.strictObject({
  ...PostsDocumentFields,
  posts: z.array(PostSchema).max(POSTS_LIMITS.posts).readonly(),
}).readonly().check((context) => checkPosts(context.value, context));

export const PublishedPostsPayloadSchema = z.strictObject({
  ...PostsDocumentFields,
  posts: z.array(PublishedPostSchema).max(POSTS_LIMITS.posts).readonly(),
}).readonly().check((context) => checkPosts(context.value, context));

export type PublishedPostsPayload = z.output<typeof PublishedPostsPayloadSchema>;
export type PublishedPost = PublishedPostsPayload['posts'][number];
export type PublishedPostCategory = PublishedPostsPayload['categories'][number];
