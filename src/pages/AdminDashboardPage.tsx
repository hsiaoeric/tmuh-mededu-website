import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle, useSite } from '@/app/site';
import { AdminAppShell, AdminPageHeader } from '@/admin/AdminShell';
import { StatePanel, StatusBadge } from '@/admin/AdminFeedback';
import { CMS_DOCUMENT_GROUPS, CMS_DOCUMENT_METADATA } from '@/admin/documents/cmsDocumentMetadata';
import { formatAdminTimestamp } from '@/admin/documents/formatAdminTimestamp';
import {
  useAdminDocumentList,
  useAdminDocumentRepository,
  type AdminDocumentRepository,
  type CmsAdminDocument,
} from '@/admin/repository';
import type { CmsRevisionStatusSummary } from '@/admin/repository/types';
import { CMS_DOCUMENT_STABLE_KEYS, type CmsDocumentKind } from '@/content/contracts/kinds';
import '@/design/admin.css';

function canonicalDocument(
  documents: readonly CmsAdminDocument[],
  kind: CmsDocumentKind,
): CmsAdminDocument | undefined {
  return documents.find((document) => (
    document.kind === kind && document.stableKey === CMS_DOCUMENT_STABLE_KEYS[kind]
  ));
}

/** Draft and published statuses when the repository can provide them; the dashboard works without. */
function useRevisionStatuses(repository: AdminDocumentRepository): readonly CmsRevisionStatusSummary[] | null {
  const [statuses, setStatuses] = useState<readonly CmsRevisionStatusSummary[] | null>(null);
  useEffect(() => {
    const list = repository.listRevisionStatuses?.bind(repository);
    if (list === undefined) return undefined;
    const controller = new AbortController();
    void list(controller.signal).then((result) => {
      if (!controller.signal.aborted && result.ok) setStatuses(result.value);
    });
    return () => controller.abort();
  }, [repository]);
  return statuses;
}

function DocumentStatus({ document, statuses }: {
  readonly document: CmsAdminDocument | undefined;
  readonly statuses: readonly CmsRevisionStatusSummary[] | null;
}) {
  const { isZh } = useSite();
  if (document === undefined) return <StatusBadge status="disabled">{isZh ? '尚未建立' : 'Missing'}</StatusBadge>;
  if (statuses === null) return <StatusBadge status="success">{isZh ? '可用' : 'Available'}</StatusBadge>;
  const own = statuses.filter((status) => status.documentId === document.id);
  const published = own.find((status) => status.status === 'published');
  const draft = own.find((status) => status.status === 'draft');
  return (
    <span className="admin-document-card-status">
      {published === undefined
        ? <StatusBadge status="warning">{isZh ? '尚未發布' : 'Unpublished'}</StatusBadge>
        : <StatusBadge status="success">{isZh ? `已發布 · 版本 ${published.version}` : `Published · v${published.version}`}</StatusBadge>}
      {draft === undefined ? null : <StatusBadge status="info">{isZh ? '有未發布草稿' : 'Unpublished draft'}</StatusBadge>}
    </span>
  );
}

function DashboardList({ repository }: { readonly repository: AdminDocumentRepository }) {
  const { isZh, lang } = useSite();
  const { state, retry } = useAdminDocumentList(repository);
  const statuses = useRevisionStatuses(repository);
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
    <div className="admin-dashboard-groups">
      {CMS_DOCUMENT_GROUPS.map((group) => {
        const groupLabel = isZh ? group.label.zh : group.label.en;
        return (
          <section key={group.id} className="admin-dashboard-group" aria-label={groupLabel}>
            <h2>{groupLabel}</h2>
            <ul className="admin-document-grid">
              {group.kinds.map((kind) => {
                const metadata = CMS_DOCUMENT_METADATA[kind];
                const document = canonicalDocument(state.documents, kind);
                const label = isZh ? metadata.label.zh : metadata.label.en;
                return (
                  <li key={kind}>
                    <Link className="admin-document-card" to={`/admin/content/${kind}`} aria-label={isZh ? `開啟${label}` : `Open ${label}`}>
                      <div>
                        <h3>{label}</h3>
                        <p lang={isZh ? 'zh-Hant' : 'en'}>{isZh ? metadata.description.zh : metadata.description.en}</p>
                      </div>
                      <div className="admin-document-card-footer">
                        <DocumentStatus document={document} statuses={statuses} />
                        <small>{document === undefined ? (isZh ? '尚無資料' : 'No document') : `${isZh ? '更新於' : 'Updated'} ${formatAdminTimestamp(document.updatedAt, lang)}`}</small>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function AdminDashboardPage() {
  const { isZh } = useSite();
  const repositoryContext = useAdminDocumentRepository();
  const title = isZh ? '內容管理總覽' : 'Content management dashboard';
  usePageTitle(title);

  return (
    <AdminAppShell eyebrow="ADMIN / DASHBOARD" title={title} status={null} showcaseNavigation={false}>
      <div className="admin-content-limiter admin-workspace-page">
        <AdminPageHeader
          eyebrow={isZh ? '內容管理' : 'CONTENT'}
          title={title}
          description={isZh ? '選擇要編輯的內容。儲存草稿不會影響網站，按下發佈後才會公開。' : 'Choose what to edit. Saved drafts do not change the site until you publish.'}
          descriptionLang={isZh ? 'zh-Hant' : 'en'}
        />
        <section className="admin-stack" aria-label={isZh ? '內容類型' : 'Content types'}>
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
