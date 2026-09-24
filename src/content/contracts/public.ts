import { CMS_DOCUMENT_STABLE_KEYS, type CmsDocumentKind, type CmsStableKey } from './kinds';
import type { Lang } from '@/i18n';

export type PublicContentIdentityFor<K extends CmsDocumentKind> = {
  readonly kind: K;
  readonly stableKey: CmsStableKey<K>;
};

export type PublicContentIdentity = {
  readonly [K in CmsDocumentKind]: PublicContentIdentityFor<K>;
}[CmsDocumentKind];

export const PUBLIC_CONTENT_IDENTITIES = {
  site_copy: { kind: 'site_copy', stableKey: CMS_DOCUMENT_STABLE_KEYS.site_copy },
  centers: { kind: 'centers', stableKey: CMS_DOCUMENT_STABLE_KEYS.centers },
  people: { kind: 'people', stableKey: CMS_DOCUMENT_STABLE_KEYS.people },
  news: { kind: 'news', stableKey: CMS_DOCUMENT_STABLE_KEYS.news },
  activities: { kind: 'activities', stableKey: CMS_DOCUMENT_STABLE_KEYS.activities },
  kpis: { kind: 'kpis', stableKey: CMS_DOCUMENT_STABLE_KEYS.kpis },
  honors: { kind: 'honors', stableKey: CMS_DOCUMENT_STABLE_KEYS.honors },
  digital_materials: {
    kind: 'digital_materials',
    stableKey: CMS_DOCUMENT_STABLE_KEYS.digital_materials,
  },
  facdev: { kind: 'facdev', stableKey: CMS_DOCUMENT_STABLE_KEYS.facdev },
  ebm: { kind: 'ebm', stableKey: CMS_DOCUMENT_STABLE_KEYS.ebm },
  holistic: { kind: 'holistic', stableKey: CMS_DOCUMENT_STABLE_KEYS.holistic },
  holistic_research: {
    kind: 'holistic_research',
    stableKey: CMS_DOCUMENT_STABLE_KEYS.holistic_research,
  },
} as const satisfies Readonly<{
  readonly [K in CmsDocumentKind]: PublicContentIdentityFor<K>;
}>;

export type PublicContentDocumentRequest = {
  readonly [K in CmsDocumentKind]: readonly [
    kind: K,
    stableKey: CmsStableKey<K>,
    lang: Lang,
  ];
}[CmsDocumentKind];

export type PublicContentInvariantDetails =
  | {
      readonly reason: 'missing';
      readonly expected: PublicContentIdentity;
    }
  | {
      readonly reason: 'mismatched';
      readonly expected: PublicContentIdentity;
      readonly actual: PublicContentIdentity;
    };
