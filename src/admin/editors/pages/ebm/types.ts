import type { EditableCmsPayloadByKind } from '@/content/contracts/registry';

export type EbmPayload = EditableCmsPayloadByKind['ebm'];
export type EbmLocale = EbmPayload['zh'];
export type LocaleKey = keyof EbmPayload;
export type Kpi = EbmLocale['kpis'][number];
export type Mission = EbmLocale['missions'][number];
export type Award = EbmLocale['awardsLit'][number];
export type Stage = EbmLocale['stages'][number];
export type CourseGroup = EbmLocale['courseGroups'][number];
export type CourseRow = CourseGroup['rows'][number];
