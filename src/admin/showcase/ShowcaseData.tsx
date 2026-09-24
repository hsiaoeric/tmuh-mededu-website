import { useMemo, useState, type ReactNode } from 'react';
import { AdminButton } from '../AdminButton';
import { AdminDataTable, RecordList, type AdminRecord, type AdminTableColumn } from '../AdminData';
import { AdminField, AdminSelect } from '../AdminFields';
import { AdminLiveRegion, StatePanel, StatusBadge } from '../AdminFeedback';
import { AdminToolbar } from '../AdminShell';
import { MixedPhrase, ZhCopy, ZhPhrase } from '../AdminText';
import { useSite } from '@/app/site';

type AnnouncementRow = { readonly id: string; readonly title: ReactNode; readonly titleLabel: string; readonly category: string; readonly updated: string; readonly status: ReactNode };

const ROWS: readonly AnnouncementRow[] = [
  { id: 'NEWS-0087', title: <><span className="admin-record-title-primary" lang="zh-Hant"><ZhPhrase>住院醫師</ZhPhrase><ZhPhrase>臨床教學</ZhPhrase><ZhPhrase>研討會</ZhPhrase></span><span className="admin-record-title-secondary" lang="en">Resident <MixedPhrase lang="en">Teaching Symposium</MixedPhrase></span></>, titleLabel: '住院醫師臨床教學研討會，Resident Teaching Symposium', category: '教學活動', updated: '2026-08-14 14:32', status: <StatusBadge status="warning">待補英文</StatusBadge> },
  { id: 'NEWS-0086', title: <><ZhPhrase>全人照護教育中心</ZhPhrase><ZhPhrase>師資培育工作坊</ZhPhrase></>, titleLabel: '全人照護教育中心師資培育工作坊', category: '中心活動', updated: '2026-08-13 09:18', status: <StatusBadge status="success">已發佈</StatusBadge> },
  { id: 'NEWS-0085', title: 'https://example.tmuh.org.tw/medical-education/announcement/long-unbroken-reference-link-2026', titleLabel: 'https://example.tmuh.org.tw/medical-education/announcement/long-unbroken-reference-link-2026', category: '行政公告', updated: '2026-08-11 17:05', status: <StatusBadge status="info">草稿</StatusBadge> },
] as const;

const ROWS_EN: readonly AnnouncementRow[] = [
  { id: 'NEWS-0087', title: <><span className="admin-record-title-primary" lang="en">Resident <MixedPhrase lang="en">Teaching Symposium</MixedPhrase></span><span className="admin-record-title-secondary" lang="zh-Hant"><ZhPhrase>住院醫師</ZhPhrase><ZhPhrase>臨床教學</ZhPhrase><ZhPhrase>研討會</ZhPhrase></span></>, titleLabel: 'Resident Teaching Symposium，住院醫師臨床教學研討會', category: 'Teaching activity', updated: '2026-08-14 14:32', status: <StatusBadge status="warning">English needed</StatusBadge> },
  { id: 'NEWS-0086', title: 'Holistic Care Faculty Development Workshop', titleLabel: 'Holistic Care Faculty Development Workshop', category: 'Center event', updated: '2026-08-13 09:18', status: <StatusBadge status="success">Published</StatusBadge> },
  { id: 'NEWS-0085', title: 'https://example.tmuh.org.tw/medical-education/announcement/long-unbroken-reference-link-2026', titleLabel: 'https://example.tmuh.org.tw/medical-education/announcement/long-unbroken-reference-link-2026', category: 'Administrative notice', updated: '2026-08-11 17:05', status: <StatusBadge status="info">Draft</StatusBadge> },
] as const;

const COLUMNS: readonly AdminTableColumn<AnnouncementRow>[] = [
  { key: 'title', label: '公告標題', sortable: true, render: (row) => <strong className="admin-break admin-record-title">{row.title}</strong> },
  { key: 'category', label: '分類', render: (row) => <span className="admin-short-label" lang="zh-Hant">{row.category}</span> },
  { key: 'status', label: '狀態', render: (row) => row.status },
  { key: 'updated', label: '最後更新', render: (row) => <span className="mono">{row.updated}</span> },
] as const;

