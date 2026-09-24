import { z } from 'zod';

export const CMS_DOCUMENT_KINDS = [
  'site_copy',
  'centers',
  'people',
  'news',
  'activities',
  'kpis',
  'honors',
  'digital_materials',
  'facdev',
  'ebm',
  'holistic',
  'holistic_research',
] as const;

export const CmsDocumentKindSchema = z.enum(CMS_DOCUMENT_KINDS);
export type CmsDocumentKind = z.infer<typeof CmsDocumentKindSchema>;

export const CMS_DOCUMENT_STABLE_KEYS = {
  site_copy: 'global',
  centers: 'directory',
  people: 'directory',
  news: 'announcements',
  activities: 'calendar',
  kpis: 'department',
  honors: 'department',
  digital_materials: 'page',
  facdev: 'page',
  ebm: 'page',
  holistic: 'page',
  holistic_research: 'registry',
} as const satisfies Readonly<Record<CmsDocumentKind, string>>;

export type CmsStableKey<K extends CmsDocumentKind> = (typeof CMS_DOCUMENT_STABLE_KEYS)[K];
