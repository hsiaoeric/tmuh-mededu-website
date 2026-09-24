import type {
  StructuredEditorCommit as GlobalEditorCommit,
  StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';
import { BranchesEditor } from './BranchesEditor';
import { CenterFields } from './CenterFields';
import type { CenterRecord, CentersPayload } from './types';

type CenterItemProps = {
  readonly index: number;
  readonly zh: CenterRecord;
  readonly en: CenterRecord;
  readonly payload: CentersPayload;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onChange: GlobalEditorCommit<CentersPayload>;
};

export function CenterItem({ index, zh, en, payload, issues, onChange }: CenterItemProps) {
  return (
    <div className="admin-editor-section-content">
      <CenterFields index={index} zh={zh} en={en} payload={payload} issues={issues} onChange={onChange} />
      <BranchesEditor centerIndex={index} zh={zh} en={en} payload={payload} issues={issues} onChange={onChange} />
    </div>
  );
}
