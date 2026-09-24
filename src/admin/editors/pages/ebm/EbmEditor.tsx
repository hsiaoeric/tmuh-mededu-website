import type { DocumentWorkspace } from '@/admin/documents';
import { StructuredEditorFrame } from '@/admin/editors/shared';
import { EbmStructuredEditor } from './EbmStructuredEditor';

export type EbmEditorProps = {
  readonly workspace: DocumentWorkspace;
  readonly onChange: (editorText: string) => void;
};

export function EbmEditor({ workspace, onChange }: EbmEditorProps) {
  return (
    <StructuredEditorFrame
      kind="ebm"
      workspace={workspace}
      onChange={onChange}
      renderStructured={(model) => (
        <EbmStructuredEditor
          payload={model.payload}
          issues={model.issues}
          onChange={model.commitPayload}
        />
      )}
    />
  );
}
