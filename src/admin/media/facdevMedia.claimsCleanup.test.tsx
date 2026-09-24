// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { changePortraitReference } from './portraitUpdates';
import { clientWith, uploadedReference } from './AdminMediaWorkbench.testHarness';
import type { DraftMediaClient } from './types';
import {
  facdevDocumentId,
  facdevEditorText,
  facdevWorkbenchTree,
  firstFacdevSlot,
  RegisterFacdevReference,
  secondFacdevDocumentId,
} from './facdevMedia.testHarness';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function linkedFacdevText(): string {
  const editorText = facdevEditorText();
  const changed = changePortraitReference({
    kind: 'facdev',
    editorText,
    slot: firstFacdevSlot(editorText),
    reference: uploadedReference,
  });
  if (!changed.ok) throw new TypeError('Expected linked facdev editor text');
  return changed.editorText;
}

describe('facdev media claims and cleanup lifecycle', () => {
  it('distinguishes editor claims from saved-draft claims', async () => {
    // Given
    const editorText = facdevEditorText();
    const linkedText = linkedFacdevText();
    const client = clientWith();
    const props = { editorText: linkedText, savedDraftPayload: null, onEditorTextChange: vi.fn() };
    const view = render(facdevWorkbenchTree(props, client, <RegisterFacdevReference reference={uploadedReference} />));
    const remove = await view.findByRole('button', { name: '刪除未使用的上傳' });
    expect(remove.hasAttribute('disabled')).toBe(true);
    expect(view.getByText('仍被目前編輯內容引用')).toBeTruthy();

    // When
    view.rerender(facdevWorkbenchTree({ ...props, editorText, savedDraftPayload: { portrait: uploadedReference } }, client, <RegisterFacdevReference reference={uploadedReference} />));

    // Then
    await waitFor(() => expect(view.getByText('仍被已儲存草稿引用')).toBeTruthy());
    expect(remove.hasAttribute('disabled')).toBe(true);
  });

  it('retains the saved claim when the facdev route changes documents', async () => {
    // Given
    const editorText = facdevEditorText();
    const client = clientWith();
    const view = render(facdevWorkbenchTree({
      documentId: facdevDocumentId,
      editorText,
      savedDraftPayload: { portrait: uploadedReference },
      onEditorTextChange: vi.fn(),
    }, client, <RegisterFacdevReference reference={uploadedReference} />));
    const remove = await view.findByRole('button', { name: '刪除未使用的上傳' });
    expect(remove.hasAttribute('disabled')).toBe(true);

    // When
    view.rerender(facdevWorkbenchTree({
      documentId: secondFacdevDocumentId,
      editorText,
      savedDraftPayload: null,
      onEditorTextChange: vi.fn(),
    }, client, <RegisterFacdevReference reference={uploadedReference} />));

    // Then
    await waitFor(() => expect(view.getByText('仍被已儲存草稿引用')).toBeTruthy());
    expect(remove.hasAttribute('disabled')).toBe(true);
  });

  it('deletes only an unclaimed upload and never resurrects the reference', async () => {
    // Given
    const editorText = facdevEditorText();
    const deleteDraft = vi.fn<DraftMediaClient['delete']>((_reference, guard) => {
      expect(guard).toEqual({ referencedByEditor: false, referencedBySavedDraft: false });
      return Promise.resolve({ ok: true });
    });
    const props = { editorText, savedDraftPayload: null, onEditorTextChange: vi.fn() };
    const client = clientWith({ delete: deleteDraft });
    const view = render(facdevWorkbenchTree(props, client, <RegisterFacdevReference reference={uploadedReference} />));
    fireEvent.click(await view.findByRole('button', { name: '刪除未使用的上傳' }));

    // When
    fireEvent.click(view.getByRole('button', { name: '永久刪除' }));
    await view.findByText('未使用的上傳已永久刪除。');
    view.rerender(facdevWorkbenchTree({ ...props, editorText: `${editorText}\n` }, client, <RegisterFacdevReference reference={uploadedReference} />));

    // Then
    await waitFor(() => expect(view.queryByRole('button', { name: '刪除未使用的上傳' })).toBeNull());
    expect(view.container.querySelector('.admin-media-cleanup-item')).toBeNull();
    expect(deleteDraft).toHaveBeenCalledOnce();
  }, 20_000);
});
