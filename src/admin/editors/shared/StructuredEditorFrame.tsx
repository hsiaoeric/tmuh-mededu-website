import { useState, type ReactElement, type ReactNode } from 'react';
import { AdminButton } from '@/admin/AdminButton';
import { InlineNotice } from '@/admin/AdminFeedback';
import { AdminToolbar } from '@/admin/AdminShell';
import { DocumentJsonEditor, type DocumentWorkspace } from '@/admin/documents';
import { useSite } from '@/app/site';
import type { CmsDocumentKind } from '@/content/contracts/kinds';
import type { EditableCmsPayloadByKind } from '@/content/contracts/registry';
import type { StructuredEditorCommitResult } from './useStructuredEditorModel';
import { useStructuredEditorModel } from './useStructuredEditorModel';
import {
  mapStructuredEditorIssues,
  type StructuredEditorIssueSummary,
} from './validation';

export type StructuredEditorFrameProps<K extends CmsDocumentKind> = {
  readonly kind: K;
  readonly workspace: DocumentWorkspace;
  readonly onChange: (editorText: string) => void;
  readonly renderStructured: (model: {
    readonly editorText: string;
    readonly payload: EditableCmsPayloadByKind[K];
    readonly issues: readonly StructuredEditorIssueSummary[];
    readonly commitPayload: (
      payload: EditableCmsPayloadByKind[K],
    ) => StructuredEditorCommitResult;
  }) => ReactNode;
};

export function StructuredEditorFrame<K extends CmsDocumentKind>({
  kind,
  workspace,
  onChange,
  renderStructured,
}: StructuredEditorFrameProps<K>): ReactElement {
  const { isZh } = useSite();
  const [mode, setMode] = useState<'structured' | 'advanced'>('structured');
  const model = useStructuredEditorModel({
    kind,
    editorText: workspace.editorText,
    onEditorTextChange: onChange,
  });
  const structured = model.status === 'valid' || model.status === 'editable-invalid';
  const recoveryRequired = !structured;
  const advanced = mode === 'advanced' || recoveryRequired;
  const mappedIssues = model.status === 'valid'
    ? []
    : mapStructuredEditorIssues(model.issues, isZh);

  return (
    <div className="admin-stack">
      <div className="admin-editor-mode">
      <AdminToolbar label={isZh ? '編輯模式' : 'Editor mode'}>
        <span className="admin-editor-mode-label" aria-hidden="true">{isZh ? '編輯方式' : 'Edit as'}</span>
        <AdminButton
          variant="quiet"
          aria-pressed={!advanced}
          disabled={recoveryRequired || mode === 'structured'}
          onClick={() => setMode('structured')}
        >
          {isZh ? '結構化編輯' : 'Structured editor'}
        </AdminButton>
        <AdminButton
          variant="quiet"
          aria-pressed={advanced}
          disabled={advanced}
          onClick={() => setMode('advanced')}
        >
          {isZh ? '進階 JSON' : 'Advanced JSON'}
        </AdminButton>
      </AdminToolbar>
      </div>
      {recoveryRequired ? (
        <InlineNotice
          status="error"
          title={isZh ? '無法開啟結構化編輯器' : 'Structured editor unavailable'}
        >
          <span>{isZh ? '原始文字會完整保留。請在 JSON 編輯器手動修正內容結構。' : 'The exact source text is preserved. Correct its structure manually in the JSON editor.'}</span>
          <span className="admin-editor-validation-list">
            {mappedIssues.map((summary) => (
              <span key={`${summary.fieldId}-${summary.issue.message}`}>
                {summary.message}
              </span>
            ))}
          </span>
        </InlineNotice>
      ) : null}
      {advanced
        ? <DocumentJsonEditor workspace={workspace} onChange={onChange} />
        : renderStructured({ ...model, issues: mappedIssues })}
    </div>
  );
}
