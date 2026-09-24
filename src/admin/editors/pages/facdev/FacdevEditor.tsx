import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { EditorValidation } from '@/admin/editors/global/ui/EditorValidation';
import { FacdevAboutCopy } from './FacdevAboutCopy';
import { FacdevContactCopy } from './FacdevContactCopy';
import { FacdevGroupsEditor } from './FacdevGroupsEditor';
import { FacdevKpisEditor } from './FacdevKpisEditor';
import { FacdevNewsClosingCopy } from './FacdevNewsClosingCopy';
import { FacdevScalarCopy } from './FacdevScalarCopy';
import { FacdevServicesEditor } from './FacdevServicesEditor';
import type { FacdevCommit, FacdevIssues, FacdevPayload } from './types';

export function FacdevEditor({ payload, issues, onChange }: {
  readonly payload: FacdevPayload;
  readonly issues: FacdevIssues;
  readonly onChange: FacdevCommit;
}) {
  const props = { payload, issues, onChange };
  return <div className="admin-stack" data-facdev-editor>
    <EditorSection id="facdev-editor" title="教師發展中心頁面" description="以受控雙語欄位維護頁面文字、列表與小組負責人。">
      <EditorValidation issues={issues} title={`教師發展內容有 ${issues.length} 個問題`} firstInvalidLabel="前往第一個問題" />
    </EditorSection>
    <FacdevScalarCopy {...props} />
    <FacdevAboutCopy {...props} />
    <FacdevContactCopy {...props} />
    <FacdevNewsClosingCopy {...props} />
    <FacdevKpisEditor {...props} />
    <FacdevServicesEditor {...props} />
    <FacdevGroupsEditor {...props} />
  </div>;
}
