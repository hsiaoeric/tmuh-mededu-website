import { useMemo } from 'react';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { useFieldDecorations } from '@/admin/fieldDecorations';
import { LINK_GROUP_PURPOSES } from '@/content/contracts/archiveIds';
import { ArchiveRecordList } from '../ArchiveRecordList';
import type {
  ArchiveCommit,
  ArchiveCommitResult,
  ArchiveIssues,
  EditableDepartmentInfoPayload,
  EditableDownloadGroup,
  EditableLinkGroup,
} from '../archiveTypes';
import { insertAt, moveItem, removeAt, replaceAt } from '../blocks/blockModel';
import { collectionCopy, NOUNS, ownerLabel, purposeLabel } from '../copy';
import { DateField, FieldGrid, HrefField, IdField, OrderField, SelectField, useIsZh } from '../fields';
import { nextSequencedId } from '../ids';
import type { IdLock } from '../lockedIds';
import { LocalizedTextField } from '../LocalizedTextField';
import { withOptional } from '../localizedValue';
import { audienceOwnerOptions, byOrder, recordRow } from '../recordRows';
import { createDownloadGroup, createLinkGroup } from './departmentModel';

type SectionProps = {
  readonly payload: EditableDepartmentInfoPayload;
  readonly issues: ArchiveIssues;
  readonly onChange: ArchiveCommit<EditableDepartmentInfoPayload>;
  readonly lock: IdLock;
  readonly expanded: number | null;
  readonly onExpandedChange: (index: number | null) => void;
};

function LinkGroupFields({ index, group, otherIds, idLocked, issues, onChange }: {
  readonly index: number;
  readonly group: EditableLinkGroup;
  readonly otherIds: readonly string[];
  readonly idLocked: boolean;
  readonly issues: ArchiveIssues;
  readonly onChange: (group: EditableLinkGroup) => ArchiveCommitResult;
}) {
  const isZh = useIsZh();
  const path = ['linkGroups', index] as const;
  const noun = isZh ? NOUNS.link.zh : NOUNS.link.en;
  const links = group.links;
  return (
    <div className="admin-stack">
      <FieldGrid>
        <IdField path={[...path, 'id']} issues={issues} label={isZh ? '群組識別碼' : 'Group id'} value={group.id} locked={idLocked} others={otherIds} onChange={(id) => onChange({ ...group, id })} />
        <SelectField path={[...path, 'owner']} issues={issues} label={isZh ? '所屬單位' : 'Owner'} value={group.owner} options={audienceOwnerOptions(isZh)} onChange={(owner) => onChange({ ...group, owner })} />
        <SelectField path={[...path, 'purpose']} issues={issues} label={isZh ? '用途' : 'Purpose'} value={group.purpose} options={LINK_GROUP_PURPOSES.map((purpose) => ({ value: purpose, label: purposeLabel(purpose, isZh) }))} onChange={(purpose) => onChange({ ...group, purpose })} />
        <OrderField path={[...path, 'order']} issues={issues} label={isZh ? '順序' : 'Order'} value={group.order} onChange={(order) => onChange({ ...group, order })} />
      </FieldGrid>
      <LocalizedTextField path={[...path, 'title']} label={{ zh: '群組名稱', en: 'Group title' }} required value={group.title} issues={issues} onChange={(title) => onChange({ ...group, title: title ?? { zh: '' } })} />
      <EditorCollection
        id={`archive-link-group-${index}-links`}
        title={isZh ? '連結' : 'Links'}
        itemCount={links.length}
        revisionKeys={[links]}
        copy={collectionCopy(NOUNS.link, isZh)}
        onAdd={() => onChange({ ...group, links: insertAt(links, links.length, { id: nextSequencedId(group.id, links.map((link) => link.id)), label: { zh: '' }, href: '' }) })}
        onMove={(from, to) => onChange({ ...group, links: moveItem(links, from, to) })}
        onRemove={(position) => onChange({ ...group, links: removeAt(links, position) })}
        renderItem={(position) => {
          const link = links[position];
          if (link === undefined) return null;
          const update = (next: typeof link) => onChange({ ...group, links: replaceAt(links, position, next) });
          const linkPath = [...path, 'links', position];
          return (
            <div className="admin-stack">
              <LocalizedTextField path={[...linkPath, 'label']} label={isZh ? `${noun} ${position + 1} 名稱` : `${noun} ${position + 1} label`} required value={link.label} issues={issues} onChange={(label) => update({ ...link, label: label ?? { zh: '' } })} />
              <HrefField path={[...linkPath, 'href']} issues={issues} label={isZh ? `${noun} ${position + 1} 網址` : `${noun} ${position + 1} URL`} allowFile={false} value={link.href} onChange={(href) => update({ ...link, href })} />
              <LocalizedTextField path={[...linkPath, 'description']} label={isZh ? `${noun} ${position + 1} 說明（選填）` : `${noun} ${position + 1} description (optional)`} optional value={link.description} issues={issues} onChange={(description) => update(withOptional(link, 'description', description))} />
            </div>
          );
        }}
      />
    </div>
  );
}

