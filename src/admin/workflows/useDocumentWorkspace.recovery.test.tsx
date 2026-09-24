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
  const shared = {
    id: `news-${label}`,
    publishedOn: `2026-08-${label}`,
    pinned: false,
    category: 'department',
    tag: '',
    title: `News ${label}`,
    lines: [],
  };
  return {
    announcementBoardUrl: ANN_URL,
    zh: { department: [shared], holistic: [] },
    en: { department: [shared], holistic: [] },
  };
}

function newsText(label: string): string {
  return JSON.stringify(newsPayload(label));
}

async function conflictedWorkspace(repository: FakeDocumentRepository) {
  repository.listResults.push(Promise.resolve({ ok: true, value: [document()] }));
  repository.readResults.push(Promise.resolve({ ok: true, value: detail() }));
  repository.saveResults.push(Promise.resolve({
    ok: false,
    failure: { kind: 'stale-edit-version', error: { code: null, details: null, hint: null, message: 'stale' } },
  }));
  const workspace = renderWorkspace(repository);
  await waitFor(() => expect(workspace.current().state.status).toBe('ready'));
  act(() => workspace.current().setEditorText(newsText('23')));
  await act(() => workspace.current().save());
  return workspace;
}

describe('document workspace conflict recovery workflow', () => {
  it('retains text and token after a stale save conflict', async () => {
    // Given
    const repository = new FakeDocumentRepository();

    // When
    const workspace = await conflictedWorkspace(repository);

    // Then
    const state = workspace.current().state;
    expect(state.status).toBe('ready');
    if (state.status !== 'ready') return;
    expect(state.workspace.editorText).toBe(newsText('23'));
    expect(state.workspace.expectedEditVersion).toBe(2);
    expect(state.workspace.operation).toEqual({ status: 'conflict', failure: { kind: 'stale-edit-version' } });
  });

  it('reloads the latest token while preserving the local text', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    const workspace = await conflictedWorkspace(repository);
    repository.readResults.push(Promise.resolve({
      ok: true,
      value: { document: document(), revisions: [revision({ editVersion: 8, payload: newsPayload('24') })] },
    }));

    // When
    await act(() => workspace.current().recoverConflict());

    // Then
    const recovered = workspace.current().state;
    expect(recovered.status).toBe('ready');
    if (recovered.status !== 'ready') return;
    expect(recovered.workspace.editorText).toBe(newsText('23'));
    expect(recovered.workspace.expectedEditVersion).toBe(8);
    expect(recovered.workspace.operation).toEqual({ status: 'idle' });
  });

  it('preserves text B edited after recovery began with A and uses the refreshed token', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    const workspace = await conflictedWorkspace(repository);
    const recovery = deferred<Awaited<ReturnType<FakeDocumentRepository['readDocument']>>>();
    repository.readResults.push(recovery.promise);
    const recovering = workspace.current().recoverConflict();
    act(() => workspace.current().setEditorText(newsText('25')));

    // When
    recovery.resolve({
      ok: true,
      value: { document: document(), revisions: [revision({ editVersion: 8, payload: newsPayload('24') })] },
    });
    await act(() => recovering);

    // Then
    const recovered = workspace.current().state;
    expect(recovered.status).toBe('ready');
    if (recovered.status !== 'ready') return;
    expect(recovered.workspace.editorText).toBe(newsText('25'));
    expect(recovered.workspace.baselineText).toContain('2026-08-24');
    expect(recovered.workspace.expectedEditVersion).toBe(8);
    repository.saveResults.push(Promise.resolve({
      ok: true,
      value: revision({ editVersion: 9, payload: newsPayload('25') }),
    }));
    await act(() => workspace.current().save());
    expect(repository.saveCalls[1]?.expectedEditVersion).toBe(8);
  });
});
