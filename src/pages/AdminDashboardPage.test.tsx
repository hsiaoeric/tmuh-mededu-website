// @vitest-environment jsdom

import { cleanup, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SiteProvider } from '@/app/site';
import { AdminDocumentRepositoryProvider } from '@/admin/repository/AdminDocumentRepositoryProvider';
import { CMS_DOCUMENT_KINDS, CMS_DOCUMENT_STABLE_KEYS } from '@/content/contracts/kinds';
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
  it('renders all canonical kinds in order with stable keys and availability', async () => {
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
      CMS_DOCUMENT_KINDS.map((kind) => `/admin/content/${kind}`),
    );
    CMS_DOCUMENT_KINDS.forEach((kind, index) => {
      expect(within(links[index]!).getByText(CMS_DOCUMENT_STABLE_KEYS[kind], { selector: 'code' })).toBeTruthy();
    });
    expect(view.getAllByText('可用')).toHaveLength(2);
    expect(view.getAllByText('尚未建立')).toHaveLength(CMS_DOCUMENT_KINDS.length - 2);
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