/** Related links, common information, and system entry points, grouped by owner. */
export function LinkGroupsSection({ payload, issues, onChange, lock, expanded, onExpandedChange }: SectionProps) {
  const isZh = useIsZh();
  const decorations = useFieldDecorations();
  const rows = useMemo(() => byOrder(payload.linkGroups).map((index) => {
    const group = payload.linkGroups[index]!;
    return recordRow({
      collection: 'linkGroups',
      index,
      title: group.title,
      meta: [purposeLabel(group.purpose, isZh), ownerLabel(group.owner, isZh), isZh ? `${group.links.length} 個連結` : `${group.links.length} link${group.links.length === 1 ? '' : 's'}`],
    }, { isZh, issues, decorations });
  }), [decorations, isZh, issues, payload.linkGroups]);
  return (
    <EditorSection id="department-links" title={isZh ? '相關連結' : 'Links'} description={isZh ? '相關連結、各計畫常用資訊與系統入口。' : 'Related links, each program’s common information, and system entry points.'}>
      <ArchiveRecordList
        id="department-links-list"
        title={isZh ? '連結群組' : 'Link groups'}
        rows={rows}
        totalCount={payload.linkGroups.length}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        itemNoun={isZh ? NOUNS.linkGroup.zh : NOUNS.linkGroup.en}
        emptyTitle={isZh ? '尚無連結群組' : 'No link groups yet'}
        emptyDescription={isZh ? '新增第一個連結群組。' : 'Add the first link group.'}
        addLabel={isZh ? '新增連結群組' : 'Add link group'}
        onAdd={() => {
          const group = createLinkGroup(payload);
          if (onChange({ ...payload, linkGroups: [...payload.linkGroups, group] }).status !== 'emitted') return null;
          lock.markCreated(group.id);
          return payload.linkGroups.length;
        }}
        removal={{
          title: (row) => (isZh ? `刪除連結群組「${row.title || '未命名'}」？` : `Delete link group “${row.title || 'Untitled'}”?`),
          description: () => (isZh ? '群組內的所有連結會一併刪除。' : 'Every link in the group is deleted with it.'),
          onRemove: (index) => onChange({ ...payload, linkGroups: removeAt(payload.linkGroups, index) }),
        }}
        renderItem={(index) => {
          const group = payload.linkGroups[index];
          if (group === undefined) return null;
          return (
            <LinkGroupFields
              index={index}
              group={group}
              otherIds={payload.linkGroups.flatMap((candidate, position) => (position === index ? [] : [candidate.id]))}
              idLocked={lock.isLocked(group.id)}
              issues={issues}
              onChange={(next) => {
                if (next.id !== group.id) lock.markCreated(next.id);
                return onChange({ ...payload, linkGroups: replaceAt(payload.linkGroups, index, next) });
              }}
            />
          );
        }}
      />
    </EditorSection>
  );
}

