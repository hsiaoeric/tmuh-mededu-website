import type { DocumentWorkspace } from '@/admin/documents';
import { assertNever } from '@/admin/documents/assertNever';
import { StructuredEditorFrame } from '@/admin/editors/shared';
import { ActivitiesEditor } from './activities';
import { CentersEditor } from './centers';
import { HonorsEditor } from './honors/HonorsEditor';
import { KpisEditor } from './kpis/KpisEditor';
import { NewsEditor } from './news';
import { PeopleEditor } from './people';
import { SiteCopyEditor } from './siteCopy/SiteCopyEditor';
import type { GlobalEditorKind } from './types';

export type GlobalDocumentEditorProps = {
  readonly kind: GlobalEditorKind;
  readonly workspace: DocumentWorkspace;
  readonly onChange: (editorText: string) => void;
};

export function GlobalDocumentEditor({ kind, workspace, onChange }: GlobalDocumentEditorProps) {
  switch (kind) {
    case 'site_copy':
      return <StructuredEditorFrame key={kind} kind={kind} workspace={workspace} onChange={onChange} renderStructured={(model) => <SiteCopyEditor payload={model.payload} issues={model.issues} onChange={(payload) => model.commitPayload(payload)} />} />;
    case 'centers':
      return <StructuredEditorFrame key={kind} kind={kind} workspace={workspace} onChange={onChange} renderStructured={(model) => <CentersEditor payload={model.payload} issues={model.issues} onChange={(payload) => model.commitPayload(payload)} />} />;
    case 'people':
      return <StructuredEditorFrame key={kind} kind={kind} workspace={workspace} onChange={onChange} renderStructured={(model) => <PeopleEditor payload={model.payload} issues={model.issues} onChange={(payload) => model.commitPayload(payload)} />} />;
    case 'news':
      return <StructuredEditorFrame key={kind} kind={kind} workspace={workspace} onChange={onChange} renderStructured={(model) => <NewsEditor payload={model.payload} issues={model.issues} onChange={(payload) => model.commitPayload(payload)} />} />;
    case 'activities':
      return <StructuredEditorFrame key={kind} kind={kind} workspace={workspace} onChange={onChange} renderStructured={(model) => <ActivitiesEditor payload={model.payload} onPayloadChange={(payload) => model.commitPayload(payload)} />} />;
    case 'kpis':
      return <StructuredEditorFrame key={kind} kind={kind} workspace={workspace} onChange={onChange} renderStructured={(model) => <KpisEditor payload={model.payload} issues={model.issues} onChange={(payload) => model.commitPayload(payload)} />} />;
    case 'honors':
      return <StructuredEditorFrame key={kind} kind={kind} workspace={workspace} onChange={onChange} renderStructured={(model) => <HonorsEditor editorText={model.editorText} onEditorTextChange={onChange} />} />;
    default:
      return assertNever(kind, 'global editor kind');
  }
}
