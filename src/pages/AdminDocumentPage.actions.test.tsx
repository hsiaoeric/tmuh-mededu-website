// @vitest-environment jsdom

import { act, cleanup, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { CmsAdminRevision, RepositoryResult } from '@/admin/repository';
import { deferred, detail, document, FakeDocumentRepository, revision } from '@/admin/workflows/testHarness';
import { ANN_URL } from '@/data/news';
import { renderDocumentRoute } from './AdminDocumentPage.testHarness';

async function readyDocument(
  repository: FakeDocumentRepository,
  initialDetail = detail(),
  mutationsAllowed = true,
) {
  repository.listResults.push(Promise.resolve({ ok: true, value: [document()] }));
  repository.readResults.push(Promise.resolve({ ok: true, value: initialDetail }));
  const view = renderDocumentRoute(repository, '/admin/content/news', mutationsAllowed);
  fireEvent.click(await view.findByRole('button', { name: '進階 JSON' }));
  await view.findByRole('textbox', { name: '雙語 JSON 內容' });
  return view;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function newsPayload(label: string) {
  return {
    announcementBoardUrl: ANN_URL,
    zh: {
      department: [{ id: 'notice', publishedOn: `2026-08-${label}`, category: 'department', pinned: false, tag: '公告', title: '公告', lines: [] }], holistic: [],
    },
    en: {
      department: [{ id: 'notice', publishedOn: `2026-08-${label}`, category: 'department', pinned: false, tag: 'News', title: 'News', lines: [] }], holistic: [],
    },
  };
}

function newsText(label: string): string {
  return JSON.stringify(newsPayload(label));
}

describe('AdminDocumentPage lifecycle actions', () => {
  it('disables and refuses save while protected mutations are blocked', async () => {
    // Given
    const user = userEvent.setup();
    const repository = new FakeDocumentRepository();
    const view = await readyDocument(repository, detail(), false);
    fireEvent.change(view.getByRole('textbox', { name: '雙語 JSON 內容' }), {
      target: { value: '{"title":"blocked"}' },
    });
    const save = view.getByRole('button', { name: '儲存草稿' });

    // When
    await user.click(save);

    // Then
    expect(save.hasAttribute('disabled')).toBe(true);
    expect(repository.saveCalls).toHaveLength(0);
  });

  it('enables save only for a dirty valid object and reports success', async () => {
    // Given
    const user = userEvent.setup();
    const repository = new FakeDocumentRepository();
    repository.saveResults.push(Promise.resolve({
      ok: true,
      value: revision({ editVersion: 3, payload: newsPayload('23') }),
    }));
    const view = await readyDocument(repository);
    const editor = view.getByRole('textbox', { name: '雙語 JSON 內容' });

    // When
    fireEvent.change(editor, { target: { value: newsText('23') } });
    const save = view.getByRole('button', { name: '儲存草稿' });
    await user.click(save);

    // Then
    await waitFor(() => expect(repository.saveCalls).toHaveLength(1));
    expect(await view.findAllByText('草稿已儲存')).toHaveLength(2);
    expect(view.getByRole('button', { name: '儲存草稿' }).hasAttribute('disabled')).toBe(true);
    await user.click(view.getByRole('button', { name: 'EN' }));
    expect(await view.findAllByText('Draft saved')).toHaveLength(2);
    expect(view.queryByText('草稿已儲存')).toBeNull();
  });

  it('returns to unsaved state and removes stale success when editing after save', async () => {
    // Given
    const user = userEvent.setup();
    const repository = new FakeDocumentRepository();
    repository.saveResults.push(Promise.resolve({
      ok: true,
      value: revision({ editVersion: 3, payload: newsPayload('23') }),
    }));
    const view = await readyDocument(repository);
    const editor = view.getByRole('textbox', { name: '雙語 JSON 內容' });
    fireEvent.change(editor, { target: { value: newsText('23') } });
    await user.click(view.getByRole('button', { name: '儲存草稿' }));
    await view.findAllByText('草稿已儲存');

    // When
    fireEvent.change(editor, { target: { value: newsText('24') } });

    // Then
    expect(view.queryAllByText('草稿已儲存')).toHaveLength(0);
    expect(view.getByText('尚有未儲存變更')).toBeTruthy();
  });

  it('publishes only after an explicit clean-draft confirmation', async () => {
    // Given
    const user = userEvent.setup();
    const repository = new FakeDocumentRepository();
    const pending = deferred<RepositoryResult<CmsAdminRevision>>();
    repository.publishResults.push(pending.promise);
    const view = await readyDocument(repository);

    // When
    await user.click(view.getByRole('button', { name: '發佈' }));
    expect(repository.publishCalls).toHaveLength(0);
    await user.click(view.getByRole('button', { name: '確認發佈' }));
    const publish = view.getByRole('button', { name: '發佈' });
    expect(publish.getAttribute('aria-busy')).toBe('true');
    expect(globalThis.document.activeElement).toBe(view.getByRole('heading', { level: 1 }));
    await user.click(publish);
    expect(repository.publishCalls).toHaveLength(1);
    await act(() => pending.resolve({
      ok: true,
      value: revision({ status: 'published', editVersion: 3, publishedAt: '2026-08-22T03:00:00Z' }),
    }));

    // Then
    await waitFor(() => expect(repository.publishCalls).toHaveLength(1));
    expect(await view.findAllByText('內容已發布')).toHaveLength(2);
    expect(view.queryByText('草稿已儲存')).toBeNull();
    await user.click(view.getByRole('button', { name: 'EN' }));
    expect(await view.findAllByText('Content published')).toHaveLength(2);
    expect(view.queryByText('Draft saved')).toBeNull();
  });

  it('archives only after an explicit warning confirmation', async () => {
    // Given
    const user = userEvent.setup();
    const repository = new FakeDocumentRepository();
    const pending = deferred<RepositoryResult<CmsAdminRevision>>();
    repository.archiveResults.push(pending.promise);
    const view = await readyDocument(repository);

    // When
    await user.click(view.getByRole('button', { name: '更多文件作業' }));
    await user.click(view.getByRole('button', { name: '封存' }));
    expect(repository.archiveCalls).toHaveLength(0);
    await user.click(view.getByRole('button', { name: '確認封存' }));
    expect(globalThis.document.activeElement).toBe(view.getByRole('heading', { level: 1 }));
    await user.click(view.getByRole('button', { name: '更多文件作業' }));
    const archive = view.getByRole('button', { name: '封存' });
    expect(archive.getAttribute('aria-busy')).toBe('true');
    await user.click(archive);
    expect(repository.archiveCalls).toHaveLength(1);
    await act(() => pending.resolve({
      ok: true,
      value: revision({ version: 8, status: 'archived', editVersion: 3, payload: newsPayload('25'), archivedAt: '2026-08-22T03:00:00Z' }),
    }));

    // Then
    await waitFor(() => expect(repository.archiveCalls).toHaveLength(1));
    expect(await view.findAllByText('內容已封存')).toHaveLength(2);
    expect(view.getByRole('heading', { name: '目前僅保留封存修訂版本' })).toBeTruthy();
    const archivedState = view.container.querySelector('.admin-state-panel[data-state="disabled"]');
    expect(archivedState?.textContent).toContain('封存版本 8');
    expect(view.queryByRole('button', { name: '進階 JSON' })).toBeNull();
    expect(view.queryByRole('textbox', { name: '雙語 JSON 內容' })).toBeNull();
    for (const label of ['儲存草稿', '發佈', '封存']) {
      expect(view.queryByRole('button', { name: label })).toBeNull();
    }
    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(false);
    expect(view.queryByText('草稿已儲存')).toBeNull();
    await user.click(view.getByRole('button', { name: 'EN' }));
    expect(await view.findAllByText('Content archived')).toHaveLength(2);
    expect(view.getByRole('heading', { name: 'Only archived revisions remain' })).toBeTruthy();
    expect(view.queryByText('Draft saved')).toBeNull();
  });

  it('keeps the exact dirty editor text after a stale conflict', async () => {
    // Given
    const user = userEvent.setup();
    const repository = new FakeDocumentRepository();
    repository.saveResults.push(Promise.resolve({
      ok: false,
      failure: { kind: 'stale-edit-version', error: { code: null, details: null, hint: null, message: 'stale' } },
    }));
    const view = await readyDocument(repository);
    const editor = view.getByRole('textbox', { name: '雙語 JSON 內容' });
    const exactText = JSON.stringify(newsPayload('23'), null, 2);

    // When
    fireEvent.change(editor, { target: { value: exactText } });
    await user.click(view.getByRole('button', { name: '儲存草稿' }));

    // Then
    expect(await view.findByText('內容版本已過期')).toBeTruthy();
    expect(editor).toHaveProperty('value', exactText);
    expect(view.getByText(/不會自動重新載入/)).toBeTruthy();
    expect(view.getByRole('button', { name: '儲存草稿' }).hasAttribute('disabled')).toBe(true);
    expect(view.getByRole('button', { name: '重新載入並保留編輯內容' })).toBeTruthy();
  });

  it('localizes a published actionable revision in zh-Hant', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    const published = revision({ status: 'published', editVersion: 4 });

    // When
    const view = await readyDocument(repository, {
      document: document(),
      revisions: [published],
    });

    // Then
    expect(view.queryByText('published')).toBeNull();
    expect(view.getAllByText('已發布')).toHaveLength(1);
  });
});
