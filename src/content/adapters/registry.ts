import { CMS_DOCUMENT_STABLE_KEYS, type CmsDocumentKind, type CmsStableKey } from '@/content/contracts/kinds';
import type { PublishedContent } from '@/content/domain';
import type { Lang } from '@/i18n';
import type { PublicMediaLocation } from './media';
import {
  adaptActivitiesCalendar,
  adaptCentersDirectory,
  adaptDepartmentHonors,
  adaptDepartmentKpis,
  adaptNewsAnnouncements,
  adaptPeopleDirectory,
  adaptSiteCopy,
} from './global';
import {
  adaptDigitalMaterialsPage,
  adaptEbmPage,
  adaptFacdevPage,
  adaptHolisticPage,
  adaptHolisticResearchRegistry,
} from './pages';

export const PUBLIC_ADAPTER_STABLE_KEYS = CMS_DOCUMENT_STABLE_KEYS satisfies Readonly<Record<CmsDocumentKind, string>>;

type PublicAdapterValueByKind = {
  readonly site_copy: ReturnType<typeof adaptSiteCopy>;
  readonly centers: ReturnType<typeof adaptCentersDirectory>;
  readonly people: ReturnType<typeof adaptPeopleDirectory>;
  readonly news: ReturnType<typeof adaptNewsAnnouncements>;
  readonly activities: ReturnType<typeof adaptActivitiesCalendar>;
  readonly kpis: ReturnType<typeof adaptDepartmentKpis>;
  readonly honors: ReturnType<typeof adaptDepartmentHonors>;
  readonly digital_materials: ReturnType<typeof adaptDigitalMaterialsPage>;
  readonly facdev: ReturnType<typeof adaptFacdevPage>;
  readonly ebm: ReturnType<typeof adaptEbmPage>;
  readonly holistic: ReturnType<typeof adaptHolisticPage>;
  readonly holistic_research: ReturnType<typeof adaptHolisticResearchRegistry>;
};

export type PublicAdapterResult = {
  readonly [K in CmsDocumentKind]: {
    readonly kind: K;
    readonly stableKey: CmsStableKey<K>;
    readonly value: PublicAdapterValueByKind[K];
  };
}[CmsDocumentKind];

export type PublicAdapterResultFor<K extends CmsDocumentKind> = Extract<
  PublicAdapterResult,
  { readonly kind: K }
>;

function assertNever(value: never): never {
  throw new TypeError(`Unexpected CMS document kind: ${String(value)}`);
}

export function adaptPublishedContent(
  document: PublishedContent,
  lang: Lang,
  media: PublicMediaLocation,
): PublicAdapterResult {
  switch (document.kind) {
    case 'site_copy': return { kind: document.kind, stableKey: document.stableKey, value: adaptSiteCopy(document.payload, lang) };
    case 'centers': return { kind: document.kind, stableKey: document.stableKey, value: adaptCentersDirectory(document.payload, lang) };
    case 'people': return { kind: document.kind, stableKey: document.stableKey, value: adaptPeopleDirectory(document.payload, lang, media) };
    case 'news': return { kind: document.kind, stableKey: document.stableKey, value: adaptNewsAnnouncements(document.payload, lang) };
    case 'activities': return { kind: document.kind, stableKey: document.stableKey, value: adaptActivitiesCalendar(document.payload, lang) };
    case 'kpis': return { kind: document.kind, stableKey: document.stableKey, value: adaptDepartmentKpis(document.payload, lang) };
    case 'honors': return { kind: document.kind, stableKey: document.stableKey, value: adaptDepartmentHonors(document.payload, lang) };
    case 'digital_materials': return { kind: document.kind, stableKey: document.stableKey, value: adaptDigitalMaterialsPage(document.payload, lang) };
    case 'facdev': return { kind: document.kind, stableKey: document.stableKey, value: adaptFacdevPage(document.payload, lang, media) };
    case 'ebm': return { kind: document.kind, stableKey: document.stableKey, value: adaptEbmPage(document.payload, lang) };
    case 'holistic': return { kind: document.kind, stableKey: document.stableKey, value: adaptHolisticPage(document.payload, lang) };
    case 'holistic_research': return { kind: document.kind, stableKey: document.stableKey, value: adaptHolisticResearchRegistry(document.payload, lang) };
    default: return assertNever(document);
  }
}
