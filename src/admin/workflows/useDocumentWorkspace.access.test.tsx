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

async function readyWorkspace(repository: FakeDocumentRepository) {
  repository.listResults.push(Promise.resolve({ ok: true, value: [document()] }));
  repository.readResults.push(Promise.resolve({ ok: true, value: detail() }));
  const workspace = renderWorkspace(repository);
  await waitFor(() => expect(workspace.current().state.status).toBe('ready'));
  return workspace;
}

describe('document workspace protected access', () => {
  it('refuses a new save while mutations are disabled', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    const workspace = await readyWorkspace(repository);
    act(() => workspace.current().setEditorText('{"title":"unsaved"}'));
    workspace.rerender('news', false);

    // When
    await act(() => workspace.current().save());

    // Then
    const state = workspace.current().state;
    expect(repository.saveCalls).toHaveLength(0);
    expect(state.status === 'ready' ? state.workspace.editorText : null).toBe(
      '{"title":"unsaved"}',
    );
    expect(state.status === 'ready' ? state.workspace.operation.status : null).toBe('idle');
  });

  it('does not abort an active save when mutations become disabled', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    const saved = deferred<Awaited<ReturnType<FakeDocumentRepository['save']>>>();
    repository.saveResults.push(saved.promise);
    const workspace = await readyWorkspace(repository);
    act(() => workspace.current().setEditorText(newsText('23')));
    const saving = workspace.current().save();

    // When
    workspace.rerender('news', false);
    saved.resolve({
      ok: true,
      value: revision({ editVersion: 3, payload: newsPayload('23') }),
    });
    await act(() => saving);

    // Then
    const state = workspace.current().state;
    expect(repository.mutationSignals[0]?.aborted).toBe(false);
    expect(state.status === 'ready' ? state.workspace.operation.status : null).toBe('saved');
  });
});
