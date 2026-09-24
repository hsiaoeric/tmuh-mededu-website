import { CENTER_BRANCHES, CENTERS } from '../../src/data/centers';
import { deptKpis } from '../../src/data/kpis';
import { ANN_URL, buildActivityRecords, buildAnnouncementRecords } from '../../src/data/news';
import { DEPARTMENT_MEMBER_GROUPS, ROLES, type RawPerson } from '../../src/data/people';
import {
  HOLISTIC_AI_TEAM,
  HOLISTIC_INSTRUCTORS,
  HOLISTIC_SEED,
} from '../../src/data/holistic';
import type { Lang } from '../../src/i18n';

export function buildPersonView(person: RawPerson, lang: Lang) {
  const isZh = lang === 'zh';
  const identity = person.identity || person.slug || person.hubId || person.email || person.en;
  return {
    id: identity.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: isZh ? person.zh : person.en,
    alternateName: isZh ? person.en : person.zh,
    roleKey: person.role,
    role: ROLES[person.role][isZh ? 0 : 1],
    department: isZh ? person.dZh : person.dEn,
    slug: person.slug,
    portrait: person.slug === ''
      ? null
      : { kind: 'local' as const, path: `assets/${person.slug}.jpg` },
    hubId: person.hubId,
    duty: isZh ? person.dutyZh : person.dutyEn,
    ext: person.ext,
    email: person.email,
  };
}

export function buildCentersSource(lang: Lang) {
  return {
    centers: CENTERS.map((center) => ({
      id: center.id,
      name: lang === 'zh' ? center.zh : center.en,
      intro: lang === 'zh' ? center.introZh : center.introEn,
      contact: lang === 'zh' ? center.contactZh : center.contactEn,
      ext: center.ext,
      externalUrl: lang === 'en' ? (center.externalUrlEn ?? center.externalUrl) : center.externalUrl,
      deep: center.deep,
      branches: CENTER_BRANCHES[center.id].map((branch) => ({
        id: branch.id,
        name: lang === 'zh' ? branch.zh : branch.en,
        description: lang === 'zh' ? branch.descZh : branch.descEn,
      })),
    })),
  };
}

export function buildPeopleSource(lang: Lang) {
  return {
    centerPeople: CENTERS.map((center) => ({
      centerId: center.id,
      people: center.people.map((person) => buildPersonView(person, lang)),
    })),
    holisticInstructors: HOLISTIC_INSTRUCTORS.map((person) => buildPersonView(person, lang)),
    holisticSeedTeachers: HOLISTIC_SEED.map((person) => buildPersonView(person, lang)),
    holisticAiTeam: HOLISTIC_AI_TEAM.map((person) => buildPersonView(person, lang)),
    memberGroups: DEPARTMENT_MEMBER_GROUPS.map((group) => ({
      id: group.id,
      people: group.people.map((person) => buildPersonView(person, lang)),
    })),
  };
}

export function buildNewsSource() {
  return {
    announcementBoardUrl: ANN_URL,
    zh: {
      department: buildAnnouncementRecords('zh', 'dept'),
      holistic: buildAnnouncementRecords('zh', 'holistic'),
    },
    en: {
      department: buildAnnouncementRecords('en', 'dept'),
      holistic: buildAnnouncementRecords('en', 'holistic'),
    },
  };
}

export function buildActivitiesSource(lang: Lang) {
  return {
    department: buildActivityRecords(lang, 'dept'),
    holistic: buildActivityRecords(lang, 'holistic'),
  };
}

export function buildKpisSource(lang: Lang) {
  return { items: deptKpis(lang) };
}
