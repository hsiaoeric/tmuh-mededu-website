import { useState } from 'react';
import { InlineNotice } from '@/admin/AdminFeedback';
import type {
  StructuredEditorCommit as GlobalEditorCommit,
  StructuredEditorCommitResult as GlobalEditorCommitResult,
  StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';
import { EditorTextField } from '../ui/EditorFields';
import { EditorSection } from '../ui/EditorSection';
import { EditorValidation } from '../ui/EditorValidation';
import { NewsScopeEditor } from './NewsScopeEditor';
import type { NewsMutationResult, NewsPayload } from './newsTypes';

export type NewsEditorProps = {
  readonly payload: NewsPayload;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onChange: GlobalEditorCommit<NewsPayload>;
};

export function NewsEditor({ payload, issues, onChange }: NewsEditorProps) {
  const [operationError, setOperationError] = useState<string | null>(null);
  const commit = (result: NewsMutationResult): GlobalEditorCommitResult => {
    if (!result.ok) {
      setOperationError(result.reason === 'length-mismatch'
        ? '繁體中文與英文項目數量不一致，請先修復配對資料。'
        : '找不到要修改的項目，請重新載入目前內容。');
      return { status: 'unchanged' };
    }
    setOperationError(null);
    return onChange(result.payload);
  };
  return (
    <div className="admin-stack" data-news-editor>
      <EditorSection
        id="news-editor"
        title="公告與消息"
        description="繁體中文優先顯示。所有陣列依目前手動順序保存，置頂與日期不會在編輯器內觸發排序。"
      >
        <EditorValidation issues={issues} title={`公告資料有 ${issues.length} 個問題`} firstInvalidLabel="前往第一個問題" />
        {operationError === null ? null : <InlineNotice status="error" title="無法完成配對操作">{operationError}</InlineNotice>}
        <EditorTextField
          path={['announcementBoardUrl']}
          issues={issues}
          label="共用公告看板 URL"
          helper="首頁與完整公告頁共用的外部公告看板連結。"
          type="url"
          required
          value={payload.announcementBoardUrl}
          onChange={(event) => commit({
            ok: true,
            payload: { ...payload, announcementBoardUrl: event.currentTarget.value },
          })}
        />
      </EditorSection>
      <NewsScopeEditor payload={payload} scope="department" issues={issues} onChange={commit} />
      <NewsScopeEditor payload={payload} scope="holistic" issues={issues} onChange={commit} />
    </div>
  );
}
