import { AdminTextarea } from '@/admin/AdminFields';
import { InlineNotice } from '@/admin/AdminFeedback';
import { assertNever } from '@/admin/documents/assertNever';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { EditorValidation } from '@/admin/editors/global/ui/EditorValidation';
import { mapStructuredEditorIssues, useStructuredEditorModel } from '@/admin/editors/shared';
import { useSite } from '@/app/site';
import { ClinicalStatsEditor } from './ClinicalStatsEditor';
import { CopyFields } from './CopyFields';
import { PapersEditor } from './PapersEditor';
import { YearTotalsEditor } from './YearTotalsEditor';

export type HolisticResearchEditorProps = {
  readonly editorText: string;
  readonly onEditorTextChange: (editorText: string) => void;
};

export function HolisticResearchEditor({ editorText, onEditorTextChange }: HolisticResearchEditorProps) {
  const { isZh } = useSite();
  const model = useStructuredEditorModel({
    kind: 'holistic_research',
    editorText,
    onEditorTextChange,
  });
  switch (model.status) {
    case 'valid':
    case 'editable-invalid': {
      const issues = model.status === 'valid' ? [] : mapStructuredEditorIssues(model.issues, isZh);
      const partProps = { payload: model.payload, issues, onPayloadChange: model.commitPayload };
      return (
        <div className="admin-editor admin-stack holistic-research-editor" data-stable-key="registry">
          <EditorValidation issues={issues} title="部分全人研究數值需要修正" firstInvalidLabel="前往第一個問題" />
          <CopyFields {...partProps} />
          <EditorSection id="holistic-research-statistics" title="研究統計" description="年度與臨床統計採雙語位置配對，新增、移動與刪除皆為單次原子更新。">
            <YearTotalsEditor {...partProps} />
            <ClinicalStatsEditor {...partProps} />
          </EditorSection>
          <EditorSection id="holistic-research-papers" title="論文與作者" description="論文及其巢狀作者保留明確順序，不做隱含排序。">
            <PapersEditor {...partProps} />
          </EditorSection>
        </div>
      );
    }
    case 'malformed-json':
    case 'invalid-root':
    case 'invalid-payload':
      return (
        <div className="admin-stack" data-stable-key="registry">
          <InlineNotice status="error" title="雙語結構不一致，請修正原始 JSON">
            原始文字會完整保留；結構恢復後會自動回到受控欄位編輯。
          </InlineNotice>
          <AdminTextarea label="全人研究原始 JSON" className="mono" value={editorText} onChange={(event) => onEditorTextChange(event.currentTarget.value)} />
        </div>
      );
    default:
      return assertNever(model, 'holistic_research editor model');
  }
}
