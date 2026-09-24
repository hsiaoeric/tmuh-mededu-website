import { z } from 'zod';
import { ActivitiesPayloadSchema, EditableActivitiesPayloadSchema } from './activities';
import { CentersPayloadSchema, EditableCentersPayloadSchema, PublishedCentersPayloadSchema } from './centers';
import { DigitalMaterialsPayloadSchema, EditableDigitalMaterialsPayloadSchema } from './digitalMaterials';
import { EbmPayloadSchema, EditableEbmPayloadSchema } from './ebm';
import { EditableFacdevPayloadSchema, FacdevPayloadSchema, PublishedFacdevPayloadSchema } from './facdev';
import { EditableHolisticPayloadSchema, HolisticPayloadSchema } from './holistic';
import { EditableHolisticResearchPayloadSchema, HolisticResearchPayloadSchema } from './holisticResearch';
import { EditableHonorsPayloadSchema, HonorsPayloadSchema } from './honors';
import {
  CMS_DOCUMENT_STABLE_KEYS,
  type CmsDocumentKind,
  type CmsStableKey,
} from './kinds';
import { EditableKpisPayloadSchema, KpisPayloadSchema } from './kpis';
import { EditableNewsPayloadSchema, NewsPayloadSchema } from './news';
import { EditablePeoplePayloadSchema, PeoplePayloadSchema, PublishedPeoplePayloadSchema } from './people';
import { EditableSiteCopyPayloadSchema, SiteCopyPayloadSchema } from './siteCopy';

export type CmsPayloadContract<
  K extends CmsDocumentKind,
  E extends z.ZodType,
  S extends z.ZodType,
  P extends z.ZodType = S,
> = {
  readonly kind: K;
  readonly stableKey: CmsStableKey<K>;
  readonly editableSchema: E;
  readonly schema: S;
  readonly publishedSchema: P;
};

type CmsPayloadRegistry = {
  readonly [K in CmsDocumentKind]: CmsPayloadContract<K, z.ZodType, z.ZodType, z.ZodType>;
};

function contract<K extends CmsDocumentKind, E extends z.ZodType, S extends z.ZodType, P extends z.ZodType>(
  kind: K,
  stableKey: CmsStableKey<K>,
  schemas: { readonly editable: E; readonly general: S; readonly published: P },
): CmsPayloadContract<K, E, S, P> {
  return { kind, stableKey, editableSchema: schemas.editable, schema: schemas.general, publishedSchema: schemas.published };
}

export const CMS_PAYLOAD_REGISTRY = {
  site_copy: contract('site_copy', CMS_DOCUMENT_STABLE_KEYS.site_copy, { editable: EditableSiteCopyPayloadSchema, general: SiteCopyPayloadSchema, published: SiteCopyPayloadSchema }),
  centers: contract('centers', CMS_DOCUMENT_STABLE_KEYS.centers, { editable: EditableCentersPayloadSchema, general: CentersPayloadSchema, published: PublishedCentersPayloadSchema }),
  people: contract('people', CMS_DOCUMENT_STABLE_KEYS.people, { editable: EditablePeoplePayloadSchema, general: PeoplePayloadSchema, published: PublishedPeoplePayloadSchema }),
  news: contract('news', CMS_DOCUMENT_STABLE_KEYS.news, { editable: EditableNewsPayloadSchema, general: NewsPayloadSchema, published: NewsPayloadSchema }),
  activities: contract('activities', CMS_DOCUMENT_STABLE_KEYS.activities, { editable: EditableActivitiesPayloadSchema, general: ActivitiesPayloadSchema, published: ActivitiesPayloadSchema }),
  kpis: contract('kpis', CMS_DOCUMENT_STABLE_KEYS.kpis, { editable: EditableKpisPayloadSchema, general: KpisPayloadSchema, published: KpisPayloadSchema }),
  honors: contract('honors', CMS_DOCUMENT_STABLE_KEYS.honors, { editable: EditableHonorsPayloadSchema, general: HonorsPayloadSchema, published: HonorsPayloadSchema }),
  digital_materials: contract('digital_materials', CMS_DOCUMENT_STABLE_KEYS.digital_materials, { editable: EditableDigitalMaterialsPayloadSchema, general: DigitalMaterialsPayloadSchema, published: DigitalMaterialsPayloadSchema }),
  facdev: contract('facdev', CMS_DOCUMENT_STABLE_KEYS.facdev, { editable: EditableFacdevPayloadSchema, general: FacdevPayloadSchema, published: PublishedFacdevPayloadSchema }),
  ebm: contract('ebm', CMS_DOCUMENT_STABLE_KEYS.ebm, { editable: EditableEbmPayloadSchema, general: EbmPayloadSchema, published: EbmPayloadSchema }),
  holistic: contract('holistic', CMS_DOCUMENT_STABLE_KEYS.holistic, { editable: EditableHolisticPayloadSchema, general: HolisticPayloadSchema, published: HolisticPayloadSchema }),
  holistic_research: contract('holistic_research', CMS_DOCUMENT_STABLE_KEYS.holistic_research, { editable: EditableHolisticResearchPayloadSchema, general: HolisticResearchPayloadSchema, published: HolisticResearchPayloadSchema }),
} satisfies CmsPayloadRegistry;

export type CmsPayloadByKind = {
  readonly [K in CmsDocumentKind]: z.output<(typeof CMS_PAYLOAD_REGISTRY)[K]['schema']>;
};

export type EditableCmsPayloadByKind = {
  readonly [K in CmsDocumentKind]: z.output<(typeof CMS_PAYLOAD_REGISTRY)[K]['editableSchema']>;
};

export type PublishedCmsPayloadByKind = {
  readonly [K in CmsDocumentKind]: z.output<(typeof CMS_PAYLOAD_REGISTRY)[K]['publishedSchema']>;
};

export type CmsPayload = CmsPayloadByKind[CmsDocumentKind];

export type CmsSourceDocument = {
  readonly [K in CmsDocumentKind]: {
    readonly kind: K;
    readonly stableKey: CmsStableKey<K>;
    readonly payload: CmsPayloadByKind[K];
  };
}[CmsDocumentKind];

export function safeParseContractPayload<S extends z.ZodType>(
  schema: S,
  input: unknown,
): z.ZodSafeParseResult<z.output<S>> {
  return schema.safeParse(input);
}
