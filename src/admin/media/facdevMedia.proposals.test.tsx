// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { DraftMediaReferenceSchema } from '@/content/media';
import { changePortraitReference } from './portraitUpdates';
import { clientWith, deferred, uploadedReference } from './AdminMediaWorkbench.testHarness';
import type { DraftMediaClient } from './types';
import { facdevEditorText, facdevWorkbenchTree, firstFacdevSlot } from './facdevMedia.testHarness';

type UploadResult = Awaited<ReturnType<DraftMediaClient['upload']>>;

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const replacementReference = DraftMediaReferenceSchema.parse({
  ...uploadedReference,
  path: `${uploadedReference.path.slice(0, uploadedReference.path.indexOf('/') + 1)}${'b'.repeat(64)}.webp`,
});

function portraitField(view: ReturnType<typeof render>, slotKey: string): HTMLElement {
  const field = view.container.querySelector(`[data-slot-key="${slotKey}"]`);
  if (!(field instanceof HTMLElement)) throw new TypeError('Expected facdev portrait field');
  return field;
}

function linkedFixture() {
  const editorText = facdevEditorText();
  const slot = firstFacdevSlot(editorText);
  const changed = changePortraitReference({ kind: 'facdev', editorText, slot, reference: uploadedReference });
  if (!changed.ok) throw new TypeError('Expected linked facdev fixture');
  return { editorText: changed.editorText, slot };
}

describe('facdev canonical portrait proposals', () => {
  it('adopts an upload only after the parent echoes canonical editor text', async () => {
    // Given
    const user = userEvent.setup();
    const editorText = facdevEditorText();
    const slot = firstFacdevSlot(editorText);
    const onEditorTextChange = vi.fn();
    const client = clientWith({ upload: () => Promise.resolve({ ok: true, outcome: 'created', reference: uploadedReference, sha256: 'a'.repeat(64) }) });
    const props = { editorText, savedDraftPayload: null, onEditorTextChange };
    const view = render(facdevWorkbenchTree(props, client));
    const field = portraitField(view, slot.key);
    const input = field.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Expected facdev file input');

    // When
    await user.upload(input, new File(['portrait'], 'portrait.webp', { type: 'image/webp' }));
    await waitFor(() => expect(onEditorTextChange).toHaveBeenCalledOnce());
    expect(within(field).queryByText('照片已連結至此欄位。')).toBeNull();
    const proposedText = onEditorTextChange.mock.calls[0]?.[0];
    if (typeof proposedText !== 'string') throw new TypeError('Expected facdev proposal text');
    view.rerender(facdevWorkbenchTree({ ...props, editorText: proposedText }, client));

    // Then
    await waitFor(() => expect(within(portraitField(view, slot.key)).getByText('照片已連結至此欄位。')).toBeTruthy());
    const original = CMS_PAYLOAD_REGISTRY.facdev.schema.parse(JSON.parse(editorText));
    const changed = CMS_PAYLOAD_REGISTRY.facdev.schema.parse(JSON.parse(proposedText));
    expect(changed.zh.groups[0]?.lead).toEqual({ ...original.zh.groups[0]?.lead, portrait: uploadedReference });
    expect(changed.en).toEqual(original.en);
  });

  it('rejects an upload when its lead slot is reordered before resolution', async () => {
    // Given
    const upload = deferred<UploadResult>();
    const editorText = facdevEditorText();
    const payload = CMS_PAYLOAD_REGISTRY.facdev.schema.parse(JSON.parse(editorText));
    const slot = firstFacdevSlot(editorText);
    const first = payload.zh.groups[0]; const second = payload.zh.groups[1];
    if (first === undefined || second === undefined) throw new TypeError('Expected two facdev groups');
    const reorderedText = `${JSON.stringify({ ...payload, zh: { ...payload.zh, groups: [second, first, ...payload.zh.groups.slice(2)] } }, null, 2)}\n`;
    const onEditorTextChange = vi.fn();
    const client = clientWith({ upload: () => upload.promise });
    const props = { editorText, savedDraftPayload: null, onEditorTextChange };
    const view = render(facdevWorkbenchTree(props, client));
    const input = portraitField(view, slot.key).querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Expected facdev file input');
    const file = new File(['portrait'], 'portrait.webp', { type: 'image/webp' });
    fireEvent.change(input, { target: { files: { 0: file, length: 1, item: () => file } } });
    view.rerender(facdevWorkbenchTree({ ...props, editorText: reorderedText }, client));

    // When
    await act(async () => {
      upload.resolve({ ok: true, outcome: 'created', reference: uploadedReference, sha256: 'a'.repeat(64) });
      await upload.promise;
    });

    // Then
    expect(onEditorTextChange).not.toHaveBeenCalled();
    await waitFor(() => expect(view.getAllByText(uploadedReference.path)).toHaveLength(1));
  });

  it('binds unlink confirmation to the captured reference path', async () => {
    // Given
    const user = userEvent.setup();
    const fixture = linkedFixture();
    const onEditorTextChange = vi.fn();
    const client = clientWith();
    const props = { editorText: fixture.editorText, savedDraftPayload: null, onEditorTextChange };
    const view = render(facdevWorkbenchTree(props, client));
    await user.click(within(portraitField(view, fixture.slot.key)).getByRole('button', { name: '取消連結' }));
    view.rerender(facdevWorkbenchTree({ ...props, editorText: fixture.editorText.replace(uploadedReference.path, replacementReference.path) }, client));

    // When
    fireEvent.click(view.getByRole('button', { name: '確認取消連結' }));

    // Then
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });

  it('binds unlink confirmation to the captured lead slot identity', async () => {
    // Given
    const user = userEvent.setup();
    const fixture = linkedFixture();
    const onEditorTextChange = vi.fn();
    const client = clientWith();
    const props = { editorText: fixture.editorText, savedDraftPayload: null, onEditorTextChange };
    const view = render(facdevWorkbenchTree(props, client));
    await user.click(within(portraitField(view, fixture.slot.key)).getByRole('button', { name: '取消連結' }));
    view.rerender(facdevWorkbenchTree({ ...props, editorText: fixture.editorText.replace(fixture.slot.personName, `${fixture.slot.personName} changed`) }, client));

    // When
    fireEvent.click(view.getByRole('button', { name: '確認取消連結' }));

    // Then
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });
});
