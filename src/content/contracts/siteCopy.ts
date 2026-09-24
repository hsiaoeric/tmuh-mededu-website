import { z } from 'zod';
import { bilingual, TextSchema } from './common';

const StringsSchema = z.strictObject({
  aiBody: TextSchema, aiTitle: TextSchema, backDept: TextSchema, brand1: TextSchema,
  brand2: TextSchema, chipCenters: TextSchema, chipSeed: TextSchema, comingSoon: TextSchema,
  contactTitle: TextSchema, ctaOrg: TextSchema, dept: TextSchema, deptShort: TextSchema,
  eventsDesc: TextSchema, eventsEn: TextSchema, eventsZh: TextSchema, footAddr: TextSchema,
  footBrand: TextSchema, footBrandEn: TextSchema, footNote: TextSchema, footTel: TextSchema,
  formingTeam: TextSchema, hAboutBody: TextSchema, hAboutTitle: TextSchema, hContactExt: TextSchema,
  hContactPerson: TextSchema, hContactPlace: TextSchema, hContactQuote: TextSchema,
  hCtaMhfa: TextSchema, hHeroTag: TextSchema, hHeroTitle: TextSchema, heroEyebrow: TextSchema,
  heroTag: TextSchema, heroTitle1: TextSchema, heroTitle2: TextSchema, hospital: TextSchema,
  instructorsTitle: TextSchema, kpiEyebrow: TextSchema, kpiTitle: TextSchema, langBtn: TextSchema,
  layoutHub: TextSchema, layoutTree: TextSchema, members: TextSchema, mhfaIntro: TextSchema,
  mhfaTitle: TextSchema, navAbout: TextSchema, navContact: TextSchema, navHolistic: TextSchema,
  navMhfa: TextSchema, navNews: TextSchema, navOrg: TextSchema, navSeed: TextSchema,
  newsDesc: TextSchema, newsEn: TextSchema, newsZh: TextSchema, orgDesc: TextSchema,
  orgTitle: TextSchema, seedDesc: TextSchema, seedTitle: TextSchema,
}).readonly();

const InlineSchema = z.strictObject({
  skipToContent: TextSchema,
  holisticAdministrativeTeam: TextSchema,
  holisticResearchTeam: TextSchema,
  holisticClosingTitle: TextSchema,
}).readonly();

export const EditableSiteCopyPayloadSchema = bilingual(
  z.strictObject({ strings: StringsSchema, inline: InlineSchema }).readonly(),
);

export const SiteCopyPayloadSchema = EditableSiteCopyPayloadSchema;
