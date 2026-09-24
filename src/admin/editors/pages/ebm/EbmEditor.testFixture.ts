import snapshot from '@/content/generated/cms-snapshot.json';
import {
  CMS_PAYLOAD_REGISTRY,
  type EditableCmsPayloadByKind,
} from '@/content/contracts/registry';

export type EbmPayload = EditableCmsPayloadByKind['ebm'];

export function ebmFixture(): EbmPayload {
  const document = snapshot.find((candidate) => candidate.kind === 'ebm');
  if (document === undefined) throw new TypeError('Missing EBM snapshot fixture');
  return CMS_PAYLOAD_REGISTRY.ebm.editableSchema.parse(structuredClone(document.payload));
}

export function compactEbmFixture(): EbmPayload {
  const payload = ebmFixture();
  const compactLocale = (locale: 'zh' | 'en'): EbmPayload[typeof locale] => ({
    ...payload[locale],
    kpis: payload[locale].kpis.slice(0, 2),
    missions: payload[locale].missions.slice(0, 2),
    awardsLit: payload[locale].awardsLit.slice(0, 2),
    awardsClin: payload[locale].awardsClin.slice(0, 2),
    awardsTrans: payload[locale].awardsTrans.slice(0, 2),
    stages: payload[locale].stages.slice(0, 2).map((stage) => ({
      ...stage,
      items: stage.items.slice(0, 2),
    })),
    courseGroups: payload[locale].courseGroups.slice(0, 2).map((group) => ({
      ...group,
      rows: group.rows.slice(0, 2),
    })),
  });
  return { zh: compactLocale('zh'), en: compactLocale('en') };
}
