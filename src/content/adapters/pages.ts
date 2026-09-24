import type { PublishedCmsPayloadByKind } from '@/content/contracts/registry';
import type { Lang } from '@/i18n';
import type { PublicMediaLocation } from './media';
import { adaptCmsPerson } from './people';
export { adaptHolisticResearchRegistry } from './collections';

export function adaptDigitalMaterialsPage(payload: PublishedCmsPayloadByKind['digital_materials'], lang: Lang) {
  return payload[lang];
}

export function adaptFacdevPage(payload: PublishedCmsPayloadByKind['facdev'], lang: Lang, media: PublicMediaLocation) {
  return {
    ...payload[lang],
    groups: payload[lang].groups.map((group, index) => {
      const zh = payload.zh.groups[index];
      const en = payload.en.groups[index];
      if (zh === undefined || en === undefined) throw new TypeError(`Missing facdev group: ${index}`);
      return { ...group, lead: adaptCmsPerson(zh.lead, en.lead, lang, media) };
    }),
  };
}

export function adaptEbmPage(payload: PublishedCmsPayloadByKind['ebm'], lang: Lang) {
  return payload[lang];
}

export function adaptHolisticPage(payload: PublishedCmsPayloadByKind['holistic'], lang: Lang) {
  return payload[lang];
}
