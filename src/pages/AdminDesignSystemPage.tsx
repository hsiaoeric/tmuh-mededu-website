import { useSite, usePageTitle } from '@/app/site';
import { Link } from 'react-router-dom';
import { AdminAppShell, AdminPageHeader } from '@/admin/AdminShell';
import { NarrowCopy, ZhAtom, ZhCopy, ZhPhrase } from '@/admin/AdminText';
import { ShowcaseControls } from '@/admin/showcase/ShowcaseControls';
import { ShowcaseData } from '@/admin/showcase/ShowcaseData';
import { ShowcaseOverlays } from '@/admin/showcase/ShowcaseOverlays';
import { ShowcaseStates } from '@/admin/showcase/ShowcaseStates';
import '@/design/admin.css';

export function AdminDesignSystemPage() {
  const { isZh } = useSite();
  const shellNotices = isZh
    ? [
        { status: 'warning', title: <><ZhPhrase>工作階段</ZhPhrase><ZhPhrase>即將到期</ZhPhrase></>, description: <ZhCopy><ZhPhrase>請先儲存草稿，</ZhPhrase><ZhPhrase>再重新登入。</ZhPhrase></ZhCopy> },
        { status: 'error', title: '目前離線', description: <ZhCopy><ZhPhrase>內容仍保留在此頁，</ZhPhrase><ZhPhrase>重新連線後再試。</ZhPhrase></ZhCopy> },
      ] as const
    : [{ status: 'warning', title: <NarrowCopy narrow="Session expiry">Session expiring soon</NarrowCopy>, description: 'Save the draft before signing in again.' }, { status: 'error', title: 'You are offline', description: 'Your content remains on this page. Retry after reconnecting.' }] as const;
  usePageTitle(isZh ? '管理元件展示' : 'Admin primitive showcase');
  return (
    <AdminAppShell notices={shellNotices}>
      <div className="admin-content-limiter">
        <AdminPageHeader eyebrow="ADMIN PRIMITIVE SHOWCASE / V1" title={isZh ? <><ZhPhrase>內容清楚、</ZhPhrase><ZhPhrase>可恢復，</ZhPhrase><ZhPhrase>保有<ZhAtom>北醫感</ZhAtom>。</ZhPhrase></> : <NarrowCopy narrow="Clear. Distinctly TMUH.">Operational clarity with the character of TMUH Medical Education.</NarrowCopy>} description={isZh ? <ZhCopy><ZhPhrase>展示不含登入、</ZhPhrase><ZhPhrase>資料更新</ZhPhrase><ZhPhrase>或領域編輯。</ZhPhrase><ZhPhrase>請用鍵盤、明暗主題</ZhPhrase><ZhPhrase>與中英文切換</ZhPhrase><ZhPhrase>檢查所有狀態。</ZhPhrase></ZhCopy> : 'This route validates admin primitives and states only. Authentication, mutations, and domain editor workflows are intentionally out of scope.'} actions={<Link className="admin-button" data-variant="secondary" to="/">{isZh ? '返回公開網站' : 'Back to public site'}</Link>} />
        <ShowcaseControls />
        <ShowcaseStates />
        <ShowcaseData />
        <ShowcaseOverlays />
      </div>
    </AdminAppShell>
  );
}
