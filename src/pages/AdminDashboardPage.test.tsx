// @vitest-environment jsdom

import { cleanup, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SiteProvider } from '@/app/site';
import { AdminDocumentRepositoryProvider } from '@/admin/repository/AdminDocumentRepositoryProvider';
import { CMS_DOCUMENT_GROUPS } from '@/admin/documents/cmsDocumentMetadata';
import type { CmsRevisionStatusSummary, RepositoryResult } from '@/admin/repository/types';
import { CMS_DOCUMENT_KINDS } from '@/content/contracts/kinds';
import { FakeDocumentRepository, document } from '@/admin/workflows/testHarness';
import { AdminDashboardPage } from './AdminDashboardPage';

function renderDashboard(repository: FakeDocumentRepository) {
  return render(
    <SiteProvider>
      <MemoryRouter>
        <AdminDocumentRepositoryProvider repository={repository}>
          <AdminDashboardPage />
        </AdminDocumentRepositoryProvider>
      </MemoryRouter>
    </SiteProvider>,
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AdminDashboardPage', () => {
  it('groups every canonical kind exactly once', () => {
    const grouped = CMS_DOCUMENT_GROUPS.flatMap((group) => group.kinds);
    expect([...grouped].sort()).toEqual([...CMS_DOCUMENT_KINDS].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it('renders every canonical kind once, in group order, with availability', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    repository.listResults.push(Promise.resolve({
      ok: true,
      value: [document('news'), document('people')],
    }));

    // When
    const view = renderDashboard(repository);
    const links = await view.findAllByRole('link', { name: /開啟/ });

    // Then
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      CMS_DOCUMENT_GROUPS.flatMap((group) => group.kinds).map((kind) => `/admin/content/${kind}`),
    );
    expect(view.getAllByText('可用')).toHaveLength(2);
    expect(view.getAllByText('尚未建立')).toHaveLength(CMS_DOCUMENT_KINDS.length - 2);
  });

  it('shows published versions and waiting drafts when revision statuses are available', async () => {
    // Given
    class StatusRepository extends FakeDocumentRepository {
      listRevisionStatuses(): Promise<RepositoryResult<readonly CmsRevisionStatusSummary[]>> {
        const news = document('news');
        return Promise.resolve({ ok: true, value: [
          { documentId: news.id, version: 4, status: 'published', updatedAt: '2026-08-22T02:00:00Z' },
          { documentId: news.id, version: 5, status: 'draft', updatedAt: '2026-08-23T02:00:00Z' },
        ] });
      }
    }
    const repository = new StatusRepository();
    // One list for the dashboard, one for the navigation's unpublished-draft markers.
    repository.listResults.push(Promise.resolve({ ok: true, value: [document('news')] }), Promise.resolve({ ok: true, value: [document('news')] }));

    // When
    const view = renderDashboard(repository);
    const newsCard = await view.findByRole('link', { name: '開啟公告' });

    // Then
    expect(await within(newsCard).findByText('已發布 · 版本 4')).toBeTruthy();
    expect(within(newsCard).getByText('有未發布草稿')).toBeTruthy();
    const navNews = await view.findByRole('link', { name: /公告.*有未發布草稿/ });
    expect(navNews.hasAttribute('data-pending')).toBe(true);
  });

  it('retries a failed document listing without hiding canonical kinds', async () => {
    // Given
    const user = userEvent.setup();
    const repository = new FakeDocumentRepository();
    repository.listResults.push(Promise.resolve({
      ok: false,
      failure: { kind: 'transport-error', error: { code: null, details: null, hint: null, message: 'offline' } },
    }));
    repository.listResults.push(Promise.resolve({ ok: true, value: [] }));
    const view = renderDashboard(repository);
    const retry = await view.findByRole('button', { name: '重試' });

    // When
    await user.click(retry);

    // Then
    expect(await view.findAllByRole('link', { name: /開啟/ })).toHaveLength(CMS_DOCUMENT_KINDS.length);
  });
});
