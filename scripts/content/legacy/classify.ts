import type { AudienceOwner, OwnerId, PostCategoryId, ProgramId } from '../../../src/content/contracts/archiveIds';
import {
  LEGACY_BOARD_CATEGORY_CODES,
  LEGACY_CENTER_CODES,
  LEGACY_CENTER_NUMBER_OWNERS,
  LEGACY_NEWS_CATEGORY_CODES,
  LEGACY_PROGRAM_ALBUM_CODES,
  LEGACY_PROGRAM_CODES,
  legacyCenterOwnerForCode,
} from '../../../src/data/legacy/taxonomy';
import { normalizeLegacyPath } from './paths';

export type ProgramSection = 'albums' | 'outcomes' | 'schedule' | 'links' | 'videos';

/** What an old URL showed, independent of which of its many duplicate paths was used. */
export type LegacyView =
  | { readonly kind: 'home' }
  | { readonly kind: 'contact' }
  | { readonly kind: 'centers' }
  | { readonly kind: 'news-index' }
  | { readonly kind: 'honors-index' }
  | { readonly kind: 'category'; readonly categoryId: PostCategoryId }
  | { readonly kind: 'post'; readonly postId: string; readonly code?: string; readonly centerOwner?: OwnerId }
  | { readonly kind: 'organization' }
  | { readonly kind: 'team' }
  | { readonly kind: 'committees' }
  | { readonly kind: 'department-page'; readonly legacyId: number }
  | { readonly kind: 'gallery' }
  | { readonly kind: 'album'; readonly albumId: string; readonly owner?: AudienceOwner }
  | { readonly kind: 'photo'; readonly photoId: string; readonly owner: AudienceOwner }
  | { readonly kind: 'owner-albums'; readonly owner: AudienceOwner }
  | { readonly kind: 'program'; readonly program: ProgramId; readonly section?: ProgramSection }
  | { readonly kind: 'videos'; readonly owner?: AudienceOwner }
  | { readonly kind: 'center'; readonly owner: OwnerId; readonly section?: 'center-articles' }
  | { readonly kind: 'links' }
  | { readonly kind: 'downloads' }
  | { readonly kind: 'download-file' };

function lookup<T>(table: Readonly<Record<string, T>>, key: string | undefined): T | undefined {
  return key === undefined ? undefined : table[key];
}

export function newsCategoryForCode(code: string): PostCategoryId | undefined {
  const upper = code.toUpperCase();
  return lookup<PostCategoryId>(LEGACY_NEWS_CATEGORY_CODES, upper) ?? lookup<PostCategoryId>(LEGACY_BOARD_CATEGORY_CODES, upper);
}

export function programForStudentCode(code: string | undefined): ProgramId | undefined {
  return lookup<ProgramId>(LEGACY_PROGRAM_CODES, code?.toLowerCase());
}

export function programForAlbumCode(code: string | undefined): ProgramId | undefined {
  return lookup<ProgramId>(LEGACY_PROGRAM_ALBUM_CODES, code?.toUpperCase());
}

export function centerForName(name: string | undefined): OwnerId | undefined {
  return lookup<OwnerId>(LEGACY_CENTER_CODES, name?.toLowerCase());
}

function centerForNumber(number: string | undefined): OwnerId | undefined {
  return lookup<OwnerId>(LEGACY_CENTER_NUMBER_OWNERS, number);
}

/** Album codes: ALB0n/STU0n belong to programs, ELB0n/MEDICAL to centers. */
export function ownerForAlbumCode(code: string): AudienceOwner | undefined {
  return programForAlbumCode(code) ?? legacyCenterOwnerForCode(code);
}

type Rule = readonly [RegExp, (match: RegExpExecArray) => LegacyView | undefined];

