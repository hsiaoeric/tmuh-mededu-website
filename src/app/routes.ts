import type { CenterId } from '@/data/types';

/** Readable slugs replace the old /ebm, /facdev, /center/:id paths. */
export const CENTER_SLUG: Record<Exclude<CenterId, 'admin'>, string> = {
  faculty_dev: 'faculty-development',
  clinical_skills: 'clinical-skills',
  ebm: 'evidence-based-medicine',
  holistic: 'holistic-care',
  med_edu_research: 'medical-education-research',
};

export const SLUG_TO_CENTER: Record<string, CenterId> = Object.fromEntries(
  Object.entries(CENTER_SLUG).map(([id, slug]) => [slug, id as CenterId]),
);

export const centerPath = (id: Exclude<CenterId, 'admin'>) => `/centers/${CENTER_SLUG[id]}`;

/**
 * The holistic center lists its symposia and papers as year cards; each opens a
 * detail page nested under the center's own path.
 */
export type HolisticDetailKind = 'symposia' | 'research';
export const HOLISTIC_DETAIL_KINDS: HolisticDetailKind[] = ['symposia', 'research'];
export const holisticDetailPath = (kind: HolisticDetailKind, year: number) =>
  `${centerPath('holistic')}/${kind}/${year}`;

/** Order the centers are presented in across the site. */
export const CENTER_ORDER: Array<Exclude<CenterId, 'admin'>> = [
  'faculty_dev',
  'clinical_skills',
  'ebm',
  'holistic',
  'med_edu_research',
];

/** Sections on the home page that the nav can jump to. */
export const HOME_SECTIONS = ['about', 'organisation', 'centers', 'news', 'honors', 'contact'] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];

/** Old URLs kept alive so existing links and bookmarks still resolve. */
export const LEGACY_REDIRECTS: Record<string, string> = {
  '/holistic': centerPath('holistic'),
  '/ebm': centerPath('ebm'),
  '/facdev': centerPath('faculty_dev'),
};
