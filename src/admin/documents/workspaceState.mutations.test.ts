import { describe, expect, it } from 'vitest';
import {
  createDocumentWorkspace,
  documentWorkspaceReducer,
  isWorkspaceDirty,
  type DocumentMutation,
  type DocumentWorkspaceAction,
} from './workspaceState';
import {
  DOCUMENT,
  DRAFT_ID,
  detail,
  laterEditCase,
  revision,
  startMutation,
} from './workspaceState.testFixtures';

describe('document workspace mutations', () => {
  it('keeps the archived response as the clean reference after archiving the final actionable revision', () => {
    // Given
    const fallbackDraft = revision({ id: DRAFT_ID, status: 'draft', editVersion: 4, payload: { title: 'draft' } });
    const initial = createDocumentWorkspace({ document: DOCUMENT, revisions: [detail().revisions[0] ?? fallbackDraft] });
    const archived = { ...revision({ id: DRAFT_ID, status: 'archived', editVersion: 5, payload: { title: 'archived safely' } }), version: 4 };

    // When
    const completed = documentWorkspaceReducer(startMutation(initial, 'archive'), {
      type: 'archive-succeeded', operation: 'archive', mutationId: 1, revision: archived,
    });

    // Then
    expect(completed.revisions).toContainEqual(archived);
    expect(completed.actionableRevision).toBeNull();
    expect(completed.referenceRevision).toEqual(archived);
    expect(completed.baselineText).toContain('archived safely');
    expect(completed.editorText).toBe(completed.baselineText);
    expect(completed.expectedEditVersion).toBeNull();
    expect(isWorkspaceDirty(completed)).toBe(false);
  });

  it.each([
    { operation: 'save' as const, failure: { kind: 'transport-error' as const } },
    { operation: 'save' as const, failure: { kind: 'stale-edit-version' as const } },
  ])('preserves editor, baseline, and edit token when $failure.kind occurs', ({ operation, failure }) => {
    // Given
    const edited = documentWorkspaceReducer(createDocumentWorkspace(detail()), {
      type: 'editor-changed', editorText: '{"title":"unsaved"}',
    });
    const started = startMutation(edited, operation);

    // When
    const failed = documentWorkspaceReducer(started, {
      type: 'mutation-failed', operation, mutationId: 1, failure,
    });

    // Then
    expect(failed.editorText).toBe(edited.editorText);
    expect(failed.baselineText).toBe(edited.baselineText);
    expect(failed.expectedEditVersion).toBe(4);
  });

  it('replaces revision, editor baseline, and edit token after save', () => {
    // Given
    const edited = documentWorkspaceReducer(createDocumentWorkspace(detail()), {
      type: 'editor-changed', editorText: '{"title":"client"}',
    });
    const savedRevision = revision({ id: DRAFT_ID, status: 'draft', editVersion: 5, payload: { title: 'server' } });

    // When
    const saved = documentWorkspaceReducer(startMutation(edited, 'save'), {
      type: 'save-succeeded', operation: 'save', mutationId: 1, revision: savedRevision,
    });

    // Then
    expect(saved.actionableRevision).toEqual(savedRevision);
    expect(saved.expectedEditVersion).toBe(5);
    expect(saved.editorText).toBe(saved.baselineText);
    expect(saved.baselineText).toContain('server');
    expect(isWorkspaceDirty(saved)).toBe(false);
    expect(saved.operation).toEqual({ status: 'saved', operation: 'save' });
  });

  it('clears a completed success state when the editor changes again', () => {
    // Given
    const saved = documentWorkspaceReducer(startMutation(createDocumentWorkspace(detail()), 'save'), {
      type: 'save-succeeded', operation: 'save', mutationId: 1,
      revision: revision({ id: DRAFT_ID, status: 'draft', editVersion: 5, payload: { title: 'saved' } }),
    });

    // When
    const edited = documentWorkspaceReducer(saved, {
      type: 'editor-changed', editorText: '{"title":"newer"}',
    });

    // Then
    expect(edited.operation).toEqual({ status: 'idle' });
    expect(isWorkspaceDirty(edited)).toBe(true);
  });

  it.each(['save', 'publish', 'archive'] satisfies readonly DocumentMutation[])('keeps text changed after a %s started while advancing the server baseline', (operation) => {
    // Given
    const submitted = '{"title":"submitted"}';
    const newer = '{"title":"newer"}';
    const scenario = laterEditCase(operation);
    const active = startMutation(
      documentWorkspaceReducer(createDocumentWorkspace(detail()), { type: 'editor-changed', editorText: submitted }),
      operation,
      submitted,
    );
    const edited = documentWorkspaceReducer(active, { type: 'editor-changed', editorText: newer });

    // When
    const completed = documentWorkspaceReducer(edited, scenario.completion);

    // Then
    expect(edited.operation).toMatchObject({ status: scenario.activeStatus, mutationId: 1, submittedEditorText: submitted });
    expect(completed.editorText).toBe(newer);
    expect(completed.baselineText).toContain(scenario.baselineText);
    expect(completed.expectedEditVersion).toBe(scenario.expectedEditVersion);
    expect(completed.activeDraft?.status ?? null).toBe(scenario.activeDraftStatus);
    expect(completed.actionableRevision?.status ?? null).toBe(scenario.actionableStatus);
    expect(isWorkspaceDirty(completed)).toBe(true);
  });

  it.each([
    {
      scenario: 'the mutation ID is stale',
      completion: {
        type: 'save-succeeded', operation: 'save', mutationId: 2,
        revision: revision({ id: DRAFT_ID, status: 'draft', editVersion: 5, payload: { title: 'server' } }),
      },
    },
    {
      scenario: 'the operation does not match',
      completion: {
        type: 'publish-succeeded', operation: 'publish', mutationId: 1,
        revision: revision({ id: DRAFT_ID, status: 'published', editVersion: 5, payload: { title: 'server' } }),
      },
    },
  ] satisfies readonly { readonly scenario: string; readonly completion: DocumentWorkspaceAction }[])('ignores a completion when $scenario', ({ completion }) => {
    // Given
    const saving = startMutation(createDocumentWorkspace(detail()), 'save');

    // When
    const ignored = documentWorkspaceReducer(saving, completion);

    // Then
    expect(ignored).toBe(saving);
  });
});
