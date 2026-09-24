import type {
  StructuredEditorCommit,
  StructuredEditorIssueSummary,
} from '@/admin/editors/shared';
import type { EditableCmsPayloadByKind } from '@/content/contracts/registry';

export type HolisticPayload = EditableCmsPayloadByKind['holistic'];
export type HolisticLocale = 'zh' | 'en';
export type HolisticIssues = readonly StructuredEditorIssueSummary[];
export type HolisticCommit = StructuredEditorCommit<HolisticPayload>;

export type HolisticEditorProps = {
  readonly payload: HolisticPayload;
  readonly issues: HolisticIssues;
  readonly onChange: HolisticCommit;
};

export type KpiRow = HolisticPayload['zh']['kpis'][number];
export type FeatureRow = HolisticPayload['zh']['features'][number];
export type AlgeeRow = HolisticPayload['zh']['algee'][number];
export type FlowRow = HolisticPayload['zh']['aiEcosystem']['flow'][number];
export type SymposiumRow = HolisticPayload['zh']['outcomes']['symposiums'][number];
