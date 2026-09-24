import type { StructuredEditorCommit, StructuredEditorIssueSummary } from '@/admin/editors/shared';
import { EditorValidation } from '@/admin/editors/global/ui/EditorValidation';
import { AwardsEditor } from './AwardsEditor';
import { CopyColorsEditor } from './CopyColorsEditor';
import { CourseGroupsEditor } from './CourseGroupsEditor';
import { KpisEditor } from './KpisEditor';
import { MissionsEditor } from './MissionsEditor';
import { StagesEditor } from './StagesEditor';
import type { EbmPayload } from './types';

export type EbmStructuredEditorProps = {
  readonly payload: EbmPayload;
  readonly issues: readonly StructuredEditorIssueSummary[];
  readonly onChange: StructuredEditorCommit<EbmPayload>;
};

export function EbmStructuredEditor({ payload, issues, onChange }: EbmStructuredEditorProps) {
  return (
    <div className="admin-editor admin-stack" data-testid="ebm-structured-editor">
      <EditorValidation issues={issues} title="部分實證醫學內容需要修正" firstInvalidLabel="前往第一個問題" />
      <CopyColorsEditor payload={payload} issues={issues} onChange={onChange} />
      <KpisEditor payload={payload} issues={issues} onChange={onChange} />
      <MissionsEditor payload={payload} issues={issues} onChange={onChange} />
      <AwardsEditor payload={payload} issues={issues} onChange={onChange} />
      <StagesEditor payload={payload} issues={issues} onChange={onChange} />
      <CourseGroupsEditor payload={payload} issues={issues} onChange={onChange} />
    </div>
  );
}
