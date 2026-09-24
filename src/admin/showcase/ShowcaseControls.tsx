import { AdminButton, AdminIconButton } from '../AdminButton';
import { AdminCheckbox, AdminField, AdminSelect, AdminTextarea, BilingualFieldPair } from '../AdminFields';
import { StatusBadge } from '../AdminFeedback';
import { MixedPhrase, ZhCopy, ZhPhrase } from '../AdminText';
import { useSite } from '@/app/site';

const CATEGORY_OPTIONS = [
  { value: 'education', label: '教學活動' },
  { value: 'announcement', label: '行政公告' },
  { value: 'research', label: '研究成果' },
] as const;

const CATEGORY_OPTIONS_EN = [
  { value: 'education', label: 'Teaching activity' },
  { value: 'announcement', label: 'Administrative notice' },
  { value: 'research', label: 'Research outcome' },
] as const;

export function ShowcaseControls() {
  const { isZh } = useSite();
  return (
    <>
      <section id="foundation" className="admin-showcase-section" aria-labelledby="foundation-title">
        <div className="admin-section-heading"><span className="mono">01 / ACTIONS</span><h2 id="foundation-title">{isZh ? '操作、狀態與清楚的下一步' : 'Clear actions and explicit states'}</h2><p>{isZh ? <ZhCopy><ZhPhrase>所有新控制項至少 44px，</ZhPhrase><ZhPhrase>按鈕在載入時</ZhPhrase><ZhPhrase>保留文字與寬度，</ZhPhrase><ZhPhrase>狀態不依賴顏色。</ZhPhrase></ZhCopy> : 'Every new control is at least 44px. Loading preserves the label and width, and status never relies on color alone.'}</p></div>
        <div className="admin-surface admin-stack">
          <div className="admin-demo-group"><span className="mono">ACTION HIERARCHY</span><div className="admin-cluster"><AdminButton variant="primary" icon="check">{isZh ? '儲存草稿' : 'Save draft'}</AdminButton><AdminButton icon="arrow">{isZh ? '預覽公開頁面' : 'Preview public page'}</AdminButton><AdminButton variant="quiet">{isZh ? '取消' : 'Cancel'}</AdminButton><AdminButton variant="warning" icon="trash">{isZh ? '移至封存' : 'Move to archive'}</AdminButton></div></div>
          <div className="admin-demo-group"><span className="mono">SYSTEM STATES</span><div className="admin-cluster"><AdminButton disabled>{isZh ? '尚無權限' : 'Permission required'}</AdminButton><AdminButton loading>{isZh ? '儲存草稿' : 'Save draft'}</AdminButton><AdminButton success>{isZh ? '已儲存' : 'Saved'}</AdminButton><AdminIconButton icon="refresh" label={isZh ? '重新整理資料' : 'Refresh records'} /><AdminIconButton icon="search" label={isZh ? '搜尋紀錄' : 'Search records'} pressed /></div></div>
          <div className="admin-demo-group"><span className="mono">RECORD STATUS</span><div className="admin-cluster"><StatusBadge status="info">{isZh ? '草稿' : 'Draft'}</StatusBadge><StatusBadge status="success">{isZh ? '已發佈' : 'Published'}</StatusBadge><StatusBadge status="warning">{isZh ? '待補英文' : 'English needed'}</StatusBadge><StatusBadge status="error">{isZh ? '儲存失敗' : 'Save failed'}</StatusBadge><StatusBadge status="disabled">{isZh ? '已停用' : 'Disabled'}</StatusBadge></div></div>
        </div>
      </section>

      <section id="forms" className="admin-showcase-section" aria-labelledby="forms-title">
        <div className="admin-section-heading"><span className="mono">02 / BILINGUAL INPUT</span><h2 id="forms-title">{isZh ? '繁體中文優先的雙語編輯' : <>Traditional Chinese-first <MixedPhrase lang="en">bilingual editing</MixedPhrase></>}</h2><p>{isZh ? <ZhCopy><ZhPhrase>兩欄在空間足夠時並列，</ZhPhrase><ZhPhrase>狹窄容器與 200% 縮放時</ZhPhrase><ZhPhrase>依序堆疊，</ZhPhrase><ZhPhrase>且各自保留驗證訊息。</ZhPhrase></ZhCopy> : 'The pair sits side by side when readable and stacks in language order in narrow containers or at 200% zoom.'}</p></div>
        <div className="admin-surface admin-form-layout">
          <BilingualFieldPair label={isZh ? '公告標題' : 'Announcement title'} description={isZh ? <ZhCopy><ZhPhrase>公開頁面會</ZhPhrase><ZhPhrase>依訪客語言顯示</ZhPhrase><ZhPhrase>對應欄位。</ZhPhrase></ZhCopy> : 'The public page displays the field matching the visitor language.'} zh={<AdminField lang="zh-Hant" label="繁體中文" required status="valid" defaultValue="住院醫師臨床教學研討會" helper={isZh ? '格式與長度皆可使用。' : 'Format and length are valid.'} />} en={<AdminField id="admin-title-en" lang="en" label="English" required requiredText="Required" defaultValue="" error={isZh ? '請補上英文公告標題。' : 'Add the English announcement title.'} />} />
          <BilingualFieldPair label={isZh ? '公告摘要' : 'Announcement summary'} zh={<AdminTextarea lang="zh-Hant" label="繁體中文摘要" rows={4} defaultValue="本研討會將分享跨職類臨床教學設計、回饋方法與住院醫師學習支持經驗。" />} en={<AdminTextarea lang="en" label="English summary" rows={4} defaultValue="This symposium shares practical approaches to interprofessional clinical teaching and resident feedback." />} />
          <div className="admin-field-grid"><AdminSelect label={isZh ? '公告分類' : 'Category'} options={isZh ? CATEGORY_OPTIONS : CATEGORY_OPTIONS_EN} defaultValue="education" /><AdminSelect label={isZh ? '資料來源' : 'Content source'} options={isZh ? CATEGORY_OPTIONS : CATEGORY_OPTIONS_EN} loadingOptions loadingLabel={isZh ? '載入選項中' : 'Loading options'} helper={isZh ? '正在讀取可用來源。' : 'Loading available sources.'} /><AdminField label={isZh ? '發布日期' : 'Publish date'} type="date" defaultValue="2026-08-28" /><AdminField label={isZh ? '摘要長度' : 'Summary length'} status="warning" defaultValue={isZh ? '接近建議上限' : 'Near the recommended limit'} helper={isZh ? '仍可儲存，發布前建議精簡。' : 'Saving is allowed; shorten before publishing.'} /><AdminField label={isZh ? '紀錄識別碼' : 'Record ID'} readOnly defaultValue="NEWS-2026-0087" helper={isZh ? '唯讀，由系統建立。' : 'Read-only and generated by the system.'} /></div>
          <div className="admin-stack"><AdminCheckbox label={isZh ? '置頂顯示' : 'Pin announcement'} description={isZh ? <ZhCopy><ZhPhrase>在公告列表中</ZhPhrase><ZhPhrase>優先顯示此項目。</ZhPhrase></ZhCopy> : 'Show this item first in the announcement list.'} defaultChecked /><AdminCheckbox label={isZh ? '同步公開' : 'Publish to public site'} description={isZh ? <ZhCopy><ZhPhrase>核准後同步至</ZhPhrase><ZhPhrase>公開網站。</ZhPhrase></ZhCopy> : 'Sync to the public site after approval.'} switchControl /><AdminCheckbox label={isZh ? '暫停發布' : 'Pause publication'} description={isZh ? <ZhCopy><ZhPhrase>目前權限不足，</ZhPhrase><ZhPhrase>無法變更。</ZhPhrase></ZhCopy> : 'Your current role cannot change this setting.'} disabled /></div>
        </div>
      </section>
    </>
  );
}
