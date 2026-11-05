import type { DocumentWorkspace } from '@/admin/documents';
import { assertNever } from '@/admin/documents/assertNever';
import { StructuredEditorFrame } from '@/admin/editors/shared';
import type { Json } from '@/content/database.types';
import type { ArchiveEditorKind } from './archiveTypes';
import { DepartmentInfoEditor } from './department/DepartmentInfoEditor';
import { GalleryEditor } from './gallery/GalleryEditor';
import { useArchiveLockedIds } from './lockedIds';
import { PostsEditor } from './posts/PostsEditor';

export type ArchiveDocumentEditorProps = {
  readonly kind: ArchiveEditorKind;
  readonly workspace: DocumentWorkspace;
  readonly onChange: (editorText: string) => void;
};

const NO_PUBLISHED: Json | null = null;

/**
 * Structured editors for the archive documents, inside the shared frame that validates the JSON
 * and keeps the advanced JSON editor one click away.
 */
export function ArchiveDocumentEditor({ kind, workspace, onChange }: ArchiveDocumentEditorProps) {
  const published = workspace.revisions.find((revision) => revision.status === 'published')?.payload ?? NO_PUBLISHED;
  const lockedIds = useArchiveLockedIds(kind, published);
  switch (kind) {
    case 'posts':
      return <StructuredEditorFrame key={kind} kind={kind} workspace={workspace} onChange={onChange} renderStructured={(model) => <PostsEditor payload={model.payload} issues={model.issues} onChange={model.commitPayload} lockedIds={lockedIds} />} />;
    case 'department_info':
      return <StructuredEditorFrame key={kind} kind={kind} workspace={workspace} onChange={onChange} renderStructured={(model) => <DepartmentInfoEditor payload={model.payload} issues={model.issues} onChange={model.commitPayload} lockedIds={lockedIds} />} />;
    case 'gallery':
      return <StructuredEditorFrame key={kind} kind={kind} workspace={workspace} onChange={onChange} renderStructured={(model) => <GalleryEditor payload={model.payload} issues={model.issues} onChange={model.commitPayload} lockedIds={lockedIds} />} />;
    default:
      return assertNever(kind, 'archive editor kind');
  }
}
