// @vitest-environment jsdom

import { act, fireEvent, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DraftMediaClient, DraftUploadResult } from './types';
import { changePortraitReference } from './portraitUpdates';
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

function portraitInput(view: ReturnType<typeof render>, slotKey: string): HTMLInputElement {
  const field = view.container.querySelector(`[data-slot-key="${slotKey}"]`);
  const input = field?.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) throw new TypeError('Expected portrait input');
  return input;
}

describe('AdminMediaWorkbench protected access', () => {
  it('disables and refuses a new upload while mutations are blocked', async () => {
    // Given
    const user = userEvent.setup();
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const upload = vi.fn<DraftMediaClient['upload']>(() => Promise.resolve({
      ok: false,
      failure: { kind: 'transport-error' },
    }));
    const view = render(workbenchTree({
      editorText,
      savedDraftPayload: null,
      onEditorTextChange: vi.fn(),
    }, clientWith({ upload }), undefined, false));
    const input = portraitInput(view, slot.key);

    // When
    await user.upload(
      input,
      new File(['portrait'], 'portrait.webp', { type: 'image/webp' }),
    );

    // Then
    expect(input.disabled).toBe(true);
    expect(upload).not.toHaveBeenCalled();
  });

  it('keeps an active upload alive when mutations become blocked', async () => {
    // Given
    const user = userEvent.setup();
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const result = deferred<DraftUploadResult>();
    let uploadSignal: AbortSignal | undefined;
    const client = clientWith({
      upload: (_file, _onProgress, signal) => {
        uploadSignal = signal;
        return result.promise;
      },
    });
    const onEditorTextChange = vi.fn();
    const props = { editorText, savedDraftPayload: null, onEditorTextChange };
    const view = render(workbenchTree(props, client));
    await user.upload(
      portraitInput(view, slot.key),
      new File(['portrait'], 'portrait.webp', { type: 'image/webp' }),
    );
    await waitFor(() => expect(uploadSignal).toBeDefined());

    // When
    view.rerender(workbenchTree(props, client, undefined, false));
    result.resolve({
      ok: true,
      outcome: 'created',
      reference: uploadedReference,
      sha256: 'a'.repeat(64),
    });
    await act(async () => result.promise);

    // Then
    expect(uploadSignal?.aborted).toBe(false);
    await waitFor(() => expect(onEditorTextChange).toHaveBeenCalledTimes(1));
  });

  it('preserves unresolved uploads and refuses cleanup deletion', async () => {
    // Given
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
    const props = {
      editorText: peopleEditorText(),
      savedDraftPayload: null,
      onEditorTextChange: vi.fn(),
    };
    const client = clientWith({ delete: remove });
    const setup = (
      <RegisterCreatedReference reference={uploadedReference} />
    );
    const view = render(workbenchTree(props, client, setup));
    const cleanup = await view.findByRole('button', { name: '刪除未使用的上傳' });

    // When
    view.rerender(workbenchTree(props, client, setup, false));
    fireEvent.click(cleanup);

    // Then
    expect(view.getByRole('button', { name: '刪除未使用的上傳' })).toBe(cleanup);
    expect(cleanup.hasAttribute('disabled')).toBe(true);
    expect(view.getAllByText(uploadedReference.path).length).toBeGreaterThan(0);
    expect(remove).not.toHaveBeenCalled();
  });

  it('disables and refuses unlinking a portrait', async () => {
    // Given
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const changed = changePortraitReference({
      kind: 'people',
      editorText,
      slot,
      reference: uploadedReference,
    });
    if (!changed.ok) throw new TypeError('Expected portrait fixture update');
    const onEditorTextChange = vi.fn();
    const view = render(workbenchTree({
      editorText: changed.editorText,
      savedDraftPayload: null,
      onEditorTextChange,
    }, clientWith(), undefined, false));
    const field = view.container.querySelector(`[data-slot-key="${slot.key}"]`);
    if (!(field instanceof HTMLElement)) throw new TypeError('Expected portrait field');
    const unlink = within(field).getByRole('button', { name: '取消連結' });

    // When
    fireEvent.click(unlink);

    // Then
    expect(unlink.hasAttribute('disabled')).toBe(true);
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });
});
