// @vitest-environment jsdom

import { act, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CmsAdminDocumentDetail } from '@/admin/repository';
import { detail, document, FakeDocumentRepository, revision } from '@/admin/workflows/testHarness';
import { renderDocumentRoute } from './AdminDocumentPage.testHarness';

async function readyStructured(repository: FakeDocumentRepository, initialDetail: CmsAdminDocumentDetail = detail()) {
  repository.listResults.push(Promise.resolve({ ok: true, value: [document()] }));
  repository.readResults.push(Promise.resolve({ ok: true, value: initialDetail }));
  const view = renderDocumentRoute(repository, '/admin/content/news');
  await view.findByRole('button', { name: '進階 JSON' });
  return view;
}

function historyDetail(): CmsAdminDocumentDetail {
  const draft = revision();
  const published = revision({ id: 'rev-published' as typeof draft.id, version: 2, status: 'published', publishedAt: '2026-08-20T00:00:00Z' });
  const payload = structuredClone(draft.payload) as { zh: { department: { title: string }[] } };
  const department = payload.zh.department[0];
  if (department !== undefined) department.title = '更新後的公告';
  return { document: document(), revisions: [{ ...draft, payload }, published] };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AdminDocumentPage navigation aids', () => {
  it('opens the edit history from the status badges with each version summarised', async () => {
    const view = await readyStructured(new FakeDocumentRepository(), historyDetail());

    fireEvent.click(view.getByRole('button', { name: /查看編輯紀錄/ }));

    const dialog = await view.findByRole('dialog', { name: '編輯紀錄' });
    expect(within(dialog).getByText('草稿 · 版本 3')).toBeTruthy();
    expect(within(dialog).getByText('已發布 · 版本 2')).toBeTruthy();
    expect(within(dialog).getByText('變更 1 處')).toBeTruthy();
    expect(within(dialog).getByText('更新後的公告')).toBeTruthy();
    expect(within(dialog).getByText('最早的版本。')).toBeTruthy();
  });

  it('lists collections under their sections in the outline', async () => {
    const view = await readyStructured(new FakeDocumentRepository());

    const outline = await view.findByRole('navigation', { name: '本頁章節' });

    expect(within(outline).getByRole('link', { name: '教學部公告' })).toBeTruthy();
    expect(within(outline).getAllByRole('button', { name: /公告清單/ }).length).toBeGreaterThan(0);
  });

  it('keeps archive and technical details behind the overflow menu', async () => {
    const view = await readyStructured(new FakeDocumentRepository());
    const trigger = view.getByRole('button', { name: '更多文件作業' });
    expect(view.queryByRole('button', { name: '封存' })).toBeNull();

    fireEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(view.getByRole('button', { name: '封存' })).toBeTruthy();
    fireEvent.keyDown(globalThis.document, { key: 'Escape' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('searches documents and the open editor from the header', async () => {
    const view = await readyStructured(new FakeDocumentRepository());
    const search = view.getByRole('combobox', { name: '搜尋文件、章節與內容' });

    act(() => search.focus());
    fireEvent.change(search, { target: { value: '人員' } });
    expect(view.getByRole('option', { name: /人員\s?名錄/ })).toBeTruthy();

    fireEvent.change(search, { target: { value: '全人照護' } });
    expect(view.getByRole('option', { name: /全人照護\s?公告/ })).toBeTruthy();

    fireEvent.change(search, { target: { value: 'zzzz-no-match' } });
    expect(view.queryAllByRole('option')).toHaveLength(0);
  });

  it('remembers a hidden sidebar and the chosen editor text size', async () => {
    const view = await readyStructured(new FakeDocumentRepository());
    const shell = view.container.querySelector('.admin-shell');

    fireEvent.click(view.getByRole('button', { name: '隱藏側邊欄' }));
    fireEvent.click(view.getByRole('button', { name: '小字' }));

    expect(view.container.querySelector('#admin-desktop-nav')?.hasAttribute('hidden')).toBe(true);
    expect(view.getByRole('button', { name: '顯示側邊欄' }).getAttribute('aria-expanded')).toBe('false');
    expect(shell?.getAttribute('data-text-size')).toBe('sm');
    expect(localStorage.getItem('tmuh-admin-nav-collapsed')).toBe('true');
    expect(localStorage.getItem('tmuh-admin-text-size')).toBe('sm');
  });

  it('shows the preview beside the editor instead of replacing it', async () => {
    const view = await readyStructured(new FakeDocumentRepository());

    fireEvent.click(view.getByRole('button', { name: '預覽' }));

    const editor = view.container.querySelector('.admin-workspace-editor');
    expect(editor?.hasAttribute('hidden')).toBe(false);
    expect(view.container.querySelector('.admin-workspace-grid')?.hasAttribute('data-previewing')).toBe(true);
    expect(view.getByRole('button', { name: '關閉預覽' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('marks fields and outline entries that differ from the published version', async () => {
    const view = await readyStructured(new FakeDocumentRepository(), historyDetail());

    const edited = await view.findByDisplayValue('更新後的公告');

    expect(edited.closest('.admin-field')?.hasAttribute('data-changed')).toBe(true);
    for (const unchanged of view.getAllByDisplayValue('News')) expect(unchanged.closest('.admin-field')?.hasAttribute('data-changed')).toBe(false);
    const outline = view.getByRole('navigation', { name: '本頁章節' });
    expect(within(outline).getByRole('link', { name: /教學部公告.*有變更/ })).toBeTruthy();
  });

  it('undoes and redoes editor changes from the action bar', async () => {
    const view = await readyStructured(new FakeDocumentRepository());
    const undo = view.getByRole('button', { name: /^復原/ });
    expect(undo.hasAttribute('disabled')).toBe(true);
    const originals = view.getAllByDisplayValue('公告');

    fireEvent.change(originals[0]!, { target: { value: '改過的標題' } });
    expect(await view.findByDisplayValue('改過的標題')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: /^復原/ }));

    await waitFor(() => expect(view.queryByDisplayValue('改過的標題')).toBeNull());
    expect(view.getAllByDisplayValue('公告')).toHaveLength(originals.length);
    fireEvent.click(view.getByRole('button', { name: /^重做/ }));
    expect(await view.findByDisplayValue('改過的標題')).toBeTruthy();
  });

  it('offers the preview for center page documents', async () => {
    const repository = new FakeDocumentRepository();
    repository.listResults.push(Promise.resolve({ ok: true, value: [document('facdev')] }));
    repository.readResults.push(Promise.resolve({ ok: true, value: detail('facdev') }));
    const view = renderDocumentRoute(repository, '/admin/content/facdev');

    expect(await view.findByRole('button', { name: '預覽' })).toBeTruthy();
  });

  it('compares any two versions side by side with the changed characters marked', async () => {
    const view = await readyStructured(new FakeDocumentRepository(), historyDetail());
    fireEvent.click(view.getByRole('button', { name: /查看編輯紀錄/ }));
    const dialog = await view.findByRole('dialog', { name: '編輯紀錄' });

    fireEvent.click(within(dialog).getByRole('tab', { name: '並排比較' }));

    expect((within(dialog).getByRole('combobox', { name: '比較基準' }) as HTMLSelectElement).selectedOptions[0]?.textContent).toBe('版本 2 · 已發布');
    expect(within(dialog).getByText('共 1 處不同')).toBeTruthy();
    expect(dialog.querySelector('.admin-compare-cell[data-side="after"] ins')?.textContent).toBe('更新後的');
  });

  it('counts the changes from the published version and steps to them', async () => {
    const view = await readyStructured(new FakeDocumentRepository(), historyDetail());
    const edited = await view.findByDisplayValue('更新後的公告');

    expect(view.getByText('1 處變更')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '下一個變更' }));

    await waitFor(() => expect(globalThis.document.activeElement).toBe(edited));
  });
});