const COLUMNS_EN: readonly AdminTableColumn<AnnouncementRow>[] = [
  { key: 'title', label: 'Announcement title', sortable: true, render: (row) => <strong className="admin-break admin-record-title">{row.title}</strong> },
  { key: 'category', label: 'Category', render: (row) => <span className="admin-short-label" lang="en">{row.category}</span> },
  { key: 'status', label: 'Status', render: (row) => row.status },
  { key: 'updated', label: 'Last updated', render: (row) => <span className="mono">{row.updated}</span> },
] as const;

const RECORDS: readonly AdminRecord[] = ROWS.map((row) => ({ id: row.id, title: row.title, accessibleTitle: row.titleLabel, meta: `${row.id} / ${row.updated}`, status: row.id === 'NEWS-0086' ? 'success' : row.id === 'NEWS-0087' ? 'warning' : 'info', statusLabel: row.id === 'NEWS-0086' ? '已發佈' : row.id === 'NEWS-0087' ? '待補英文' : '草稿' }));
const RECORDS_EN: readonly AdminRecord[] = ROWS_EN.map((row) => ({ id: row.id, title: row.title, accessibleTitle: row.titleLabel, meta: `${row.id} / ${row.updated}`, status: row.id === 'NEWS-0086' ? 'success' : row.id === 'NEWS-0087' ? 'warning' : 'info', statusLabel: row.id === 'NEWS-0086' ? 'Published' : row.id === 'NEWS-0087' ? 'English needed' : 'Draft' }));

