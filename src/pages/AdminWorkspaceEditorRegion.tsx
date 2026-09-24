import { lazy, Suspense, useRef, type ReactNode } from 'react';
import { useSite } from '@/app/site';
import { DocumentOutline } from '@/admin/DocumentOutline';
import { formatAdminTimestamp, type DocumentWorkspace } from '@/admin/documents';
import { assertNever } from '@/admin/documents/assertNever';
import { GlobalDocumentEditor } from '@/admin/editors/global';
import { PageDocumentEditor } from '@/admin/editors/pages';
import { EditorDensityProvider } from '@/admin/editors/global/ui/EditorDensity';
import { AdminMediaWorkbench } from '@/admin/media';
import { StableKey } from '@/admin/StableKey';
import { CMS_DOCUMENT_STABLE_KEYS, type CmsDocumentKind } from '@/content/contracts/kinds';

// Loaded on first use: the preview renders public home sections and their GSAP motion code,
// which the editor itself never needs.
const DocumentPreview = lazy(() => import('@/admin/preview/DocumentPreview').then((module) => ({ default: module.DocumentPreview })));

export type AdminWorkspaceEditorRegionProps = {
  readonly workspace: DocumentWorkspace;
  readonly kind: CmsDocumentKind;
  readonly onChange: (editorText: string) => void;
  /** Rarely used document actions shown in the side rail, such as archive. */
  readonly railActions?: ReactNode;
  /** Show the live public preview instead of the editor; the editor stays mounted to keep its state. */
  readonly previewing?: boolean;
};

export function AdminWorkspaceEditorRegion({
  workspace,
  kind,
  onChange,
  railActions,
  previewing = false,
}: AdminWorkspaceEditorRegionProps) {
  const { isZh, lang } = useSite();
  const editorRef = useRef<HTMLDivElement>(null);
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
    <section className="admin-workspace-grid">
      {previewing ? (
        <Suspense fallback={<p className="admin-preview-note" role="status">{isZh ? '正在載入預覽…' : 'Loading preview…'}</p>}>
          <DocumentPreview kind={kind} workspace={workspace} />
        </Suspense>
      ) : null}
      <div ref={editorRef} className="admin-workspace-editor" hidden={previewing}>
        {kind === 'people' || kind === 'facdev' ? (
          <AdminMediaWorkbench
            kind={kind}
            documentId={workspace.document.id}
            editorText={workspace.editorText}
            savedDraftPayload={workspace.activeDraft?.payload ?? null}
            onEditorTextChange={onChange}
          />
        ) : null}
        <EditorDensityProvider collapseItemsByDefault isZh={isZh}>{editor}</EditorDensityProvider>
      </div>
      <aside className="admin-workspace-rail" aria-label={isZh ? '文件資訊' : 'Document details'}>
        {previewing ? null : <DocumentOutline editorRef={editorRef} revision={workspace.editorText} />}
        {railActions}
        <details className="admin-surface admin-document-details">
          <summary>{isZh ? '技術資訊' : 'Technical details'}</summary>
          <dl className="admin-document-context">
            <div><dt>{isZh ? '內容類型' : 'Content kind'}</dt><dd><StableKey value={kind} /></dd></div>
            <div><dt>{isZh ? '穩定鍵' : 'Stable key'}</dt><dd><StableKey value={CMS_DOCUMENT_STABLE_KEYS[kind]} /></dd></div>
            {workspace.actionableRevision === null ? null : <>
              <div><dt>{isZh ? '目前版本' : 'Current version'}</dt><dd>{workspace.actionableRevision.version}</dd></div>
              <div><dt>{isZh ? '編輯權杖' : 'Edit token'}</dt><dd>{workspace.expectedEditVersion}</dd></div>
            </>}
            <div><dt>{isZh ? '最後更新' : 'Last updated'}</dt><dd>{formatAdminTimestamp(workspace.document.updatedAt, lang)}</dd></div>
            <div><dt>{isZh ? '發布修訂' : 'Published revision'}</dt><dd>{publishedRevision?.version ?? (isZh ? '尚未發布' : 'Not published')}</dd></div>
          </dl>
        </details>
      </aside>
    </section>
  );
}
