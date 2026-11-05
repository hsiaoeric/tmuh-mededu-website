import { AdminButton, AdminIconButton } from '@/admin/AdminButton';
import { AdminCheckbox } from '@/admin/AdminFields';
import type { ArchiveCommitResult, ArchiveIssues, EditableBlock, JsonPath } from '../archiveTypes';
import { NOUNS } from '../copy';
import { SelectField, TextField, useIsZh } from '../fields';
import { withOptional } from '../localizedValue';
import { ArchiveMediaField } from '../media/ArchiveMediaField';
import type { ArchiveMediaSlotKind } from '../media/archiveMediaSlots';
import { YoutubeField } from '../YoutubeField';
import { emptyRun, insertAt, moveItem, removeAt, replaceAt } from './blockModel';
import { RunsEditor } from './RunsEditor';
import { TableBlockFields } from './TableBlockFields';

type BlockFieldsProps = {
  /** JSON path of the block. */
  readonly path: JsonPath;
  /** Names the block, such as "中文內文區塊 3". */
  readonly label: string;
  readonly block: EditableBlock;
  readonly issues: ArchiveIssues;
  readonly lang: string;
  readonly imageSlotKind: ArchiveMediaSlotKind;
  readonly onChange: (block: EditableBlock) => ArchiveCommitResult;
};

type ListBlock = Extract<EditableBlock, { readonly type: 'list' }>;

function ListFields({ path, label, block, issues, lang, onChange }: Omit<BlockFieldsProps, 'block' | 'imageSlotKind' | 'onChange'> & { readonly block: ListBlock; readonly onChange: (block: ListBlock) => ArchiveCommitResult }) {
  const isZh = useIsZh();
  const noun = isZh ? NOUNS.listItem.zh : NOUNS.listItem.en.toLowerCase();
  return (
    <div className="admin-archive-list-block">
      <AdminCheckbox
        switchControl
        checked={block.ordered}
        label={isZh ? '編號清單（1. 2. 3.）' : 'Numbered list (1. 2. 3.)'}
        onChange={(event) => onChange({ ...block, ordered: event.currentTarget.checked })}
      />
      <ol className="admin-archive-list-items">
        {block.items.map((item, index) => {
          const itemLabel = isZh ? `${label}，${noun} ${index + 1}` : `${label}, ${noun} ${index + 1}`;
          return (
            // List items are positional; there is no other identity.
            <li key={index} className="admin-archive-list-item" data-list-item-index={index}>
              <RunsEditor path={[...path, 'items', index]} label={itemLabel} runs={item} issues={issues} lang={lang} onChange={(runs) => onChange({ ...block, items: replaceAt(block.items, index, runs) })} />
              <div className="admin-archive-list-item-actions">
                <AdminIconButton className="admin-editor-move-up" icon="arrowDown" label={isZh ? `上移${itemLabel}` : `Move ${itemLabel} up`} disabled={index === 0} onClick={() => onChange({ ...block, items: moveItem(block.items, index, index - 1) })} />
                <AdminIconButton icon="arrowDown" label={isZh ? `下移${itemLabel}` : `Move ${itemLabel} down`} disabled={index === block.items.length - 1} onClick={() => onChange({ ...block, items: moveItem(block.items, index, index + 1) })} />
                <AdminIconButton icon="trash" label={isZh ? `刪除${itemLabel}` : `Delete ${itemLabel}`} disabled={block.items.length === 1} onClick={() => onChange({ ...block, items: removeAt(block.items, index) })} />
              </div>
            </li>
          );
        })}
      </ol>
      <AdminButton variant="quiet" icon="plus" onClick={() => onChange({ ...block, items: insertAt(block.items, block.items.length, [emptyRun()]) })}>
        {isZh ? '新增清單項目' : 'Add list item'}
      </AdminButton>
    </div>
  );
}

