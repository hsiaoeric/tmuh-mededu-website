import type { AdminDocumentFailure } from '@/admin/repository';
import { assertNever } from './assertNever';

export type WorkflowConflict =
  | { readonly kind: 'active-draft-exists' }
  | { readonly kind: 'stale-edit-version' }
  | { readonly kind: 'superseded-revision' };

export type WorkflowError =
  | { readonly kind: 'forbidden' }
  | { readonly kind: 'not-found' }
  | { readonly kind: 'invalid-request' }
  | { readonly kind: 'validation-failed' }
  | { readonly kind: 'schema-unavailable' }
  | { readonly kind: 'transport-error' }
  | { readonly kind: 'malformed-payload' }
  | { readonly kind: 'aborted' }
  | {
      readonly kind: 'publication-error';
      readonly code: Exclude<
        Extract<AdminDocumentFailure, { readonly kind: 'publication-error' }>['code'],
        'stale-edit-version' | 'superseded-revision'
      >;
      readonly retryable: boolean;
    };

export type WorkflowFailure = WorkflowConflict | WorkflowError;

export function mapRepositoryFailure(failure: AdminDocumentFailure): WorkflowFailure {
  if (failure.kind === 'publication-error') {
    if (failure.code === 'stale-edit-version') return { kind: 'stale-edit-version' };
    if (failure.code === 'superseded-revision') return { kind: 'superseded-revision' };
    return { kind: 'publication-error', code: failure.code, retryable: failure.retryable };
  }
  switch (failure.kind) {
    case 'active-draft-exists':
    case 'stale-edit-version':
    case 'forbidden':
    case 'not-found':
    case 'invalid-request':
    case 'validation-failed':
    case 'schema-unavailable':
    case 'transport-error':
    case 'malformed-payload':
    case 'aborted':
      return { kind: failure.kind };
    default:
      return assertNever(failure, 'document repository failure');
  }
}

export function isWorkflowConflict(failure: WorkflowFailure): failure is WorkflowConflict {
  switch (failure.kind) {
    case 'active-draft-exists':
    case 'stale-edit-version':
    case 'superseded-revision':
      return true;
    case 'forbidden':
    case 'not-found':
    case 'invalid-request':
    case 'validation-failed':
    case 'schema-unavailable':
    case 'transport-error':
    case 'malformed-payload':
    case 'aborted':
    case 'publication-error':
      return false;
    default:
      return assertNever(failure, 'document workflow failure');
  }
}
