import type { Lang } from '@/i18n';
import { assetUrl } from '@/utils/asset';

/** Role keys mapped to [zh, en] labels. */
export const ROLES = {
  director: ['中心主任', 'Director'],
  deputy: ['中心副主任', 'Deputy Director'],
  cadmin: ['中心行政專員', 'Center Administrator'],
  instructor: ['指導員', 'Instructor'],
  seed: ['種子教師', 'Seed Teacher'],
  vp: ['教學副院長', 'VP · Medical Education'],
  lead: ['負責人', 'Lead'],
  ddir: ['教學部主任', 'Department Director'],
  ddep: ['教學部副主任', 'Deputy Director'],
  head: ['教學部組長', 'Section Head'],
  spec: ['行政專員', 'Administrative Specialist'],
  pm: ['專案經理', 'Project Manager'],
  ai: ['AI 專家顧問', 'AI Expert Advisor'],
  eng: ['專案工程師', 'Project Engineer'],
} as const satisfies Record<string, readonly [string, string]>;

export type RoleKey = keyof typeof ROLES;

export interface RawPerson {
  zh: string;
  en: string;
  role: RoleKey;
  /** Department / title (may contain <br> in the source). */
  dZh: string;
  dEn: string;
  /** Image slug (filename without extension), '' if no photo. */
  slug: string;
  /** TMU Hub person id used to build the academic-profile link. */
  hubId: string;
  /** Main duties (admin specialists). */
  dutyZh?: string;
  dutyEn?: string;
}

export interface ResolvedPerson {
  fullname: string;
  sub: string;
  role: string;
  dept: string;
  photoSrc: string;
  /** object-position for the portrait (some are full-body shots). */
  objectPosition: string;
  initials: string;
  accent: string;
  hasPhoto: boolean;
  profile: string;
  profileLabel: string;
  duty: string;
  dutyLabel: string;
}

/** Portraits that need a non-centered crop. */
const FULL_BODY_POSITION: Record<string, string> = {
  'chung-che-wu': 'center 18%',
  'tien-shang-chu': 'center 16%',
  'nien-hsuan-tsao': 'center 16%',
  'fang-chun-fan': 'center 16%',
  'chien-yu-chen': 'center 14%',
  'hsin-yi-chiu': 'center 10%',
  'hung-wei-tsai': 'center 8%',
};

function initialsOf(en: string): string {
  const words = (en || '')
    .replace(/[^A-Za-z ]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2)
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return (en || '?').slice(0, 2).toUpperCase();
}

/** Resolve an image slug to a public asset path. */
export function resourceSrc(slug: string): string {
  return slug ? assetUrl(`assets/${slug}.jpg`) : '';
}

/** Factory mirroring the original `P(...)` helper. */
export function person(
  zh: string,
  en: string,
  role: RoleKey,
  dZh: string,
  dEn: string,
  slug = '',
  hubId = '',
  dutyZh = '',
  dutyEn = '',
): RawPerson {
  return { zh, en, role, dZh, dEn, slug, hubId, dutyZh, dutyEn };
}

/** Localize a raw person into render-ready data. */
export function resolvePerson(
  p: RawPerson,
  accent: string,
  lang: Lang,
): ResolvedPerson {
  const isZh = lang === 'zh';
  return {
    fullname: isZh ? p.zh : p.en,
    sub: isZh ? p.en : p.zh,
    role: ROLES[p.role][isZh ? 0 : 1],
    dept: (isZh ? p.dZh : p.dEn).split('<br>').join('\n'),
    photoSrc: resourceSrc(p.slug),
    objectPosition: FULL_BODY_POSITION[p.slug] ?? 'center',
    initials: initialsOf(p.en),
    accent,
    hasPhoto: !!p.slug,
    profile: p.hubId ? `https://hub.tmu.edu.tw/zh/persons/${p.hubId}/` : '',
    profileLabel: isZh ? '個人學術檔案' : 'Academic Profile',
    duty: isZh ? p.dutyZh ?? '' : p.dutyEn ?? '',
    dutyLabel: isZh ? '主要業務' : 'Main Duties',
  };
}
