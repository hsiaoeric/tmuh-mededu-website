import type {
  StructuredEditorCommit,
  StructuredEditorIssueSummary,
} from '@/admin/editors/shared';
import type { EditableCmsPayloadByKind } from '@/content/contracts/registry';

export type FacdevPayload = EditableCmsPayloadByKind['facdev'];
export type FacdevLocale = FacdevPayload['zh'];
export type FacdevLocaleKey = 'zh' | 'en';
export type FacdevKpi = FacdevLocale['kpis'][number];
export type FacdevService = FacdevLocale['services'][number];
export type FacdevGroup = FacdevLocale['groups'][number];
export type FacdevLead = FacdevGroup['lead'];
export type FacdevLeadField = Exclude<keyof FacdevLead, 'portrait'>;
export type FacdevIssues = readonly StructuredEditorIssueSummary[];
export type FacdevCommit = StructuredEditorCommit<FacdevPayload>;
