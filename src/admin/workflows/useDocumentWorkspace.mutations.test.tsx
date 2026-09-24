// @vitest-environment jsdom
import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ANN_URL } from '@/data/news';
import {
  FakeDocumentRepository,
  deferred,
  detail,
  document,
  renderWorkspace,
  revision,
} from './testHarness';

afterEach(cleanup);

function newsPayload(label: string) {
  return {
    announcementBoardUrl: ANN_URL,
    zh: {
      department: [{ id: 'notice', publishedOn: `2026-08-${label}`, category: 'department', pinned: false, tag: '公告', title: '公告', lines: [] }], holistic: [],
    },
    en: {
      department: [{ id: 'notice', publishedOn: `2026-08-${label}`, category: 'department', pinned: false, tag: 'News', title: 'News', lines: [] }], holistic: [],
    },
  };
}

function newsText(label: string): string {
  return JSON.stringify(newsPayload(label));
}

async function readyWorkspace(repository: FakeDocumentRepository) {
  repository.listResults.push(Promise.resolve({ ok: true, value: [document()] }));
  repository.readResults.push(Promise.resolve({ ok: true, value: detail() }));
  const workspace = renderWorkspace(repository);
  await waitFor(() => expect(workspace.current().state.status).toBe('ready'));
  return workspace;
}

