import type { DocumentWorkspace } from '@/admin/documents';
import { assertNever } from '@/admin/documents/assertNever';
import type { GlobalEditorKind } from '@/admin/editors/global/types';
import { StructuredEditorFrame } from '@/admin/editors/shared';
import type { CmsDocumentKind } from '@/content/contracts/kinds';
import { DigitalMaterialsDocumentEditor } from './digitalMaterials/DigitalMaterialsDocumentEditor';
import { EbmEditor } from './ebm/EbmEditor';
import { FacdevDocumentEditor } from './facdev/FacdevDocumentEditor';
import { HolisticEditor } from './holistic/HolisticEditor';
import { HolisticResearchEditor } from './holisticResearch/HolisticResearchEditor';

export type PageEditorKind = Exclude<CmsDocumentKind, GlobalEditorKind>;

export type PageDocumentEditorProps = {
  readonly kind: PageEditorKind;
  readonly workspace: DocumentWorkspace;
  readonly onChange: (editorText: string) => void;
};

export function PageDocumentEditor({ kind, workspace, onChange }: PageDocumentEditorProps) {
  switch (kind) {
    case 'digital_materials':
      return <DigitalMaterialsDocumentEditor workspace={workspace} onChange={onChange} />;
    case 'facdev':
      return <FacdevDocumentEditor workspace={workspace} onChange={onChange} />;
    case 'ebm':
      return <EbmEditor workspace={workspace} onChange={onChange} />;
    case 'holistic':
      return (
        <StructuredEditorFrame
          kind={kind}
          workspace={workspace}
          onChange={onChange}
          renderStructured={(model) => (
            <HolisticEditor
              payload={model.payload}
              issues={model.issues}
              onChange={model.commitPayload}
            />
          )}
        />
      );
    case 'holistic_research':
      return (
        <StructuredEditorFrame
          kind={kind}
          workspace={workspace}
          onChange={onChange}
          renderStructured={(model) => (
            <HolisticResearchEditor
              editorText={model.editorText}
              onEditorTextChange={onChange}
            />
          )}
        />
      );
    default:
      return assertNever(kind, 'page editor kind');
  }
}