export function ShowcaseData() {
  const { isZh } = useSite();
  const rows = isZh ? ROWS : ROWS_EN;
  const columns = isZh ? COLUMNS : COLUMNS_EN;
  const [selectedIds, setSelectedIds] = useState<readonly string[]>(['NEWS-0087']);
  const [sortDirection, setSortDirection] = useState<'ascending' | 'descending'>();
  const [page, setPage] = useState(1);
  const [tableRecovered, setTableRecovered] = useState(false);
  const sortedRows = useMemo(() => {
    if (!sortDirection) return rows;
    const direction = sortDirection === 'ascending' ? 1 : -1;
    return [...rows].sort((left, right) => direction * left.titleLabel.localeCompare(right.titleLabel));
  }, [rows, sortDirection]);
  const toggleSelection = (rowId: string) => setSelectedIds((current) => current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId]);
  const selectedLabel = isZh ? '已選取' : 'Selected';
  const scrollRegionLabel = isZh
    ? '公告管理紀錄，可左右滑動查看完整欄位'
    : 'Announcement records. Scroll horizontally to view all columns.';
  return (
    <section id="records" className="admin-showcase-section" aria-labelledby="records-title">
      <div className="admin-section-heading"><span className="mono">04 / RECORDS</span><h2 id="records-title">{isZh ? '桌面比較與行動閱讀各自清楚' : 'Desktop comparison and mobile reading stay clear'}</h2><p>{isZh ? <ZhCopy><ZhPhrase>桌面保留語意表格；</ZhPhrase><ZhPhrase>窄螢幕改以</ZhPhrase><ZhPhrase>固定閱讀順序</ZhPhrase><ZhPhrase>呈現紀錄卡，</ZhPhrase><ZhPhrase>不要求二維捲動。</ZhPhrase></ZhCopy> : 'Desktop keeps a semantic table; narrow screens use ordered record cards instead of requiring two-dimensional scrolling.'}</p></div>
      <div className="admin-surface admin-stack">
        <AdminLiveRegion className="admin-table-reload-announcer">{tableRecovered ? (isZh ? '公告紀錄已重新載入，可繼續操作。' : 'Announcement records reloaded. You can continue working.') : ''}</AdminLiveRegion>
        <AdminToolbar label={isZh ? '公告篩選與批次操作' : 'Announcement filters and bulk actions'}><AdminField label={isZh ? '搜尋公告' : 'Search announcements'} className="admin-toolbar-search" placeholder={isZh ? '標題、分類或紀錄編號' : 'Title, category, or record ID'} /><AdminSelect label={isZh ? '發布狀態' : 'Publication status'} options={isZh ? [{ value: 'all', label: '全部狀態' }, { value: 'draft', label: '草稿' }, { value: 'published', label: '已發佈' }] : [{ value: 'all', label: 'All statuses' }, { value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} /><AdminButton disabled>{isZh ? '批次發布' : 'Bulk publish'}</AdminButton><AdminButton variant="primary" icon="plus">{isZh ? '新增公告' : 'New announcement'}</AdminButton></AdminToolbar>
        <div className="admin-table-view"><AdminDataTable caption={isZh ? '公告管理紀錄' : 'Announcement records'} columns={columns} rows={sortedRows} selectedIds={selectedIds} selectedLabel={selectedLabel} scrollRegionLabel={scrollRegionLabel} refreshingLabel={isZh ? '資料可能不是最新版本，正在重新整理。' : 'Data may be stale. Refreshing records.'} actionHeaderLabel={isZh ? '操作' : 'Actions'} actionLabel={isZh ? '編輯' : 'Edit'} density="compact" onToggleRow={toggleSelection} selectionHeaderLabel={isZh ? '選取公告' : 'Select announcement'} rowSelectionLabel={(rowId) => isZh ? `選取 ${rowId}` : `Select ${rowId}`} sort={{ key: 'title', direction: sortDirection ?? 'none', onChange: () => setSortDirection((current) => current === 'ascending' ? 'descending' : 'ascending'), label: (label) => isZh ? `依${label}排序` : `Sort by ${label}` }} /></div>
        <div className="admin-record-view"><RecordList records={isZh ? RECORDS : RECORDS_EN} openLabel={isZh ? '開啟' : 'Open'} /></div>
        <div className="admin-state-grid">
          <AdminDataTable caption={isZh ? '載入中的公告紀錄' : 'Loading announcement records'} columns={columns} rows={[]} selectedLabel={selectedLabel} scrollRegionLabel={scrollRegionLabel} state="loading" stateTitle={isZh ? '正在載入公告紀錄' : 'Loading announcement records'} stateDescription={isZh ? <ZhCopy><ZhPhrase>保留操作位置，</ZhPhrase><ZhPhrase>完成後顯示資料列。</ZhPhrase></ZhCopy> : 'Actions remain in place while rows load.'} />
          {tableRecovered ? <StatePanel kind="success" title={isZh ? '公告紀錄已重新載入' : 'Announcement records reloaded'} description={isZh ? <ZhCopy><ZhPhrase>展示資料已恢復，</ZhPhrase><ZhPhrase>可繼續操作。</ZhPhrase></ZhCopy> : 'Showcase data is available again.'} /> : <AdminDataTable caption={isZh ? '載入失敗的公告紀錄' : 'Failed announcement records'} columns={columns} rows={[]} selectedLabel={selectedLabel} scrollRegionLabel={scrollRegionLabel} state="error" stateTitle={isZh ? '公告紀錄載入失敗' : 'Announcement records failed to load'} stateDescription={isZh ? <ZhCopy><ZhPhrase>請確認連線後</ZhPhrase><ZhPhrase>再試一次。</ZhPhrase></ZhCopy> : 'Check the connection and try again.'} stateActionLabel={isZh ? '重新載入' : 'Retry'} onStateAction={() => setTableRecovered(true)} />}
          <AdminDataTable caption={isZh ? '空白公告紀錄' : 'Empty announcement records'} columns={columns} rows={[]} selectedLabel={selectedLabel} scrollRegionLabel={scrollRegionLabel} state="empty" stateTitle={isZh ? '目前沒有資料' : 'No records yet'} stateDescription={isZh ? <ZhCopy><ZhPhrase>請確認目前條件，</ZhPhrase><ZhPhrase>或稍後再試一次。</ZhPhrase></ZhCopy> : 'Check the current conditions or try again later.'} />
          <AdminDataTable caption={isZh ? '篩選後公告紀錄' : 'Filtered announcement records'} columns={columns} rows={[]} selectedLabel={selectedLabel} scrollRegionLabel={scrollRegionLabel} state="filtered-empty" stateTitle={isZh ? '沒有符合篩選條件的資料' : 'No matching records'} stateDescription={isZh ? <ZhCopy><ZhPhrase>請確認目前條件，</ZhPhrase><ZhPhrase>或稍後再試一次。</ZhPhrase></ZhCopy> : 'Change or clear the current filters.'} />
        </div>
        <nav className="admin-pagination" aria-label={isZh ? '公告紀錄分頁' : 'Announcement pagination'}><AdminButton disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>{isZh ? '上一頁' : 'Previous'}</AdminButton><span className="mono" aria-current="page">{isZh ? `第 ${page} 頁，共 12 頁` : `Page ${page} of 12`}</span><AdminButton disabled={page === 12} onClick={() => setPage((current) => Math.min(12, current + 1))}>{isZh ? '下一頁' : 'Next'}</AdminButton></nav>
      </div>
    </section>
  );
}
