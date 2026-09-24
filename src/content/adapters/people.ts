import type { PublishedCmsPayloadByKind } from '@/content/contracts/registry';
import type { RawPerson } from '@/data/people';
import type { Lang } from '@/i18n';
import { resolvePublishedMediaUrl, type PublicMediaLocation } from './media';

export type CmsPublishedPerson = PublishedCmsPayloadByKind['people']['zh']['centerPeople'][number]['people'][number];

export function adaptCmsPerson(
  zh: CmsPublishedPerson,
  en: CmsPublishedPerson,
  lang: Lang,
  media: PublicMediaLocation,
): RawPerson {
  const portrait = lang === 'zh' ? zh.portrait : en.portrait;
  return {
    identity: zh.id,
    zh: zh.name,
    en: en.name,
    role: zh.roleKey,
    roleLabel: lang === 'zh' ? zh.role : en.role,
    dZh: zh.department,
    dEn: en.department,
    slug: zh.slug,
    hubId: zh.hubId,
    dutyZh: zh.duty,
    dutyEn: en.duty,
    ext: zh.ext,
    email: zh.email,
    photoSrc: portrait == null ? '' : resolvePublishedMediaUrl(portrait, media),
  };
}

export function adaptCmsPeople(
  zhPeople: readonly CmsPublishedPerson[],
  enPeople: readonly CmsPublishedPerson[],
  lang: Lang,
  media: PublicMediaLocation,
): readonly RawPerson[] {
  const englishById = new Map(enPeople.map((person) => [person.id, person]));
  return zhPeople.map((zh) => {
    const en = englishById.get(zh.id);
    if (en === undefined) throw new TypeError(`Missing English person: ${zh.id}`);
    return adaptCmsPerson(zh, en, lang, media);
  });
}
