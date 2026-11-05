// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ChangedFieldNavigator } from '@/admin/ChangedFieldNavigator';
import { isFieldChanged } from '@/admin/documents/changedFields';
import { displayStructuredEditorIssue, mapStructuredEditorIssues } from '@/admin/editors/shared';
import { EditorDensityProvider } from '@/admin/editors/global/ui/EditorDensity';
import { FieldDecorationsProvider } from '@/admin/fieldDecorations';
import { SiteProvider } from '@/app/site';
import { snapshotPayload } from './archiveTestHarness';
import { PostsEditor } from './posts/PostsEditor';

afterEach(cleanup);

describe('archive validation messages', () => {
  it.each([
    ['Text must not be empty', '此欄位為必填，請輸入內容。', 'This field is required.'],
    ['Text must be at most 200 characters', '文字最多 200 個字元。', 'Use at most 200 characters.'],
    ['Text must not start or end with whitespace', '開頭與結尾不可有空白，請刪除多餘空白。', 'Remove the spaces at the start or end.'],
    ['Link must be an https, http, site path, mailto, or tel address', '連結必須是 https:// 或 http:// 網址、站內路徑（/ 開頭）、mailto: 或 tel:。', 'Links must be an https:// or http:// URL, a site path starting with /, mailto:, or tel:.'],
    ['Center posts must belong to a center', '中心文章的所屬單位必須是中心。', 'A center article must belong to a center.'],
    ['Program pgy outcomesPageId must name a program page owned by that program', '計畫 pgy 只能選擇類別為「學員專區計畫」且屬於該計畫的頁面。', 'Program pgy can only use a trainee program page that belongs to it.'],
  ])('explains “%s” in both admin languages', (message, zh, en) => {
    expect(displayStructuredEditorIssue({ path: ['posts', 0], message, code: 'custom' }, true)).toBe(zh);
    expect(displayStructuredEditorIssue({ path: ['posts', 0], message, code: 'custom' }, false)).toBe(en);
  });
});

describe('changed fields in closed archive rows', () => {
  it('marks the closed row and opens it from the changed-field navigator', async () => {
    const payload = snapshotPayload('posts');
    const changed = mapStructuredEditorIssues([{ path: ['posts', 2, 'title', 'zh'], message: 'x' }]).map((summary) => summary.fieldId);
    const view = render(
      <SiteProvider>
        <main className="admin-main">
          <ChangedFieldNavigator count={1} />
          <div className="admin-workspace-editor">
            <FieldDecorationsProvider value={{ isZh: true, isChanged: (fieldId) => isFieldChanged(changed, fieldId) }}>
              <EditorDensityProvider collapseItemsByDefault isZh>
                <PostsEditor payload={payload} issues={[]} onChange={() => ({ status: 'unchanged' })} />
              </EditorDensityProvider>
            </FieldDecorationsProvider>
          </div>
        </main>
      </SiteProvider>,
    );
    const row = view.container.querySelector('[data-archive-row-index="2"]')!;
    expect(row.hasAttribute('data-changed-collapsed')).toBe(true);
    expect(view.container.querySelectorAll('[data-changed-collapsed]')).toHaveLength(1);
    fireEvent.click(view.getByRole('button', { name: '下一個變更' }));
    await waitFor(() => expect(document.activeElement?.id).toBe(changed[0]));
    expect(row.hasAttribute('data-changed-collapsed')).toBe(false);
  });
});
