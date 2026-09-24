// @vitest-environment jsdom
import { fireEvent, render, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteProvider } from '@/app/site';
import { AdminProtectedAccessProvider } from '@/admin/auth';
import type { DraftMediaClient } from './types';
import { AdminMediaOwnershipProvider } from './AdminMediaOwnershipProvider';
import { AdminMediaCleanup } from './AdminMediaCleanup';
import {
  clientWith,
  peopleEditorText,
  RegisterCreatedReference,
  resetWorkbenchTestState,
  uploadedReference,
} from './AdminMediaWorkbench.testHarness';

afterEach(resetWorkbenchTestState);

const setup = <RegisterCreatedReference reference={uploadedReference} />;

function cleanupTree(client: DraftMediaClient): ReactElement {
  return (
    <SiteProvider>
      <AdminProtectedAccessProvider mutationsAllowed>
        <AdminMediaOwnershipProvider>
          {setup}
          <AdminMediaCleanup
            editorText={peopleEditorText()}
            savedDraftPayload={null}
            client={client}
          />
        </AdminMediaOwnershipProvider>
      </AdminProtectedAccessProvider>
    </SiteProvider>
  );
}

describe('AdminMediaWorkbench cleanup feedback', () => {
  it('politely announces successful deletion after the cleanup item is removed', async () => {
    // Given
    const view = render(cleanupTree(clientWith()));
    fireEvent.click(await view.findByRole('button', { name: '刪除未使用的上傳' }));

    // When
    fireEvent.click(view.getByRole('button', { name: '永久刪除' }));

    // Then
    const status = await view.findByRole('status');
    expect(status.textContent).toContain('未使用的上傳已永久刪除');
    expect(view.queryByRole('button', { name: '刪除未使用的上傳' })).toBeNull();
  });

  it('keeps deletion failure visible and permits a confirmed retry', async () => {
    // Given
    const remove = vi.fn<DraftMediaClient['delete']>()
      .mockResolvedValueOnce({ ok: false, failure: { kind: 'storage-failure' } })
      .mockResolvedValueOnce({ ok: true });
    const view = render(cleanupTree(clientWith({ delete: remove })));
    fireEvent.click(await view.findByRole('button', { name: '刪除未使用的上傳' }));
    fireEvent.click(view.getByRole('button', { name: '永久刪除' }));
    const alert = await view.findByRole('alert');

    // When
    const retry = view.getByRole('button', { name: '重試刪除' });
    fireEvent.click(retry);
    fireEvent.click(view.getByRole('button', { name: '永久刪除' }));

    // Then
    expect(alert.textContent).toContain('檔案仍保留，請再試一次');
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(view.queryByRole('alert')).toBeNull());
  });

  it('renders English cleanup recovery without Chinese fallback', async () => {
    // Given
    localStorage.setItem('tmuh.lang', 'en');
    const view = render(cleanupTree(clientWith({
      delete: () => Promise.resolve({ ok: false, failure: { kind: 'storage-failure' } }),
    })));
    fireEvent.click(await view.findByRole('button', { name: 'Delete unused upload' }));

    // When
    fireEvent.click(view.getByRole('button', { name: 'Permanently delete' }));

    // Then
    const alert = await view.findByRole('alert');
    expect(alert.textContent).toContain('Storage could not delete the file');
    expect(alert.textContent).not.toMatch(/[\u3400-\u9fff]/u);
    expect(view.getByRole('button', { name: 'Retry deletion' })).toBeTruthy();
  });
});
