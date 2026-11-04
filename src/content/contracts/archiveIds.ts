import { z } from 'zod';
import type { CenterId } from '@/data/centerIdentities';

/** Who an archive item belongs to: the department, a center, or the digital materials room. */
export const OWNER_IDS = [
  'department',
  'faculty_dev',
  'clinical_skills',
  'ebm',
  'holistic',
  'med_edu_research',
  'digital_materials',
] as const;
export const OwnerIdSchema = z.enum(OWNER_IDS);
export type OwnerId = z.infer<typeof OwnerIdSchema>;

/** Owners that are education centers and so have a center page. */
export const CENTER_OWNER_IDS = [
  'faculty_dev',
  'clinical_skills',
  'ebm',
  'holistic',
  'med_edu_research',
] as const satisfies readonly (OwnerId & CenterId)[];

/** The five trainee programs (學員專區). Exactly these, in this order, in `department_info.programs`. */
export const PROGRAM_IDS = [
  'residents',
  'pgy',
  'medical-students',
  'allied-health-trainees',
  'joint-training',
] as const;
export const ProgramIdSchema = z.enum(PROGRAM_IDS);
export type ProgramId = z.infer<typeof ProgramIdSchema>;

/** Albums, link groups, downloads, and pages can also belong to a trainee program. */
export const AUDIENCE_OWNER_IDS = [...OWNER_IDS, ...PROGRAM_IDS] as const;
export const AudienceOwnerSchema = z.enum(AUDIENCE_OWNER_IDS);
export type AudienceOwner = z.infer<typeof AudienceOwnerSchema>;

/**
 * Stable item identifiers. Lowercase kebab case, 1–80 characters. Imported legacy posts keep their
 * numeric article id (for example "185") so redirects never need to change.
 */
export const SLUG_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_ID_MAX_LENGTH = 80;
export const SlugIdSchema = z.string().max(SLUG_ID_MAX_LENGTH).regex(SLUG_ID_PATTERN);

/** Display order within a collection; ties fall back to the id. */
export const OrderSchema = z.number().int().min(0);

export const POST_CHANNELS = ['news', 'honors', 'center'] as const;
export const PostChannelSchema = z.enum(POST_CHANNELS);
export type PostChannel = z.infer<typeof PostChannelSchema>;

/** Every post category, in canonical order. */
export const POST_CATEGORY_IDS = [
  'hospital-courses',
  'recruitment',
  'further-training',
  'faculty',
  'center-notices',
  'trainee-notices',
  'hospital-events',
  'external-events',
  'teaching-recognition',
  'competitions-awards',
  'publications-training',
  'faculty-certification',
  'center-about',
  'center-events',
] as const;
export const PostCategoryIdSchema = z.enum(POST_CATEGORY_IDS);
export type PostCategoryId = z.infer<typeof PostCategoryIdSchema>;

/** The one channel each category belongs to. */
export const POST_CATEGORY_CHANNELS = {
  'hospital-courses': 'news',
  recruitment: 'news',
  'further-training': 'news',
  faculty: 'news',
  'center-notices': 'news',
  'trainee-notices': 'news',
  'hospital-events': 'news',
  'external-events': 'news',
  'teaching-recognition': 'honors',
  'competitions-awards': 'honors',
  'publications-training': 'honors',
  'faculty-certification': 'honors',
  'center-about': 'center',
  'center-events': 'center',
} as const satisfies Readonly<Record<PostCategoryId, PostChannel>>;

export const DEPARTMENT_PAGE_SECTIONS = ['about', 'committee', 'program', 'center'] as const;
export const DepartmentPageSectionSchema = z.enum(DEPARTMENT_PAGE_SECTIONS);
export type DepartmentPageSection = z.infer<typeof DepartmentPageSectionSchema>;

export const LINK_GROUP_PURPOSES = ['related', 'common', 'systems'] as const;
export const LinkGroupPurposeSchema = z.enum(LINK_GROUP_PURPOSES);
export type LinkGroupPurpose = z.infer<typeof LinkGroupPurposeSchema>;

export function isProgramId(value: string): value is ProgramId {
  return PROGRAM_IDS.some((id) => id === value);
}
