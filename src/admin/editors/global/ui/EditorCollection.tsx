import { useCallback, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { AdminButton, AdminIconButton } from '@/admin/AdminButton';
import { AdminLiveRegion, StatePanel } from '@/admin/AdminFeedback';
import { ConfirmDialog } from '@/admin/AdminOverlays';
import {
  isStructuredEditorCommitAccepted as isGlobalEditorCommitAccepted,
  type StructuredEditorCommitResult as GlobalEditorCommitResult,
} from '@/admin/editors/shared';
import { EDITOR_REVEAL_EVENT, useEditorDensity } from './EditorDensity';

export type EditorCollectionCopy = {
  readonly addLabel: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly itemLabel: (position: number, total: number) => string;
  readonly moveUpLabel: (position: number) => string;
  readonly moveDownLabel: (position: number) => string;
  readonly removeLabel: (position: number) => string;
  readonly removeTitle: (position: number) => string;
  readonly removeDescription: string;
  readonly removeBody: string;
  readonly confirmRemoveLabel: string;
  readonly cancelRemoveLabel: string;
  readonly movedAnnouncement: (from: number, to: number, total: number) => string;
};

type EditorCollectionProps = {
  readonly id: string;
  readonly title: string;
  readonly description?: ReactNode;
  readonly itemCount: number;
  readonly revisionKeys: readonly object[];
  readonly copy: EditorCollectionCopy;
  readonly renderItem: (index: number) => ReactNode;
  readonly onAdd: () => GlobalEditorCommitResult;
  readonly onMove?: (fromIndex: number, toIndex: number) => GlobalEditorCommitResult;
  readonly onRemove: (index: number) => GlobalEditorCommitResult;
};

type FocusRequest =
  | { readonly kind: 'add' }
  | { readonly kind: 'item'; readonly index: number; readonly action?: 'move-up' | 'move-down' | 'remove' };

type RemovalIntent = {
  readonly index: number;
  readonly revisionKeys: readonly object[];
};

const ITEM_FOCUSABLE = 'input:not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex="-1"])';
const SUMMARY_SOURCE = 'input[type="text"], input:not([type]), input[type="url"], textarea';
/** Items with fewer editable fields than this stay open; collapsing a one-line row saves nothing. */
const COLLAPSIBLE_FIELD_COUNT = 3;
const SUMMARY_LENGTH = 72;

function revisionsMatch(left: readonly object[], right: readonly object[]): boolean {
  return left.length === right.length && left.every((key, index) => key === right[index]);
}

function ownContent(item: Element): HTMLElement | null {
  return item.querySelector<HTMLElement>(':scope > .admin-editor-collection-item-content');
}

function itemElements(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(':scope > .admin-editor-collection-list > [data-editor-item-index]')];
}

const NAMING_FIELD = /^(title|name|label|heading|topic)$/iu;
const DATE_VALUE = /^\d{4}[-/]\d{2}[-/]\d{2}/u;

/** Last JSON path key of a structured-editor field id, whose segments are hex-encoded (`-s-74_69_74_6c_65`). */
function fieldKey(field: Element): string {
  const encoded = /-s-([0-9a-f_]+)$/u.exec(field.id)?.[1];
  if (encoded === undefined) return '';
  return encoded.split('_').map((pair) => String.fromCharCode(Number.parseInt(pair, 16))).join('');
}

/**
 * A one-line item summary: the item's title or name in the editor's own language when there is
 * one, otherwise its first filled text field, followed by a date if the item has one.
 */
function summarize(content: HTMLElement, isZh: boolean): string {
  const fields = [...content.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(SUMMARY_SOURCE)]
    .filter((field) => field.value.trim() !== '');
  const ownLanguage = (field: Element) => field.closest('[lang]')?.getAttribute('lang') === (isZh ? 'zh-Hant' : 'en');
  const ranked = [
    ...fields.filter((field) => ownLanguage(field) && NAMING_FIELD.test(fieldKey(field))),
    ...fields.filter((field) => NAMING_FIELD.test(fieldKey(field))),
    ...fields.filter((field) => ownLanguage(field) && !DATE_VALUE.test(field.value.trim())),
    ...fields.filter((field) => !DATE_VALUE.test(field.value.trim())),
  ];
  const lead = ranked[0]?.value.trim() ?? '';
  const date = fields.find((field) => DATE_VALUE.test(field.value.trim()))?.value.trim().slice(0, 10);
  const oneLine = [lead, date].filter((part) => part !== undefined && part !== '').join(' · ').replace(/\s+/gu, ' ');
  return oneLine.length > SUMMARY_LENGTH ? `${oneLine.slice(0, SUMMARY_LENGTH - 1)}…` : oneLine;
}

function fieldCount(content: HTMLElement): number {
  return content.querySelectorAll('input, textarea, select').length;
}

