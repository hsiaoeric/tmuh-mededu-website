import type { DocumentWorkspace } from '@/admin/documents';
import { StructuredEditorFrame } from '@/admin/editors/shared';
import { FacdevEditor } from './FacdevEditor';

export type FacdevDocumentEditorProps = {
  readonly workspace: DocumentWorkspace;
  readonly onChange: (editorText: string) => void;
};

export function FacdevDocumentEditor({ workspace, onChange }: FacdevDocumentEditorProps) {
  return <StructuredEditorFrame
    kind="facdev"
    workspace={workspace}
    onChange={onChange}
    renderStructured={(model) => <FacdevEditor payload={model.payload} issues={model.issues} onChange={model.commitPayload} />}
  />;
}
