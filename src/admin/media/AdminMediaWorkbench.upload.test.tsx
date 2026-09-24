// @vitest-environment jsdom
import { act, fireEvent, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { changePortraitReference, deriveMediaWorkbench } from './index';
import type { DraftMediaClient } from './types';
import {
  clientWith,
  deferred,
  firstSlot,
  peopleEditorText,
  resetWorkbenchTestState,
  uploadedReference,
  workbenchTree,
} from './AdminMediaWorkbench.testHarness';

afterEach(resetWorkbenchTestState);

describe('AdminMediaWorkbench uploads', () => {
  it('writes a successful upload only to its exact portrait slot', async () => {
    // Given
    const user = userEvent.setup();
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const onEditorTextChange = vi.fn();
    const client = clientWith({
      upload: () => Promise.resolve({
        ok: true,
        outcome: 'created',
        reference: uploadedReference,
        sha256: 'a'.repeat(64),
      }),
    });
    const view = render(workbenchTree({ editorText, savedDraftPayload: null, onEditorTextChange }, client));
    const field = view.container.querySelector(`[data-slot-key="${slot.key}"]`);
    if (!(field instanceof HTMLElement)) throw new TypeError('Expected portrait field');
    const input = field.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Expected file input');

    // When
    await user.upload(input, new File(['portrait'], 'portrait.webp', { type: 'image/webp' }));

    // Then
    await waitFor(() => expect(onEditorTextChange).toHaveBeenCalledTimes(1));
    const changedText = onEditorTextChange.mock.calls[0]?.[0];
    if (typeof changedText !== 'string') throw new TypeError('Expected changed editor text');
    const changed = deriveMediaWorkbench('people', changedText);
    if (changed.status !== 'ready') throw new TypeError('Expected changed workbench');
    const original = deriveMediaWorkbench('people', editorText);
    if (original.status !== 'ready') throw new TypeError('Expected original workbench');
    expect(changed.slots.find((candidate) => candidate.key === slot.key)?.reference).toEqual(uploadedReference);
    expect(changed.slots.filter((candidate) => candidate.key !== slot.key)).toEqual(
      original.slots.filter((candidate) => candidate.key !== slot.key),
    );
  });

  it('hands an adopted upload preview to the persisted-reference signer without a blank', async () => {
    // Given
    const user = userEvent.setup();
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const persistedPreview = deferred<Awaited<ReturnType<DraftMediaClient['createPreview']>>>();
    const onEditorTextChange = vi.fn();
    const createPreview = vi.fn<DraftMediaClient['createPreview']>()
      .mockResolvedValueOnce({
        ok: true,
        url: 'https://signed.example/upload-time',
        expiresAt: Date.now() + 300_000,
      })
      .mockReturnValueOnce(persistedPreview.promise);
    const client = clientWith({
      upload: () => Promise.resolve({
        ok: true,
        outcome: 'created',
        reference: uploadedReference,
        sha256: 'a'.repeat(64),
      }),
      createPreview,
    });
    const props = { editorText, savedDraftPayload: null, onEditorTextChange };
    const view = render(workbenchTree(props, client));
    const field = view.container.querySelector(`[data-slot-key="${slot.key}"]`);
    if (!(field instanceof HTMLElement)) throw new TypeError('Expected portrait field');
    const input = field.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Expected file input');

    // When
    await user.upload(input, new File(['portrait'], 'portrait.webp', { type: 'image/webp' }));
    await waitFor(() => expect(onEditorTextChange).toHaveBeenCalledTimes(1));
    const changedText = onEditorTextChange.mock.calls[0]?.[0];
    if (typeof changedText !== 'string') throw new TypeError('Expected changed editor text');
    view.rerender(workbenchTree({ ...props, editorText: changedText }, client));

    // Then
    expect(view.getByRole('img', { name: slot.personName }).getAttribute('src'))
      .toBe('https://signed.example/upload-time');

    // When
    await act(async () => {
      persistedPreview.resolve({
        ok: true,
        url: 'https://signed.example/persisted',
        expiresAt: Date.now() + 300_000,
      });
      await Promise.resolve();
    });

    // Then
    expect(view.getByRole('img', { name: slot.personName }).getAttribute('src'))
      .toBe('https://signed.example/persisted');
  });

  it('rejects a proposal when the parent supplies competing canonical text', async () => {
    // Given
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const onEditorTextChange = vi.fn();
    const client = clientWith({
      upload: () => Promise.resolve({
        ok: true, outcome: 'created', reference: uploadedReference, sha256: 'a'.repeat(64),
      }),
    });
    const props = { editorText, savedDraftPayload: null, onEditorTextChange };
    const view = render(workbenchTree(props, client));
    const field = view.container.querySelector(`[data-slot-key="${slot.key}"]`);
    if (!(field instanceof HTMLElement)) throw new TypeError('Expected portrait field');
    const input = field.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Expected file input');
    const file = new File(['portrait'], 'portrait.webp');
    fireEvent.change(input, {
      target: { files: { 0: file, length: 1, item: () => file } },
    });
    await waitFor(() => expect(onEditorTextChange).toHaveBeenCalledTimes(1));

    // When
    view.rerender(workbenchTree({ ...props, editorText: `${editorText}\n` }, client));

    // Then
    await waitFor(() => {
      expect(within(field).queryByText('照片已連結至此欄位。')).toBeNull();
    });
    const cleanup = view.getByRole('heading', { name: '待清理上傳' }).closest('section');
    if (!(cleanup instanceof HTMLElement)) throw new TypeError('Expected cleanup section');
    expect(within(cleanup).getAllByText(uploadedReference.path)).toHaveLength(1);
    expect(onEditorTextChange).toHaveBeenCalledTimes(1);
  });

  it('rejects an upload completed after a pending A-B-A canonical revision', async () => {
    // Given
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const upload = deferred<Awaited<ReturnType<DraftMediaClient['upload']>>>();
    const onEditorTextChange = vi.fn();
    const client = clientWith({ upload: () => upload.promise });
    const props = { editorText, savedDraftPayload: null, onEditorTextChange };
    const view = render(workbenchTree(props, client));
    const field = view.container.querySelector(`[data-slot-key="${slot.key}"]`);
    if (!(field instanceof HTMLElement)) throw new TypeError('Expected portrait field');
    const input = field.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Expected file input');
    const file = new File(['portrait'], 'portrait.webp');
    fireEvent.change(input, {
      target: { files: { 0: file, length: 1, item: () => file } },
    });
    view.rerender(workbenchTree({ ...props, editorText: `${editorText}\n` }, client));
    view.rerender(workbenchTree(props, client));

    // When
    await act(async () => {
      upload.resolve({
        ok: true, outcome: 'created', reference: uploadedReference, sha256: 'a'.repeat(64),
      });
      await upload.promise;
    });

    // Then
    expect(onEditorTextChange).not.toHaveBeenCalled();
    const cleanup = view.getByRole('heading', { name: '待清理上傳' }).closest('section');
    if (!(cleanup instanceof HTMLElement)) throw new TypeError('Expected cleanup section');
    expect(within(cleanup).getAllByText(uploadedReference.path)).toHaveLength(1);
  });

  it('unlinks a draft portrait without deleting storage', async () => {
    // Given
    const user = userEvent.setup();
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const changed = changePortraitReference({
      kind: 'people',
      editorText,
      slot,
      reference: uploadedReference,
    });
    if (!changed.ok) throw new TypeError('Expected draft fixture update');
    const onEditorTextChange = vi.fn();
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
    const view = render(workbenchTree({
      editorText: changed.editorText,
      savedDraftPayload: null,
      onEditorTextChange,
    }, clientWith({ delete: remove })));
    const field = view.container.querySelector(`[data-slot-key="${slot.key}"]`);
    if (!(field instanceof HTMLElement)) throw new TypeError('Expected portrait field');

    // When
    await user.click(within(field).getByRole('button', { name: '取消連結' }));
    fireEvent.click(view.getByRole('button', { name: '確認取消連結' }));

    // Then
    expect(remove).not.toHaveBeenCalled();
    expect(onEditorTextChange).toHaveBeenCalledTimes(1);
    const nextText = onEditorTextChange.mock.calls[0]?.[0];
    if (typeof nextText !== 'string') throw new TypeError('Expected editor update');
    const next = deriveMediaWorkbench('people', nextText);
    if (next.status !== 'ready') throw new TypeError('Expected ready workbench');
    expect(next.slots.find((candidate) => candidate.key === slot.key)?.reference).toBeNull();
  });
});
