import { useState } from 'react';
import { AdminButton } from '../AdminButton';
import { AdminLiveRegion, InlineNotice, StatePanel, StatusBadge } from '../AdminFeedback';
import { AdminSaveStatus } from '../AdminShell';
import { MixedPhrase, ZhCopy, ZhPhrase } from '../AdminText';
import { useSite } from '@/app/site';

export function ShowcaseStates() {
  const { isZh } = useSite();
  const [connectionRecovered, setConnectionRecovered] = useState(false);
  const [recordsReloaded, setRecordsReloaded] = useState(false);
  const focusEnglishField = () => document.getElementById('admin-title-en')?.focus();
  return (
    <section id="states" className="admin-showcase-section" aria-labelledby="states-title">
      <div className="admin-section-heading"><span className="mono">03 / FEEDBACK</span><h2 id="states-title">{isZh ? '每個結果都說明發生什麼事' : <>Every outcome explains <MixedPhrase lang="en">what happened</MixedPhrase></>}</h2><p>{isZh ? <ZhCopy><ZhPhrase>區域狀態保留工作脈絡，</ZhPhrase><ZhPhrase>不以空白畫面、</ZhPhrase><ZhPhrase>旋轉圖示取代內容。</ZhPhrase></ZhCopy> : 'Regional states preserve working context instead of replacing the page with a blank screen or spinner.'}</p></div>
      <div className="admin-stack">
        <AdminLiveRegion className="admin-recovery-announcer">{connectionRecovered ? (isZh ? '已重新連線，可繼續編輯。' : 'Connection restored. You can continue editing.') : ''}</AdminLiveRegion>
        <AdminLiveRegion className="admin-reload-announcer">{recordsReloaded ? (isZh ? '公告已重新載入，可繼續操作。' : 'Announcements reloaded. You can continue working.') : ''}</AdminLiveRegion>
        <InlineNotice status="success" title={isZh ? '草稿已儲存' : 'Draft saved'}>{isZh ? <ZhCopy><ZhPhrase>最後儲存時間 14:32，</ZhPhrase><ZhPhrase>尚未發布至</ZhPhrase><ZhPhrase>公開網站。</ZhPhrase></ZhCopy> : 'Last saved at 14:32. This draft is not yet public.'}</InlineNotice>
        <InlineNotice status="warning" title={isZh ? '英文內容尚未完成' : 'English content is incomplete'} action={<AdminButton variant="quiet" onClick={focusEnglishField}>{isZh ? '前往英文欄位' : 'Go to English fields'}</AdminButton>}>{isZh ? <ZhCopy><ZhPhrase>公告可先儲存為草稿，</ZhPhrase><ZhPhrase>發布前請補齊翻譯。</ZhPhrase></ZhCopy> : 'Save as a draft now, then complete both languages before publishing.'}</InlineNotice>
        <div data-recovery-state={connectionRecovered ? 'complete' : 'pending'}>{connectionRecovered ? <InlineNotice status="success" title={isZh ? '已重新連線' : 'Connection restored'}>{isZh ? <ZhCopy><ZhPhrase>目前內容仍在此頁，</ZhPhrase><ZhPhrase>可繼續編輯。</ZhPhrase></ZhCopy> : 'Your current edits remain available.'}</InlineNotice> : <InlineNotice status="error" title={isZh ? '無法連線至內容服務' : 'Content service unavailable'} action={<AdminButton variant="secondary" icon="refresh" onClick={() => setConnectionRecovered(true)}>{isZh ? '再試一次' : 'Try again'}</AdminButton>}>{isZh ? <ZhCopy><ZhPhrase>編輯內容仍保留，</ZhPhrase><ZhPhrase>請確認網路後重試。</ZhPhrase></ZhCopy> : 'Your edits remain on this page. Check the network and retry.'}</InlineNotice>}</div>
        <div className="admin-save-state-demo"><AdminSaveStatus state="saving">{isZh ? '正在儲存變更' : 'Saving changes'}</AdminSaveStatus><AdminSaveStatus state="error">{isZh ? '儲存失敗，內容仍保留' : 'Save failed; edits remain'}</AdminSaveStatus></div>
        <div className="admin-state-grid"><StatePanel kind="loading" title={isZh ? '正在載入公告紀錄' : 'Loading announcements'} description={isZh ? <ZhCopy><ZhPhrase>已保留頁面標題</ZhPhrase><ZhPhrase>與操作位置，</ZhPhrase><ZhPhrase>載入完成後</ZhPhrase><ZhPhrase>將顯示資料列。</ZhPhrase></ZhCopy> : 'The page title and action positions remain visible while records load.'} /><StatePanel kind="empty" title={isZh ? '尚未建立公告' : 'No announcements yet'} description={isZh ? <ZhCopy><ZhPhrase>建立第一則公告後，</ZhPhrase><ZhPhrase>草稿與發布狀態</ZhPhrase><ZhPhrase>會顯示在這裡。</ZhPhrase></ZhCopy> : 'Create the first announcement to begin tracking draft and publication status.'} /><StatePanel kind="filtered-empty" title={isZh ? '沒有符合條件的公告' : 'No matching announcements'} description={isZh ? <ZhCopy><ZhPhrase>清除「教學活動」</ZhPhrase><ZhPhrase>篩選條件，</ZhPhrase><ZhPhrase>或改用</ZhPhrase><ZhPhrase>其他關鍵字。</ZhPhrase></ZhCopy> : 'Clear the Teaching activity filter or try another keyword.'} />{recordsReloaded ? <StatePanel kind="success" title={isZh ? '公告已重新載入' : 'Announcements reloaded'} description={isZh ? <ZhCopy><ZhPhrase>展示資料已恢復，</ZhPhrase><ZhPhrase>可繼續操作。</ZhPhrase></ZhCopy> : 'Showcase data is available again.'} /> : <StatePanel kind="error" title={isZh ? '公告載入失敗' : 'Announcements failed to load'} description={isZh ? <ZhCopy><ZhPhrase>請重新整理；</ZhPhrase><ZhPhrase>若問題持續，</ZhPhrase><ZhPhrase>聯絡網站管理人員</ZhPhrase><ZhPhrase>並提供時間資訊。</ZhPhrase></ZhCopy> : 'Refresh the data. If the issue continues, contact the site administrator with the time.'} actionLabel={isZh ? '重新載入' : 'Reload'} onAction={() => setRecordsReloaded(true)} />}<StatePanel kind="success" title={isZh ? '內容已發布' : 'Content published'} description={isZh ? <ZhCopy><ZhPhrase>繁體中文與英文版本</ZhPhrase><ZhPhrase>已同步至</ZhPhrase><ZhPhrase>公開網站。</ZhPhrase></ZhCopy> : 'Traditional Chinese and English versions are now live on the public site.'} /><StatePanel kind="disabled" title={isZh ? '此區域目前唯讀' : 'This area is read-only'} description={isZh ? <ZhCopy><ZhPhrase>你的帳號可以檢視內容，</ZhPhrase><ZhPhrase>但無法修改或發布。</ZhPhrase></ZhCopy> : 'Your account can view this content but cannot edit or publish it.'} /></div>
        <div className="admin-cluster"><StatusBadge status="info">{isZh ? '即時訊息：儲存中' : 'Live: saving'}</StatusBadge><StatusBadge status="success">{isZh ? '完成：已儲存' : 'Complete: saved'}</StatusBadge></div>
      </div>
    </section>
  );
}
