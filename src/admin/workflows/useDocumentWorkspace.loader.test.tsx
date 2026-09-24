// @vitest-environment jsdom
import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  FakeDocumentRepository,
  deferred,
  detail,
  document,
  renderWorkspace,
} from './testHarness';

afterEach(cleanup);

describe('document workspace loading', () => {
  it('loads the canonical document and its revisions', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    repository.listResults.push(Promise.resolve({ ok: true, value: [document()] }));
    repository.readResults.push(Promise.resolve({ ok: true, value: detail() }));

    // When
    const workspace = renderWorkspace(repository);

    // Then
    expect(workspace.current().state.status).toBe('loading');
    await waitFor(() => expect(workspace.current().state.status).toBe('ready'));
    expect(repository.readSignals).toHaveLength(1);
  });

  it('reports missing when the canonical kind and stable key are absent', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    repository.listResults.push(Promise.resolve({ ok: true, value: [] }));

    // When
    const workspace = renderWorkspace(repository);

    // Then
    await waitFor(() => expect(workspace.current().state).toEqual({ status: 'missing' }));
    expect(repository.readSignals).toHaveLength(0);
  });

  it('maps repository load failures into load-error state', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    repository.listResults.push(Promise.resolve({
      ok: false,
      failure: { kind: 'transport-error', error: { code: null, details: null, hint: null, message: 'offline' } },
    }));

    // When
    const workspace = renderWorkspace(repository);

    // Then
    await waitFor(() => expect(workspace.current().state).toEqual({
      status: 'load-error',
      failure: { kind: 'transport-error' },
    }));
  });

  it('aborts and ignores a late load after the route kind changes', async () => {
    // Given
    const repository = new FakeDocumentRepository();
    const oldList = deferred<Awaited<ReturnType<FakeDocumentRepository['listDocuments']>>>();
    repository.listResults.push(oldList.promise);
    repository.listResults.push(Promise.resolve({ ok: true, value: [document('people')] }));
    repository.readResults.push(Promise.resolve({ ok: true, value: detail('people') }));
    const workspace = renderWorkspace(repository, 'news');

    // When
    workspace.rerender('people');
    await waitFor(() => expect(workspace.current().state.status).toBe('ready'));
    await act(() => {
      oldList.resolve({ ok: true, value: [document('news')] });
      return oldList.promise;
    });

    // Then
    const state = workspace.current().state;
    expect(repository.listSignals[0]?.aborted).toBe(true);
    expect(state.status === 'ready' ? state.workspace.document.kind : null).toBe('people');
  });

  it('aborts an in-flight load on cleanup', () => {
    // Given
    const repository = new FakeDocumentRepository();
    repository.listResults.push(deferred<Awaited<ReturnType<FakeDocumentRepository['listDocuments']>>>().promise);
    const workspace = renderWorkspace(repository);

    // When
    workspace.view.unmount();

    // Then
    expect(repository.listSignals[0]?.aborted).toBe(true);
  });
});
