import { describe, expect, it } from 'vitest';
import { createDocumentWorkspace, documentWorkspaceReducer, isWorkspaceDirty } from './workspaceState';
import { detail, revision } from '@/admin/workflows/testHarness';

const CONFLICT = { kind: 'stale-edit-version' } as const;

function conflictedWorkspace(editorText: string) {
  const edited = documentWorkspaceReducer(createDocumentWorkspace(detail()), {
    type: 'editor-changed',
    editorText,
  });
  const saving = documentWorkspaceReducer(edited, {
    type: 'mutation-started',
    operation: 'save',
    mutationId: 1,
    submittedEditorText: editorText,
  });
  return documentWorkspaceReducer(saving, {
    type: 'mutation-failed',
    operation: 'save',
    mutationId: 1,
    failure: CONFLICT,
  });
}

function recoveringWorkspace(editorText: string) {
  return documentWorkspaceReducer(conflictedWorkspace(editorText), {
    type: 'conflict-recovery-started',
    mutationId: 2,
    submittedEditorText: editorText,
    failure: CONFLICT,
  });
}

describe('document workspace conflict recovery', () => {
  it('retains text B edited after recovery began with A while refreshing baseline and token', () => {
    // Given
    const textA = '{"title":"A"}';
    const textB = '{"title":"B"}';
    const editedDuringRecovery = documentWorkspaceReducer(recoveringWorkspace(textA), {
      type: 'editor-changed',
      editorText: textB,
    });

    // When
    const recovered = documentWorkspaceReducer(editedDuringRecovery, {
      type: 'conflict-recovery-succeeded',
      mutationId: 2,
      detail: {
        ...detail(),
        revisions: [revision({ editVersion: 8, payload: { title: 'server' } })],
      },
    });

    // Then
    expect(recovered.editorText).toBe(textB);
    expect(recovered.baselineText).toContain('server');
    expect(recovered.expectedEditVersion).toBe(8);
    expect(recovered.operation).toEqual({ status: 'idle' });
    expect(isWorkspaceDirty(recovered)).toBe(true);
  });

  it('preserves text, baseline, token, and conflict after recovery fails', () => {
    // Given
    const recovering = documentWorkspaceReducer(recoveringWorkspace('{"title":"A"}'), {
      type: 'editor-changed',
      editorText: '{"title":"B"}',
    });

    // When
    const failed = documentWorkspaceReducer(recovering, {
      type: 'conflict-recovery-failed',
      mutationId: 2,
    });

    // Then
    expect(failed.editorText).toBe('{"title":"B"}');
    expect(failed.baselineText).toBe(recovering.baselineText);
    expect(failed.expectedEditVersion).toBe(recovering.expectedEditVersion);
    expect(failed.operation).toEqual({ status: 'conflict', failure: CONFLICT });
  });

  it('ignores a stale recovery success after failure and preserves the conflict state', () => {
    // Given
    const recovering = documentWorkspaceReducer(recoveringWorkspace('{"title":"A"}'), {
      type: 'editor-changed',
      editorText: '{"title":"B"}',
    });
    const failed = documentWorkspaceReducer(recovering, {
      type: 'conflict-recovery-failed',
      mutationId: 2,
    });

    // When
    const stale = documentWorkspaceReducer(failed, {
      type: 'conflict-recovery-succeeded',
      mutationId: 2,
      detail: {
        ...detail(),
        revisions: [revision({ editVersion: 9, payload: { title: 'stale server' } })],
      },
    });

    // Then
    expect(stale).toBe(failed);
    expect(stale.editorText).toBe('{"title":"B"}');
    expect(stale.baselineText).toBe(failed.baselineText);
    expect(stale.expectedEditVersion).toBe(failed.expectedEditVersion);
    expect(stale.operation).toEqual({ status: 'conflict', failure: CONFLICT });
  });
});
