import type { LegacyDocument } from 'jsdom';
import { CENTERS } from '../../../src/data/centers';
import { LEGACY_DEPARTMENT_PAGES, LEGACY_ORGANIZATION_PAGE, type LegacyDepartmentPage } from '../../../src/data/legacy/taxonomy';
import { elements } from './parsePage';
import { isBlank, singleLine } from './text';

export type DepartmentPageSpec = LegacyDepartmentPage & {
  /** Old page number (about/detail/28 …), or undefined for the organization overview. */
  readonly legacyId?: number;
  readonly order: number;
};

/** The organization overview first, then the old pages in their old numbering. */
export function departmentPageSpecs(): DepartmentPageSpec[] {
  const numbered = Object.entries(LEGACY_DEPARTMENT_PAGES)
    .map(([legacyId, page]) => ({ ...page, legacyId: Number(legacyId) }))
    .sort((left, right) => left.legacyId - right.legacyId);
  return [
    { ...LEGACY_ORGANIZATION_PAGE, order: 0 },
    ...numbered.map((page, index) => ({ ...page, order: index + 1 })),
  ];
}

/** The team page's one-paragraph teaser for each member page (about/team → detail/28 …). */
export function readTeamSummaries(document: LegacyDocument): Map<number, string> {
  const summaries = new Map<number, string>();
  for (const member of elements(document.querySelectorAll('.member'))) {
    const href = member.querySelector('.member__name a')?.getAttribute('href') ?? '';
    const legacyId = /detail\/(\d+)\.html/.exec(href)?.[1];
    const summary = singleLine(member.querySelector('.member__desc')?.textContent);
    if (legacyId !== undefined && summary.length > 0 && !isBlank(summary)) summaries.set(Number(legacyId), summary);
  }
  return summaries;
}

/** The team page's portrait for each member page, used when the detail page lacks one. */
export function readTeamPortraits(document: LegacyDocument): Map<number, string> {
  const portraits = new Map<number, string>();
  for (const member of elements(document.querySelectorAll('.member'))) {
    const href = member.querySelector('.member__img a')?.getAttribute('href') ?? '';
    const legacyId = /detail\/(\d+)\.html/.exec(href)?.[1];
    const src = member.querySelector('.member__img img')?.getAttribute('src')?.trim();
    if (legacyId !== undefined && src !== undefined && src.length > 0) portraits.set(Number(legacyId), src);
  }
  return portraits;
}

export type RosterEntry = { readonly name: string; readonly ext?: string; readonly email?: string };

/**
 * People listed on the old 行政團隊 page, as `name(#ext) <email>`. Only entries that carry an
 * extension are read, which skips headings and vacant roles.
 */
export function readLegacyRoster(text: string): RosterEntry[] {
  const entries: RosterEntry[] = [];
  const pattern = /(\p{Script=Han}{2,3})(?:事務員|副管理師|管理師|專員)?[\s　]*[(（]#(\d{3,5})[)）][\s　]*(?:<([^<>\s]+@[^<>\s]+)>)?/gu;
  for (const match of text.matchAll(pattern)) {
    const [, name, ext, email] = match;
    if (name === undefined) continue;
    entries.push({ name, ...(ext === undefined ? {} : { ext }), ...(email === undefined ? {} : { email }) });
  }
  return entries;
}

export type RosterDiff = {
  readonly onlyLegacy: readonly RosterEntry[];
  readonly onlyCurrent: readonly RosterEntry[];
  readonly mismatched: readonly { readonly name: string; readonly legacy: RosterEntry; readonly current: RosterEntry }[];
};

/** The administrative team as the current site lists it (`src/data/centers.ts`, center `admin`). */
export function currentAdminRoster(): RosterEntry[] {
  const admin = CENTERS.find((center) => center.id === 'admin');
  return (admin?.people ?? []).map((person) => ({
    name: person.zh,
    ...(person.ext === undefined || person.ext === '' ? {} : { ext: person.ext }),
    ...(person.email === undefined || person.email === '' ? {} : { email: person.email }),
  }));
}

export function diffRoster(legacy: readonly RosterEntry[], current: readonly RosterEntry[]): RosterDiff {
  const currentByName = new Map(current.map((entry) => [entry.name, entry]));
  const legacyNames = new Set(legacy.map((entry) => entry.name));
  const mismatched: { name: string; legacy: RosterEntry; current: RosterEntry }[] = [];
  for (const entry of legacy) {
    const match = currentByName.get(entry.name);
    if (match === undefined) continue;
    if ((entry.ext !== undefined && match.ext !== entry.ext) || (entry.email !== undefined && match.email !== entry.email)) {
      mismatched.push({ name: entry.name, legacy: entry, current: match });
    }
  }
  return {
    onlyLegacy: legacy.filter((entry) => !currentByName.has(entry.name)),
    onlyCurrent: current.filter((entry) => !legacyNames.has(entry.name)),
    mismatched,
  };
}
