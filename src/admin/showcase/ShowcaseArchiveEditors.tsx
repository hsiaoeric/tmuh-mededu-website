import { useMemo, useState } from 'react';
import { useSite } from '@/app/site';
import { AdminButton } from '../AdminButton';
import { AdminToolbar } from '../AdminShell';
import { changedFieldIds, isFieldChanged } from '../documents/changedFields';
import { DepartmentInfoEditor, GalleryEditor, PostsEditor, useArchiveLockedIds, type ArchiveEditorKind } from '../editors/archive';
import { mapStructuredEditorIssues } from '../editors/shared';
import { EditorDensityProvider } from '../editors/global/ui/EditorDensity';
import { FieldDecorationsProvider } from '../fieldDecorations';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import type { Json } from '@/content/database.types';
import snapshot from '@/content/generated/cms-snapshot.json';

const KINDS: readonly { readonly kind: ArchiveEditorKind; readonly zh: string; readonly en: string }[] = [
  { kind: 'posts', zh: '公告與文章', en: 'Posts' },
  { kind: 'department_info', zh: '教學部資料', en: 'Department information' },
  { kind: 'gallery', zh: '活動花絮與影音', en: 'Photos and videos' },
];

function publishedPayload(kind: ArchiveEditorKind): Json {
  const document = snapshot.find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} snapshot`);
  return document.payload as Json;
}

/**
 * The archive editors on the committed snapshot, editable in memory only. The snapshot stands in
 * for the published revision, so edits show changed markers as they would in the workspace.
 */
function ArchiveEditorDemo({ kind, isZh }: { readonly kind: ArchiveEditorKind; readonly isZh: boolean }) {
  const published = useMemo(() => publishedPayload(kind), [kind]);
  const [payload, setPayload] = useState<unknown>(() => CMS_PAYLOAD_REGISTRY[kind].editableSchema.parse(published));
  const lockedIds = useArchiveLockedIds(kind, published);
  const text = useMemo(() => JSON.stringify(payload), [payload]);
  const changed = useMemo(() => changedFieldIds(published, text), [published, text]);
  const issues = useMemo(() => {
    const result = CMS_PAYLOAD_REGISTRY[kind].schema.safeParse(payload);
    return mapStructuredEditorIssues(result.success ? [] : result.error.issues.map((issue) => ({ path: issue.path, message: issue.message, code: issue.code })), isZh);
  }, [isZh, kind, payload]);
  const decorations = useMemo(() => ({ isZh, isChanged: (fieldId: string) => isFieldChanged(changed, fieldId) }), [changed, isZh]);
  const onChange = (next: unknown) => {
    if (JSON.stringify(next) === text) return { status: 'unchanged' } as const;
    setPayload(next);
    return { status: 'emitted' } as const;
  };
  const props = { issues, lockedIds, onChange };
  return (
    <FieldDecorationsProvider value={decorations}>
      <EditorDensityProvider collapseItemsByDefault isZh={isZh}>
        <div className="admin-workspace-editor" data-showcase-archive={kind}>
          {kind === 'posts' ? <PostsEditor {...props} payload={payload as never} /> : null}
          {kind === 'department_info' ? <DepartmentInfoEditor {...props} payload={payload as never} /> : null}
          {kind === 'gallery' ? <GalleryEditor {...props} payload={payload as never} /> : null}
        </div>
      </EditorDensityProvider>
    </FieldDecorationsProvider>
  );
}

export function ShowcaseArchiveEditors() {
  const { isZh } = useSite();
  const [kind, setKind] = useState<ArchiveEditorKind>('posts');
  return (
    <section id="archive-editors" className="admin-showcase-section" aria-labelledby="archive-editors-title">
      <div className="admin-section-heading">
        <span className="mono">05 / ARCHIVE EDITORS</span>
        <h2 id="archive-editors-title">{isZh ? '公告與資料庫編輯器' : 'Archive editors'}</h2>
        <p>{isZh ? '以已提交的快照資料展示；變更只存在此頁，不會寫入任何地方。' : 'Shown on the committed snapshot; edits stay on this page and are never saved.'}</p>
      </div>
      <div className="admin-stack">
        <AdminToolbar label={isZh ? '選擇編輯器' : 'Choose an editor'}>
          {KINDS.map((entry) => (
            <AdminButton key={entry.kind} variant="quiet" aria-pressed={kind === entry.kind} onClick={() => setKind(entry.kind)}>{isZh ? entry.zh : entry.en}</AdminButton>
          ))}
        </AdminToolbar>
        <ArchiveEditorDemo key={kind} kind={kind} isZh={isZh} />
      </div>
    </section>
  );
}
