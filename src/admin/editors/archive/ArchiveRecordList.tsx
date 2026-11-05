import { memo, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AdminButton, AdminIconButton } from '@/admin/AdminButton';
import { StatePanel, StatusBadge, type AdminStatus } from '@/admin/AdminFeedback';
import { AdminIcon } from '@/admin/AdminIcon';
import { ConfirmDialog } from '@/admin/AdminOverlays';
import { EDITOR_REVEAL_EVENT } from '@/admin/editors/global/ui/EditorDensity';
import { isStructuredEditorCommitAccepted } from '@/admin/editors/shared';
import type { ArchiveCommitResult } from './archiveTypes';
import { useIsZh } from './fields';

export type ArchiveRecordBadge = { readonly label: string; readonly status: AdminStatus };

/** One collapsed line of a long collection: what the item is, without rendering its fields. */
export type ArchiveRecordRow = {
  /** Index of the item in the payload array, which stays put however the list is sorted. */
  readonly index: number;
  readonly title: string;
  readonly titleLang: string;
  /** Short facts shown before the title, such as the date and category. */
  readonly meta: readonly string[];
  /** Short status tags, such as "置頂" or "未翻譯". */
  readonly badges?: readonly ArchiveRecordBadge[];
  /** The item differs from the published revision. */
  readonly changed: boolean;
  readonly issueCount: number;
};

export type ArchiveRecordRemoval = {
  readonly title: (row: ArchiveRecordRow) => string;
  readonly description: (row: ArchiveRecordRow) => string;
  readonly body?: (row: ArchiveRecordRow) => string;
  readonly onRemove: (index: number) => ArchiveCommitResult;
};

type ArchiveRecordListProps = {
  readonly id: string;
  readonly title: string;
  readonly description?: ReactNode;
  /** Rows to show, already filtered and in display order. */
  readonly rows: readonly ArchiveRecordRow[];
  readonly totalCount: number;
  /** Payload index of the open item, if any. Only one is open at a time. */
  readonly expanded: number | null;
  readonly onExpandedChange: (index: number | null) => void;
  readonly renderItem: (index: number) => ReactNode;
  readonly toolbar?: ReactNode;
  readonly addLabel?: string;
  /** Adds an item and returns its payload index, which then opens with focus in its first field. */
  readonly onAdd?: () => number | null;
  readonly removal?: ArchiveRecordRemoval;
  readonly itemNoun: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly pageSize?: number;
};

const FIRST_FIELD = 'input:not([type="hidden"]):not([readonly]):not(:disabled), textarea:not(:disabled), select:not(:disabled)';

type RowProps = {
  readonly listId: string;
  readonly row: ArchiveRecordRow;
  readonly open: boolean;
  readonly isZh: boolean;
  readonly itemNoun: string;
  readonly removable: boolean;
  readonly onToggle: (index: number) => void;
  readonly onRemove: (row: ArchiveRecordRow, trigger: HTMLButtonElement) => void;
};

function badgeKey(badges: readonly ArchiveRecordBadge[] | undefined): string {
  return badges === undefined ? '' : badges.map((badge) => `${badge.status}:${badge.label}`).join('\u0000');
}

