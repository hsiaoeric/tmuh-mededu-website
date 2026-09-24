import { useId, useMemo, type ReactNode } from 'react';
import { Icon } from '@/ui/Icon';
import { AdminIconButton } from './AdminButton';
import { StatePanel, StatusBadge, type AdminStatus, type StateKind } from './AdminFeedback';

export type AdminTableColumn<Row> = {
  readonly key: string;
  readonly label: string;
  readonly render: (row: Row) => ReactNode;
  readonly sortable?: boolean;
};

export type AdminTableSort = {
  readonly key: string;
  readonly direction: 'none' | 'ascending' | 'descending';
  readonly onChange: (key: string) => void;
  readonly label: (columnLabel: string) => string;
};

type AdminDataTableProps<Row extends { readonly id: string }> = {
  readonly caption: string;
  readonly columns: readonly AdminTableColumn<Row>[];
  readonly rows: readonly Row[];
  readonly selectedIds?: readonly string[];
  readonly state?: Exclude<StateKind, 'success' | 'disabled'>;
  readonly stateTitle?: string;
  readonly stateDescription?: ReactNode;
  readonly stateActionLabel?: string;
  readonly onStateAction?: () => void;
  readonly refreshingLabel?: string;
  readonly actionHeaderLabel?: string;
  readonly actionLabel?: string;
  readonly selectedLabel: string;
  readonly scrollRegionLabel: string;
  readonly density?: 'standard' | 'compact';
  readonly sort?: AdminTableSort;
  readonly onToggleRow?: (rowId: string) => void;
  readonly selectionHeaderLabel?: string;
  readonly rowSelectionLabel?: (rowId: string) => string;
};

const TABLE_STATE_TITLES: Readonly<Record<Exclude<StateKind, 'success' | 'disabled'>, string>> = {
  loading: '資料載入中',
  empty: '目前沒有資料',
  'filtered-empty': '沒有符合篩選條件的資料',
  error: '無法載入資料',
};
const EMPTY_SELECTED_IDS: readonly string[] = [];

export function AdminDataTable<Row extends { readonly id: string }>({ caption, columns, rows, selectedIds = EMPTY_SELECTED_IDS, state, stateTitle, stateDescription = '請確認目前條件，或稍後再試一次。', stateActionLabel, onStateAction, refreshingLabel, actionHeaderLabel = '操作', actionLabel = '編輯', selectedLabel, scrollRegionLabel, density = 'standard', sort, onToggleRow, selectionHeaderLabel = '選取', rowSelectionLabel = (rowId) => `選取 ${rowId}` }: AdminDataTableProps<Row>) {
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const scrollHintId = `${useId()}-scroll-hint`;
  if (state) {
    return <StatePanel kind={state} title={stateTitle ?? TABLE_STATE_TITLES[state]} description={stateDescription} actionLabel={stateActionLabel} onAction={onStateAction} />;
  }
  return (
    <div className="admin-table-region" role="region" aria-label={scrollRegionLabel} aria-describedby={scrollHintId} tabIndex={0}>
      <p className="admin-table-scroll-hint" id={scrollHintId}><Icon name="arrow" />{scrollRegionLabel}</p>
      {refreshingLabel ? <div className="admin-table-refresh" data-state="refreshing" role="status"><StatusBadge status="info">{refreshingLabel}</StatusBadge></div> : null}
      <table className="admin-table" data-density={density}>
        <caption>{caption}</caption>
        <thead><tr>{onToggleRow ? <th scope="col" data-column-key="selection"><span className="sr-only">{selectionHeaderLabel}</span></th> : null}{columns.map((column) => {
          const activeSort = sort?.key === column.key ? sort.direction : 'none';
          return <th key={column.key} scope="col" data-column-key={column.key} aria-sort={column.sortable ? activeSort : undefined}>{column.sortable && sort ? <button type="button" className="admin-table-sort" aria-label={sort.label(column.label)} onClick={() => sort.onChange(column.key)}><span aria-hidden="true">{column.label}</span></button> : column.label}</th>;
        })}<th scope="col" data-column-key="actions">{actionHeaderLabel}</th></tr></thead>
        <tbody>{rows.map((row) => {
          const selected = selectedIdSet.has(row.id);
          return <tr key={row.id} data-selected={selected || undefined} aria-selected={selected}>{onToggleRow ? <td data-column-key="selection"><input type="checkbox" checked={selected} aria-label={rowSelectionLabel(row.id)} onChange={() => onToggleRow(row.id)} /></td> : null}{columns.map((column, index) => <td key={column.key} data-column-key={column.key}>{index === 0 && selected ? <span className="admin-table-selection"><StatusBadge status="info">{selectedLabel}</StatusBadge></span> : null}{column.render(row)}</td>)}<td data-column-key="actions"><AdminIconButton icon="arrow" label={`${actionLabel} ${row.id}`} /></td></tr>;
        })}</tbody>
      </table>
    </div>
  );
}

export type AdminRecord = {
  readonly id: string;
  readonly title: ReactNode;
  readonly accessibleTitle: string;
  readonly meta: string;
  readonly status: AdminStatus;
  readonly statusLabel: string;
};

export function RecordList({ records, openLabel = '開啟' }: { readonly records: readonly AdminRecord[]; readonly openLabel?: string }) {
  return (
    <ul className="admin-record-list">
      {records.map((record) => <li key={record.id}><div><strong className="admin-record-title">{record.title}</strong><span className="mono">{record.meta}</span></div><StatusBadge status={record.status}>{record.statusLabel}</StatusBadge><AdminIconButton icon="arrow" label={`${openLabel} ${record.accessibleTitle}`} /></li>)}
    </ul>
  );
}