export function EditorCollection({ id, title, description, itemCount, revisionKeys, copy, renderItem, onAdd, onMove, onRemove }: EditorCollectionProps) {
  const { collapseItemsByDefault, isZh } = useEditorDensity();
  const rootRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const removeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [removalIntent, setRemovalIntent] = useState<RemovalIntent | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [announcement, setAnnouncement] = useState('');
  // `null` means "not measured yet": the first layout pass decides which items start collapsed.
  const [collapsed, setCollapsed] = useState<readonly boolean[] | null>(null);
  const [collapsible, setCollapsible] = useState<readonly boolean[]>([]);
  const [summaries, setSummaries] = useState<readonly string[]>([]);

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (root === null) return;
    const items = itemElements(root);
    const nextCollapsible = items.map((item) => {
      const content = ownContent(item);
      return content !== null && fieldCount(content) >= COLLAPSIBLE_FIELD_COUNT;
    });
    const nextSummaries = items.map((item) => {
      const content = ownContent(item);
      return content === null ? '' : summarize(content, isZh);
    });
    setCollapsible((current) => (current.length === nextCollapsible.length && current.every((value, index) => value === nextCollapsible[index]) ? current : nextCollapsible));
    setSummaries((current) => (current.length === nextSummaries.length && current.every((value, index) => value === nextSummaries[index]) ? current : nextSummaries));
    setCollapsed((current) => current ?? nextCollapsible.map((canCollapse) => collapseItemsByDefault && itemCount > 1 && canCollapse));
  }, [collapseItemsByDefault, isZh, itemCount]);

  // Re-measure after every render. Accepted edits re-render the collection, so summaries stay
  // current without listening to raw input events, which would re-render a controlled field
  // before React's own change handler runs and drop the keystroke.
  useLayoutEffect(() => { measure(); });

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) return undefined;
    const reveal = (event: Event) => {
      let item = (event.target as Element | null)?.closest('[data-editor-item-index]') ?? null;
      while (item !== null && item.parentElement?.parentElement !== root) {
        item = item.parentElement?.closest('[data-editor-item-index]') ?? null;
      }
      if (item === null) return;
      const index = Number(item.getAttribute('data-editor-item-index'));
      setCollapsed((current) => current?.map((value, position) => (position === index ? false : value)) ?? current);
    };
    root.addEventListener(EDITOR_REVEAL_EVENT, reveal);
    root.addEventListener('beforematch', reveal);
    return () => {
      root.removeEventListener(EDITOR_REVEAL_EVENT, reveal);
      root.removeEventListener('beforematch', reveal);
    };
  }, []);

  // `hidden="until-found"` keeps collapsed text reachable by the browser's find-in-page, which
  // fires `beforematch` to open the item. React only writes boolean `hidden`, so set it here.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) return;
    itemElements(root).forEach((item, index) => {
      const content = ownContent(item);
      if (content === null) return;
      if (collapsed?.[index] === true && collapsible[index] === true) content.setAttribute('hidden', 'until-found');
      else content.removeAttribute('hidden');
    });
  });

  useLayoutEffect(() => {
    if (focusRequest === null) return;
    if (focusRequest.kind === 'add') {
      const addButton = addButtonRef.current ?? rootRef.current?.querySelector<HTMLElement>('.admin-state-panel button');
      if (addButton === null || addButton === undefined) return;
      addButton.focus();
    } else {
      const item = rootRef.current?.querySelector<HTMLElement>(`:scope > .admin-editor-collection-list > [data-editor-item-index="${focusRequest.index}"]`);
      const content = item === null || item === undefined ? null : ownContent(item);
      const target = focusRequest.action === undefined
        ? content?.querySelector<HTMLElement>(ITEM_FOCUSABLE)
        : item?.querySelector<HTMLElement>(`[data-editor-action="${focusRequest.action}"]`);
      if (target === undefined || target === null) return;
      target.focus();
    }
    setFocusRequest(null);
  }, [focusRequest, itemCount]);

  const setItemCollapsed = (index: number, value: boolean) => {
    setCollapsed((current) => (current ?? []).map((flag, position) => (position === index ? value : flag)));
  };
  const setAllCollapsed = (value: boolean) => {
    setCollapsed(Array.from({ length: itemCount }, () => value));
  };

  const addItem = () => {
    if (!isGlobalEditorCommitAccepted(onAdd())) return;
    setCollapsed((current) => [...(current ?? []), false]);
    setFocusRequest({ kind: 'item', index: itemCount });
  };
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (onMove === undefined) return;
    if (!isGlobalEditorCommitAccepted(onMove(fromIndex, toIndex))) return;
    setCollapsed((current) => {
      if (current === null) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved ?? false);
      return next;
    });
    setAnnouncement(copy.movedAnnouncement(fromIndex + 1, toIndex + 1, itemCount));
    setFocusRequest({ kind: 'item', index: toIndex, action: toIndex < fromIndex ? 'move-down' : 'move-up' });
  };
  const requestRemoval = (index: number, trigger: HTMLButtonElement) => {
    removeTriggerRef.current = trigger;
    setRemovalIntent({ index, revisionKeys });
  };
  const confirmRemoval = () => {
    if (removalIntent === null) return;
    setRemovalIntent(null);
    if (!revisionsMatch(removalIntent.revisionKeys, revisionKeys)) return;
    const nextCount = itemCount - 1;
    if (!isGlobalEditorCommitAccepted(onRemove(removalIntent.index))) return;
    setCollapsed((current) => current?.filter((_, position) => position !== removalIntent.index) ?? current);
    setFocusRequest(nextCount === 0
      ? { kind: 'add' }
      : { kind: 'item', index: Math.min(removalIntent.index, nextCount - 1), action: 'remove' });
  };

  const anyCollapsible = collapsible.some(Boolean);
  const allOpen = collapsed === null || collapsed.every((flag, index) => !flag || collapsible[index] !== true);

  return (
    <div ref={rootRef} className="admin-editor-collection" data-editor-collection={id}>
      <header className="admin-editor-collection-header">
        <div><h3>{title}</h3>{description ? <p>{description}</p> : null}</div>
        <div className="admin-editor-collection-tools">
          {anyCollapsible && itemCount > 1 ? (
            <AdminButton variant="quiet" onClick={() => setAllCollapsed(allOpen)}>
              {allOpen ? (isZh ? '全部收合' : 'Collapse all') : (isZh ? '全部展開' : 'Expand all')}
            </AdminButton>
          ) : null}
          {itemCount > 0 ? <AdminButton ref={addButtonRef} icon="plus" onClick={addItem}>{copy.addLabel}</AdminButton> : null}
        </div>
      </header>
      <AdminLiveRegion className="admin-editor-reorder-announcer">{announcement}</AdminLiveRegion>
      {itemCount === 0 ? (
        <StatePanel kind="empty" title={copy.emptyTitle} description={copy.emptyDescription} actionLabel={copy.addLabel} onAction={addItem} />
      ) : (
        <ol className="admin-editor-collection-list">
          {Array.from({ length: itemCount }, (_, index) => {
            const position = index + 1;
            const canCollapse = collapsible[index] === true;
            const isCollapsed = canCollapse && collapsed?.[index] === true;
            const contentId = `${id}-item-${index}-content`;
            const label = copy.itemLabel(position, itemCount);
            const toggleFromHeader = (event: MouseEvent<HTMLDivElement>) => {
              if (!canCollapse || (event.target as Element).closest('button, a, input, textarea, select') !== null) return;
              setItemCollapsed(index, !isCollapsed);
            };
            return (
              <li key={index} className="admin-editor-collection-item" data-editor-item-index={index} data-collapsed={isCollapsed || undefined}>
                <div className="admin-editor-collection-item-header" data-collapsible={canCollapse || undefined} onClick={toggleFromHeader}>
                  {canCollapse ? (
                    <AdminIconButton
                      className="admin-editor-collapse"
                      icon="arrowDown"
                      label={isCollapsed ? (isZh ? `展開${label}` : `Expand ${label}`) : (isZh ? `收合${label}` : `Collapse ${label}`)}
                      aria-expanded={!isCollapsed}
                      aria-controls={contentId}
                      onClick={() => setItemCollapsed(index, !isCollapsed)}
                    />
                  ) : null}
                  <div className="admin-editor-collection-item-title">
                    <h4>{label}</h4>
                    {isCollapsed && summaries[index] ? <p className="admin-editor-collection-summary">{summaries[index]}</p> : null}
                  </div>
                  <div className="admin-editor-collection-actions">
                    {onMove === undefined ? null : <>
                      <AdminIconButton className="admin-editor-move-up" data-editor-action="move-up" icon="arrowDown" label={copy.moveUpLabel(position)} disabled={index === 0} onClick={() => moveItem(index, index - 1)} />
                      <AdminIconButton data-editor-action="move-down" icon="arrowDown" label={copy.moveDownLabel(position)} disabled={index === itemCount - 1} onClick={() => moveItem(index, index + 1)} />
                    </>}
                    <AdminIconButton data-editor-action="remove" icon="trash" label={copy.removeLabel(position)} onClick={(event) => requestRemoval(index, event.currentTarget)} />
                  </div>
                </div>
                <div id={contentId} className="admin-editor-collection-item-content">{renderItem(index)}</div>
              </li>
            );
          })}
        </ol>
      )}
      {removalIntent === null ? null : (
        <ConfirmDialog
          open
          warning
          title={copy.removeTitle(removalIntent.index + 1)}
          description={copy.removeDescription}
          body={copy.removeBody}
          confirmLabel={copy.confirmRemoveLabel}
          cancelLabel={copy.cancelRemoveLabel}
          triggerRef={removeTriggerRef}
          onClose={() => setRemovalIntent(null)}
          onConfirm={confirmRemoval}
        />
      )}
    </div>
  );
}
