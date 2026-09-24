// @vitest-environment jsdom
import { fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { changePortraitReference, deriveMediaWorkbench } from './index';
import {
  clientWith,
  firstSlot,
  peopleEditorText,
  resetWorkbenchTestState,
  uploadedReference,
  workbenchTree,
} from './AdminMediaWorkbench.testHarness';

afterEach(resetWorkbenchTestState);

function slotField(view: ReturnType<typeof render>, slotKey: string): HTMLElement {
  const field = view.container.querySelector(`[data-slot-key="${slotKey}"]`);
  if (!(field instanceof HTMLElement)) throw new TypeError('Expected portrait field');
  return field;
}

describe('AdminMediaWorkbench portrait feedback', () => {
  it('does not announce or settle a portrait proposal rejected by its parent', async () => {
    // Given
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const onEditorTextChange = vi.fn();
    const view = render(workbenchTree({
      editorText, savedDraftPayload: null, onEditorTextChange,
    }, clientWith({
      upload: () => Promise.resolve({
        ok: true, outcome: 'created', reference: uploadedReference, sha256: 'a'.repeat(64),
      }),
    })));
    const input = slotField(view, slot.key).querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Expected file input');

    // When
    const file = new File(['portrait'], 'portrait.webp', { type: 'image/webp' });
    fireEvent.change(input, {
      target: { files: { 0: file, length: 1, item: () => file } },
    });

    // Then
    await waitFor(() => expect(onEditorTextChange).toHaveBeenCalledTimes(1));
    expect(within(slotField(view, slot.key)).queryByText('照片已連結至此欄位。')).toBeNull();
    const cleanup = view.getByRole('heading', { name: '待清理上傳' }).closest('section');
    if (!(cleanup instanceof HTMLElement)) throw new TypeError('Expected cleanup section');
    expect(within(cleanup).getAllByText(uploadedReference.path)).toHaveLength(1);
  });

  it('keeps portrait adoption success after the parent accepts the uploaded reference', async () => {
    // Given
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const onEditorTextChange = vi.fn();
    const view = render(workbenchTree({
      editorText, savedDraftPayload: null, onEditorTextChange,
    }, clientWith({
      upload: () => Promise.resolve({
        ok: true, outcome: 'created', reference: uploadedReference, sha256: 'a'.repeat(64),
      }),
    })));
    const field = slotField(view, slot.key);
    const input = field.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Expected file input');
    const file = new File(['portrait'], 'portrait.webp', { type: 'image/webp' });
    fireEvent.change(input, {
      target: { files: { 0: file, length: 1, item: () => file } },
    });
    await waitFor(() => expect(onEditorTextChange).toHaveBeenCalledTimes(1));
    const adoptedEditorText = onEditorTextChange.mock.calls[0]?.[0];
    if (typeof adoptedEditorText !== 'string') throw new TypeError('Expected adopted editor text');
    expect(within(slotField(view, slot.key)).queryByText('照片已連結至此欄位。')).toBeNull();
    expect(view.getByRole('heading', { name: '待清理上傳' })).toBeTruthy();

    // When
    view.rerender(workbenchTree({
      editorText: adoptedEditorText, savedDraftPayload: null, onEditorTextChange,
    }, clientWith()));

    // Then
    expect(within(slotField(view, slot.key)).getByRole('status').textContent)
      .toContain('照片已連結至此欄位');
    expect(within(slotField(view, slot.key)).getAllByText('照片已連結至此欄位。')).toHaveLength(1);
    expect(view.queryByRole('heading', { name: '待清理上傳' })).toBeNull();
  });

  it('clears portrait adoption success after an external editor rollback', async () => {
    // Given
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const onEditorTextChange = vi.fn();
    const view = render(workbenchTree({
      editorText, savedDraftPayload: null, onEditorTextChange,
    }, clientWith({
      upload: () => Promise.resolve({
        ok: true, outcome: 'created', reference: uploadedReference, sha256: 'a'.repeat(64),
      }),
    })));
    const field = slotField(view, slot.key);
    const input = field.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Expected file input');
    const file = new File(['portrait'], 'portrait.webp', { type: 'image/webp' });
    fireEvent.change(input, {
      target: { files: { 0: file, length: 1, item: () => file } },
    });
    await waitFor(() => expect(onEditorTextChange).toHaveBeenCalledTimes(1));
    const adoptedEditorText = onEditorTextChange.mock.calls[0]?.[0];
    if (typeof adoptedEditorText !== 'string') throw new TypeError('Expected adopted editor text');
    view.rerender(workbenchTree({
      editorText: adoptedEditorText, savedDraftPayload: null, onEditorTextChange,
    }, clientWith()));
    await waitFor(() => {
      expect(within(slotField(view, slot.key)).getByRole('status').textContent)
        .toContain('照片已連結至此欄位');
    });

    // When
    view.rerender(workbenchTree({
      editorText, savedDraftPayload: null, onEditorTextChange,
    }, clientWith()));

    // Then
    expect(within(slotField(view, slot.key)).queryByText('照片已連結至此欄位。')).toBeNull();
  });

  it('does not announce an unlink proposal rejected by its parent', async () => {
    // Given
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const linked = changePortraitReference({ kind: 'people', editorText, slot, reference: uploadedReference });
    if (!linked.ok) throw new TypeError('Expected linked portrait');
    const onEditorTextChange = vi.fn();
    const view = render(workbenchTree({
      editorText: linked.editorText, savedDraftPayload: null, onEditorTextChange,
    }, clientWith()));
    fireEvent.click(within(slotField(view, slot.key)).getByRole('button', { name: '取消連結' }));

    // When
    fireEvent.click(view.getByRole('button', { name: '確認取消連結' }));

    // Then
    expect(onEditorTextChange).toHaveBeenCalledTimes(1);
    expect(within(slotField(view, slot.key)).queryByText('已取消照片連結。')).toBeNull();
    expect(within(slotField(view, slot.key)).getByRole('button', { name: '取消連結' })).toBeTruthy();
  }, 15_000);

  it('announces unlink only after the parent echoes the exact proposal', async () => {
    // Given
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const linked = changePortraitReference({ kind: 'people', editorText, slot, reference: uploadedReference });
    if (!linked.ok) throw new TypeError('Expected linked portrait');
    const onEditorTextChange = vi.fn();
    const client = clientWith();
    const view = render(workbenchTree({
      editorText: linked.editorText, savedDraftPayload: null, onEditorTextChange,
    }, client));
    fireEvent.click(within(slotField(view, slot.key)).getByRole('button', { name: '取消連結' }));
    fireEvent.click(view.getByRole('button', { name: '確認取消連結' }));
    const proposedEditorText = onEditorTextChange.mock.calls[0]?.[0];
    if (typeof proposedEditorText !== 'string') throw new TypeError('Expected unlink proposal');

    // When
    view.rerender(workbenchTree({
      editorText: proposedEditorText, savedDraftPayload: null, onEditorTextChange,
    }, client));

    // Then
    await waitFor(() => {
      expect(within(slotField(view, slot.key)).getByRole('status').textContent)
        .toContain('已取消照片連結');
    });
    expect(onEditorTextChange).toHaveBeenCalledTimes(1);
  }, 15_000);

  it('uses English preview recovery and fallback for a linked unpreviewable portrait', async () => {
    // Given
    localStorage.setItem('tmuh.lang', 'en');
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const linked = changePortraitReference({ kind: 'people', editorText, slot, reference: uploadedReference });
    if (!linked.ok) throw new TypeError('Expected linked portrait');

    // When
    const view = render(workbenchTree({
      editorText: linked.editorText, savedDraftPayload: null, onEditorTextChange: vi.fn(),
    }, clientWith({
      createPreview: () => Promise.resolve({ ok: false, failure: { kind: 'storage-failure' } }),
    })));

    // Then
    const field = slotField(view, slot.key);
    await waitFor(() => expect(within(field).getByRole('alert')).toBeTruthy());
    expect(within(field).getByText('Portrait preview unavailable')).toBeTruthy();
    expect(within(field).queryByText('No portrait linked')).toBeNull();
    expect(within(field).getByRole('alert').textContent).not.toMatch(/[\u3400-\u9fff]/u);
  });

  it('marks Chinese and English slot names and contexts with their content language', () => {
    // Given
    localStorage.setItem('tmuh.lang', 'en');
    const editorText = peopleEditorText();
    const workbench = deriveMediaWorkbench('people', editorText);
    if (workbench.status !== 'ready') throw new TypeError('Expected ready workbench');

    // When
    const view = render(workbenchTree({
      editorText, savedDraftPayload: null, onEditorTextChange: vi.fn(),
    }, clientWith()));

    // Then
    for (const slot of workbench.slots) {
      const field = slotField(view, slot.key);
      const language = slot.locale === 'zh' ? 'zh-Hant' : 'en';
      expect(within(field).getByRole('heading', { name: slot.personName }).getAttribute('lang')).toBe(language);
      expect(field.querySelector('[data-media-slot-context]')?.getAttribute('lang')).toBe(language);
    }
  });
});
