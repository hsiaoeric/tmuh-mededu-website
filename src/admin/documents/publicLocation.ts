import {
  ANNOUNCEMENTS_PATH,
  DIGITAL_MATERIALS_PATH,
  HONORS_PATH,
  centerPath,
} from '@/app/routes';
import type { CmsDocumentKind } from '@/content/contracts/kinds';

/**
 * The public page where each document's content is most visible, so an
 * editor can check the live result. Several kinds feed more than one page;
 * this picks the one an editor would look at first.
 */
export const CMS_DOCUMENT_PUBLIC_PATH: Readonly<Record<CmsDocumentKind, string>> = {
  site_copy: '/',
  centers: '/#organisation',
  people: '/#organisation',
  news: ANNOUNCEMENTS_PATH,
  activities: ANNOUNCEMENTS_PATH,
  kpis: '/#glance',
  honors: HONORS_PATH,
  digital_materials: DIGITAL_MATERIALS_PATH,
  facdev: centerPath('faculty_dev'),
  ebm: centerPath('ebm'),
  holistic: centerPath('holistic'),
  holistic_research: centerPath('holistic'),
};

/** Resolves a public path against the deployed base, e.g. the Pages sub-path. */
export function publicDocumentHref(kind: CmsDocumentKind): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/u, '');
  return `${base}${CMS_DOCUMENT_PUBLIC_PATH[kind]}`;
}
