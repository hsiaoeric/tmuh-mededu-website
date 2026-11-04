import { z } from 'zod';
import {
  AudienceOwnerSchema,
  DepartmentPageSectionSchema,
  LinkGroupPurposeSchema,
  OrderSchema,
  PROGRAM_IDS,
  ProgramIdSchema,
  SlugIdSchema,
} from './archiveIds';
import {
  EditableLocalizedBlocksSchema,
  FileHrefSchema,
  LinkHrefSchema,
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

type IssueContext = { readonly value: unknown; readonly issues: z.core.$ZodRawIssue[] };

const PROGRAM_PAGE_FIELDS = ['introPageId', 'outcomesPageId', 'schedulePageId'] as const;

type CheckedDepartmentInfo = {
  readonly pages: readonly { readonly id: string; readonly section: string; readonly owner?: string }[];
  readonly programs: readonly ({ readonly id: string } & { readonly [F in (typeof PROGRAM_PAGE_FIELDS)[number]]?: string })[];
  readonly linkGroups: readonly { readonly id: string; readonly links: readonly { readonly id: string }[] }[];
  readonly downloads: readonly { readonly id: string; readonly items: readonly { readonly id: string }[] }[];
};

function checkDepartmentInfo(value: CheckedDepartmentInfo, context: IssueContext): void {
  addDuplicateIssues({ values: value.pages.map((page) => page.id), path: ['pages'], field: 'id' }, context);
  addExactIdentitySetIssue({
    values: value.programs.map((program) => program.id),
    expected: PROGRAM_IDS,
    path: ['programs'],
    message: 'Programs must contain every canonical program exactly once',
  }, context);
  const pages = new Map(value.pages.map((page) => [page.id, page]));
  value.programs.forEach((program, index) => {
    for (const field of PROGRAM_PAGE_FIELDS) {
      const pageId = program[field];
      if (pageId === undefined) continue;
      const page = pages.get(pageId);
      if (page === undefined || page.section !== 'program' || page.owner !== program.id) {
        context.issues.push({
          code: 'custom',
          message: `Program ${program.id} ${field} must name a program page owned by that program`,
          path: ['programs', index, field],
          input: context.value,
        });
      }
    }
  });
  addDuplicateIssues({ values: value.linkGroups.map((group) => group.id), path: ['linkGroups'], field: 'id' }, context);
  value.linkGroups.forEach((group, index) => {
    addDuplicateIssues({ values: group.links.map((link) => link.id), path: ['linkGroups', index, 'links'], field: 'id' }, context);
  });
  addDuplicateIssues({ values: value.downloads.map((group) => group.id), path: ['downloads'], field: 'id' }, context);
  value.downloads.forEach((group, index) => {
    addDuplicateIssues({ values: group.items.map((item) => item.id), path: ['downloads', index, 'items'], field: 'id' }, context);
  });
}

const LinkGroupSchema = z.strictObject({
  id: SlugIdSchema,
  owner: AudienceOwnerSchema,
  purpose: LinkGroupPurposeSchema,
  order: OrderSchema,
  title: LocalizedTitleSchema,
  links: z.array(z.strictObject({
    id: SlugIdSchema,
    label: LocalizedLabelSchema,
    description: LocalizedSummarySchema.optional(),
    href: LinkHrefSchema,
  }).readonly()).readonly(),
}).readonly();

const DownloadGroupSchema = z.strictObject({
  id: SlugIdSchema,
  owner: AudienceOwnerSchema,
  title: LocalizedTitleSchema,
  items: z.array(z.strictObject({
    id: SlugIdSchema,
    label: LocalizedLabelSchema,
    href: FileHrefSchema,
    publishedOn: CalendarDateSchema.optional(),
  }).readonly()).readonly(),
}).readonly();

const PageFields = {
  id: SlugIdSchema,
  section: DepartmentPageSectionSchema,
  owner: AudienceOwnerSchema.optional(),
  order: OrderSchema,
  title: LocalizedTitleSchema,
  subtitle: LocalizedTitleSchema.optional(),
  summary: LocalizedSummarySchema.optional(),
  updatedOn: CalendarDateSchema.optional(),
} as const;

const ProgramFields = {
  id: ProgramIdSchema,
  order: OrderSchema,
  title: LocalizedTitleSchema,
  summary: LocalizedSummarySchema,
  introPageId: SlugIdSchema.optional(),
  outcomesPageId: SlugIdSchema.optional(),
  schedulePageId: SlugIdSchema.optional(),
} as const;

const PageSchema = z.strictObject({ ...PageFields, portrait: MediaReferenceSchema.optional(), body: LocalizedBlocksSchema }).readonly();
const PublishedPageSchema = z.strictObject({ ...PageFields, portrait: PublishedMediaReferenceSchema.optional(), body: PublishedLocalizedBlocksSchema }).readonly();
const ProgramSchema = z.strictObject({ ...ProgramFields, cover: MediaReferenceSchema.optional() }).readonly();
const PublishedProgramSchema = z.strictObject({ ...ProgramFields, cover: PublishedMediaReferenceSchema.optional() }).readonly();

const DepartmentInfoDocumentFields = {
  contentModel: ContentModelSchema,
  linkGroups: z.array(LinkGroupSchema).readonly(),
  downloads: z.array(DownloadGroupSchema).readonly(),
} as const;

export const EditableDepartmentInfoPayloadSchema = z.strictObject({
  contentModel: ContentModelSchema,
  pages: z.array(z.strictObject({
    id: z.string(),
    section: z.string(),
    owner: z.string().optional(),
    order: z.number(),
    title: EditableLocalizedTextSchema,
    subtitle: EditableLocalizedTextSchema.optional(),
    summary: EditableLocalizedTextSchema.optional(),
    portrait: MediaReferenceSchema.optional(),
    body: EditableLocalizedBlocksSchema,
    updatedOn: z.string().optional(),
  }).readonly()).readonly(),
  programs: z.array(z.strictObject({
    id: z.string(),
    order: z.number(),
    title: EditableLocalizedTextSchema,
    summary: EditableLocalizedTextSchema,
    cover: MediaReferenceSchema.optional(),
    introPageId: z.string().optional(),
    outcomesPageId: z.string().optional(),
    schedulePageId: z.string().optional(),
  }).readonly()).readonly(),
  linkGroups: z.array(z.strictObject({
    id: z.string(),
    owner: z.string(),
    purpose: z.string(),
    order: z.number(),
    title: EditableLocalizedTextSchema,
    links: z.array(z.strictObject({
      id: z.string(),
      label: EditableLocalizedTextSchema,
      description: EditableLocalizedTextSchema.optional(),
      href: z.string(),
    }).readonly()).readonly(),
  }).readonly()).readonly(),
  downloads: z.array(z.strictObject({
    id: z.string(),
    owner: z.string(),
    title: EditableLocalizedTextSchema,
    items: z.array(z.strictObject({
      id: z.string(),
      label: EditableLocalizedTextSchema,
      href: z.string(),
      publishedOn: z.string().optional(),
    }).readonly()).readonly(),
  }).readonly()).readonly(),
}).readonly();

export const DepartmentInfoPayloadSchema = z.strictObject({
  ...DepartmentInfoDocumentFields,
  pages: z.array(PageSchema).readonly(),
  programs: z.array(ProgramSchema).readonly(),
}).readonly().check((context) => checkDepartmentInfo(context.value, context));

export const PublishedDepartmentInfoPayloadSchema = z.strictObject({
  ...DepartmentInfoDocumentFields,
  pages: z.array(PublishedPageSchema).readonly(),
  programs: z.array(PublishedProgramSchema).readonly(),
}).readonly().check((context) => checkDepartmentInfo(context.value, context));

export type PublishedDepartmentInfoPayload = z.output<typeof PublishedDepartmentInfoPayloadSchema>;
