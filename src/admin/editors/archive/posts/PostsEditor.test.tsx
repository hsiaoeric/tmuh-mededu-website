// @vitest-environment jsdom

import { cleanup, fireEvent, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import redirects from '@/data/legacy/redirects.json';
import { emitStructuredEditorText, parseStructuredEditorText } from '@/admin/editors/shared';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { renderArchiveEditor, snapshotPayload } from '../archiveTestHarness';
import { legacyArchiveIds, mergeLockedIds, publishedArchiveIds } from '../lockedIds';
import { PostsEditor } from './PostsEditor';

afterEach(cleanup);

const payload = snapshotPayload('posts');
const lockedIds = mergeLockedIds(publishedArchiveIds('posts', payload as never), legacyArchiveIds(redirects));

function renderPosts(options: { readonly lockedIds?: typeof lockedIds; readonly isZh?: boolean } = { lockedIds }) {
  return renderArchiveEditor('posts', PostsEditor, payload, { today: '2026-11-04', ...options });
}

function rowToggles(view: ReturnType<typeof renderPosts>) {
  return view.container.querySelectorAll<HTMLButtonElement>('#posts-editor .admin-archive-row-toggle');
}

describe('PostsEditor', () => {
  it('round-trips the committed archive through the structured editor codec unchanged', () => {
    const text = emitStructuredEditorText('posts', payload);
    const parsed = parseStructuredEditorText('posts', text);
    expect(parsed.status).toBe('valid');
    if (parsed.status !== 'valid') return;
    expect(parsed.payload).toEqual(payload);
    expect(emitStructuredEditorText('posts', parsed.payload)).toBe(text);
  });

  it('lists every post as a closed one-line row without rendering post fields', () => {
    const view = renderPosts();
    const toggles = rowToggles(view);
    expect(toggles).toHaveLength(payload.posts.length);
    expect([...toggles].every((toggle) => toggle.getAttribute('aria-expanded') === 'false')).toBe(true);
    expect(view.container.querySelectorAll('#posts-editor textarea')).toHaveLength(0);
    const first = toggles[0]!;
    expect(first.textContent).toMatch(/^\d{4}-\d{2}-\d{2} · /);
  });

  it('filters by channel, category, year, and text', () => {
    const view = renderPosts();
    fireEvent.change(view.getByRole('combobox', { name: '頻道' }), { target: { value: 'honors' } });
    const honors = payload.posts.filter((post) => post.channel === 'honors').length;
    expect(rowToggles(view)).toHaveLength(honors);
    expect(view.getByText(`顯示 ${honors}／${payload.posts.length} 個文章`)).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '清除篩選' }));
    const sample = payload.posts[3]!;
    fireEvent.change(view.getByRole('searchbox', { name: '搜尋標題、摘要或識別碼' }), { target: { value: sample.title.zh } });
    expect([...rowToggles(view)].some((toggle) => toggle.textContent?.includes(sample.title.zh))).toBe(true);
    fireEvent.change(view.getByRole('searchbox', { name: '搜尋標題、摘要或識別碼' }), { target: { value: '不存在的文章標題' } });
    expect(rowToggles(view)).toHaveLength(0);
    expect(view.getByText('沒有符合篩選條件的項目')).toBeTruthy();
  });

  it('opens one post at a time and keeps legacy ids read-only', () => {
    const view = renderPosts();
    const legacyIndex = payload.posts.findIndex((post) => lockedIds.posts?.has(post.id));
    const legacyPost = payload.posts[legacyIndex]!;
    const row = view.container.querySelector(`[data-archive-list="posts-list"][data-archive-row-index="${legacyIndex}"]`)!;
    fireEvent.click(within(row as HTMLElement).getByRole('button', { expanded: false }));
    const id = view.getByRole('textbox', { name: /^文章識別碼/ }) as HTMLInputElement;
    expect(id.value).toBe(legacyPost.id);
    expect(id.readOnly).toBe(true);
    fireEvent.change(id, { target: { value: 'changed' } });
    expect(view.history).toHaveLength(0);
    expect(view.container.querySelectorAll('.admin-archive-row-content')).toHaveLength(1);
  });

  it('adds a post with a unique date-based id that stays editable, then edits its title', () => {
    const view = renderPosts();
    fireEvent.click(view.getByRole('button', { name: '新增文章' }));
    const added = view.latest().posts.slice(-1)[0]!;
    expect(added.id).toBe('2026-11-04-1');
    expect(view.latest().posts).toHaveLength(payload.posts.length + 1);
    const id = view.getByRole('textbox', { name: /^文章識別碼/ }) as HTMLInputElement;
    expect(id.readOnly).toBe(false);
    expect(document.activeElement).toBe(id);
    fireEvent.change(id, { target: { value: 'Bad Id' } });
    expect(view.getByText(/識別碼只能使用小寫英文字母/)).toBeTruthy();
    fireEvent.change(id, { target: { value: 'pgy-recruitment-2027' } });
    fireEvent.change(view.getByRole('textbox', { name: /^標題（中文）/ }), { target: { value: '115 學年 PGY 招募' } });
    const latest = view.latest();
    expect(latest.posts.slice(-1)[0]).toMatchObject({ id: 'pgy-recruitment-2027', title: { zh: '115 學年 PGY 招募' } });
    expect(CMS_PAYLOAD_REGISTRY.posts.schema.safeParse(latest).success).toBe(true);
    // Existing posts keep their index paths.
    expect(latest.posts.slice(0, payload.posts.length)).toEqual(payload.posts);
  });

  it('deletes a post only after confirming, warning when old links point to it', () => {
    const view = renderPosts();
    const index = payload.posts.findIndex((post) => lockedIds.posts?.has(post.id));
    const row = view.container.querySelector(`[data-archive-row-index="${index}"]`) as HTMLElement;
    fireEvent.click(within(row).getByRole('button', { name: /^刪除文章/ }));
    const dialog = view.getByRole('dialog');
    expect(dialog.textContent).toContain('舊網站連結');
    fireEvent.click(within(dialog).getByRole('button', { name: '保留' }));
    expect(view.history).toHaveLength(0);
    fireEvent.click(within(row).getByRole('button', { name: /^刪除文章/ }));
    fireEvent.click(within(view.getByRole('dialog')).getByRole('button', { name: '確認刪除' }));
    expect(view.latest().posts).toHaveLength(payload.posts.length - 1);
    expect(view.latest().posts.some((post) => post.id === payload.posts[index]!.id)).toBe(false);
  });

  it('offers the five trainee programs as audiences and stores them in program order', () => {
    const view = renderPosts();
    fireEvent.click(view.getByRole('button', { name: '新增文章' }));
    const audiences = view.getByRole('group', { name: '學員專區對象（選填）' });
    const boxes = within(audiences).getAllByRole('checkbox');
    expect(boxes).toHaveLength(5);
    fireEvent.click(boxes[1]!);
    fireEvent.click(boxes[0]!);
    expect(view.latest().posts.slice(-1)[0]?.audiences).toEqual(['residents', 'pgy']);
  });

  it('validates attachment links as they are typed', () => {
    const view = renderPosts();
    fireEvent.click(view.getByRole('button', { name: '新增文章' }));
    fireEvent.click(view.getByRole('button', { name: '新增附件' }));
    const href = view.getByRole('textbox', { name: /^附件 1 連結/ });
    fireEvent.change(href, { target: { value: 'ftp://files.example/x.pdf' } });
    expect(href.getAttribute('aria-invalid')).toBe('true');
    fireEvent.change(href, { target: { value: 'files/legacy/downloads/form.pdf' } });
    expect(href.getAttribute('aria-invalid')).toBeNull();
    expect(view.latest().posts.slice(-1)[0]?.attachments).toEqual([{ id: 'attachment-1', label: { zh: '' }, href: 'files/legacy/downloads/form.pdf' }]);
  });

  it('opens the post holding an issue from the validation summary', async () => {
    const broken = { ...payload, posts: payload.posts.map((post, index) => (index === 5 ? { ...post, title: { zh: '' } } : post)) };
    const view = renderArchiveEditor('posts', PostsEditor, broken, { lockedIds, today: '2026-11-04' });
    const row = view.container.querySelector('[data-archive-row-index="5"]') as HTMLElement;
    expect(within(row).getByText('1 個問題')).toBeTruthy();
    fireEvent.click(view.getByRole('link', { name: '此欄位為必填，請輸入內容。' }));
    await new Promise((resolve) => setTimeout(resolve, 80));
    const title = view.getByRole('textbox', { name: /^標題（中文）/ });
    expect(document.activeElement).toBe(title);
  });

  it('labels the editor in English when the admin is in English', () => {
    const view = renderPosts({ lockedIds, isZh: false });
    expect(view.getByRole('button', { name: 'Add post' })).toBeTruthy();
    expect(view.getByRole('combobox', { name: 'Channel' })).toBeTruthy();
    expect(view.getAllByText('Chinese only').length).toBeGreaterThan(0);
  });
});
