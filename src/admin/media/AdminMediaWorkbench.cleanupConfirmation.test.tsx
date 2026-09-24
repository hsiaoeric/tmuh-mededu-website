// @vitest-environment jsdom
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteProvider } from '@/app/site';
import { AdminProtectedAccessProvider } from '@/admin/auth';
import { parseDraftPayload } from '@/admin/documents';
import { changePortraitReference } from './index';
import { AdminMediaOwnershipProvider } from './AdminMediaOwnershipProvider';
import { AdminMediaCleanup } from './AdminMediaCleanup';
import type { DraftMediaClient, DraftDeleteResult } from './types';
import {
  clientWith,
  deferred,
  firstSlot,
  peopleEditorText,
  RegisterCreatedReference,
  resetWorkbenchTestState,
  uploadedReference,
  workbenchTree,
} from './AdminMediaWorkbench.testHarness';

afterEach(resetWorkbenchTestState);

const baseProps = () => ({
  editorText: peopleEditorText(),
  savedDraftPayload: null,
  onEditorTextChange: vi.fn(),
});
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

describe('AdminMediaWorkbench cleanup confirmation', () => {
  it('opens and cancels cleanup while returning focus to its trigger', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(workbenchTree(baseProps(), clientWith(), setup));
    const remove = await view.findByRole('button', { name: '刪除未使用的上傳' });

    // When
    await user.click(remove);
    fireEvent.click(view.getByRole('button', { name: '保留檔案' }));

    // Then
    expect(view.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(remove);
  });

  it('closes cleanup with Escape and returns focus to its trigger', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(workbenchTree(baseProps(), clientWith(), setup));
    const remove = await view.findByRole('button', { name: '刪除未使用的上傳' });
    await user.click(remove);

    // When
    await user.keyboard('{Escape}');

    // Then
    expect(view.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(remove));
  });

  it.each(['editor', 'saved'] as const)(
    'refuses cleanup when the %s payload references the path before confirmation',
    async (source) => {
      // Given
      const user = userEvent.setup();
      const props = baseProps();
      const slot = firstSlot(props.editorText);
      const linked = changePortraitReference({
        kind: 'people', editorText: props.editorText, slot, reference: uploadedReference,
      });
      if (!linked.ok) throw new TypeError('Expected linked fixture');
      const linkedPayload = parseDraftPayload(linked.editorText);
      if (!linkedPayload.ok) throw new TypeError('Expected linked payload');
      const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
      const client = clientWith({ delete: remove });
      const view = render(workbenchTree(props, client, setup));
      await user.click(await view.findByRole('button', { name: '刪除未使用的上傳' }));
      view.rerender(workbenchTree({
        ...props,
        editorText: source === 'editor' ? linked.editorText : props.editorText,
        savedDraftPayload: source === 'saved' ? linkedPayload.payload : null,
      }, client, setup));

      // When
      fireEvent.click(view.getByRole('button', { name: '永久刪除' }));

      // Then
      expect(view.queryByRole('dialog')).toBeNull();
      expect(remove).not.toHaveBeenCalled();
    },
  );

  it('refuses cleanup when mutations become blocked before confirmation', async () => {
    // Given
    const user = userEvent.setup();
    const props = baseProps();
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
    const client = clientWith({ delete: remove });
    const view = render(workbenchTree(props, client, setup));
    await user.click(await view.findByRole('button', { name: '刪除未使用的上傳' }));
    view.rerender(workbenchTree(props, client, setup, false));

    // When
    fireEvent.click(view.getByRole('button', { name: '永久刪除' }));

    // Then
    expect(view.queryByRole('dialog')).toBeNull();
    expect(remove).not.toHaveBeenCalled();
  });

  it('closes after a failed cleanup and returns focus to the remaining trigger', async () => {
    // Given
    const user = userEvent.setup();
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({
      ok: false, failure: { kind: 'storage-failure' },
    }));
    const view = render(cleanupTree(clientWith({ delete: remove })));
    const trigger = await view.findByRole('button', { name: '刪除未使用的上傳' });
    await user.click(trigger);

    // When
    fireEvent.click(view.getByRole('button', { name: '永久刪除' }));

    // Then
    await waitFor(() => expect(view.queryByRole('dialog')).toBeNull());
    expect(remove).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('submits one delete while valid confirmation is pending', async () => {
    // Given
    const user = userEvent.setup();
    const deletion = deferred<DraftDeleteResult>();
    const remove = vi.fn<DraftMediaClient['delete']>(() => deletion.promise);
    const view = render(cleanupTree(clientWith({ delete: remove })));
    await user.click(await view.findByRole('button', { name: '刪除未使用的上傳' }));
    const confirm = view.getByRole('button', { name: '永久刪除' });

    // When
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    // Then
    expect(remove).toHaveBeenCalledTimes(1);
    expect(confirm.hasAttribute('disabled')).toBe(true);
    await act(async () => {
      deletion.resolve({ ok: true });
      await deletion.promise;
    });
    await waitFor(() => expect(view.queryByRole('dialog')).toBeNull());
  });
});