/** A closed row re-renders only when what it shows changes, not on every keystroke elsewhere. */
const RecordRowHeader = memo(function RecordRowHeader({ listId, row, open, isZh, itemNoun, removable, onToggle, onRemove }: RowProps) {
  const contentId = `${listId}-item-${row.index}-content`;
  const untitled = isZh ? `（未命名${itemNoun}）` : `(Untitled ${itemNoun.toLowerCase()})`;
  return (
    <div className="admin-archive-row-header">
      <h4 className="admin-archive-row-heading">
        <button
          type="button"
          className="admin-archive-row-toggle"
          aria-expanded={open}
          aria-controls={open ? contentId : undefined}
          onClick={() => onToggle(row.index)}
        >
          <span className="admin-archive-row-chevron" aria-hidden="true"><AdminIcon name="arrowDown" /></span>
          {row.meta.length > 0 ? <span className="admin-archive-row-meta">{row.meta.join(' · ')}</span> : null}
          <span className="admin-archive-row-title" lang={row.titleLang}>{row.title === '' ? untitled : row.title}</span>
        </button>
      </h4>
      <div className="admin-archive-row-badges">
        {row.badges?.map((badge) => <StatusBadge key={badge.label} status={badge.status}>{badge.label}</StatusBadge>)}
        {row.issueCount > 0 ? <StatusBadge status="error">{isZh ? `${row.issueCount} 個問題` : `${row.issueCount} issue${row.issueCount === 1 ? '' : 's'}`}</StatusBadge> : null}
        {row.changed ? <span className="admin-changed-dot" data-changed title={isZh ? '含未發布的變更' : 'Has unpublished changes'}><span className="sr-only">{isZh ? '（有變更）' : '(changed)'}</span></span> : null}
        {removable ? (
          <AdminIconButton
            icon="trash"
            data-record-action="remove"
            label={isZh ? `刪除${itemNoun}：${row.title === '' ? untitled : row.title}` : `Delete ${itemNoun.toLowerCase()}: ${row.title === '' ? untitled : row.title}`}
            onClick={(event) => onRemove(row, event.currentTarget)}
          />
        ) : null}
      </div>
    </div>
  );
}, (previous, next) => (
  previous.listId === next.listId
  && previous.open === next.open
  && previous.isZh === next.isZh
  && previous.itemNoun === next.itemNoun
  && previous.removable === next.removable
  && previous.onToggle === next.onToggle
  && previous.onRemove === next.onRemove
  && previous.row.index === next.row.index
  && previous.row.title === next.row.title
  && previous.row.titleLang === next.row.titleLang
  && previous.row.changed === next.row.changed
  && previous.row.issueCount === next.row.issueCount
  && previous.row.meta.join('\u0000') === next.row.meta.join('\u0000')
  && badgeKey(previous.row.badges) === badgeKey(next.row.badges)
));

/**
 * A long collection (posts, videos, pages) as one-line rows that open one at a time. Closed rows
 * render no fields, so a 100-post archive stays as light as a short list; a closed row that
 * holds unpublished changes is marked so the changed-field navigator can open it.
 */
