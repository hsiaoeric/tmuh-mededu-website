import type {
  StructuredEditorCommit,
  StructuredEditorCommitResult,
  StructuredEditorIssueSummary,
} from '@/admin/editors/shared';
import type { EditableCmsPayloadByKind } from '@/content/contracts/registry';

export type ResearchPayload = EditableCmsPayloadByKind['holistic_research'];
export type ResearchLocaleKey = 'zh' | 'en';
export type ResearchLocale = ResearchPayload[ResearchLocaleKey];
export type ResearchYear = ResearchLocale['byYear'][number];
export type ResearchClinicalStat = ResearchLocale['clinicalStats'][number];
export type ResearchPaper = ResearchLocale['papers'][number];
export type AuthoredNumber = ResearchYear['year'];
export type ResearchCommit = StructuredEditorCommit<ResearchPayload>;
export type ResearchCommitResult = StructuredEditorCommitResult;
export type ResearchIssues = readonly StructuredEditorIssueSummary[];

export type ResearchEditorPartProps = {
  readonly payload: ResearchPayload;
  readonly issues: ResearchIssues;
  readonly onPayloadChange: ResearchCommit;
};
