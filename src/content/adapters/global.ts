import type { PublishedCmsPayloadByKind } from '@/content/contracts/registry';
import type { Lang } from '@/i18n';
import { adaptCmsPeople } from './people';
import type { PublicMediaLocation } from './media';
export { adaptActivitiesCalendar, adaptNewsAnnouncements } from './collections';

export function adaptSiteCopy(payload: PublishedCmsPayloadByKind['site_copy'], lang: Lang) {
  return payload[lang];
}

export function adaptCentersDirectory(payload: PublishedCmsPayloadByKind['centers'], lang: Lang) {
  return payload[lang];
}

export function adaptPeopleDirectory(payload: PublishedCmsPayloadByKind['people'], lang: Lang, media: PublicMediaLocation) {
  const localized = payload[lang];
  return {
    centerPeople: localized.centerPeople.map((group) => {
      const zh = payload.zh.centerPeople.find((candidate) => candidate.centerId === group.centerId);
      const en = payload.en.centerPeople.find((candidate) => candidate.centerId === group.centerId);
      if (zh === undefined || en === undefined) throw new TypeError(`Missing center people: ${group.centerId}`);
      return { ...group, people: adaptCmsPeople(zh.people, en.people, lang, media) };
    }),
    holisticInstructors: adaptCmsPeople(payload.zh.holisticInstructors, payload.en.holisticInstructors, lang, media),
    holisticSeedTeachers: adaptCmsPeople(payload.zh.holisticSeedTeachers, payload.en.holisticSeedTeachers, lang, media),
    holisticAiTeam: adaptCmsPeople(payload.zh.holisticAiTeam, payload.en.holisticAiTeam, lang, media),
    memberGroups: localized.memberGroups.map((group) => {
      const zh = payload.zh.memberGroups.find((candidate) => candidate.id === group.id);
      const en = payload.en.memberGroups.find((candidate) => candidate.id === group.id);
      if (zh === undefined || en === undefined) throw new TypeError(`Missing member group: ${group.id}`);
      return { ...group, people: adaptCmsPeople(zh.people, en.people, lang, media) };
    }),
  };
}

export function adaptDepartmentKpis(payload: PublishedCmsPayloadByKind['kpis'], lang: Lang) {
  return payload[lang];
}

export function adaptDepartmentHonors(payload: PublishedCmsPayloadByKind['honors'], lang: Lang) {
  return payload[lang];
}
