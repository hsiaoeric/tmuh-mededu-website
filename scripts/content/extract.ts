import {
  CMS_DOCUMENT_STABLE_KEYS,
  type CmsDocumentKind,
} from '../../src/content/domain';
import { parseCmsSourceDocuments } from '../../src/content/contracts/source';
import { en } from '../../src/i18n/en';
import { zh } from '../../src/i18n/zh';
import {
  buildActivitiesSource,
  buildCentersSource,
  buildKpisSource,
  buildNewsSource,
  buildPeopleSource,
} from './coreSources';
import { SITE_INLINE_COPY } from './inlineCopy';
import { toJsonObject } from './json';
import {
  buildDigitalMaterialsSource,
  buildEbmSource,
  buildFacdevSource,
  buildHolisticResearchSource,
  buildHolisticSource,
  buildHonorsSource,
} from './pageSources';
import type { SourceDocument } from './types';

type BilingualSource = {
  readonly zh: unknown;
  readonly en: unknown;
};

function sourceDocument(kind: CmsDocumentKind, source: BilingualSource) {
  return {
    kind,
    stableKey: CMS_DOCUMENT_STABLE_KEYS[kind],
    payload: toJsonObject(source),
  };
}

export function buildSourceDocuments(): readonly SourceDocument[] {
  const documents = [
    sourceDocument('site_copy', {
      zh: { strings: zh, inline: SITE_INLINE_COPY.zh },
      en: { strings: en, inline: SITE_INLINE_COPY.en },
    }),
    sourceDocument('centers', { zh: buildCentersSource('zh'), en: buildCentersSource('en') }),
    sourceDocument('people', { zh: buildPeopleSource('zh'), en: buildPeopleSource('en') }),
    sourceDocument('news', buildNewsSource()),
    sourceDocument('activities', {
      zh: buildActivitiesSource('zh'),
      en: buildActivitiesSource('en'),
    }),
    sourceDocument('kpis', { zh: buildKpisSource('zh'), en: buildKpisSource('en') }),
    sourceDocument('honors', { zh: buildHonorsSource('zh'), en: buildHonorsSource('en') }),
    sourceDocument('digital_materials', {
      zh: buildDigitalMaterialsSource('zh'),
      en: buildDigitalMaterialsSource('en'),
    }),
    sourceDocument('facdev', { zh: buildFacdevSource('zh'), en: buildFacdevSource('en') }),
    sourceDocument('ebm', { zh: buildEbmSource('zh'), en: buildEbmSource('en') }),
    sourceDocument('holistic', {
      zh: buildHolisticSource('zh'),
      en: buildHolisticSource('en'),
    }),
    sourceDocument('holistic_research', {
      zh: buildHolisticResearchSource('zh'),
      en: buildHolisticResearchSource('en'),
    }),
  ];

  return parseCmsSourceDocuments(documents);
}
