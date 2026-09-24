import type { CmsDocumentKind } from '@/content/contracts/kinds';
import type {
  CmsPayloadByKind,
  EditableCmsPayloadByKind,
} from '@/content/contracts/registry';

export type StructuredEditorIssue = {
  readonly path: readonly PropertyKey[];
  readonly message: string;
  readonly code?: string;
};

type InvalidStructuredEditorParseResult<K extends CmsDocumentKind> = {
  readonly kind: K;
  readonly editorText: string;
  readonly issues: readonly StructuredEditorIssue[];
};

export type StructuredEditorParseResult<K extends CmsDocumentKind> =
  | {
      readonly status: 'valid';
      readonly kind: K;
      readonly payload: CmsPayloadByKind[K];
    }
  | {
      readonly status: 'editable-invalid';
      readonly kind: K;
      readonly editorText: string;
      readonly payload: EditableCmsPayloadByKind[K];
      readonly issues: readonly StructuredEditorIssue[];
    }
  | (InvalidStructuredEditorParseResult<K> & { readonly status: 'malformed-json' })
  | (InvalidStructuredEditorParseResult<K> & { readonly status: 'invalid-root' })
  | (InvalidStructuredEditorParseResult<K> & { readonly status: 'invalid-payload' });
