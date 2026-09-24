// @vitest-environment jsdom

import { act, cleanup, fireEvent, type RenderResult, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { CmsAdminRevision, RepositoryResult } from '@/admin/repository';
import { parseDraftPayload } from '@/admin/documents';
import type { Json } from '@/content/database.types';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import snapshot from '@/content/generated/cms-snapshot.json';
import { deferred, document, FakeDocumentRepository, revision } from '@/admin/workflows/testHarness';
import { renderDocumentRoute } from './AdminDocumentPage.testHarness';

const source = snapshot.find((candidate) => candidate.kind === 'kpis');
if (source === undefined) throw new TypeError('Missing KPI fixture');
const INITIAL_PAYLOAD = CMS_PAYLOAD_REGISTRY.kpis.schema.parse(source.payload);
const INITIAL_TEXT = JSON.stringify(INITIAL_PAYLOAD, null, 2);
const initialDraft = parseDraftPayload(INITIAL_TEXT);
if (!initialDraft.ok) throw new TypeError('Invalid KPI fixture');
const INITIAL_JSON = initialDraft.payload;

async function readyKpis(repository: FakeDocumentRepository, payload: Json = INITIAL_JSON) {
  repository.listResults.push(Promise.resolve({ ok: true, value: [document('kpis')] }));
  repository.readResults.push(Promise.resolve({
    ok: true,
    value: { document: document('kpis'), revisions: [revision({ payload })] },
  }));
  const view = renderDocumentRoute(repository, '/admin/content/kpis');
  await waitFor(() => {
    const editor = view.container.querySelector('#kpis-editor');
    if (!(editor instanceof HTMLElement)) throw new TypeError('Missing KPI editor');
    within(editor).getAllByRole('textbox', { name: '繁體中文標籤' });
  });
  return view;
}

function editLabel(view: RenderResult, value: string): void {
  const editor = view.container.querySelector('#kpis-editor');
  if (!(editor instanceof HTMLElement)) throw new TypeError('Missing KPI editor');
  const input = within(editor).getAllByRole('textbox', { name: '繁體中文標籤' })[0];
  if (!(input instanceof HTMLInputElement)) throw new TypeError('Missing KPI label editor');
  fireEvent.change(input, {
    target: { value },
  });
}

function toolbar(view: RenderResult, label: '文件作業' | '編輯模式'): HTMLElement {
  const element = view.container.querySelector(`[role="toolbar"][aria-label="${label}"]`);
  if (!(element instanceof HTMLElement)) throw new TypeError(`Missing ${label} toolbar`);
  return element;
}

function actionButton(view: RenderResult, name: string): HTMLElement {
  // Save and publish live in the sticky document toolbar; archive sits in the side rail.
  return view.getByRole('button', { name });
}

async function advancedText(view: RenderResult): Promise<string> {
  const existing = view.container.querySelector('textarea');
  if (existing === null) {
    fireEvent.click(within(toolbar(view, '編輯模式')).getByRole('button', { name: '進階 JSON' }));
  }
  const editor = await waitFor(() => {
    const element = view.container.querySelector('textarea');
    if (!(element instanceof HTMLTextAreaElement)) throw new TypeError('Missing JSON editor');
    return element;
  });
  if (!(editor instanceof HTMLTextAreaElement)) throw new TypeError('Missing JSON editor');
  return editor.value;
}

function successfulRevision(operation: 'save' | 'publish' | 'archive', payload: Json): CmsAdminRevision {
  if (operation === 'publish') return revision({ status: 'published', editVersion: 3, payload, publishedAt: '2026-08-27T03:00:00Z' });
  if (operation === 'archive') return revision({ status: 'archived', editVersion: 3, payload, archivedAt: '2026-08-27T03:00:00Z' });
  return revision({ editVersion: 3, payload });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AdminDocumentPage structured global lifecycle', () => {
  it('saves the current canonical structured payload and advances the clean baseline', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    const view = await readyKpis(repository);
    editLabel(view, '整合後標籤');
    const emittedText = await advancedText(view);
    const emittedPayload = CMS_PAYLOAD_REGISTRY.kpis.schema.parse(JSON.parse(emittedText));
    const draft = parseDraftPayload(emittedText);
    if (!draft.ok) throw new TypeError('Expected emitted draft payload');
    repository.saveResults.push(Promise.resolve({ ok: true, value: revision({ editVersion: 3, payload: draft.payload }) }));

    // When
    fireEvent.click(actionButton(view, '儲存草稿'));

    // Then
    expect(emittedText).not.toBe(INITIAL_TEXT);
    await waitFor(() => expect(repository.saveCalls).toHaveLength(1));
    expect(repository.saveCalls[0]?.payload).toEqual(emittedPayload);
    expect(await view.findAllByText('草稿已儲存')).toHaveLength(2);
    expect(actionButton(view, '儲存草稿').hasAttribute('disabled')).toBe(true);
    expect(await advancedText(view)).toBe(emittedText);
  });

  it('retains the exact canonical structured edit after a failed save', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    repository.saveResults.push(Promise.resolve({
      ok: false,
      failure: { kind: 'transport-error', error: { code: null, details: null, hint: null, message: 'offline' } },
    }));
    const view = await readyKpis(repository);
    editLabel(view, '離線仍保留');
    const emittedText = await advancedText(view);

    // When
    fireEvent.click(actionButton(view, '儲存草稿'));

    // Then
    expect((await view.findAllByText('內容作業失敗')).length).toBeGreaterThan(0);
    expect(await advancedText(view)).toBe(emittedText);
    expect(actionButton(view, '儲存草稿').hasAttribute('disabled')).toBe(false);
  });

  it.each(['save', 'publish'] as const)('preserves a structured edit made while %s is pending', async (operation) => {
    // Given
    const repository = new FakeDocumentRepository();
    const pending = deferred<RepositoryResult<CmsAdminRevision>>();
    repository[`${operation}Results`].push(pending.promise);
    const view = await readyKpis(repository);
    let submittedPayload: Json = INITIAL_JSON;
    if (operation === 'save') {
      editLabel(view, '已送出版本');
      const submitted = parseDraftPayload(await advancedText(view));
      if (!submitted.ok) throw new TypeError('Expected submitted draft payload');
      submittedPayload = submitted.payload;
      fireEvent.click(within(toolbar(view, '編輯模式')).getByRole('button', { name: '結構化編輯' }));
      fireEvent.click(actionButton(view, '儲存草稿'));
    } else {
      fireEvent.click(actionButton(view, '發佈'));
      fireEvent.click(view.getByRole('button', { name: '確認發佈' }));
    }
    editLabel(view, `等待 ${operation} 時的新版本`);
    const newerText = await advancedText(view);

    // When
    await act(() => pending.resolve({ ok: true, value: successfulRevision(operation, submittedPayload) }));

    // Then
    expect(await advancedText(view)).toBe(newerText);
    expect(newerText).not.toBe(JSON.stringify(submittedPayload, null, 2));
    expect(actionButton(view, '儲存草稿').hasAttribute('disabled')).toBe(false);
    expect(actionButton(view, '發佈').hasAttribute('disabled')).toBe(true);
    expect(actionButton(view, '封存').hasAttribute('disabled')).toBe(true);
  });

  it('transitions to archived-only state when the final archive completes after a later edit', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    const pending = deferred<RepositoryResult<CmsAdminRevision>>();
    repository.archiveResults.push(pending.promise);
    const view = await readyKpis(repository);
    fireEvent.click(actionButton(view, '封存'));
    fireEvent.click(view.getByRole('button', { name: '確認封存' }));
    editLabel(view, '等待 archive 時的新版本');

    // When
    await act(() => pending.resolve({
      ok: true,
      value: successfulRevision('archive', INITIAL_JSON),
    }));

    // Then
    expect(await view.findByRole('heading', { name: '目前僅保留封存修訂版本' })).toBeTruthy();
    expect(view.queryByRole('button', { name: '進階 JSON' })).toBeNull();
    expect(view.queryByRole('textbox', { name: '雙語 JSON 內容' })).toBeNull();
    for (const label of ['儲存草稿', '發佈', '封存']) {
      expect(view.queryByRole('button', { name: label })).toBeNull();
    }
    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(false);
  });

  it('recovers newer server metadata without replacing exact stale-conflict text', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    repository.saveResults.push(Promise.resolve({ ok: false, failure: { kind: 'stale-edit-version', error: { code: null, details: null, hint: null, message: 'stale' } } }));
    const view = await readyKpis(repository);
    editLabel(view, '我的衝突版本');
    const emittedText = await advancedText(view);
    fireEvent.click(actionButton(view, '儲存草稿'));
    await view.findByText('內容版本已過期');
    repository.readResults.push(Promise.resolve({ ok: true, value: {
      document: document('kpis'), revisions: [revision({ editVersion: 8, payload: INITIAL_JSON })],
    } }));

    // When
    fireEvent.click(view.getByRole('button', { name: '重新載入並保留編輯內容' }));

    // Then
    await waitFor(() => expect(view.container.querySelector('.admin-document-details')?.textContent).toContain('編輯權杖8'));
    expect(await advancedText(view)).toBe(emittedText);
    expect(view.getByText('尚有未儲存變更')).toBeTruthy();
  });

  it('retains malformed raw bytes through conflict recovery', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    repository.saveResults.push(Promise.resolve({ ok: false, failure: { kind: 'stale-edit-version', error: { code: null, details: null, hint: null, message: 'stale' } } }));
    const view = await readyKpis(repository);
    editLabel(view, '先建立衝突');
    fireEvent.click(actionButton(view, '儲存草稿'));
    await view.findByText('內容版本已過期');
    fireEvent.click(within(toolbar(view, '編輯模式')).getByRole('button', { name: '進階 JSON' }));
    const raw = await view.findByRole('textbox', { name: '雙語 JSON 內容' });
    fireEvent.change(raw, { target: { value: '{"raw":\n' } });
    repository.readResults.push(Promise.resolve({ ok: true, value: {
      document: document('kpis'), revisions: [revision({ editVersion: 9, payload: INITIAL_JSON })],
    } }));

    // When
    fireEvent.click(view.getByRole('button', { name: '重新載入並保留編輯內容' }));

    // Then
    await waitFor(() => expect(view.container.querySelector('.admin-document-details')?.textContent).toContain('編輯權杖9'));
    expect(await advancedText(view)).toBe('{"raw":\n');
    expect(view.getByText('無法開啟結構化編輯器')).toBeTruthy();
  });

  it('activates route and browser guards and keeps actions unavailable for dirty malformed text', async () => {
    // Given
    const user = userEvent.setup();
    const repository = new FakeDocumentRepository();
    const view = await readyKpis(repository);
    editLabel(view, '尚未儲存');
    const dirtyUnload = new Event('beforeunload', { cancelable: true });

    // When
    window.dispatchEvent(dirtyUnload);
    await user.click(view.getByRole('link', { name: /管理總覽/u }));

    // Then
    expect(dirtyUnload.defaultPrevented).toBe(true);
    expect(view.getByRole('heading', { name: '離開並放棄未儲存的變更？' })).toBeTruthy();
    await user.click(view.getByRole('button', { name: '繼續編輯' }));
    await advancedText(view);
    const raw = view.getByRole('textbox', { name: '雙語 JSON 內容' });
    fireEvent.change(raw, { target: { value: '{broken' } });
    expect(view.getByRole('button', { name: '發佈' }).hasAttribute('disabled')).toBe(true);
    expect(view.getByRole('button', { name: '封存' }).hasAttribute('disabled')).toBe(true);
    expect(await advancedText(view)).toBe('{broken');
  });
});