/** The fields of one body block, by type. */
export function BlockFields({ path, label, block, issues, lang, imageSlotKind, onChange }: BlockFieldsProps) {
  const isZh = useIsZh();
  switch (block.type) {
    case 'paragraph':
      return <RunsEditor path={[...path, 'runs']} label={label} runs={block.runs} issues={issues} lang={lang} onChange={(runs) => onChange({ ...block, runs })} />;
    case 'heading':
      return (
        <div className="admin-archive-heading-block">
          <SelectField
            path={[...path, 'level']}
            issues={issues}
            label={isZh ? '層級' : 'Level'}
            accessibleLabel={isZh ? `${label}：層級` : `${label}: level`}
            value={String(block.level)}
            options={[
              { value: '2', label: isZh ? '大標題（H2）' : 'Section heading (H2)' },
              { value: '3', label: isZh ? '小標題（H3）' : 'Subheading (H3)' },
            ]}
            onChange={(level) => onChange({ ...block, level: Number(level) })}
          />
          <TextField path={[...path, 'text']} issues={issues} label={isZh ? '文字' : 'Text'} accessibleLabel={isZh ? `${label}：文字` : `${label}: text`} required value={block.text} lang={lang} onChange={(text) => onChange({ ...block, text })} />
        </div>
      );
    case 'list':
      return <ListFields path={path} label={label} block={block} issues={issues} lang={lang} onChange={onChange} />;
    case 'image':
      return (
        <div className="admin-archive-image-block">
          <ArchiveMediaField
            slot={{ slotKind: imageSlotKind, path: [...path, 'media'], reference: block.media, required: true }}
            label={isZh ? `${label}：圖片` : `${label}: image`}
            altText={block.alt}
            issues={issues}
            onChange={(media, meta) => {
              if (media === null) return { status: 'unchanged' };
              const { width: _width, height: _height, ...rest } = block;
              return onChange({
                ...rest,
                media,
                ...(meta?.width === undefined ? {} : { width: meta.width }),
                ...(meta?.height === undefined ? {} : { height: meta.height }),
              });
            }}
          />
          <TextField
            path={[...path, 'alt']}
            issues={issues}
            label={isZh ? '替代文字' : 'Alt text'}
            accessibleLabel={isZh ? `${label}：替代文字` : `${label}: alt text`}
            helper={isZh ? '描述圖片內容，供螢幕報讀器與圖片無法載入時使用。海報請寫出主要資訊。' : 'Describe the image for screen readers and when it fails to load. For posters, give the key details.'}
            required
            value={block.alt}
            lang={lang}
            onChange={(alt) => onChange({ ...block, alt })}
          />
          <TextField
            path={[...path, 'caption']}
            issues={issues}
            label={isZh ? '圖說（選填）' : 'Caption (optional)'}
            accessibleLabel={isZh ? `${label}：圖說（選填）` : `${label}: caption (optional)`}
            value={block.caption ?? ''}
            lang={lang}
            onChange={(caption) => onChange(withOptional(block, 'caption', caption === '' ? undefined : caption))}
          />
          {block.width !== undefined && block.height !== undefined ? (
            <p className="admin-field-message mono">{`${block.width} × ${block.height} px`}</p>
          ) : null}
        </div>
      );
    case 'table':
      return <TableBlockFields path={path} label={label} block={block} issues={issues} lang={lang} onChange={onChange} />;
    case 'divider':
      return <p className="admin-field-message">{isZh ? '分隔線沒有可編輯的內容。' : 'A divider has nothing to edit.'}</p>;
    case 'video':
      return (
        <YoutubeField
          path={[...path, 'youtubeId']}
          label={isZh ? 'YouTube 網址或影片 ID' : 'YouTube link or id'}
          accessibleLabel={isZh ? `${label}：YouTube 網址或影片 ID` : `${label}: YouTube link or id`}
          value={block.youtubeId}
          issues={issues}
          onChange={(youtubeId) => onChange({ ...block, youtubeId })}
        />
      );
  }
}
