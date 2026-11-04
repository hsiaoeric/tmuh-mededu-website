import { z } from 'zod';
import {
  MediaReferenceSchema,
  PublishedMediaReferenceSchema,
  isCredentialFreeHttpUrl,
  isCredentialFreeHttpsUrl,
} from './primitives';
import {
  AltTextSchema,
  CaptionTextSchema,
  RunTextSchema,
  TableCellTextSchema,
  TitleTextSchema,
} from './localized';

/** Limits shared with the SQL validator. */
export const BLOCK_LIMITS = {
  blocksPerLocale: 500,
  tableColumns: 50,
} as const;

export const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
export const YoutubeIdSchema = z.string().regex(YOUTUBE_ID_PATTERN);

export const INTERNAL_PATH_PATTERN = /^\/(?!\/)[A-Za-z0-9._~%!$&'()*+,;=:@/-]*(\?[A-Za-z0-9._~%!$&'()*+,;=:@/?-]*)?(#[A-Za-z0-9_-]+)?$/;
export const MAILTO_PATTERN = /^mailto:[^\s@<>()]+@[A-Za-z0-9.-]+$/;
export const TEL_PATTERN = /^tel:\+?[0-9-]{3,20}$/;
/** Committed legacy downloads under `public/files/legacy/`, resolved through `assetUrl`. */
export const LOCAL_FILE_PATH_PATTERN = /^files\/legacy\/(?:[a-z0-9._-]+\/)*[a-z0-9][a-z0-9._-]*\.(?:pdf|docx?|xlsx?|pptx?)$/;

export type LinkHrefKind = 'https' | 'http' | 'internal' | 'mailto' | 'tel';

/** Which kind of anchor target a string is, or `null` when it is not a safe one. */
export function classifyLinkHref(value: string): LinkHrefKind | null {
  if (isCredentialFreeHttpsUrl(value)) return 'https';
  if (isCredentialFreeHttpUrl(value)) return 'http';
  if (INTERNAL_PATH_PATTERN.test(value)) return 'internal';
  if (MAILTO_PATTERN.test(value)) return 'mailto';
  if (TEL_PATTERN.test(value)) return 'tel';
  return null;
}

export function isLocalFilePath(value: string): boolean {
  return LOCAL_FILE_PATH_PATTERN.test(value)
    && !value.split('/').some((segment) => segment === '.' || segment === '..');
}

/**
 * An anchor target: credential-free https or http (http only ever as a link, never for media),
 * a same-site path, `mailto:`, or `tel:`. Everything else, including `javascript:`, `data:`,
 * protocol-relative `//host`, and userinfo, is rejected.
 */
export const LinkHrefSchema = z.string().check((context) => {
  if (classifyLinkHref(context.value) === null) {
    context.issues.push({ code: 'custom', message: 'Link must be an https, http, site path, mailto, or tel address', input: context.value });
  }
});

/** A link or a committed legacy download. */
export const FileHrefSchema = z.string().check((context) => {
  if (classifyLinkHref(context.value) === null && !isLocalFilePath(context.value)) {
    context.issues.push({ code: 'custom', message: 'File link must be a safe link or a files/legacy/ path', input: context.value });
  }
});

export const BLOCK_TYPES = ['paragraph', 'heading', 'list', 'image', 'table', 'divider', 'video'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

const PositiveIntSchema = z.number().int().positive();

const RunSchema = z.strictObject({
  text: RunTextSchema,
  strong: z.literal(true).optional(),
  href: LinkHrefSchema.optional(),
}).readonly();
const RunsSchema = z.array(RunSchema).min(1).readonly();
const TableRowSchema = z.array(TableCellTextSchema).min(1).max(BLOCK_LIMITS.tableColumns).readonly();

const ParagraphBlockSchema = z.strictObject({ type: z.literal('paragraph'), runs: RunsSchema }).readonly();
const HeadingBlockSchema = z.strictObject({
  type: z.literal('heading'),
  level: z.union([z.literal(2), z.literal(3)]),
  text: TitleTextSchema,
}).readonly();
const ListBlockSchema = z.strictObject({
  type: z.literal('list'),
  ordered: z.boolean(),
  items: z.array(RunsSchema).min(1).readonly(),
}).readonly();
const ImageBlockFields = {
  type: z.literal('image'),
  alt: AltTextSchema,
  caption: CaptionTextSchema.optional(),
  width: PositiveIntSchema.optional(),
  height: PositiveIntSchema.optional(),
} as const;
const TableBlockSchema = z.strictObject({
  type: z.literal('table'),
  header: TableRowSchema.optional(),
  rows: z.array(TableRowSchema).min(1).readonly(),
}).readonly();
const DividerBlockSchema = z.strictObject({ type: z.literal('divider') }).readonly();
const VideoBlockSchema = z.strictObject({ type: z.literal('video'), youtubeId: YoutubeIdSchema }).readonly();

/** Editable/general tier: images may still point at private draft media. */
export const BlockSchema = z.discriminatedUnion('type', [
  ParagraphBlockSchema,
  HeadingBlockSchema,
  ListBlockSchema,
  z.strictObject({ ...ImageBlockFields, media: MediaReferenceSchema }).readonly(),
  TableBlockSchema,
  DividerBlockSchema,
  VideoBlockSchema,
]);

/** Published tier: images are committed local assets or promoted public media only. */
export const PublishedBlockSchema = z.discriminatedUnion('type', [
  ParagraphBlockSchema,
  HeadingBlockSchema,
  ListBlockSchema,
  z.strictObject({ ...ImageBlockFields, media: PublishedMediaReferenceSchema }).readonly(),
  TableBlockSchema,
  DividerBlockSchema,
  VideoBlockSchema,
]);

/**
 * Body content per language. Chinese may be empty (an attachment-only post); English is absent
 * when untranslated and otherwise holds at least one block.
 */
export const LocalizedBlocksSchema = z.strictObject({
  zh: z.array(BlockSchema).max(BLOCK_LIMITS.blocksPerLocale).readonly(),
  en: z.array(BlockSchema).min(1).max(BLOCK_LIMITS.blocksPerLocale).readonly().optional(),
}).readonly();

export const PublishedLocalizedBlocksSchema = z.strictObject({
  zh: z.array(PublishedBlockSchema).max(BLOCK_LIMITS.blocksPerLocale).readonly(),
  en: z.array(PublishedBlockSchema).min(1).max(BLOCK_LIMITS.blocksPerLocale).readonly().optional(),
}).readonly();

/** Authoring tier: the same structure with every leaf string loose, so half-typed content parses. */
const EditableRunSchema = z.strictObject({
  text: z.string(),
  strong: z.literal(true).optional(),
  href: z.string().optional(),
}).readonly();
const EditableRunsSchema = z.array(EditableRunSchema).readonly();
const EditableTableRowSchema = z.array(z.string()).readonly();

export const EditableBlockSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('paragraph'), runs: EditableRunsSchema }).readonly(),
  z.strictObject({ type: z.literal('heading'), level: z.number(), text: z.string() }).readonly(),
  z.strictObject({ type: z.literal('list'), ordered: z.boolean(), items: z.array(EditableRunsSchema).readonly() }).readonly(),
  z.strictObject({
    type: z.literal('image'),
    media: MediaReferenceSchema,
    alt: z.string(),
    caption: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).readonly(),
  z.strictObject({
    type: z.literal('table'),
    header: EditableTableRowSchema.optional(),
    rows: z.array(EditableTableRowSchema).readonly(),
  }).readonly(),
  z.strictObject({ type: z.literal('divider') }).readonly(),
  z.strictObject({ type: z.literal('video'), youtubeId: z.string() }).readonly(),
]);

export const EditableLocalizedBlocksSchema = z.strictObject({
  zh: z.array(EditableBlockSchema).readonly(),
  en: z.array(EditableBlockSchema).readonly().optional(),
}).readonly();

export type Run = z.output<typeof RunSchema>;
export type Block = z.output<typeof BlockSchema>;
export type PublishedBlock = z.output<typeof PublishedBlockSchema>;
export type LocalizedBlocks = z.output<typeof LocalizedBlocksSchema>;
export type PublishedLocalizedBlocks = z.output<typeof PublishedLocalizedBlocksSchema>;
export type EditableBlock = z.output<typeof EditableBlockSchema>;
export type EditableLocalizedBlocks = z.output<typeof EditableLocalizedBlocksSchema>;