describe('document workspace mutations', () => {
  it('deduplicates save clicks while preserving the captured edit token', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    const saveResult = deferred<Awaited<ReturnType<FakeDocumentRepository['save']>>>();
    repository.saveResults.push(saveResult.promise);
    const workspace = await readyWorkspace(repository);
    const submittedText = newsText('23');
    act(() => workspace.current().setEditorText(submittedText));

    // When
    const first = workspace.current().save();
    const second = workspace.current().save();

    // Then
    expect(repository.saveCalls).toEqual([expect.objectContaining({ expectedEditVersion: 2 })]);
    saveResult.resolve({ ok: true, value: revision({ editVersion: 3, payload: newsPayload('23') }) });
    await act(() => Promise.all([first, second]));
    expect(repository.saveCalls).toHaveLength(1);
  });

  it('publishes a clean active draft and removes it from the workspace', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    const published = revision({ status: 'published', editVersion: 3, publishedAt: '2026-08-22T03:00:00Z' });
    repository.publishResults.push(Promise.resolve({ ok: true, value: published }));
    const workspace = await readyWorkspace(repository);

    // When
    await act(() => workspace.current().publish());

    // Then
    const state = workspace.current().state;
    expect(repository.publishCalls).toEqual([expect.objectContaining({ expectedEditVersion: 2 })]);
    expect(state.status === 'ready' ? state.workspace.activeDraft : undefined).toBeNull();
  });

  it('archives only a clean actionable revision and removes it', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    repository.archiveResults.push(Promise.resolve({ ok: true, value: revision({ status: 'archived', editVersion: 3 }) }));
    const workspace = await readyWorkspace(repository);

    // When
    await act(() => workspace.current().archive());

    // Then
    const state = workspace.current().state;
    expect(repository.archiveCalls).toHaveLength(1);
    expect(state.status === 'ready' ? state.workspace.actionableRevision : undefined).toBeNull();
  });

  it('preserves text edited after a save submission when the deferred request resolves', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    const saved = deferred<Awaited<ReturnType<FakeDocumentRepository['save']>>>();
    repository.saveResults.push(saved.promise);
    const workspace = await readyWorkspace(repository);
    const submittedText = newsText('23');
    const newerText = newsText('24');
    act(() => workspace.current().setEditorText(submittedText));
    const saving = workspace.current().save();
    act(() => workspace.current().setEditorText(newerText));
    const stateAfterEdit = workspace.current().state;
    expect(stateAfterEdit.status === 'ready'
      ? stateAfterEdit.workspace.operation.status
      : undefined).toBe('saving');

    // When
    saved.resolve({ ok: true, value: revision({ editVersion: 3, payload: newsPayload('23') }) });
    await act(() => saving);

    // Then
    const state = workspace.current().state;
    expect(state.status === 'ready' ? state.workspace.editorText : undefined).toBe(newerText);
    expect(state.status === 'ready' ? state.workspace.baselineText : undefined).toContain('2026-08-23');
    expect(state.status === 'ready' ? state.workspace.expectedEditVersion : undefined).toBe(3);
    expect(state.status === 'ready' ? state.workspace.editorText !== state.workspace.baselineText : false).toBe(true);
  });

  it('preserves text edited after a publish submission when the deferred request resolves', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    const published = deferred<Awaited<ReturnType<FakeDocumentRepository['publish']>>>();
    repository.publishResults.push(published.promise);
    const workspace = await readyWorkspace(repository);
    const publishing = workspace.current().publish();
    act(() => workspace.current().setEditorText('{"title":"newer"}'));
    const stateAfterEdit = workspace.current().state;
    expect(stateAfterEdit.status === 'ready'
      ? stateAfterEdit.workspace.operation.status
      : undefined).toBe('publishing');

    // When
    published.resolve({ ok: true, value: revision({ status: 'published', editVersion: 3, payload: { title: 'published' } }) });
    await act(() => publishing);

    // Then
    const state = workspace.current().state;
    expect(state.status === 'ready' ? state.workspace.editorText : undefined).toBe('{"title":"newer"}');
    expect(state.status === 'ready' ? state.workspace.baselineText : undefined).toContain('published');
    expect(state.status === 'ready' ? state.workspace.expectedEditVersion : undefined).toBe(3);
    expect(state.status === 'ready' ? state.workspace.editorText !== state.workspace.baselineText : false).toBe(true);
  });

  it('preserves text edited after an archive submission when the deferred request resolves', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    const archived = deferred<Awaited<ReturnType<FakeDocumentRepository['archive']>>>();
    repository.archiveResults.push(archived.promise);
    const workspace = await readyWorkspace(repository);
    const archiving = workspace.current().archive();
    act(() => workspace.current().setEditorText('{"title":"newer"}'));
    const stateAfterEdit = workspace.current().state;
    expect(stateAfterEdit.status === 'ready'
      ? stateAfterEdit.workspace.operation.status
      : undefined).toBe('archiving');

    // When
    archived.resolve({ ok: true, value: revision({ status: 'archived', editVersion: 3 }) });
    await act(() => archiving);

    // Then
    const state = workspace.current().state;
    expect(state.status === 'ready' ? state.workspace.editorText : undefined).toBe('{"title":"newer"}');
    expect(state.status === 'ready' ? state.workspace.baselineText : undefined).toContain('2026-08-22');
    expect(state.status === 'ready' ? state.workspace.referenceRevision?.status : undefined).toBe('archived');
    expect(state.status === 'ready' ? state.workspace.actionableRevision : undefined).toBeNull();
    expect(state.status === 'ready' ? state.workspace.expectedEditVersion : undefined).toBeNull();
    expect(state.status === 'ready' ? state.workspace.editorText !== state.workspace.baselineText : false).toBe(true);
  });

  it('ignores and aborts a late mutation after the route changes', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    const saveResult = deferred<Awaited<ReturnType<FakeDocumentRepository['save']>>>();
    repository.saveResults.push(saveResult.promise);
    const workspace = await readyWorkspace(repository);
    act(() => workspace.current().setEditorText(newsText('23')));
    const saving = workspace.current().save();
    repository.listResults.push(Promise.resolve({ ok: true, value: [document('people')] }));
    repository.readResults.push(Promise.resolve({ ok: true, value: detail('people') }));

    // When
    workspace.rerender('people');
    await waitFor(() => expect(workspace.current().state.status).toBe('ready'));
    saveResult.resolve({ ok: true, value: revision({ editVersion: 9, payload: newsPayload('23') }) });
    await act(() => saving);

    // Then
    const state = workspace.current().state;
    expect(repository.mutationSignals[0]?.aborted).toBe(true);
    expect(state.status === 'ready' ? state.workspace.document.kind : null).toBe('people');
  });
});
