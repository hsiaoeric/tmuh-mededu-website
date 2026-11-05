import { useLayoutEffect, useRef, useState } from 'react';
import { AdminButton, AdminIconButton } from '@/admin/AdminButton';
import { AdminLiveRegion, StatusBadge } from '@/admin/AdminFeedback';
import { AdminSelect } from '@/admin/AdminFields';
import { ConfirmDialog } from '@/admin/AdminOverlays';
import { fieldIdForStructuredEditorIssuePath, isStructuredEditorCommitAccepted } from '@/admin/editors/shared';
import { useFieldDecorations } from '@/admin/fieldDecorations';
import { BLOCK_LIMITS, type BlockType } from '@/content/contracts/blocks';
import type { ArchiveCommitResult, ArchiveIssues, EditableBlock, EditableLocalizedBlocks, JsonPath } from '../archiveTypes';
import { blockLabel, untranslatedLabel } from '../copy';
import { issueFor, issuesWithin, useIsZh } from '../fields';
import { setOptionalEnglishBlocks } from '../localizedValue';
import { ArchiveMediaField } from '../media/ArchiveMediaField';
import type { ArchiveMediaSlotKind } from '../media/archiveMediaSlots';
import { BlockFields } from './BlockFields';
import {
  TEXT_BLOCK_TYPES,
  blockText,
  convertBlock,
  createBlock,
  createImageBlock,
  insertAt,
  moveItem,
  removeAt,
  replaceAt,
  type CreatableBlockType,
} from './blockModel';

type Locale = 'zh' | 'en';
type Pair = { readonly zh: string; readonly en: string };

export type BlockListEditorProps = {
  /** JSON path of the `{ zh, en? }` blocks object. */
  readonly path: JsonPath;
  readonly label: Pair;
  readonly value: EditableLocalizedBlocks;
  readonly issues: ArchiveIssues;
  readonly imageSlotKind: ArchiveMediaSlotKind;
  readonly onChange: (value: EditableLocalizedBlocks) => ArchiveCommitResult;
};

type FocusRequest = { readonly index: number; readonly target: 'move-up' | 'move-down' | 'remove' | 'content' } | { readonly index: -1; readonly target: 'add' };

const ALL_ADDABLE: readonly BlockType[] = [...TEXT_BLOCK_TYPES.slice(0, 3), 'image', ...TEXT_BLOCK_TYPES.slice(3)];
const FOCUSABLE = 'textarea:not(:disabled), input:not(:disabled), select:not(:disabled), button:not(:disabled)';

function summaryOf(block: EditableBlock): string {
  const text = blockText(block).replace(/\s+/gu, ' ').trim();
  return text.length > 48 ? `${text.slice(0, 47)}…` : text;
}

type LocaleBlockListProps = {
  readonly path: JsonPath;
  readonly locale: Locale;
  readonly title: string;
  readonly blocks: readonly EditableBlock[];
  readonly issues: ArchiveIssues;
  readonly imageSlotKind: ArchiveMediaSlotKind;
  readonly onChange: (blocks: readonly EditableBlock[]) => ArchiveCommitResult;
};

