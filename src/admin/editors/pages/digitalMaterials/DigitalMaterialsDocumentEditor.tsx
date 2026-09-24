import {
  StructuredEditorFrame,
  type StructuredEditorFrameProps,
} from '@/admin/editors/shared';
import { DigitalMaterialsEditor } from './DigitalMaterialsEditor';

export type DigitalMaterialsDocumentEditorProps = Pick<
  StructuredEditorFrameProps<'digital_materials'>,
  'workspace' | 'onChange'
>;

export function DigitalMaterialsDocumentEditor({
  workspace,
  onChange,
}: DigitalMaterialsDocumentEditorProps) {
  return (
    <StructuredEditorFrame
      kind="digital_materials"
      workspace={workspace}
      onChange={onChange}
      renderStructured={({ payload, issues, commitPayload }) => (
        <DigitalMaterialsEditor
          payload={payload}
          issues={issues}
          onChange={commitPayload}
        />
      )}
    />
  );
}
