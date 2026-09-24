import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AdminButton, AdminIconButton } from '@/admin/AdminButton';
import { AdminLiveRegion, StatePanel } from '@/admin/AdminFeedback';
import { ConfirmDialog } from '@/admin/AdminOverlays';
import {
  isStructuredEditorCommitAccepted as isGlobalEditorCommitAccepted,
  type StructuredEditorCommitResult as GlobalEditorCommitResult,
} from '@/admin/editors/shared';

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

function revisionsMatch(left: readonly object[], right: readonly object[]): boolean {
  return left.length === right.length && left.every((key, index) => key === right[index]);
}

export function EditorCollection({ id, title, description, itemCount, revisionKeys, copy, renderItem, onAdd, onMove, onRemove }: EditorCollectionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const removeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [removalIntent, setRemovalIntent] = useState<RemovalIntent | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useLayoutEffect(() => {
    if (focusRequest === null) return;
    if (focusRequest.kind === 'add') {
      const addButton = addButtonRef.current ?? rootRef.current?.querySelector<HTMLElement>('.admin-state-panel button');
      if (addButton === null || addButton === undefined) return;
      addButton.focus();
    } else {
      const item = rootRef.current?.querySelector<HTMLElement>(`:scope > .admin-editor-collection-list > [data-editor-item-index="${focusRequest.index}"]`);
      const content = item?.querySelector<HTMLElement>(':scope > .admin-editor-collection-item-content');
      const target = focusRequest.action === undefined
        ? content?.querySelector<HTMLElement>(ITEM_FOCUSABLE)
        : item?.querySelector<HTMLElement>(`[data-editor-action="${focusRequest.action}"]`);
      if (target === undefined || target === null) return;
      target.focus();
    }
    setFocusRequest(null);
  }, [focusRequest, itemCount]);

  const addItem = () => {
    if (!isGlobalEditorCommitAccepted(onAdd())) return;
    setFocusRequest({ kind: 'item', index: itemCount });
  };
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (onMove === undefined) return;
    if (!isGlobalEditorCommitAccepted(onMove(fromIndex, toIndex))) return;
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
    setFocusRequest(nextCount === 0
      ? { kind: 'add' }
      : { kind: 'item', index: Math.min(removalIntent.index, nextCount - 1), action: 'remove' });
  };

  return (
    <div ref={rootRef} className="admin-editor-collection" data-editor-collection={id}>
      <header className="admin-editor-collection-header">
        <div><h3>{title}</h3>{description ? <p>{description}</p> : null}</div>
        {itemCount > 0 ? <AdminButton ref={addButtonRef} icon="plus" onClick={addItem}>{copy.addLabel}</AdminButton> : null}
      </header>
      <AdminLiveRegion className="admin-editor-reorder-announcer">{announcement}</AdminLiveRegion>
      {itemCount === 0 ? (
        <StatePanel kind="empty" title={copy.emptyTitle} description={copy.emptyDescription} actionLabel={copy.addLabel} onAction={addItem} />
      ) : (
        <ol className="admin-editor-collection-list">
          {Array.from({ length: itemCount }, (_, index) => {
            const position = index + 1;
            return (
              <li key={index} className="admin-editor-collection-item" data-editor-item-index={index}>
                <div className="admin-editor-collection-item-header">
                  <h4>{copy.itemLabel(position, itemCount)}</h4>
                  <div className="admin-editor-collection-actions">
                    {onMove === undefined ? null : <>
                      <AdminIconButton className="admin-editor-move-up" data-editor-action="move-up" icon="arrowDown" label={copy.moveUpLabel(position)} disabled={index === 0} onClick={() => moveItem(index, index - 1)} />
                      <AdminIconButton data-editor-action="move-down" icon="arrowDown" label={copy.moveDownLabel(position)} disabled={index === itemCount - 1} onClick={() => moveItem(index, index + 1)} />
                    </>}
                    <AdminIconButton data-editor-action="remove" icon="trash" label={copy.removeLabel(position)} onClick={(event) => requestRemoval(index, event.currentTarget)} />
                  </div>
                </div>
                <div className="admin-editor-collection-item-content">{renderItem(index)}</div>
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
