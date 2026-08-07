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

/** Full department announcement archive; the home page only carries highlights. */
export const ANNOUNCEMENTS_PATH = '/announcements';

/**
 * The digital learning materials studio. A department unit rather than a
 * centre, so it sits outside `/centers` and carries its own top-level path.
 */
export const DIGITAL_MATERIALS_PATH = '/digital-materials';

/**
 * The holistic center lists its symposia and papers as year cards; each opens a
 * detail page nested under the center's own path.
 */
export type HolisticDetailKind = 'symposia' | 'research';
export const HOLISTIC_DETAIL_KINDS: HolisticDetailKind[] = ['symposia', 'research'];
export const holisticDetailPath = (kind: HolisticDetailKind, year: number) =>
  `${centerPath('holistic')}/${kind}/${year}`;

/**
 * Order the centers are presented in across the site. Every centre listing —
 * nav, hero, glance, footer, contact table — reads this, so the sequence is
 * defined once and cannot drift between them.
 */
export const CENTER_ORDER: Array<Exclude<CenterId, 'admin'>> = [
  'faculty_dev',
  'clinical_skills',
  'ebm',
  'holistic',
  'med_edu_research',
];

/**
 * The org diagram's ring, read clockwise from twelve o'clock: the
 * administrative team sits at the top, then the five centres in `CENTER_ORDER`.
 */
export const ORG_ORDER: CenterId[] = ['admin', ...CENTER_ORDER];

/** Sections on the home page that the nav can jump to. */
export const HOME_SECTIONS = ['about', 'organisation', 'glance', 'news', 'honors', 'contact'] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];

/**
 * Sections on the holistic centre page, in the order they appear down the
 * page. Kept here beside the home ids so every in-page anchor target on the
 * site is declared in one file; the rail's labels and grouping live with the
 * page.
 */
export const HOLISTIC_SECTIONS = [
  'h-about',
  'h-news',
  'symposia',
  'h-members',
  'h-research-team',
  'ai',
  'mhfa',
  'training',
  'h-intl',
  'research',
  'contact',
] as const;
export type HolisticSection = (typeof HOLISTIC_SECTIONS)[number];

/** Old URLs kept alive so existing links and bookmarks still resolve. */
export const LEGACY_REDIRECTS: Record<string, string> = {
  '/holistic': centerPath('holistic'),
  '/ebm': centerPath('ebm'),
  '/facdev': centerPath('faculty_dev'),
};