export function ArchiveRecordList({
  id,
  title,
  description,
  rows,
  totalCount,
  expanded,
  onExpandedChange,
  renderItem,
  toolbar,
  addLabel,
  onAdd,
  removal,
  itemNoun,
  emptyTitle,
  emptyDescription,
  pageSize = 100,
}: ArchiveRecordListProps) {
  const isZh = useIsZh();
  const rootRef = useRef<HTMLDivElement>(null);
  const removeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [limit, setLimit] = useState(pageSize);
  const [pendingRemoval, setPendingRemoval] = useState<ArchiveRecordRow | null>(null);
  const [focus, setFocus] = useState<{ readonly index: number; readonly target: 'field' | 'toggle' } | null>(null);
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;
  const changeRef = useRef(onExpandedChange);
  changeRef.current = onExpandedChange;

  const expandedPosition = expanded === null ? -1 : rows.findIndex((row) => row.index === expanded);
  const shown = Math.max(limit, expandedPosition + 1);
  const visible = rows.length > shown ? rows.slice(0, shown) : rows;

  // Opening from elsewhere (a validation link, the changed-field navigator, search) arrives as the
  // editor's reveal event from inside the row.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) return undefined;
    const reveal = (event: Event) => {
      const row = (event.target as Element | null)?.closest<HTMLElement>(`[data-archive-list="${id}"]`);
      if (row === null || row === undefined) return;
      const index = Number(row.dataset.archiveRowIndex);
      if (expandedRef.current !== index) changeRef.current(index);
    };
    root.addEventListener(EDITOR_REVEAL_EVENT, reveal);
    return () => root.removeEventListener(EDITOR_REVEAL_EVENT, reveal);
  }, [id]);

  useLayoutEffect(() => {
    if (focus === null) return;
    const row = rootRef.current?.querySelector<HTMLElement>(`[data-archive-list="${id}"][data-archive-row-index="${focus.index}"]`);
    if (row === null || row === undefined) return;
    setFocus(null);
    const target = focus.target === 'field'
      ? row.querySelector<HTMLElement>(`.admin-archive-row-content ${FIRST_FIELD}`)
      : row.querySelector<HTMLElement>('.admin-archive-row-toggle');
    target?.focus();
  });

  const toggle = useRef((index: number) => {
    changeRef.current(expandedRef.current === index ? null : index);
  }).current;
  const requestRemoval = useRef((row: ArchiveRecordRow, trigger: HTMLButtonElement) => {
    removeTriggerRef.current = trigger;
    setPendingRemoval(row);
  }).current;

  const add = () => {
    if (onAdd === undefined) return;
    const index = onAdd();
    if (index === null) return;
    onExpandedChange(index);
    setFocus({ index, target: 'field' });
  };
  const confirmRemoval = () => {
    if (pendingRemoval === null || removal === undefined) return;
    const row = pendingRemoval;
    setPendingRemoval(null);
    const position = rows.findIndex((candidate) => candidate.index === row.index);
    if (!isStructuredEditorCommitAccepted(removal.onRemove(row.index))) return;
    if (expanded === row.index) onExpandedChange(null);
    else if (expanded !== null && expanded > row.index) onExpandedChange(expanded - 1);
    // Focus the row that took the removed one's place, whose payload index shifted down by one.
    const neighbour = rows[position + 1] ?? rows[position - 1];
    if (neighbour !== undefined) setFocus({ index: neighbour.index > row.index ? neighbour.index - 1 : neighbour.index, target: 'toggle' });
  };

  return (
    <div ref={rootRef} className="admin-editor-collection admin-archive-records" data-editor-collection={id}>
      <header className="admin-editor-collection-header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        <div className="admin-editor-collection-tools">
          {onAdd === undefined ? null : <AdminButton icon="plus" onClick={add}>{addLabel}</AdminButton>}
        </div>
      </header>
      {toolbar}
      {totalCount > 0 ? (
        <p className="admin-archive-count" role="status">
          {rows.length === totalCount
            ? (isZh ? `共 ${totalCount} 個${itemNoun}` : `${totalCount} ${itemNoun.toLowerCase()}${totalCount === 1 ? '' : 's'}`)
            : (isZh ? `顯示 ${rows.length}／${totalCount} 個${itemNoun}` : `Showing ${rows.length} of ${totalCount}`)}
        </p>
      ) : null}
      {totalCount === 0 ? (
        <StatePanel kind="empty" title={emptyTitle} description={emptyDescription} />
      ) : rows.length === 0 ? (
        <StatePanel kind="filtered-empty" title={isZh ? '沒有符合篩選條件的項目' : 'No matching items'} description={isZh ? '請調整或清除篩選條件。' : 'Change or clear the filters.'} />
      ) : (
        <ol className="admin-editor-collection-list">
          {visible.map((row) => {
            const open = row.index === expanded;
            return (
              <li
                key={row.index}
                className="admin-editor-collection-item admin-archive-row"
                data-editor-item-index={row.index}
                data-archive-list={id}
                data-archive-row-index={row.index}
                data-collapsed={open ? undefined : true}
                data-changed-collapsed={!open && row.changed ? true : undefined}
              >
                <RecordRowHeader
                  listId={id}
                  row={row}
                  open={open}
                  isZh={isZh}
                  itemNoun={itemNoun}
                  removable={removal !== undefined}
                  onToggle={toggle}
                  onRemove={requestRemoval}
                />
                {open ? <div id={`${id}-item-${row.index}-content`} className="admin-archive-row-content">{renderItem(row.index)}</div> : null}
              </li>
            );
          })}
        </ol>
      )}
      {rows.length > visible.length ? (
        <AdminButton variant="quiet" onClick={() => setLimit((current) => current + pageSize)}>
          {isZh ? `顯示更多（還有 ${rows.length - visible.length} 個）` : `Show more (${rows.length - visible.length} more)`}
        </AdminButton>
      ) : null}
      {pendingRemoval === null || removal === undefined ? null : (
        <ConfirmDialog
          open
          warning
          title={removal.title(pendingRemoval)}
          description={removal.description(pendingRemoval)}
          body={removal.body?.(pendingRemoval) ?? (isZh ? '儲存草稿前都可以用「復原」還原。' : 'You can still undo this before saving the draft.')}
          confirmLabel={isZh ? '確認刪除' : 'Delete'}
          cancelLabel={isZh ? '保留' : 'Keep'}
          closeLabel={isZh ? '關閉對話框' : 'Close dialog'}
          triggerRef={removeTriggerRef}
          onClose={() => setPendingRemoval(null)}
          onConfirm={confirmRemoval}
        />
      )}
    </div>
  );
}
