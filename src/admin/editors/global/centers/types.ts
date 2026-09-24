import type {
  StructuredEditorCommit as GlobalEditorCommit,
  StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';
import type { CmsPayloadByKind } from '@/content/contracts/registry';

export type CentersPayload = CmsPayloadByKind['centers'];
export type CentersLocale = keyof CentersPayload;
export type CenterRecord = CentersPayload['zh']['centers'][number];
export type BranchRecord = CenterRecord['branches'][number];

export type CentersEditorProps = {
  readonly payload: CentersPayload;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onChange: GlobalEditorCommit<CentersPayload>;
};
