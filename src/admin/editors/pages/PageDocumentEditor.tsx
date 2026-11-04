import { InlineNotice } from '@/admin/AdminFeedback';
import { DocumentJsonEditor, type DocumentWorkspace } from '@/admin/documents';
import { assertNever } from '@/admin/documents/assertNever';
import { useSite } from '@/app/site';
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

type ArchiveEditorKind = Extract<PageEditorKind, 'posts' | 'department_info' | 'gallery'>;

/**
 * Archive documents have no structured editor yet: they open in the structured frame, which keeps
 * validation and the mode switch, and edit their JSON directly until dedicated editors land.
 */
function ArchiveInterimEditor({ kind, workspace, onChange }: {
  readonly kind: ArchiveEditorKind;
  readonly workspace: DocumentWorkspace;
  readonly onChange: (editorText: string) => void;
}) {
  const { isZh } = useSite();
  return (
    <StructuredEditorFrame
      kind={kind}
      workspace={workspace}
      onChange={onChange}
      renderStructured={() => (
        <div className="admin-stack" data-archive-editor={kind}>
          <InlineNotice status="info" title={isZh ? '結構化編輯器準備中' : 'Structured editor in preparation'} lang={isZh ? 'zh-Hant' : 'en'}>
            {isZh
              ? '這類內容目前以 JSON 編輯。英文欄位可省略；省略時網站會顯示中文。'
              : 'This content is edited as JSON for now. English fields may be omitted; the site then shows the Chinese text.'}
          </InlineNotice>
          <DocumentJsonEditor workspace={workspace} onChange={onChange} />
        </div>
      )}
    />
  );
}

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
    case 'posts':
    case 'department_info':
    case 'gallery':
      return <ArchiveInterimEditor kind={kind} workspace={workspace} onChange={onChange} />;
    default:
      return assertNever(kind, 'page editor kind');
  }
}
