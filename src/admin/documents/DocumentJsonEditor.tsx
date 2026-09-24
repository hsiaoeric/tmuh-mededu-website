import { useSite } from '@/app/site';
import { AdminTextarea } from '@/admin/AdminFields';
import { InlineNotice } from '@/admin/AdminFeedback';
import { AdminSaveStatus } from '@/admin/AdminShell';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import type { DocumentWorkspace } from './workspaceState';
import { parseDraftPayload } from './workspaceValidation';

type DocumentJsonEditorProps = {
  readonly workspace: DocumentWorkspace;
  readonly onChange: (editorText: string) => void;
};

export function DocumentJsonEditor({ workspace, onChange }: DocumentJsonEditorProps) {
  const { isZh } = useSite();
  const draftResult = parseDraftPayload(workspace.editorText);
  const publishValid = draftResult.ok && CMS_PAYLOAD_REGISTRY[workspace.document.kind]
    .publishedSchema.safeParse(draftResult.payload).success;
  const label = isZh ? '雙語 JSON 內容' : 'Bilingual JSON content';
  const invalidJson = isZh
    ? '請輸入有效的 JSON 物件。文字會保留，修正後可繼續。'
    : 'Enter a valid JSON object. Your text is preserved while you correct it.';
  const draftValid = isZh ? '草稿格式有效' : 'Draft format valid';

  return (
    <div className="admin-stack">
      <AdminTextarea
        className="mono"
        label={label}
        lang={isZh ? 'zh-Hant' : 'en'}
        rows={18}
        spellCheck={false}
        value={workspace.editorText}
        error={draftResult.ok ? undefined : invalidJson}
        helper={draftResult.ok ? (isZh ? 'JSON 物件可儲存為草稿。' : 'This JSON object can be saved as a draft.') : undefined}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      <AdminSaveStatus state={draftResult.ok ? 'ready' : 'error'}>
        {draftResult.ok ? draftValid : (isZh ? '草稿格式無效' : 'Draft format invalid')}
      </AdminSaveStatus>
      {draftResult.ok ? (
        <InlineNotice
          status={publishValid ? 'success' : 'warning'}
          title={publishValid
            ? (isZh ? '可發佈' : 'Ready to publish')
            : (isZh ? '可儲存草稿，尚不可發佈' : 'Draft can be saved; not ready to publish')}
          lang={isZh ? 'zh-Hant' : 'en'}
        >
          {publishValid
            ? (isZh ? '內容符合此文件類型的發佈規則。' : 'The content meets this document type’s publication rules.')
            : (isZh ? '保留目前文字並補齊發佈必填內容。' : 'Keep the current text and complete the publication requirements.')}
        </InlineNotice>
      ) : (
        <InlineNotice
          status="error"
          title={isZh ? 'JSON 格式錯誤' : 'Invalid JSON'}
          lang={isZh ? 'zh-Hant' : 'en'}
        >
          {invalidJson}
        </InlineNotice>
      )}
    </div>
  );
}
