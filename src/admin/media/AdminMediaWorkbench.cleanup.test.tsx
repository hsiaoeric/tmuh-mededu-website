// @vitest-environment jsdom
import { act, fireEvent, render, waitFor, within, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { changePortraitReference } from './index';
import { parseDraftPayload } from '@/admin/documents';
import { CmsDocumentIdSchema } from '@/content/contracts/primitives';
import type { DraftUploadResult } from './types';
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

async function cleanupRegion(view: RenderResult): Promise<HTMLElement> {
  return waitFor(() => {
    const region = view.container.querySelector('.admin-media-cleanup');
    if (!(region instanceof HTMLElement)) throw new TypeError('Missing media cleanup region');
    return region;
  });
}

describe('AdminMediaWorkbench cleanup', () => {
  it('keeps a stale upload out of edited JSON and exposes it for cleanup', async () => {
    // Given
    const user = userEvent.setup();
    const upload = deferred<DraftUploadResult>();
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const onEditorTextChange = vi.fn();
    const view = render(workbenchTree({ editorText, savedDraftPayload: null, onEditorTextChange }, clientWith({
      upload: () => upload.promise,
    })));
    const field = view.container.querySelector(`[data-slot-key="${slot.key}"]`);
    const input = field?.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Expected file input');
    await user.upload(input, new File(['portrait'], 'portrait.webp', { type: 'image/webp' }));

    // When
    view.rerender(workbenchTree({
      editorText: `${editorText}\n`,
      savedDraftPayload: null,
      onEditorTextChange,
    }, clientWith({ upload: () => upload.promise })));
    upload.resolve({
      ok: true,
      outcome: 'created',
      reference: uploadedReference,
      sha256: 'a'.repeat(64),
    });
    await act(async () => upload.promise);

    // Then
    expect(onEditorTextChange).not.toHaveBeenCalled();
    const cleanup = within(await cleanupRegion(view));
    expect(cleanup.getAllByText(uploadedReference.path).length).toBeGreaterThan(0);
    expect(cleanup.getByRole('button', { name: '刪除未使用的上傳' })).toBeTruthy();
  });

  it('abandons an upload when canonical editor text changes A to B to A before resolution', async () => {
    // Given
    const user = userEvent.setup();
    const upload = deferred<DraftUploadResult>();
    const editorTextA = peopleEditorText();
    const editorTextB = `${editorTextA}\n`;
    const slot = firstSlot(editorTextA);
    const canonicalReference = slot.reference;
    if (canonicalReference === null) throw new TypeError('Expected canonical portrait reference');
    const onEditorTextChange = vi.fn();
    const client = clientWith({ upload: () => upload.promise });
    const props = { editorText: editorTextA, savedDraftPayload: null, onEditorTextChange };
    const view = render(workbenchTree(props, client));
    const field = view.container.querySelector(`[data-slot-key="${slot.key}"]`);
    if (!(field instanceof HTMLElement)) throw new TypeError('Expected portrait field');
    const input = field.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Expected file input');
    await user.upload(input, new File(['portrait'], 'portrait.webp', { type: 'image/webp' }));
    view.rerender(workbenchTree({ ...props, editorText: editorTextB }, client));
    view.rerender(workbenchTree(props, client));

    // When
    await act(async () => {
      upload.resolve({
        ok: true,
        outcome: 'created',
        reference: uploadedReference,
        sha256: 'a'.repeat(64),
      });
      await upload.promise;
    });

    // Then
    expect(within(await cleanupRegion(view)).getAllByText(uploadedReference.path)).toHaveLength(1);
    expect(onEditorTextChange).not.toHaveBeenCalled();
    expect(field.textContent).toContain(canonicalReference.path);
  });

  it('keeps cleanup deletion disabled while the exact draft path is referenced', async () => {
    // Given
    const editorText = peopleEditorText();
    const slot = firstSlot(editorText);
    const changed = changePortraitReference({
      kind: 'people',
      editorText,
      slot,
      reference: uploadedReference,
    });
    if (!changed.ok) throw new TypeError('Expected draft fixture update');
    const parsedSavedDraft = parseDraftPayload(changed.editorText);
    if (!parsedSavedDraft.ok) throw new TypeError('Expected saved draft payload');
    const savedDraftPayload = parsedSavedDraft.payload;

    // When
    const view = render(workbenchTree({
      editorText: changed.editorText,
      savedDraftPayload,
      onEditorTextChange: vi.fn(),
    }, clientWith(), <RegisterCreatedReference reference={uploadedReference} />));

    // Then
    const cleanup = within(await cleanupRegion(view));
    expect(cleanup.getAllByText(uploadedReference.path).length).toBeGreaterThan(0);
    const remove = cleanup.getByRole('button', { name: '刪除未使用的上傳' });
    expect(remove.hasAttribute('disabled')).toBe(true);
    expect(view.getByText(/仍被目前編輯內容與已儲存草稿引用/)).toBeTruthy();
  });

  it('retains a saved claim across document navigation and blocks cleanup immediately', async () => {
    // Given
    const peopleId = CmsDocumentIdSchema.parse('22222222-2222-4222-8222-222222222222');
    const facdevId = CmsDocumentIdSchema.parse('33333333-3333-4333-8333-333333333333');
    const editorText = peopleEditorText();
    const view = render(workbenchTree({
      documentId: peopleId,
      editorText,
      savedDraftPayload: { portrait: uploadedReference },
      onEditorTextChange: vi.fn(),
    }, clientWith(), <RegisterCreatedReference reference={uploadedReference} />));
    const cleanup = within(await cleanupRegion(view));
    expect(cleanup.getByRole('button', { name: '刪除未使用的上傳' }).hasAttribute('disabled')).toBe(true);

    // When
    view.rerender(workbenchTree({
      documentId: facdevId,
      editorText,
      savedDraftPayload: null,
      onEditorTextChange: vi.fn(),
    }, clientWith(), <RegisterCreatedReference reference={uploadedReference} />));

    // Then
    await waitFor(() => expect(cleanup.getByRole('button', { name: '刪除未使用的上傳' }).hasAttribute('disabled')).toBe(true));
    expect(cleanup.getByText(/仍被已儲存草稿引用/)).toBeTruthy();
  });

  it('returns rejected explicit cleanup to a non-busy terminal state', async () => {
    // Given
    const view = render(workbenchTree({
      editorText: peopleEditorText(),
      savedDraftPayload: null,
      onEditorTextChange: vi.fn(),
    }, clientWith({
      delete: () => Promise.reject(new TypeError('protocol violation')),
    }), <RegisterCreatedReference reference={uploadedReference} />));
    const cleanup = within(await cleanupRegion(view));
    const remove = cleanup.getByRole('button', { name: '刪除未使用的上傳' });

    // When
    fireEvent.click(remove);
    fireEvent.click(view.getByRole('button', { name: '永久刪除' }));

    // Then
    await act(async () => Promise.resolve());
    expect(remove.hasAttribute('disabled')).toBe(false);
    expect(view.queryByRole('dialog')).toBeNull();
    expect(cleanup.getAllByText(uploadedReference.path).length).toBeGreaterThan(0);
  });

  it('does not resurrect a permanently deleted upload after ownership synchronization', async () => {
    // Given
    const editorText = peopleEditorText();
    const deleteDraft = vi.fn(() => Promise.resolve({ ok: true } as const));
    const props = {
      editorText,
      savedDraftPayload: null,
      onEditorTextChange: vi.fn(),
    };
    const client = clientWith({ delete: deleteDraft });
    const view = render(workbenchTree(
      props,
      client,
      <RegisterCreatedReference reference={uploadedReference} />,
    ));
    const cleanup = within(await cleanupRegion(view));
    fireEvent.click(cleanup.getByRole('button', { name: '刪除未使用的上傳' }));
    fireEvent.click(view.getByRole('button', { name: '永久刪除' }));
    await view.findByText('未使用的上傳已永久刪除。');
    expect(cleanup.queryByRole('button', { name: '刪除未使用的上傳' })).toBeNull();

    // When
    view.rerender(workbenchTree(
      { ...props, editorText: `${editorText}\n` },
      client,
      <RegisterCreatedReference reference={uploadedReference} />,
    ));

    // Then
    await waitFor(() => {
      expect(cleanup.queryByRole('button', { name: '刪除未使用的上傳' })).toBeNull();
      expect(view.container.querySelector('.admin-media-cleanup-item')).toBeNull();
    });
    expect(deleteDraft).toHaveBeenCalledOnce();
    expect(view.getByText('未使用的上傳已永久刪除。')).toBeTruthy();
  }, 20_000);

  it('consumes a late cleanup rejection after unmount', async () => {
    // Given
    let rejectRemoval: (reason?: unknown) => void = () => undefined;
    let operationSignal: AbortSignal | undefined;
    const removal = new Promise<never>((_resolve, reject) => {
      rejectRemoval = reject;
    });
    const view = render(workbenchTree({
      editorText: peopleEditorText(),
      savedDraftPayload: null,
      onEditorTextChange: vi.fn(),
    }, clientWith({
      delete: (_reference, _guard, signal) => {
        operationSignal = signal;
        return removal;
      },
    }), <RegisterCreatedReference reference={uploadedReference} />));
    const cleanup = within(await cleanupRegion(view));
    fireEvent.click(cleanup.getByRole('button', { name: '刪除未使用的上傳' }));
    fireEvent.click(view.getByRole('button', { name: '永久刪除' }));

    // When
    view.unmount();
    rejectRemoval(new TypeError('late protocol violation'));
    await act(async () => Promise.resolve());

    // Then
    expect(operationSignal?.aborted).toBe(true);
  });
});