const RULES: readonly Rule[] = [
  [/^\/(?:index)?$/, () => ({ kind: 'home' })],
  [/^\/contact$/, () => ({ kind: 'contact' })],
  [/^\/center$/, () => ({ kind: 'centers' })],
  [/^\/news(?:\/index)?$/, () => ({ kind: 'news-index' })],
  [/^\/news\/cate\/([a-z0-9]+)$/, (m) => categoryView(m[1])],
  [/^\/news\/info(?:\/news)?\/(\d+)$/, (m) => ({ kind: 'post', postId: String(Number(m[1])) })],
  [/^\/news\/info\/(n00\d|board0\d)\/(\d+)$/, (m) => ({ kind: 'post', postId: String(Number(m[2])), code: m[1]?.toUpperCase() })],
  [/^\/board(?:\/index)?$/, () => ({ kind: 'honors-index' })],
  [/^\/board\/(?:index|cate\/board)\/(board0\d)$/, (m) => categoryView(m[1])],
  [/^\/board\/info\/board\/(board0\d)\/(\d+)$/, (m) => ({ kind: 'post', postId: String(Number(m[2])), code: m[1]?.toUpperCase() })],
  [/^\/about(?:\/index)?$/, () => ({ kind: 'organization' })],
  [/^\/about\/team$/, () => ({ kind: 'team' })],
  [/^\/about\/committee$/, () => ({ kind: 'committees' })],
  [/^\/about\/(?:detail|info\/committee)\/(\d+)$/, (m) => ({ kind: 'department-page', legacyId: Number(m[1]) })],
  [/^\/album(?:\/home)?$/, () => ({ kind: 'gallery' })],
  [/^\/album\/info\/album\/([a-z0-9]+)\/(\d+)$/, (m) => albumView(m[2], ownerForAlbumCode(m[1] ?? ''))],
  [/^\/student\/album\/(alb0\d)\/(\d+)$/, (m) => photoView(m[2], programForAlbumCode(m[1]))],
  [/^\/student\/album\/(stu0\d)\/alb0\d$/, (m) => programView(m[1], 'albums')],
  [/^\/student\/(?:album|albumlist)\/(stu0\d)\/alb0\d\/(\d+)$/, (m) => albumView(m[2], programForStudentCode(m[1]))],
  [/^\/student\/doctor\/(stu0\d)\/home$/, (m) => programView(m[1])],
  [/^\/student\/doctor\/(alb0\d)$/, (m) => {
    const program = programForAlbumCode(m[1]);
    return program === undefined ? undefined : { kind: 'program', program };
  }],
  [/^\/student\/training\/(stu0\d)\/trn0\d$/, (m) => programView(m[1], 'outcomes')],
  [/^\/student\/schedule\/(stu0\d)\/sch0\d$/, (m) => programView(m[1], 'schedule')],
  [/^\/student\/comm\/(stu0\d)\/dwn0\d$/, (m) => programView(m[1], 'links')],
  [/^\/student\/video\/(stu0\d)\/vdo0\d$/, (m) => programView(m[1], 'videos')],
  [/^\/home\/video(?:\/video){0,2}$/, () => ({ kind: 'videos', owner: 'department' })],
  [/^\/home\/video\/(stu0\d)\/vdo0\d$/, (m) => ownerView('videos', programForStudentCode(m[1]))],
  [/^\/home\/video\/stu0\d\/cvd(0\d)$/, (m) => ownerView('videos', centerForNumber(m[1]))],
  [/^\/center\/about\/abt(0\d)$/, (m) => centerView(centerForNumber(m[1]))],
  [/^\/center\/about\/([a-z]+)\/abt0\d$/, (m) => centerView(centerForName(m[1]))],
  [/^\/center\/events\/([a-z]+)\/[a-z0-9]+$/, (m) => centerView(centerForName(m[1]), 'center-articles')],
  [/^\/center\/info\/([a-z]+)\/(abt0\d|evt0\d)\/(\d+)$/, (m) => {
    const centerOwner = centerForName(m[1]);
    return centerOwner === undefined ? undefined : { kind: 'post', postId: String(Number(m[3])), code: m[2]?.toUpperCase(), centerOwner };
  }],
  [/^\/center\/info\/([a-z]+)\/elb0\d\/(\d+)$/, (m) => albumView(m[2], centerForName(m[1]))],
  [/^\/center\/album\/([a-z]+)\/elb0\d$/, (m) => ownerView('owner-albums', centerForName(m[1]))],
  [/^\/center\/album\/(elb0\d)\/(\d+)$/, (m) => photoView(m[2], legacyCenterOwnerForCode(m[1] ?? ''))],
  [/^\/center\/albumlist\/([a-z]+)\/elb0\d\/(\d+)$/, (m) => albumView(m[2], centerForName(m[1]))],
  [/^\/center\/video\/([a-z]+)(?:\/.*)?$/, (m) => ownerView('videos', centerForName(m[1]))],
  [/^\/other\/links(?:\/l00\d)?$/, () => ({ kind: 'links' })],
  [/^\/other\/download(?:\/(?:dwn|rec)\d\d)?$/, () => ({ kind: 'downloads' })],
  [/^\/other\/downloadfile$/, () => ({ kind: 'download-file' })],
];

function categoryView(code: string | undefined): LegacyView | undefined {
  const categoryId = code === undefined ? undefined : newsCategoryForCode(code);
  return categoryId === undefined ? undefined : { kind: 'category', categoryId };
}

function albumView(id: string | undefined, owner: AudienceOwner | undefined): LegacyView | undefined {
  if (id === undefined) return undefined;
  return owner === undefined ? { kind: 'album', albumId: String(Number(id)) } : { kind: 'album', albumId: String(Number(id)), owner };
}

function photoView(id: string | undefined, owner: AudienceOwner | undefined): LegacyView | undefined {
  return id === undefined || owner === undefined ? undefined : { kind: 'photo', photoId: String(Number(id)), owner };
}

function programView(code: string | undefined, section?: ProgramSection): LegacyView | undefined {
  const program = programForStudentCode(code);
  if (program === undefined) return undefined;
  return section === undefined ? { kind: 'program', program } : { kind: 'program', program, section };
}

function ownerView(kind: 'videos' | 'owner-albums', owner: AudienceOwner | undefined): LegacyView | undefined {
  return owner === undefined ? undefined : { kind, owner };
}

function centerView(owner: OwnerId | undefined, section?: 'center-articles'): LegacyView | undefined {
  if (owner === undefined) return undefined;
  return section === undefined ? { kind: 'center', owner } : { kind: 'center', owner, section };
}

/** Classifies an old path (any case, with or without `.html`); undefined when it is unknown. */
export function classifyLegacyPath(path: string): LegacyView | undefined {
  const normalized = normalizeLegacyPath(path);
  for (const [pattern, build] of RULES) {
    const match = pattern.exec(normalized);
    if (match !== null) return build(match);
  }
  return undefined;
}