function LocaleBlockList({ path, locale, title, blocks, issues, imageSlotKind, onChange }: LocaleBlockListProps) {
  const isZh = useIsZh();
  const decorations = useFieldDecorations();
  const rootRef = useRef<HTMLDivElement>(null);
  const removeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [removal, setRemoval] = useState<{ readonly index: number; readonly blocks: readonly EditableBlock[] } | null>(null);
  const [addType, setAddType] = useState<BlockType>('paragraph');
  const [addPosition, setAddPosition] = useState<number | 'end'>('end');
  const [pendingImageAt, setPendingImageAt] = useState<number | null>(null);
  const lang = locale === 'zh' ? 'zh-Hant' : 'en';
  const listPath = [...path, locale];
  const name = (index: number) => (isZh ? `${title}區塊 ${index + 1}` : `${title} block ${index + 1}`);
  const full = blocks.length >= BLOCK_LIMITS.blocksPerLocale;

  useLayoutEffect(() => {
    if (focusRequest === null) return;
    setFocusRequest(null);
    const root = rootRef.current;
    if (root === null) return;
    if (focusRequest.target === 'add') {
      root.querySelector<HTMLElement>('[data-block-add]')?.focus();
      return;
    }
    const item = root.querySelector<HTMLElement>(`:scope > .admin-editor-collection-list > [data-block-index="${focusRequest.index}"]`);
    const target = focusRequest.target === 'content'
      ? item?.querySelector<HTMLElement>(`.admin-archive-block-content ${FOCUSABLE}`)
      : item?.querySelector<HTMLElement>(`[data-block-action="${focusRequest.target}"]`);
    target?.focus();
  }, [focusRequest]);

  const commit = (next: readonly EditableBlock[], focus?: FocusRequest) => {
    const result = onChange(next);
    if (isStructuredEditorCommitAccepted(result) && focus !== undefined) setFocusRequest(focus);
    return result;
  };
  const move = (from: number, to: number) => {
    if (!isStructuredEditorCommitAccepted(commit(moveItem(blocks, from, to), { index: to, target: to < from ? 'move-up' : 'move-down' }))) return;
    setAnnouncement(isZh ? `已將區塊 ${from + 1} 移至第 ${to + 1} 個，共 ${blocks.length} 個。` : `Moved block ${from + 1} to position ${to + 1} of ${blocks.length}.`);
  };
  const insertionIndex = addPosition === 'end' ? blocks.length : Math.min(addPosition + 1, blocks.length);
  const add = () => {
    if (addType === 'image') {
      setPendingImageAt(insertionIndex);
      return;
    }
    commit(insertAt(blocks, insertionIndex, createBlock(addType as CreatableBlockType)), { index: insertionIndex, target: 'content' });
    setAddPosition('end');
  };
  const confirmRemoval = () => {
    if (removal === null) return;
    setRemoval(null);
    if (removal.blocks !== blocks) return;
    const remaining = blocks.length - 1;
    commit(removeAt(blocks, removal.index), remaining === 0 ? { index: -1, target: 'add' } : { index: Math.min(removal.index, remaining - 1), target: 'remove' });
  };
  const requestRemoval = (index: number, trigger: HTMLButtonElement) => {
    const block = blocks[index];
    if (block === undefined) return;
    if (blockText(block) === '' && block.type !== 'image') {
      const remaining = blocks.length - 1;
      commit(removeAt(blocks, index), remaining === 0 ? { index: -1, target: 'add' } : { index: Math.min(index, remaining - 1), target: 'remove' });
      return;
    }
    removeTriggerRef.current = trigger;
    setRemoval({ index, blocks });
  };

  return (
    <div ref={rootRef} className="admin-editor-collection admin-archive-blocks" data-editor-collection={fieldIdForStructuredEditorIssuePath(listPath)} lang={lang}>
      <header className="admin-editor-collection-header">
        <div>
          <h3>{title}</h3>
          <p>{isZh ? `${blocks.length} 個區塊` : `${blocks.length} block${blocks.length === 1 ? '' : 's'}`}</p>
        </div>
      </header>
      <AdminLiveRegion className="admin-editor-reorder-announcer">{announcement}</AdminLiveRegion>
      {issueFor(listPath, issues) === undefined ? null : <p className="admin-field-message admin-field-error" role="alert">{issueFor(listPath, issues)}</p>}
      {blocks.length === 0 ? (
        <p className="admin-field-message admin-archive-empty">{isZh ? '尚無內文區塊。只有附件的文章可以留白。' : 'No body blocks yet. A post with only attachments may leave this empty.'}</p>
      ) : (
        <ol className="admin-editor-collection-list">
          {blocks.map((block, index) => {
            const blockPath = [...listPath, index];
            const label = name(index);
            const blockIssues = issuesWithin(blockPath, issues);
            const changed = decorations?.isChanged?.(fieldIdForStructuredEditorIssuePath(blockPath)) === true;
            return (
              // Blocks have no identity of their own; position is the only key there is.
              <li key={index} className="admin-editor-collection-item admin-archive-block" data-editor-item-index={index} data-block-index={index} data-block-type={block.type} data-changed-block={changed || undefined}>
                <div className="admin-archive-block-header">
                  <h4>
                    <span>{label}</span>
                    <small className="admin-archive-block-type">{blockLabel(block.type, isZh)}</small>
                    {blockIssues.length > 0 ? <StatusBadge status="error">{isZh ? `${blockIssues.length} 個問題` : `${blockIssues.length} issue${blockIssues.length === 1 ? '' : 's'}`}</StatusBadge> : null}
                  </h4>
                  <div className="admin-editor-collection-actions">
                    {block.type === 'image' ? null : (
                      <AdminSelect
                        className="admin-archive-block-convert"
                        label={isZh ? `${label}：類型` : `${label}: type`}
                        value={block.type}
                        options={TEXT_BLOCK_TYPES.map((type) => ({ value: type, label: blockLabel(type, isZh) }))}
                        onChange={(event) => commit(replaceAt(blocks, index, convertBlock(block, event.currentTarget.value as CreatableBlockType)))}
                      />
                    )}
                    <AdminIconButton className="admin-editor-move-up" data-block-action="move-up" icon="arrowDown" label={isZh ? `上移${label}` : `Move ${label} up`} disabled={index === 0} onClick={() => move(index, index - 1)} />
                    <AdminIconButton data-block-action="move-down" icon="arrowDown" label={isZh ? `下移${label}` : `Move ${label} down`} disabled={index === blocks.length - 1} onClick={() => move(index, index + 1)} />
                    <AdminIconButton data-block-action="remove" icon="trash" label={isZh ? `刪除${label}` : `Delete ${label}`} onClick={(event) => requestRemoval(index, event.currentTarget)} />
                  </div>
                </div>
                <div className="admin-archive-block-content">
                  <BlockFields path={blockPath} label={label} block={block} issues={issues} lang={lang} imageSlotKind={imageSlotKind} onChange={(next) => commit(replaceAt(blocks, index, next))} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {pendingImageAt === null ? null : (
        <ArchiveMediaField
          pending
          slot={{ slotKind: imageSlotKind, path: [...listPath, pendingImageAt, 'media'], reference: null, required: true }}
          label={isZh ? `新圖片區塊（第 ${pendingImageAt + 1} 個）` : `New image block (position ${pendingImageAt + 1})`}
          issues={issues}
          onCancel={() => { setPendingImageAt(null); setFocusRequest({ index: -1, target: 'add' }); }}
          onChange={(media, meta) => {
            if (media === null) return { status: 'unchanged' };
            const result = commit(insertAt(blocks, pendingImageAt, createImageBlock(media, meta)), { index: pendingImageAt, target: 'content' });
            if (isStructuredEditorCommitAccepted(result)) {
              setPendingImageAt(null);
              setAddPosition('end');
            }
            return result;
          }}
        />
      )}
      <div className="admin-archive-block-add" role="group" aria-label={isZh ? `新增${title}區塊` : `Add a ${title} block`}>
        <AdminSelect
          label={isZh ? '區塊類型' : 'Block type'}
          value={addType}
          options={ALL_ADDABLE.map((type) => ({ value: type, label: blockLabel(type, isZh) }))}
          onChange={(event) => setAddType(event.currentTarget.value as BlockType)}
        />
        <AdminSelect
          label={isZh ? '位置' : 'Position'}
          value={String(addPosition)}
          options={[
            { value: 'end', label: isZh ? '最後面' : 'At the end' },
            ...blocks.map((block, index) => ({ value: String(index), label: isZh ? `區塊 ${index + 1} 之後${summaryOf(block) === '' ? '' : `（${summaryOf(block)}）`}` : `After block ${index + 1}${summaryOf(block) === '' ? '' : ` (${summaryOf(block)})`}` })),
          ]}
          onChange={(event) => setAddPosition(event.currentTarget.value === 'end' ? 'end' : Number(event.currentTarget.value))}
        />
        <AdminButton data-block-add icon="plus" disabled={full} onClick={add}>{isZh ? '新增區塊' : 'Add block'}</AdminButton>
      </div>
      {removal === null ? null : (
        <ConfirmDialog
          open
          warning
          title={isZh ? `刪除${name(removal.index)}？` : `Delete ${name(removal.index)}?`}
          description={isZh ? '只會刪除這個區塊。' : 'Only this block is deleted.'}
          body={isZh ? '儲存草稿前都可以用「復原」還原。' : 'You can still undo this before saving the draft.'}
          confirmLabel={isZh ? '確認刪除' : 'Delete'}
          cancelLabel={isZh ? '保留' : 'Keep'}
          closeLabel={isZh ? '關閉對話框' : 'Close dialog'}
          triggerRef={removeTriggerRef}
          onClose={() => setRemoval(null)}
          onConfirm={confirmRemoval}
        />
      )}
    </div>
  );
}

/**
 * A post or page body: Chinese blocks, and English blocks once someone adds a translation.
 * Removing the English body deletes the `en` key, which the site reads as "show the Chinese".
 */
export function BlockListEditor({ path, label, value, issues, imageSlotKind, onChange }: BlockListEditorProps) {
  const isZh = useIsZh();
  const [englishOpen, setEnglishOpen] = useState(value.en !== undefined);
  const [confirmRemoveEnglish, setConfirmRemoveEnglish] = useState(false);
  const removeEnglishRef = useRef<HTMLButtonElement>(null);
  const showEnglish = englishOpen || value.en !== undefined;
  const name = isZh ? label.zh : label.en;
  const untranslated = value.zh.length > 0 && value.en === undefined;
  return (
    <div className="admin-archive-body" data-english={showEnglish ? 'open' : 'closed'}>
      <LocaleBlockList
        path={path}
        locale="zh"
        title={isZh ? `${name}（中文）` : `${name} (Chinese)`}
        blocks={value.zh}
        issues={issues}
        imageSlotKind={imageSlotKind}
        onChange={(zh) => onChange({ ...value, zh })}
      />
      {showEnglish ? (
        <>
          <LocaleBlockList
            path={path}
            locale="en"
            title={isZh ? `${name}（英文）` : `${name} (English)`}
            blocks={value.en ?? []}
            issues={issues}
            imageSlotKind={imageSlotKind}
            onChange={(en) => onChange(setOptionalEnglishBlocks(value, en))}
          />
          <div className="admin-cluster admin-archive-english-tools">
            {value.en === undefined ? <span className="admin-field-message">{isZh ? '英文內文留白時，網站顯示中文內文。' : 'While the English body is empty, the site shows the Chinese body.'}</span> : null}
            <AdminButton ref={removeEnglishRef} variant="quiet" icon="close" onClick={() => {
              if (value.en === undefined) { setEnglishOpen(false); return; }
              setConfirmRemoveEnglish(true);
            }}>
              {isZh ? '移除英文內文' : 'Remove English body'}
            </AdminButton>
          </div>
        </>
      ) : (
        <div className="admin-localized-missing admin-archive-english-tools">
          {untranslated ? <StatusBadge status="warning">{untranslatedLabel(isZh)}</StatusBadge> : null}
          <span className="admin-field-message">{isZh ? '未加入英文內文時，網站以中文顯示。' : 'Without an English body, the site shows the Chinese one.'}</span>
          <AdminButton variant="quiet" icon="plus" onClick={() => setEnglishOpen(true)}>{isZh ? '加入英文內文' : 'Add English body'}</AdminButton>
          {value.zh.length > 0 ? (
            <AdminButton variant="quiet" onClick={() => { setEnglishOpen(true); onChange(setOptionalEnglishBlocks(value, value.zh)); }}>
              {isZh ? '以中文內文為底稿翻譯' : 'Start from the Chinese body'}
            </AdminButton>
          ) : null}
        </div>
      )}
      <ConfirmDialog
        open={confirmRemoveEnglish}
        warning
        title={isZh ? '移除英文內文？' : 'Remove the English body?'}
        description={isZh ? '英文區塊會全部刪除，網站改為顯示中文內文。' : 'Every English block is deleted and the site shows the Chinese body instead.'}
        body={isZh ? '儲存草稿前都可以用「復原」還原。' : 'You can still undo this before saving the draft.'}
        confirmLabel={isZh ? '移除英文' : 'Remove English'}
        cancelLabel={isZh ? '保留' : 'Keep'}
        closeLabel={isZh ? '關閉對話框' : 'Close dialog'}
        triggerRef={removeEnglishRef}
        onClose={() => setConfirmRemoveEnglish(false)}
        onConfirm={() => {
          setConfirmRemoveEnglish(false);
          setEnglishOpen(false);
          onChange(setOptionalEnglishBlocks(value, undefined));
        }}
      />
    </div>
  );
}
