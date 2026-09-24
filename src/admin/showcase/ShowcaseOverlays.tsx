import { useRef, useState } from 'react';
import { assetUrl } from '@/utils/asset';
import { AdminButton } from '../AdminButton';
import { AdminField } from '../AdminFields';
import { AdminMediaPicker } from '../AdminMedia';
import { AdminDialog, AdminToast, ConfirmDialog } from '../AdminOverlays';
import { ZhCopy, ZhPhrase } from '../AdminText';
import { useSite } from '@/app/site';

const MEDIA_LABELS_EN = { empty: 'No image selected', guidance: 'Alternative text should describe the people, setting, and teaching purpose. Leave it empty only for decorative media.', uploading: 'Uploading. Keep this page open.', choose: 'Choose image', replace: 'Replace image', remove: 'Remove image' } as const;

export function ShowcaseOverlays() {
  const { isZh } = useSite();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(true);
  const dialogTriggerRef = useRef<HTMLButtonElement>(null);
  const confirmTriggerRef = useRef<HTMLButtonElement>(null);
  return (
    <section id="overlays" className="admin-showcase-section" aria-labelledby="overlays-title">
      <div className="admin-section-heading"><span className="mono">05 / OVERLAYS & MEDIA</span><h2 id="overlays-title">{isZh ? '覆層保留焦點，媒體流程保留脈絡' : 'Overlays preserve focus and media preserves context'}</h2><p>{isZh ? <ZhCopy><ZhPhrase>對話框與抽屜關閉後</ZhPhrase><ZhPhrase>回到觸發控制；</ZhPhrase><ZhPhrase>通知不搶焦點，</ZhPhrase><ZhPhrase>媒體缺漏時仍可操作。</ZhPhrase></ZhCopy> : 'Dialogs and drawers return focus to their trigger. Toasts never steal focus, and missing media retains a clear action.'}</p></div>
      <div className="admin-surface admin-stack">
        <div className="admin-cluster"><AdminButton ref={dialogTriggerRef} variant="primary" onClick={() => setDialogOpen(true)}>{isZh ? '開啟編輯視窗' : 'Open edit dialog'}</AdminButton><AdminButton ref={confirmTriggerRef} variant="warning" onClick={() => setConfirmOpen(true)}>{isZh ? '放棄未儲存變更' : 'Discard unsaved changes'}</AdminButton><AdminButton onClick={() => setToastVisible(true)}>{isZh ? '顯示儲存通知' : 'Show save notice'}</AdminButton></div>
        <div className="admin-toast-stack">{toastVisible ? <AdminToast status="success" title={isZh ? '公告草稿已儲存' : 'Draft saved'} description={isZh ? <ZhCopy><ZhPhrase>14:32 儲存完成，</ZhPhrase><ZhPhrase>尚未發布。</ZhPhrase></ZhCopy> : 'Saved at 14:32. Not yet published.'} dismissLabel={isZh ? '關閉通知' : 'Dismiss notification'} onDismiss={() => setToastVisible(false)} /> : null}<AdminToast status="error" title={isZh ? '媒體上傳失敗' : 'Upload failed'} description={isZh ? <ZhCopy><ZhPhrase>檔案仍在你的裝置，</ZhPhrase><ZhPhrase>請確認格式後重試。</ZhPhrase></ZhCopy> : 'The file remains on your device. Check the format and retry.'} /></div>
        <div className="admin-media-grid">
          <AdminMediaPicker label={isZh ? '公告主視覺' : 'Announcement image'} description={isZh ? <ZhCopy><ZhPhrase>建議使用 4:3 橫式圖片，</ZhPhrase><ZhPhrase>檔案需清楚呈現教學活動。</ZhPhrase></ZhCopy> : 'Use a 4:3 landscape image that clearly represents the teaching activity.'} labels={isZh ? undefined : MEDIA_LABELS_EN} />
          <AdminMediaPicker label={isZh ? '北醫附醫院徽' : 'TMUH logo'} description={isZh ? <ZhCopy><ZhPhrase>完整院徽以安全留白</ZhPhrase><ZhPhrase>置中顯示。</ZhPhrase></ZhCopy> : 'The complete hospital logo is centered with safe inset.'} labels={isZh ? undefined : MEDIA_LABELS_EN} fileName="tmuh-logo.svg" altText={isZh ? '臺北醫學大學附設醫院院徽' : 'Taipei Medical University Hospital logo'} previewUrl={assetUrl('assets/tmuh-logo.svg')} feedback={{ status: 'success', message: isZh ? <ZhCopy><ZhPhrase>上傳完成，</ZhPhrase><ZhPhrase>可移除或更換。</ZhPhrase></ZhCopy> : 'Upload complete. The file can be removed or replaced.' }} onRemove={() => setRemoveConfirmOpen(true)} />
          <AdminMediaPicker label={isZh ? '上傳進度' : 'Upload progress'} description={isZh ? <ZhCopy><ZhPhrase>上傳期間保留檔名</ZhPhrase><ZhPhrase>與操作脈絡。</ZhPhrase></ZhCopy> : 'The filename and work context remain visible during upload.'} labels={isZh ? undefined : MEDIA_LABELS_EN} fileName="resident-teaching.jpg" uploading />
          <AdminMediaPicker label={isZh ? '上傳失敗' : 'Upload error'} description={isZh ? <ZhCopy><ZhPhrase>失敗時保留檔名</ZhPhrase><ZhPhrase>與再次選取操作。</ZhPhrase></ZhCopy> : 'The filename and replacement action remain available after failure.'} labels={isZh ? undefined : MEDIA_LABELS_EN} fileName="teaching-session.jpg" feedback={{ status: 'error', message: isZh ? <ZhCopy><ZhPhrase>上傳失敗，</ZhPhrase><ZhPhrase>確認格式後</ZhPhrase><ZhPhrase>可再次選取檔案。</ZhPhrase></ZhCopy> : 'Upload failed. Verify the format and choose the file again.' }} />
          <AdminMediaPicker label={isZh ? '停用的媒體欄位' : 'Disabled media field'} description={isZh ? <ZhCopy><ZhPhrase>唯讀權限仍顯示</ZhPhrase><ZhPhrase>目前狀態</ZhPhrase><ZhPhrase>與替代文字指引。</ZhPhrase></ZhCopy> : 'Read-only access still shows state and alternative-text guidance.'} labels={isZh ? undefined : MEDIA_LABELS_EN} disabled />
        </div>
      </div>
      <AdminDialog open={dialogOpen} title={isZh ? '編輯發布資訊' : 'Edit publication details'} description={isZh ? '調整日期與公開狀態，不會更動公告內容。' : 'Change the date and publication status without altering the announcement.'} closeLabel={isZh ? '關閉對話框' : 'Close dialog'} onClose={() => setDialogOpen(false)} triggerRef={dialogTriggerRef} actions={<><AdminButton onClick={() => setDialogOpen(false)}>{isZh ? '取消' : 'Cancel'}</AdminButton><AdminButton variant="primary" onClick={() => setDialogOpen(false)}>{isZh ? '套用變更' : 'Apply changes'}</AdminButton></>}><div className="admin-stack"><AdminField label={isZh ? '預定發布日期' : 'Scheduled publish date'} type="date" defaultValue="2026-08-28" /><p>{isZh ? '完成後，焦點會回到「開啟編輯視窗」。' : 'Focus returns to Open edit dialog when this closes.'}</p></div></AdminDialog>
      <ConfirmDialog open={confirmOpen} title={isZh ? '放棄未儲存的變更？' : 'Discard unsaved changes?'} description={isZh ? '本次尚未儲存的中文與英文內容都會遺失。' : 'Unsaved Traditional Chinese and English content will be lost.'} body={isZh ? '請先確認這項操作的影響，再決定是否繼續。' : 'Review the impact before continuing.'} closeLabel={isZh ? '關閉對話框' : 'Close dialog'} confirmLabel={isZh ? '放棄變更' : 'Discard changes'} cancelLabel={isZh ? '繼續編輯' : 'Keep editing'} warning triggerRef={confirmTriggerRef} onClose={() => setConfirmOpen(false)} onConfirm={() => setConfirmOpen(false)} />
      <ConfirmDialog open={removeConfirmOpen} title={isZh ? '移除目前媒體？' : 'Remove current media?'} description={isZh ? '這是移除流程的元件狀態展示，不會異動任何資料。' : 'This demonstrates the removal flow without changing data.'} body={isZh ? '確認後只會關閉展示視窗。' : 'Confirming only closes this showcase dialog.'} closeLabel={isZh ? '關閉對話框' : 'Close dialog'} confirmLabel={isZh ? '確認移除' : 'Confirm removal'} cancelLabel={isZh ? '保留媒體' : 'Keep media'} warning onClose={() => setRemoveConfirmOpen(false)} onConfirm={() => setRemoveConfirmOpen(false)} />
    </section>
  );
}
