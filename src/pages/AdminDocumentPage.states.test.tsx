// @vitest-environment jsdom

import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RepositoryResult, CmsAdminDocumentDetail } from '@/admin/repository';
import { deferred, detail, document, FakeDocumentRepository, revision } from '@/admin/workflows/testHarness';
import snapshot from '@/content/generated/cms-snapshot.json';
import {
  PAGE_EDITOR_KINDS,
  PAGE_EDITOR_SELECTORS,
  pageFixture,
  renderDocumentRoute,
  renderNavigableDocumentRoute,
} from './AdminDocumentPage.testHarness';

const peopleSource = snapshot.find((candidate) => candidate.kind === 'people');
if (peopleSource === undefined) throw new TypeError('Missing people fixture');

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

class RouteObservingRepository extends FakeDocumentRepository {
  onNextList: (() => void) | null = null;

  override listDocuments(signal?: AbortSignal) {
    this.onNextList?.();
    this.onNextList = null;
    return super.listDocuments(signal);
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

describe('AdminDocumentPage states', () => {
  it('shows a recoverable not-found state for an invalid kind without loading documents', async () => {
    // Given
    const repository = new FakeDocumentRepository();

    // When
    const view = renderDocumentRoute(repository, '/admin/content/not-a-kind');

    // Then
    expect(await view.findByRole('heading', { name: '找不到此內容類型' })).toBeTruthy();
    expect(view.getByRole('link', { name: '返回管理總覽' }).getAttribute('href')).toBe('/admin');
    expect(repository.listSignals).toHaveLength(0);
  });

  it('shows workflow loading while the canonical document list is pending', () => {
    // Given
    const repository = new FakeDocumentRepository();
    repository.listResults.push(deferred<Awaited<ReturnType<FakeDocumentRepository['listDocuments']>>>().promise);

    // When
    const view = renderDocumentRoute(repository);

    // Then
    expect(view.getByRole('heading', { name: '正在載入公告內容' })).toBeTruthy();
  });

  it('shows missing when the canonical backing document does not exist', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    repository.listResults.push(Promise.resolve({ ok: true, value: [] }));

    // When
    const view = renderDocumentRoute(repository);

    // Then
    expect(await view.findByRole('heading', { name: '尚未建立公告文件' })).toBeTruthy();
  });

  it('shows a retry action after a workflow load error', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    repository.listResults.push(Promise.resolve({
      ok: false,
      failure: { kind: 'malformed-payload' },
    }));

    // When
    const view = renderDocumentRoute(repository);

    // Then
    expect(await view.findByRole('heading', { name: '無法載入公告內容' })).toBeTruthy();
    expect(view.getByRole('button', { name: '重試' })).toBeTruthy();
  });

  it('renders revision context and the structured workspace when ready', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    repository.listResults.push(Promise.resolve({ ok: true, value: [document()] }));
    repository.readResults.push(Promise.resolve({ ok: true, value: detail() }));

    // When
    const view = renderDocumentRoute(repository);

    // Then
    expect(await view.findByRole('button', { name: '進階 JSON' })).toBeTruthy();
    expect(view.queryByRole('textbox', { name: '雙語 JSON 內容' })).toBeNull();
    expect(view.getByText('草稿 · 版本 3')).toBeTruthy();
    const details = view.container.querySelector('.admin-document-details');
    expect(details?.textContent).toContain('目前版本3');
    expect(details?.textContent).toContain('編輯權杖2');
  });

  it.each(PAGE_EDITOR_KINDS)('renders a stable archived-only state without mounting the %s editor', async (kind) => {
    // Given
    const repository = new FakeDocumentRepository();
    const archived = revision({
      version: 7,
      editVersion: 9,
      status: 'archived',
      payload: pageFixture(kind),
      archivedAt: '2026-08-28T03:00:00Z',
    });
    repository.listResults.push(Promise.resolve({ ok: true, value: [document(kind)] }));
    repository.readResults.push(Promise.resolve({
      ok: true,
      value: { document: document(kind), revisions: [archived] },
    }));

    // When
    const view = renderDocumentRoute(repository, `/admin/content/${kind}`);

    // Then
    expect(await view.findByRole('heading', { name: '目前僅保留封存修訂版本' })).toBeTruthy();
    const archivedState = view.container.querySelector('.admin-state-panel[data-state="disabled"]');
    expect(archivedState?.textContent).toContain('封存版本 7');
    expect(archivedState?.textContent).toContain(archived.id);
    expect(view.container.querySelector(PAGE_EDITOR_SELECTORS[kind])).toBeNull();
    expect(view.queryByRole('button', { name: '進階 JSON' })).toBeNull();
    expect(view.queryByRole('textbox', { name: '雙語 JSON 內容' })).toBeNull();
    for (const label of ['儲存草稿', '發佈', '封存']) {
      expect(view.queryByRole('button', { name: label })).toBeNull();
    }
    expect(view.container.textContent).not.toContain('{}');
    expect(view.container.textContent).not.toContain('無效輸入');
    expect(repository.saveCalls).toHaveLength(0);
    expect(repository.publishCalls).toHaveLength(0);
    expect(repository.archiveCalls).toHaveLength(0);
  });

  it('unmounts the old workspace immediately while a new route kind is loading', async () => {
    // Given
    const repository = new RouteObservingRepository();
    const pendingPeople = deferred<RepositoryResult<CmsAdminDocumentDetail>>();
    repository.listResults.push(
      Promise.resolve({ ok: true, value: [document('news')] }),
      Promise.resolve({ ok: true, value: [document('people')] }),
    );
    repository.readResults.push(
      Promise.resolve({ ok: true, value: detail('news') }),
      pendingPeople.promise,
    );
    const { router, view } = renderNavigableDocumentRoute(repository);
    await waitFor(() => expect(view.container.querySelector('#news-editor')).toBeTruthy());
    expect(view.container.querySelector('aside[aria-label="文件資訊"]')).toBeTruthy();
    let routeBoundary = { loading: false, news: false, details: false, media: false };
    repository.onNextList = () => {
      routeBoundary = {
        loading: view.queryByRole('heading', { name: '正在載入人員名錄內容' }) !== null,
        news: view.container.querySelector('#news-editor') !== null,
        details: view.container.querySelector('aside[aria-label="文件資訊"]') !== null,
        media: view.queryByRole('heading', { name: '視覺媒體工作區' }) !== null,
      };
    };

    // When
    await act(async () => {
      await router.navigate('/admin/content/people');
      await Promise.resolve();
    });

    // Then
    expect(routeBoundary).toEqual({ loading: true, news: false, details: false, media: false });
    expect(view.getByRole('heading', { name: '正在載入人員名錄內容' })).toBeTruthy();
    expect(view.container.querySelector('#news-editor')).toBeNull();
    expect(view.container.querySelector('aside[aria-label="文件資訊"]')).toBeNull();
    expect(view.queryByRole('heading', { name: '視覺媒體工作區' })).toBeNull();

    await act(async () => {
      pendingPeople.resolve({
        ok: true,
        value: {
          document: document('people'),
          revisions: [revision({ payload: peopleSource.payload })],
        },
      });
      await pendingPeople.promise;
    });
    await waitFor(() => expect(view.container.querySelector('#people-center-directory')).toBeTruthy());
    expect(view.container.querySelector('#news-editor')).toBeNull();
    expect(view.getByRole('heading', { name: '視覺媒體工作區' })).toBeTruthy();
  }, 15_000); // Mounts the whole people directory editor in jsdom, which is slow rather than stuck.
});
