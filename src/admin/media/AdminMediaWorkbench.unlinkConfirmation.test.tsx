// @vitest-environment jsdom
import { fireEvent, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DraftMediaReferenceSchema } from '@/content/media';
import { changePortraitReference, deriveMediaWorkbench } from './index';
import type { DraftMediaClient } from './types';
import {
  clientWith,
  firstSlot,
  peopleEditorText,
  resetWorkbenchTestState,
  uploadedReference,
  workbenchTree,
} from './AdminMediaWorkbench.testHarness';

afterEach(resetWorkbenchTestState);

const replacementReference = DraftMediaReferenceSchema.parse({
  ...uploadedReference,
  path: `${uploadedReference.path.slice(0, uploadedReference.path.indexOf('/') + 1)}${'b'.repeat(64)}.webp`,
});

function linkedFixture() {
  const editorText = peopleEditorText();
  const slot = firstSlot(editorText);
  const changed = changePortraitReference({
    kind: 'people', editorText, slot, reference: uploadedReference,
  });
  if (!changed.ok) throw new TypeError('Expected linked portrait fixture');
  return { editorText: changed.editorText, slot };
}

function unlinkButton(view: ReturnType<typeof render>, slotKey: string): HTMLButtonElement {
  const field = view.container.querySelector(`[data-slot-key="${slotKey}"]`);
  if (!(field instanceof HTMLElement)) throw new TypeError('Expected portrait field');
  return within(field).getByRole('button', { name: '取消連結' });
}

describe('AdminMediaWorkbench portrait unlink confirmation', () => {
  it('opens and cancels unlink while returning focus to its trigger', async () => {
    // Given
    const user = userEvent.setup();
    const fixture = linkedFixture();
    const onEditorTextChange = vi.fn();
    const view = render(workbenchTree({
      editorText: fixture.editorText, savedDraftPayload: null, onEditorTextChange,
    }, clientWith()));
    const unlink = unlinkButton(view, fixture.slot.key);

    // When
    await user.click(unlink);
    fireEvent.click(view.getByRole('button', { name: '保留連結' }));

    // Then
    expect(view.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(unlink);
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });

  it('closes unlink with Escape and returns focus to its trigger', async () => {
    // Given
    const user = userEvent.setup();
    const fixture = linkedFixture();
    const view = render(workbenchTree({
      editorText: fixture.editorText, savedDraftPayload: null, onEditorTextChange: vi.fn(),
    }, clientWith()));
    const unlink = unlinkButton(view, fixture.slot.key);
    await user.click(unlink);

    // When
    await user.keyboard('{Escape}');

    // Then
    expect(view.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(unlink));
  });

  it('confirms unlink without deleting Storage and returns focus', async () => {
    // Given
    const user = userEvent.setup();
    const fixture = linkedFixture();
    const onEditorTextChange = vi.fn();
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
    const view = render(workbenchTree({
      editorText: fixture.editorText, savedDraftPayload: null, onEditorTextChange,
    }, clientWith({ delete: remove })));
    const unlink = unlinkButton(view, fixture.slot.key);
    await user.click(unlink);

    // When
    fireEvent.click(view.getByRole('button', { name: '確認取消連結' }));

    // Then
    expect(remove).not.toHaveBeenCalled();
    expect(onEditorTextChange).toHaveBeenCalledTimes(1);
    const nextText = onEditorTextChange.mock.calls[0]?.[0];
    if (typeof nextText !== 'string') throw new TypeError('Expected editor update');
    const next = deriveMediaWorkbench('people', nextText);
    if (next.status !== 'ready') throw new TypeError('Expected ready workbench');
    expect(next.slots.find((candidate) => candidate.key === fixture.slot.key)?.reference).toBeNull();
    expect(document.activeElement).toBe(unlink);
  });

  it('refuses unlink when the slot points to a new path before confirmation', async () => {
    // Given
    const user = userEvent.setup();
    const fixture = linkedFixture();
    const onEditorTextChange = vi.fn();
    const props = { editorText: fixture.editorText, savedDraftPayload: null, onEditorTextChange };
    const view = render(workbenchTree(props, clientWith()));
    await user.click(unlinkButton(view, fixture.slot.key));
    const relinkedText = fixture.editorText.replace(uploadedReference.path, replacementReference.path);
    view.rerender(workbenchTree({ ...props, editorText: relinkedText }, clientWith()));

    // When
    fireEvent.click(view.getByRole('button', { name: '確認取消連結' }));

    // Then
    expect(view.queryByRole('dialog')).toBeNull();
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });

  it('refuses unlink when the captured slot changes before confirmation', async () => {
    // Given
    const user = userEvent.setup();
    const fixture = linkedFixture();
    const onEditorTextChange = vi.fn();
    const props = { editorText: fixture.editorText, savedDraftPayload: null, onEditorTextChange };
    const view = render(workbenchTree(props, clientWith()));
    await user.click(unlinkButton(view, fixture.slot.key));
    const renamedText = fixture.editorText.split(fixture.slot.personName).join(`${fixture.slot.personName} changed`);
    view.rerender(workbenchTree({ ...props, editorText: renamedText }, clientWith()));

    // When
    fireEvent.click(view.getByRole('button', { name: '確認取消連結' }));

    // Then
    expect(view.queryByRole('dialog')).toBeNull();
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });

  it('refuses unlink when mutations become blocked before confirmation', async () => {
    // Given
    const user = userEvent.setup();
    const fixture = linkedFixture();
    const onEditorTextChange = vi.fn();
    const props = { editorText: fixture.editorText, savedDraftPayload: null, onEditorTextChange };
    const client = clientWith();
    const view = render(workbenchTree(props, client));
    await user.click(unlinkButton(view, fixture.slot.key));
    view.rerender(workbenchTree(props, client, undefined, false));

    // When
    fireEvent.click(view.getByRole('button', { name: '確認取消連結' }));

    // Then
    expect(view.queryByRole('dialog')).toBeNull();
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });
});
