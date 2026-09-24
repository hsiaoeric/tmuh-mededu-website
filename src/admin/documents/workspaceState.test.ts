import { describe, expect, it } from 'vitest';
import {
  createDocumentWorkspace,
  documentWorkspaceReducer,
  isWorkspaceDirty,
  type DocumentLoadState,
  type DocumentOperationState,
} from './workspaceState';
import {
  ARCHIVED_ID,
  DOCUMENT,
  PUBLISHED_ID,
  detail,
  revision,
} from './workspaceState.testFixtures';

describe('document workspace state', () => {
  it('models every load and operation phase as discriminated states', () => {
    // Given
    const loads: readonly DocumentLoadState[] = [
      { status: 'loading' },
      { status: 'missing' },
      { status: 'load-error', failure: { kind: 'forbidden' } },
      { status: 'ready', workspace: createDocumentWorkspace(detail()) },
    ];
    const operations: readonly DocumentOperationState[] = [
      { status: 'idle' },
      { status: 'saving', mutationId: 1, submittedEditorText: '{}' },
      { status: 'publishing', mutationId: 2, submittedEditorText: '{}' },
      { status: 'archiving', mutationId: 3, submittedEditorText: '{}' },
      { status: 'recovering', mutationId: 4, submittedEditorText: '{}', failure: { kind: 'stale-edit-version' } },
      { status: 'saved', operation: 'save' },
      { status: 'conflict', failure: { kind: 'stale-edit-version' } },
      { status: 'error', failure: { kind: 'transport-error' } },
    ];

    // When
    const phases = [...loads.map((state) => state.status), ...operations.map((state) => state.status)];

    // Then
    expect(phases).toEqual([
      'loading', 'missing', 'load-error', 'ready',
      'idle', 'saving', 'publishing', 'archiving', 'recovering', 'saved', 'conflict', 'error',
    ]);
  });

  it('derives dirty exclusively from editor and baseline text', () => {
    // Given
    const workspace = createDocumentWorkspace(detail());

    // When
    const edited = documentWorkspaceReducer(workspace, {
      type: 'editor-changed',
      editorText: '{"title":"changed"}',
    });

    // Then
    expect(isWorkspaceDirty(workspace)).toBe(false);
    expect(isWorkspaceDirty(edited)).toBe(true);
    expect('dirty' in edited).toBe(false);
  });

  it('uses the newest archived payload as a non-actionable reference when no current revision exists', () => {
    // Given
    const older = revision({ id: PUBLISHED_ID, status: 'archived', editVersion: 5, payload: { title: 'older archived' } });
    const newestArchived = { ...revision({ id: ARCHIVED_ID, status: 'archived', editVersion: 8, payload: { title: 'newest archived' } }), version: 8 };

    // When
    const workspace = createDocumentWorkspace({ document: DOCUMENT, revisions: [older, newestArchived] });

    // Then
    expect(workspace.actionableRevision).toBeNull();
    expect(workspace.referenceRevision).toEqual(newestArchived);
    expect(workspace.baselineText).toContain('newest archived');
    expect(workspace.editorText).toBe(workspace.baselineText);
    expect(workspace.expectedEditVersion).toBeNull();
    expect(isWorkspaceDirty(workspace)).toBe(false);
  });
});
