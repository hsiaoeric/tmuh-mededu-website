import { useMemo } from 'react';
import { ORG_ORDER } from '@/app/routes';
import { usePublicContentDocument } from '@/content';
import { CENTER_BRANCHES, centerById, type Center, type CenterBranch } from '@/data/centers';
import type { RawPerson } from '@/data/people';
import type { CenterId } from '@/data/types';
import type { Lang } from '@/i18n';

export type PublicCenter = Omit<Center, 'people'> & {
  readonly people: readonly RawPerson[];
  readonly branches: readonly CenterBranch[];
};

export function usePublicCenters(lang: Lang): readonly PublicCenter[] {
  const zhDirectory = usePublicContentDocument('centers', 'directory', 'zh').value;
  const enDirectory = usePublicContentDocument('centers', 'directory', 'en').value;
  const peopleDirectory = usePublicContentDocument('people', 'directory', lang).value;

  return useMemo(() => ORG_ORDER.map((id) => {
    const zh = zhDirectory.centers.find((center) => center.id === id);
    const en = enDirectory.centers.find((center) => center.id === id);
    const people = peopleDirectory.centerPeople.find((group) => group.centerId === id);
    if (zh === undefined || en === undefined || people === undefined) {
      throw new TypeError(`Missing public center: ${id}`);
    }
    const presentation = centerById(id);
    if (presentation === undefined) throw new TypeError(`Missing center presentation: ${id}`);

    const branches = CENTER_BRANCHES[id].map((branchPresentation) => {
      const branch = zh.branches.find((candidate) => candidate.id === branchPresentation.id);
      const translated = en.branches.find((candidate) => candidate.id === branchPresentation.id);
      if (branch === undefined || translated === undefined) {
        throw new TypeError(`Missing public center branch: ${id}/${branchPresentation.id}`);
      }
      return {
        ...branchPresentation,
        zh: branch.name,
        en: translated.name,
        descZh: branch.description,
        descEn: translated.description,
      };
    });

    return {
      id,
      zh: zh.name,
      en: en.name,
      color: presentation.color,
      introZh: zh.intro,
      introEn: en.intro,
      contactZh: zh.contact,
      contactEn: en.contact,
      ext: zh.ext,
      externalUrl: zh.externalUrl,
      externalUrlEn: en.externalUrl,
      deep: zh.deep,
      people: people.people,
      branches,
    };
  }), [enDirectory, peopleDirectory, zhDirectory]);
}

export function publicCenterById(
  centers: readonly PublicCenter[],
  id: CenterId,
): PublicCenter {
  const center = centers.find((candidate) => candidate.id === id);
  if (center === undefined) throw new TypeError(`Missing public center: ${id}`);
  return center;
}

export function publicCenterExternalUrl(center: PublicCenter, isZh: boolean): string | undefined {
  return isZh ? center.externalUrl : center.externalUrlEn;
}
