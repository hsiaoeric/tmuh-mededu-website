import { Link } from 'react-router-dom';
import { usePageTitle, useSite } from '@/app/site';
import { AdminAppShell, AdminPageHeader } from '@/admin/AdminShell';
import { StatePanel, StatusBadge } from '@/admin/AdminFeedback';
import { StableKey } from '@/admin/StableKey';
import { CMS_DOCUMENT_METADATA } from '@/admin/documents/cmsDocumentMetadata';
import { formatAdminTimestamp } from '@/admin/documents/formatAdminTimestamp';
import {
  useAdminDocumentList,
  useAdminDocumentRepository,
  type CmsAdminDocument,
} from '@/admin/repository';
import { CMS_DOCUMENT_KINDS, CMS_DOCUMENT_STABLE_KEYS, type CmsDocumentKind } from '@/content/contracts/kinds';
import '@/design/admin.css';

function canonicalDocument(
  documents: readonly CmsAdminDocument[],
  kind: CmsDocumentKind,
): CmsAdminDocument | undefined {
  return documents.find((document) => (
    document.kind === kind && document.stableKey === CMS_DOCUMENT_STABLE_KEYS[kind]
  ));
}

function DashboardList({ repository }: { readonly repository: Parameters<typeof useAdminDocumentList>[0] }) {
  const { isZh, lang } = useSite();
  const { state, retry } = useAdminDocumentList(repository);
  if (state.status === 'loading') {
    return (
      <StatePanel
        kind="loading"
        title={isZh ? '正在讀取內容清單' : 'Loading content list'}
        description={isZh ? '正在確認各內容類型的可用狀態。' : 'Checking availability for every content type.'}
      />
    );
  }
  if (state.status === 'error') {
    return (
      <StatePanel
        kind="error"
        title={isZh ? '無法讀取內容清單' : 'Unable to load content list'}
        description={isZh ? '內容文字未變更。請確認連線後再試一次。' : 'No content was changed. Check the connection and try again.'}
        actionLabel={isZh ? '重試' : 'Retry'}
        onAction={retry}
      />
    );
  }
  return (
    <ul className="admin-document-grid">
      {CMS_DOCUMENT_KINDS.map((kind) => {
        const metadata = CMS_DOCUMENT_METADATA[kind];
        const document = canonicalDocument(state.documents, kind);
        const label = isZh ? metadata.label.zh : metadata.label.en;
        return (
          <li key={kind}>
            <Link className="admin-document-card" to={`/admin/content/${kind}`} aria-label={isZh ? `開啟${label}` : `Open ${label}`}>
              <div className="admin-document-card-heading">
                <StableKey value={kind} />
                <StatusBadge status={document === undefined ? 'disabled' : 'success'}>
                  {document === undefined ? (isZh ? '尚未建立' : 'Missing') : (isZh ? '可用' : 'Available')}
                </StatusBadge>
              </div>
              <div>
                <h2>{label}</h2>
                <p lang={isZh ? 'zh-Hant' : 'en'}>{isZh ? metadata.description.zh : metadata.description.en}</p>
              </div>
              <dl className="admin-document-context">
                <div><dt>{isZh ? '穩定鍵' : 'Stable key'}</dt><dd><StableKey value={CMS_DOCUMENT_STABLE_KEYS[kind]} /></dd></div>
                <div><dt>{isZh ? '最後更新' : 'Last updated'}</dt><dd>{document === undefined ? (isZh ? '尚無資料' : 'No document') : formatAdminTimestamp(document.updatedAt, lang)}</dd></div>
              </dl>
              <span className="admin-document-open">{isZh ? '開啟工作區' : 'Open workspace'}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminDashboardPage() {
  const { isZh } = useSite();
  const repositoryContext = useAdminDocumentRepository();
  const title = isZh ? '內容管理總覽' : 'Content management dashboard';
  usePageTitle(title);

  return (
    <AdminAppShell eyebrow="ADMIN / DASHBOARD" title={title} status={isZh ? '內容儲存庫狀態' : 'Repository status'} showcaseNavigation={false}>
      <div className="admin-content-limiter admin-workspace-page">
        <AdminPageHeader
          eyebrow="ADMIN / 12 CONTENT KINDS"
          title={title}
          description={isZh ? '依網站內容架構進入各文件工作區；未建立的類型仍保留固定入口。' : 'Open each document workspace from the canonical site structure. Missing documents keep a stable entry point.'}
          descriptionLang={isZh ? 'zh-Hant' : 'en'}
        />
        <section className="admin-surface admin-stack" aria-label={isZh ? '內容類型' : 'Content types'}>
          {repositoryContext.state.status === 'loading' ? (
            <StatePanel kind="loading" title={isZh ? '正在準備內容儲存庫' : 'Preparing content repository'} description={isZh ? '完成驗證後即可讀取管理文件。' : 'Management documents will be available after provisioning.'} />
          ) : repositoryContext.state.status === 'error' ? (
            <StatePanel kind="error" title={isZh ? '無法準備內容儲存庫' : 'Unable to prepare content repository'} description={isZh ? '請確認管理環境設定與連線後重試。' : 'Check the admin configuration and connection, then retry.'} actionLabel={isZh ? '重試' : 'Retry'} onAction={repositoryContext.retry} />
          ) : (
            <DashboardList repository={repositoryContext.state.repository} />
          )}
        </section>
      </div>
    </AdminAppShell>
  );
}