function DownloadGroupFields({ index, group, otherIds, idLocked, issues, onChange }: {
  readonly index: number;
  readonly group: EditableDownloadGroup;
  readonly otherIds: readonly string[];
  readonly idLocked: boolean;
  readonly issues: ArchiveIssues;
  readonly onChange: (group: EditableDownloadGroup) => ArchiveCommitResult;
}) {
  const isZh = useIsZh();
  const path = ['downloads', index] as const;
  const noun = isZh ? NOUNS.downloadItem.zh : NOUNS.downloadItem.en;
  const items = group.items;
  return (
    <div className="admin-stack">
      <FieldGrid>
        <IdField path={[...path, 'id']} issues={issues} label={isZh ? '群組識別碼' : 'Group id'} value={group.id} locked={idLocked} others={otherIds} onChange={(id) => onChange({ ...group, id })} />
        <SelectField path={[...path, 'owner']} issues={issues} label={isZh ? '所屬單位' : 'Owner'} value={group.owner} options={audienceOwnerOptions(isZh)} onChange={(owner) => onChange({ ...group, owner })} />
      </FieldGrid>
      <LocalizedTextField path={[...path, 'title']} label={{ zh: '群組名稱', en: 'Group title' }} required value={group.title} issues={issues} onChange={(title) => onChange({ ...group, title: title ?? { zh: '' } })} />
      <EditorCollection
        id={`archive-download-group-${index}-items`}
        title={isZh ? '檔案' : 'Files'}
        itemCount={items.length}
        revisionKeys={[items]}
        copy={collectionCopy(NOUNS.downloadItem, isZh)}
        onAdd={() => onChange({ ...group, items: insertAt(items, items.length, { id: nextSequencedId(group.id, items.map((item) => item.id)), label: { zh: '' }, href: '' }) })}
        onMove={(from, to) => onChange({ ...group, items: moveItem(items, from, to) })}
        onRemove={(position) => onChange({ ...group, items: removeAt(items, position) })}
        renderItem={(position) => {
          const item = items[position];
          if (item === undefined) return null;
          const update = (next: typeof item) => onChange({ ...group, items: replaceAt(items, position, next) });
          const itemPath = [...path, 'items', position];
          return (
            <div className="admin-stack">
              <LocalizedTextField path={[...itemPath, 'label']} label={isZh ? `${noun} ${position + 1} 名稱` : `${noun} ${position + 1} label`} required value={item.label} issues={issues} onChange={(label) => update({ ...item, label: label ?? { zh: '' } })} />
              <FieldGrid>
                <HrefField path={[...itemPath, 'href']} issues={issues} label={isZh ? `${noun} ${position + 1} 連結` : `${noun} ${position + 1} link`} allowFile value={item.href} onChange={(href) => update({ ...item, href })} />
                <DateField path={[...itemPath, 'publishedOn']} issues={issues} label={isZh ? `${noun} ${position + 1} 日期（選填）` : `${noun} ${position + 1} date (optional)`} value={item.publishedOn} onChange={(publishedOn) => update(withOptional(item, 'publishedOn', publishedOn))} />
              </FieldGrid>
            </div>
          );
        }}
      />
    </div>
  );
}

/** Downloadable forms and documents, grouped by owner. */
export function DownloadsSection({ payload, issues, onChange, lock, expanded, onExpandedChange }: SectionProps) {
  const isZh = useIsZh();
  const decorations = useFieldDecorations();
  const rows = useMemo(() => payload.downloads.map((group, index) => recordRow({
    collection: 'downloads',
    index,
    title: group.title,
    meta: [ownerLabel(group.owner, isZh), isZh ? `${group.items.length} 個檔案` : `${group.items.length} file${group.items.length === 1 ? '' : 's'}`],
  }, { isZh, issues, decorations })), [decorations, isZh, issues, payload.downloads]);
  return (
    <EditorSection id="department-downloads" title={isZh ? '下載資源' : 'Downloads'} description={isZh ? '資源專區的表單與文件。' : 'Forms and documents in the downloads area.'}>
      <ArchiveRecordList
        id="department-downloads-list"
        title={isZh ? '下載群組' : 'Download groups'}
        rows={rows}
        totalCount={payload.downloads.length}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        itemNoun={isZh ? NOUNS.download.zh : NOUNS.download.en}
        emptyTitle={isZh ? '尚無下載群組' : 'No download groups yet'}
        emptyDescription={isZh ? '新增第一個下載群組。' : 'Add the first download group.'}
        addLabel={isZh ? '新增下載群組' : 'Add download group'}
        onAdd={() => {
          const group = createDownloadGroup(payload);
          if (onChange({ ...payload, downloads: [...payload.downloads, group] }).status !== 'emitted') return null;
          lock.markCreated(group.id);
          return payload.downloads.length;
        }}
        removal={{
          title: (row) => (isZh ? `刪除下載群組「${row.title || '未命名'}」？` : `Delete download group “${row.title || 'Untitled'}”?`),
          description: () => (isZh ? '群組內的所有檔案連結會一併刪除；檔案本身不會刪除。' : 'Every file link in the group is deleted with it; the files themselves stay.'),
          onRemove: (index) => onChange({ ...payload, downloads: removeAt(payload.downloads, index) }),
        }}
        renderItem={(index) => {
          const group = payload.downloads[index];
          if (group === undefined) return null;
          return (
            <DownloadGroupFields
              index={index}
              group={group}
              otherIds={payload.downloads.flatMap((candidate, position) => (position === index ? [] : [candidate.id]))}
              idLocked={lock.isLocked(group.id)}
              issues={issues}
              onChange={(next) => {
                if (next.id !== group.id) lock.markCreated(next.id);
                return onChange({ ...payload, downloads: replaceAt(payload.downloads, index, next) });
              }}
            />
          );
        }}
      />
    </EditorSection>
  );
}
