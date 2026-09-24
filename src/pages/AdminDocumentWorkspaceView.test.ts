import { describe, expect, it } from 'vitest';
import type { AdminSaveState } from '@/admin/AdminShell';
import type { DocumentOperationState } from '@/admin/documents';
import { operationSaveState } from './AdminDocumentWorkspaceView';

const OPERATION_SAVE_STATES = [
  { operation: { status: 'idle' }, expected: 'ready' },
  { operation: { status: 'saving', mutationId: 1, submittedEditorText: '{}' }, expected: 'saving' },
  { operation: { status: 'publishing', mutationId: 2, submittedEditorText: '{}' }, expected: 'saving' },
  { operation: { status: 'archiving', mutationId: 3, submittedEditorText: '{}' }, expected: 'saving' },
  { operation: { status: 'recovering', mutationId: 4, submittedEditorText: '{}', failure: { kind: 'stale-edit-version' } }, expected: 'saving' },
  { operation: { status: 'saved', operation: 'save' }, expected: 'ready' },
  { operation: { status: 'conflict', failure: { kind: 'stale-edit-version' } }, expected: 'error' },
  { operation: { status: 'error', failure: { kind: 'transport-error' } }, expected: 'error' },
] satisfies readonly {
  readonly operation: DocumentOperationState;
  readonly expected: AdminSaveState;
}[];

describe('operationSaveState', () => {
  it.each(OPERATION_SAVE_STATES)('maps $operation.status to $expected', ({ operation, expected }) => {
    expect(operationSaveState(operation)).toBe(expected);
  });
});
