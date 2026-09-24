import { useSite } from '@/app/site';
import { formatAdminTimestamp, type DocumentWorkspace } from '@/admin/documents';
import { assertNever } from '@/admin/documents/assertNever';
import { GlobalDocumentEditor } from '@/admin/editors/global';
import { PageDocumentEditor } from '@/admin/editors/pages';
import { AdminMediaWorkbench } from '@/admin/media';
import { StableKey } from '@/admin/StableKey';
import { CMS_DOCUMENT_STABLE_KEYS, type CmsDocumentKind } from '@/content/contracts/kinds';

export type AdminWorkspaceEditorRegionProps = {
  readonly workspace: DocumentWorkspace;
  readonly kind: CmsDocumentKind;
  readonly onChange: (editorText: string) => void;
};

export function AdminWorkspaceEditorRegion({
  workspace,
  kind,
  onChange,
}: AdminWorkspaceEditorRegionProps) {
  const { isZh, lang } = useSite();
  const publishedRevision = workspace.revisions.find((revision) => revision.status === 'published');
  const editor = (() => {
    switch (kind) {
      case 'site_copy':
      case 'centers':
      case 'people':
      case 'news':
      case 'activities':
      case 'kpis':
      case 'honors':
        return <GlobalDocumentEditor kind={kind} workspace={workspace} onChange={onChange} />;
      case 'digital_materials':
      case 'facdev':
      case 'ebm':
      case 'holistic':
      case 'holistic_research':
        return <PageDocumentEditor kind={kind} workspace={workspace} onChange={onChange} />;
      default:
        return assertNever(kind, 'CMS document kind');
    }
  })();

  return (
    <>
      {kind === 'people' || kind === 'facdev' ? (
        <AdminMediaWorkbench
          kind={kind}
          documentId={workspace.document.id}
          editorText={workspace.editorText}
          savedDraftPayload={workspace.activeDraft?.payload ?? null}
          onEditorTextChange={onChange}
        />
      ) : null}
      <section className="admin-workspace-grid">
        {editor}
        <aside className="admin-surface admin-document-details" aria-label={isZh ? '文件資訊' : 'Document details'}>
          <h2>{isZh ? '文件資訊' : 'Document details'}</h2>
          <dl className="admin-document-context">
            <div><dt>{isZh ? '內容類型' : 'Content kind'}</dt><dd><StableKey value={kind} /></dd></div>
            <div><dt>{isZh ? '穩定鍵' : 'Stable key'}</dt><dd><StableKey value={CMS_DOCUMENT_STABLE_KEYS[kind]} /></dd></div>
            <div><dt>{isZh ? '最後更新' : 'Last updated'}</dt><dd>{formatAdminTimestamp(workspace.document.updatedAt, lang)}</dd></div>
            <div><dt>{isZh ? '發布修訂' : 'Published revision'}</dt><dd>{publishedRevision?.version ?? (isZh ? '尚未發布' : 'Not published')}</dd></div>
          </dl>
        </aside>
      </section>
    </>
  );
}
