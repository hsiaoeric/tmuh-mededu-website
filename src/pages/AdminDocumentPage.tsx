import { Link, useParams } from 'react-router-dom';
import { usePageTitle, useSite } from '@/app/site';
import { AdminAppShell, AdminPageHeader } from '@/admin/AdminShell';
import { StatePanel } from '@/admin/AdminFeedback';
import { CMS_DOCUMENT_METADATA, getAdminDocumentFailureCopy, type WorkflowFailure } from '@/admin/documents';
import { useAdminDocumentRepository, type AdminDocumentRepository } from '@/admin/repository';
import { useDocumentWorkspace } from '@/admin/workflows';
import { CmsDocumentKindSchema, type CmsDocumentKind } from '@/content/contracts/kinds';
import { AdminDocumentWorkspaceView } from './AdminDocumentWorkspaceView';
import '@/design/admin.css';

type DocumentStatePageProps = {
  readonly kind: CmsDocumentKind;
  readonly state: 'loading' | 'missing' | 'error';
  readonly failure?: WorkflowFailure;
  readonly onRetry?: () => void;
};

function DocumentStatePage({ kind, state, failure, onRetry }: DocumentStatePageProps) {
  const { isZh } = useSite();
  const metadata = CMS_DOCUMENT_METADATA[kind];
  const label = isZh ? metadata.label.zh : metadata.label.en;
  const title = `${label} ${isZh ? 'JSON 工作區' : 'JSON workspace'}`;
  const copy = failure === undefined ? null : getAdminDocumentFailureCopy(failure, isZh);
  const panel = state === 'loading'
    ? { kind: 'loading' as const, title: isZh ? `正在載入${label}內容` : `Loading ${label} content`, description: isZh ? '正在取得文件與目前修訂版本。' : 'Retrieving the document and its current revision.' }
    : state === 'missing'
      ? { kind: 'empty' as const, title: isZh ? `尚未建立${label}文件` : `${label} document has not been created`, description: isZh ? '此內容類型目前沒有可編輯的管理文件。' : 'There is no editable admin document for this content type.' }
      : { kind: 'error' as const, title: isZh ? `無法載入${label}內容` : `Unable to load ${label} content`, description: copy === null ? '' : `${copy.title}。${copy.description}` };
  return (
    <AdminAppShell eyebrow={`ADMIN / ${kind.toUpperCase()}`} title={title} status={isZh ? '文件工作區' : 'Document workspace'} showcaseNavigation={false}>
      <div className="admin-content-limiter admin-workspace-page">
        <AdminPageHeader eyebrow={`CONTENT / ${kind}`} title={title} description={isZh ? metadata.description.zh : metadata.description.en} descriptionLang={isZh ? 'zh-Hant' : 'en'} actions={<Link className="admin-button" data-variant="secondary" to="/admin">{isZh ? '返回總覽' : 'Back to dashboard'}</Link>} />
        <section className="admin-surface">
          <StatePanel kind={panel.kind} title={panel.title} description={panel.description} actionLabel={state === 'error' ? (isZh ? '重試' : 'Retry') : undefined} onAction={state === 'error' ? onRetry : undefined} />
        </section>
      </div>
    </AdminAppShell>
  );
}

function DocumentWorkspaceRoute({ repository, kind }: { readonly repository: AdminDocumentRepository; readonly kind: CmsDocumentKind }) {
  const controller = useDocumentWorkspace({ repository, kind });
  if (controller.state.status === 'loading') return <DocumentStatePage kind={kind} state="loading" />;
  if (controller.state.status === 'missing') return <DocumentStatePage kind={kind} state="missing" />;
  if (controller.state.status === 'load-error') return <DocumentStatePage kind={kind} state="error" failure={controller.state.failure} onRetry={controller.reload} />;
  return <AdminDocumentWorkspaceView kind={kind} controller={controller} workspace={controller.state.workspace} />;
}

export function AdminDocumentPage() {
  const { isZh } = useSite();
  const repositoryContext = useAdminDocumentRepository();
  const parsedKind = CmsDocumentKindSchema.safeParse(useParams().kind);
  const title = parsedKind.success ? (isZh ? CMS_DOCUMENT_METADATA[parsedKind.data].label.zh : CMS_DOCUMENT_METADATA[parsedKind.data].label.en) : (isZh ? '找不到此內容類型' : 'Content type not found');
  usePageTitle(title);

  if (!parsedKind.success) {
    return (
      <AdminAppShell eyebrow="ADMIN / NOT FOUND" title={title} status={isZh ? '無效路徑' : 'Invalid route'} showcaseNavigation={false}>
        <div className="admin-content-limiter admin-workspace-page"><section className="admin-surface admin-stack"><StatePanel kind="empty" title={title} description={isZh ? '請從內容管理總覽選擇有效的內容類型。' : 'Choose a valid content type from the content management dashboard.'} /><Link className="admin-button" data-variant="secondary" to="/admin">{isZh ? '返回管理總覽' : 'Back to admin dashboard'}</Link></section></div>
      </AdminAppShell>
    );
  }
  if (repositoryContext.state.status === 'loading') return <DocumentStatePage kind={parsedKind.data} state="loading" />;
  if (repositoryContext.state.status === 'error') return <DocumentStatePage kind={parsedKind.data} state="error" failure={{ kind: 'transport-error' }} onRetry={repositoryContext.retry} />;
  return <DocumentWorkspaceRoute key={parsedKind.data} repository={repositoryContext.state.repository} kind={parsedKind.data} />;
}
