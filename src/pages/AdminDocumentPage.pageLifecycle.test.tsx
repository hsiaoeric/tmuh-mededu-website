// @vitest-environment jsdom

import { act, cleanup, fireEvent, type RenderResult, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseDraftPayload } from '@/admin/documents';
import type { CmsAdminRevision, RepositoryResult } from '@/admin/repository';
import { deferred, FakeDocumentRepository, revision } from '@/admin/workflows/testHarness';
import {
  PAGE_EDITOR_KINDS,
  pageAdvancedEditor,
  pageFixture,
  queuePageDocument,
  readyPageRoute,
  renderDocumentRoute,
  renderNavigableDocumentRoute,
  structuredPageEditor,
} from './AdminDocumentPage.testHarness';

const PAGE_EDITOR_FIELD_NAMES = {
  digital_materials: /^頁面眉標（繁體中文）/,
  facdev: /^繁體中文頁首眉標/,
  ebm: /^頁面眉標（繁體中文）/,
  holistic: /^KPI 標籤（繁體中文）/,
  holistic_research: /^繁體中文頁面眉標/,
} as const satisfies Record<(typeof PAGE_EDITOR_KINDS)[number], RegExp>;

const PAGE_EDITOR_TEST_TIMEOUT_MS = 30_000;
const NativeRequest = Request;

class RouterTestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const signal = init?.signal;
    super(input, init === undefined ? undefined : { ...init, signal: undefined });
    if (signal !== undefined && signal !== null) {
      Object.defineProperty(this, 'signal', { value: signal });
    }
  }
}

function editFirstField(view: RenderResult, kind: (typeof PAGE_EDITOR_KINDS)[number], suffix: string): void {
  const control = within(structuredPageEditor(view, kind)).getByLabelText(PAGE_EDITOR_FIELD_NAMES[kind]);
  if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) {
    throw new TypeError(`Missing editable ${kind} field`);
  }
  fireEvent.change(control, { target: { value: `${control.value}${suffix}` } });
}

/** Archive and the technical details sit behind the action bar's overflow menu. */
function openDocumentMenu(view: RenderResult): void {
  const trigger = view.getByRole('button', { name: '更多文件作業' });
  if (trigger.getAttribute('aria-expanded') !== 'true') fireEvent.click(trigger);
}

function expectWorkspaceChrome(view: RenderResult, kind: (typeof PAGE_EDITOR_KINDS)[number]): void {
  expect(view.getByRole('main').id).toBe('admin-main');
  expect(view.getByRole('link', { name: '跳到管理內容' }).getAttribute('href')).toBe('#admin-main');
  expect(view.getByRole('complementary', { name: '文件資訊' })).toBeTruthy();
  expect(view.getByText(kind, { selector: 'code' })).toBeTruthy();
  openDocumentMenu(view);
  for (const label of ['儲存草稿', '發佈', '封存']) {
    expect(view.getByRole('button', { name: label })).toBeTruthy();
  }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'Request', {
    configurable: true,
    value: RouterTestRequest,
    writable: true,
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  Object.defineProperty(globalThis, 'Request', {
    configurable: true,
    value: NativeRequest,
    writable: true,
  });
});

