import type { ReactNode } from 'react';
import { AdminPageHeader, AdminAppShell } from '@/admin/AdminShell';
import { StatePanel } from '@/admin/AdminFeedback';
import { ZhCopy, ZhPhrase } from '@/admin/AdminText';
import { usePageTitle, useSite } from '@/app/site';
import '@/design/admin.css';

type AdminPlaceholderKind = 'dashboard' | 'news';

const PLACEHOLDER_COPY = {
  dashboard: {
    eyebrow: 'ADMIN / DASHBOARD',
    headerZh: '管理總覽',
    headerEn: 'Administrator dashboard',
    titleZh: '管理工作區即將推出',
    titleEn: 'Administrator workspace coming in a later milestone',
  },
  news: {
    eyebrow: 'ADMIN / CONTENT / NEWS',
    headerZh: '公告工作區',
    headerEn: 'News workspace',
    titleZh: '公告工作區即將推出',
    titleEn: 'News workspace coming in a later milestone',
  },
} as const satisfies Readonly<Record<AdminPlaceholderKind, {
  readonly eyebrow: string;
  readonly headerZh: string;
  readonly headerEn: string;
  readonly titleZh: string;
  readonly titleEn: string;
}>>;

export function AdminPlaceholderPage({ kind }: { readonly kind: AdminPlaceholderKind }) {
  const { isZh } = useSite();
  const copy = PLACEHOLDER_COPY[kind];
  const title = isZh ? copy.titleZh : copy.titleEn;
  const headerTitle = isZh ? copy.headerZh : copy.headerEn;
  const description: ReactNode = isZh
    ? (
      <ZhCopy>
        <ZhPhrase>此為刻意保留的路由位置。</ZhPhrase>
        <ZhPhrase>完整工作區</ZhPhrase>
        <ZhPhrase>將於後續里程碑提供，</ZhPhrase>
        <ZhPhrase>目前不包含</ZhPhrase>
        <ZhPhrase>儲存、發布、</ZhPhrase>
        <ZhPhrase>編輯器</ZhPhrase>
        <ZhPhrase>或資料庫操作。</ZhPhrase>
      </ZhCopy>
    )
    : 'This intentional route placeholder has no save, publish, editor, or database behavior. The complete workspace arrives in a later milestone.';
  const descriptionLang = isZh ? 'zh-Hant' : 'en';

  usePageTitle(headerTitle);

  return (
    <AdminAppShell
      eyebrow={copy.eyebrow}
      title={headerTitle}
      status={isZh ? '工作區尚未啟用' : 'Workspace not enabled'}
      showcaseNavigation={false}
    >
      <div className="admin-content-limiter">
        <AdminPageHeader
          eyebrow={copy.eyebrow}
          title={title}
          description={description}
          descriptionLang={descriptionLang}
        />
        <section className="admin-surface">
          <StatePanel
            kind="disabled"
            title={isZh ? '目前沒有可操作的管理功能' : 'No management tools are enabled yet'}
            description={description}
            descriptionLang={descriptionLang}
          />
        </section>
      </div>
    </AdminAppShell>
  );
}
