import { useLayoutEffect, useMemo, useRef } from 'react';
import { assertNever } from '@/admin/documents/assertNever';
import type { CmsDocumentKind } from '@/content/contracts/kinds';
import type { EditableCmsPayloadByKind } from '@/content/contracts/registry';
import {
  emitStructuredEditorText,
  parseStructuredEditorText,
} from './editorCodec';
import type {
  StructuredEditorIssue,
  StructuredEditorParseResult,
} from './types';

export type StructuredEditorCommitResult =
  | { readonly status: 'emitted' }
  | { readonly status: 'unchanged' }
  | { readonly status: 'stale' };

export type StructuredEditorCommit<Payload> = (
  payload: Payload,
) => StructuredEditorCommitResult;

type AcceptedStructuredEditorCommitResult = Extract<
  StructuredEditorCommitResult,
  { readonly status: 'emitted' }
>;

export function isStructuredEditorCommitAccepted(
  result: StructuredEditorCommitResult,
): result is AcceptedStructuredEditorCommitResult {
  switch (result.status) {
    case 'emitted':
      return true;
    case 'stale':
    case 'unchanged':
      return false;
    default:
      return assertNever(result, 'structured editor commit result');
  }
}

type ValidStructuredEditorModel<K extends CmsDocumentKind> = {
  readonly status: 'valid' | 'editable-invalid';
  readonly kind: K;
  readonly editorText: string;
  readonly payload: EditableCmsPayloadByKind[K];
  readonly issues: readonly StructuredEditorIssue[];
  readonly commitPayload: StructuredEditorCommit<EditableCmsPayloadByKind[K]>;
};

export type StructuredEditorModel<K extends CmsDocumentKind> =
  | ValidStructuredEditorModel<K>
  | Exclude<StructuredEditorParseResult<K>, { readonly status: 'valid' | 'editable-invalid' }>;

export type StructuredEditorModelOptions<K extends CmsDocumentKind> = {
  readonly kind: K;
  readonly editorText: string;
  readonly onEditorTextChange: (editorText: string) => void;
};

type SourceRevision = {
  readonly kind: CmsDocumentKind;
  readonly editorText: string;
};

export function useStructuredEditorModel<K extends CmsDocumentKind>(
  options: StructuredEditorModelOptions<K>,
): StructuredEditorModel<K> {
  const sourceRevision = useMemo<SourceRevision>(() => ({
    kind: options.kind,
    editorText: options.editorText,
  }), [options.editorText, options.kind]);
  const synchronizedSource = useRef<SourceRevision | null>(null);
  const synchronizedOnChange = useRef(options.onEditorTextChange);
  // The text this hook last emitted. When the editor text is still that text, re-emitting its
  // parsed payload would reproduce it exactly (JSON.parse keeps key order), so it is reused rather
  // than serialised again on every keystroke.
  const lastEmitted = useRef<string | null>(null);
  const parsed = useMemo(
    () => parseStructuredEditorText(options.kind, options.editorText),
    [options.editorText, options.kind],
  );

  useLayoutEffect(() => {
    synchronizedSource.current = sourceRevision;
    synchronizedOnChange.current = options.onEditorTextChange;
    return () => {
      if (synchronizedSource.current === sourceRevision) {
        synchronizedSource.current = null;
      }
    };
  }, [options.onEditorTextChange, sourceRevision]);

  switch (parsed.status) {
    case 'valid':
    case 'editable-invalid':
      return {
        ...parsed,
        editorText: options.editorText,
        issues: parsed.status === 'valid' ? [] : parsed.issues,
        commitPayload: (payload) => {
          if (synchronizedSource.current !== sourceRevision) {
            return { status: 'stale' };
          }
          const nextEditorText = emitStructuredEditorText(options.kind, payload);
          const currentText = lastEmitted.current === options.editorText
            ? options.editorText
            : emitStructuredEditorText(options.kind, parsed.payload);
          if (nextEditorText === currentText) {
            return { status: 'unchanged' };
          }
          lastEmitted.current = nextEditorText;
          synchronizedOnChange.current(nextEditorText);
          return { status: 'emitted' };
        },
      };
    case 'malformed-json':
    case 'invalid-root':
    case 'invalid-payload':
      return parsed;
    default:
      return assertNever(parsed, 'structured editor parse result');
  }
}