describe('AdminDocumentPage page editor lifecycle', () => {
  it.each(PAGE_EDITOR_KINDS)('renders %s structured by default with workspace semantics', async (kind) => {
    const view = await readyPageRoute(new FakeDocumentRepository(), kind);

    expect(structuredPageEditor(view, kind)).toBeTruthy();
    expect(view.queryByRole('textbox', { name: '雙語 JSON 內容' })).toBeNull();
    expectWorkspaceChrome(view, kind);
    if (kind === 'facdev') {
      expect(view.getByRole('heading', { name: '視覺媒體工作區' })).toBeTruthy();
    }
  }, PAGE_EDITOR_TEST_TIMEOUT_MS);

  it.each(PAGE_EDITOR_KINDS)('toggles %s advanced source without changing canonical text', async (kind) => {
    const view = await readyPageRoute(new FakeDocumentRepository(), kind);
    const expected = JSON.stringify(pageFixture(kind), null, 2);

    const editor = await pageAdvancedEditor(view);

    expect(editor.value).toBe(expected);
    expect(view.getByText('內容已同步')).toBeTruthy();
    expect(view.getByRole('button', { name: '儲存草稿' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(view.getByRole('button', { name: '結構化編輯' }));
    expect(structuredPageEditor(view, kind)).toBeTruthy();
  }, PAGE_EDITOR_TEST_TIMEOUT_MS);

  it.each(PAGE_EDITOR_KINDS)('preserves exact malformed %s source and recovers to structured fields', async (kind) => {
    const view = await readyPageRoute(new FakeDocumentRepository(), kind);
    const editor = await pageAdvancedEditor(view);
    const original = editor.value;

    fireEvent.change(editor, { target: { value: '{"broken":\n' } });

    expect((await pageAdvancedEditor(view)).value).toBe('{"broken":\n');
    expect(view.getByText('無法開啟結構化編輯器')).toBeTruthy();
    openDocumentMenu(view);
    for (const label of ['儲存草稿', '發佈', '封存']) {
      expect(view.getByRole('button', { name: label }).hasAttribute('disabled')).toBe(true);
    }
    fireEvent.change(await pageAdvancedEditor(view), { target: { value: original } });
    fireEvent.click(view.getByRole('button', { name: '結構化編輯' }));
    expect(structuredPageEditor(view, kind)).toBeTruthy();
  }, PAGE_EDITOR_TEST_TIMEOUT_MS);

  it.each(PAGE_EDITOR_KINDS)('preserves exact structural %s fallback until corrected', async (kind) => {
    const view = await readyPageRoute(new FakeDocumentRepository(), kind);
    const editor = await pageAdvancedEditor(view);
    const original = editor.value;

    fireEvent.change(editor, { target: { value: '[]' } });

    expect((await pageAdvancedEditor(view)).value).toBe('[]');
    expect(view.getByText('無法開啟結構化編輯器')).toBeTruthy();
    fireEvent.change(await pageAdvancedEditor(view), { target: { value: original } });
    fireEvent.click(view.getByRole('button', { name: '結構化編輯' }));
    expect(structuredPageEditor(view, kind)).toBeTruthy();
  }, PAGE_EDITOR_TEST_TIMEOUT_MS);

  it.each(PAGE_EDITOR_KINDS)('remounts direct navigation to %s in structured mode', async (kind) => {
    const repository = new FakeDocumentRepository();
    const initialKind = kind === 'digital_materials' ? 'facdev' : 'digital_materials';
    queuePageDocument(repository, initialKind);
    const { router, view } = renderNavigableDocumentRoute(repository, `/admin/content/${initialKind}`);
    await pageAdvancedEditor(view);

    queuePageDocument(repository, kind);
    await act(async () => {
      await router.navigate(`/admin/content/${kind}`);
    });

    await waitFor(() => expect(structuredPageEditor(view, kind)).toBeTruthy());
    expect(view.queryByLabelText('雙語 JSON 內容')).toBeNull();
  }, PAGE_EDITOR_TEST_TIMEOUT_MS);

  it.each(PAGE_EDITOR_KINDS)('saves a dirty %s edit with its canonical payload', async (kind) => {
    const repository = new FakeDocumentRepository();
    const view = await readyPageRoute(repository, kind);
    editFirstField(view, kind, '整合修訂');
    expect(view.getByText('尚有未儲存變更')).toBeTruthy();
    const submittedText = (await pageAdvancedEditor(view)).value;
    const submitted = parseDraftPayload(submittedText);
    if (!submitted.ok) throw new TypeError('Expected valid page draft');
    repository.saveResults.push(Promise.resolve({
      ok: true,
      value: revision({ editVersion: 3, payload: submitted.payload }),
    }));

    fireEvent.click(view.getByRole('button', { name: '儲存草稿' }));

    await waitFor(() => expect(repository.saveCalls[0]?.payload).toEqual(submitted.payload));
    expect(await view.findAllByText('草稿已儲存')).toHaveLength(2);
  }, PAGE_EDITOR_TEST_TIMEOUT_MS);

  it.each(PAGE_EDITOR_KINDS)('reloads canonical %s payload as exact source text', async (kind) => {
    const submittedText = JSON.stringify(pageFixture(kind), null, 2);
    const submitted = parseDraftPayload(submittedText);
    if (!submitted.ok) throw new TypeError('Expected valid page draft');
    const repository = new FakeDocumentRepository();
    queuePageDocument(repository, kind, submitted.payload);

    const view = renderDocumentRoute(repository, `/admin/content/${kind}`);

    expect((await pageAdvancedEditor(view)).value).toBe(submittedText);
  }, PAGE_EDITOR_TEST_TIMEOUT_MS);

  it('retains post-submit page edits after a failed save', async () => {
    const user = userEvent.setup();
    const repository = new FakeDocumentRepository();
    const pending = deferred<RepositoryResult<CmsAdminRevision>>();
    repository.saveResults.push(pending.promise);
    const view = await readyPageRoute(repository, 'digital_materials');
    editFirstField(view, 'digital_materials', '已送出');
    await user.click(view.getByRole('button', { name: '儲存草稿' }));
    editFirstField(view, 'digital_materials', '送出後');
    const currentText = (await pageAdvancedEditor(view)).value;

    await act(() => pending.resolve({
      ok: false,
      failure: { kind: 'transport-error', error: { code: null, details: null, hint: null, message: 'offline' } },
    }));

    expect((await pageAdvancedEditor(view)).value).toBe(currentText);
    expect((await view.findAllByText('內容作業失敗')).length).toBeGreaterThan(0);
  });

  it('retains current page editor text after a stale conflict', async () => {
    const user = userEvent.setup();
    const repository = new FakeDocumentRepository();
    repository.saveResults.push(Promise.resolve({
      ok: false,
      failure: { kind: 'stale-edit-version', error: { code: null, details: null, hint: null, message: 'stale' } },
    }));
    const view = await readyPageRoute(repository, 'digital_materials');
    editFirstField(view, 'digital_materials', '衝突內容');
    const currentText = (await pageAdvancedEditor(view)).value;

    await user.click(view.getByRole('button', { name: '儲存草稿' }));

    expect(await view.findByText('內容版本已過期')).toBeTruthy();
    expect((await pageAdvancedEditor(view)).value).toBe(currentText);
  });

  it.each(['publish', 'archive'] as const)('keeps page %s behind workspace confirmation', async (operation) => {
    const user = userEvent.setup();
    const repository = new FakeDocumentRepository();
    repository[`${operation}Results`].push(Promise.resolve({
      ok: true,
      value: revision({ status: operation === 'publish' ? 'published' : 'archived', editVersion: 3 }),
    }));
    const view = await readyPageRoute(repository, 'digital_materials');
    const action = operation === 'publish' ? '發佈' : '封存';
    if (operation === 'archive') openDocumentMenu(view);

    await user.click(view.getByRole('button', { name: action }));
    expect(repository[`${operation}Calls`]).toHaveLength(0);
    await user.click(view.getByRole('button', { name: operation === 'publish' ? '確認發佈' : '確認封存' }));

    await waitFor(() => expect(repository[`${operation}Calls`]).toHaveLength(1));
  });

  it('rejects an unknown page kind before repository access', async () => {
    const repository = new FakeDocumentRepository();

    const view = renderDocumentRoute(repository, '/admin/content/not-a-kind');

    expect(await view.findByRole('heading', { name: '找不到此內容類型' })).toBeTruthy();
    expect(repository.listResults).toHaveLength(0);
    expect(repository.readResults).toHaveLength(0);
  });
});
