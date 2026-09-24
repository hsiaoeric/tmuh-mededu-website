import type { StructuredEditorCommitResult } from '@/admin/editors/shared';
import { insertPaired, movePaired, nextCollectionId, removePaired, updatePaired, type PairedCollectionResult } from '@/admin/editors/global/pairedCollections';
import { EditorCollection, type EditorCollectionCopy } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { FacdevGroupFields } from './FacdevGroupFields';
import type { FacdevCommit, FacdevGroup, FacdevIssues, FacdevLead, FacdevPayload } from './types';

const COPY: EditorCollectionCopy = {
  addLabel: '新增培育小組', emptyTitle: '尚無培育小組', emptyDescription: '新增第一組雙語培育小組與負責人。',
  itemLabel: (position, total) => `培育小組 ${position}，共 ${total} 組`,
  moveUpLabel: (position) => `上移第 ${position} 個培育小組`, moveDownLabel: (position) => `下移第 ${position} 個培育小組`,
  removeLabel: (position) => `刪除第 ${position} 個培育小組`, removeTitle: (position) => `刪除第 ${position} 個培育小組？`,
  removeDescription: '繁體中文與英文小組及負責人會一起刪除。', removeBody: '照片檔案不會由此操作刪除。',
  confirmRemoveLabel: '確認刪除', cancelRemoveLabel: '保留培育小組',
  movedAnnouncement: (from, to, total) => `已將第 ${from} 個培育小組移至第 ${to} 個，共 ${total} 個。`,
};

const EMPTY_LEAD: FacdevLead = { id: 'new-facdev-lead', name: '', alternateName: '', roleKey: '', role: '', department: '', slug: '', hubId: '', duty: '', ext: '', email: '' };

export function FacdevGroupsEditor({ payload, issues, onChange }: { readonly payload: FacdevPayload; readonly issues: FacdevIssues; readonly onChange: FacdevCommit }) {
  const collection = { zh: payload.zh.groups, en: payload.en.groups };
  const commit = (result: PairedCollectionResult<FacdevGroup>): StructuredEditorCommitResult => result.ok
    ? onChange({ ...payload, zh: { ...payload.zh, groups: result.collection.zh }, en: { ...payload.en, groups: result.collection.en } })
    : { status: 'unchanged' };
  return <EditorSection id="facdev-groups" title="培育小組" description="負責人照片僅顯示狀態，媒體工作區仍是唯一照片編輯入口。">
    <EditorCollection id="groups" title="培育小組列表" itemCount={Math.max(collection.zh.length, collection.en.length)} revisionKeys={[collection.zh, collection.en]} copy={COPY}
      onAdd={() => {
        const id = nextCollectionId('new-facdev-lead', [
          ...collection.zh.map((group) => group.lead.id),
          ...collection.en.map((group) => group.lead.id),
        ]);
        const lead = { ...EMPTY_LEAD, id };
        return commit(insertPaired(collection, {
          index: collection.zh.length,
          rows: {
            zh: { name: '新培育小組', desc: '', lead },
            en: { name: 'New cultivation group', desc: '', lead },
          },
        }));
      }}
      onMove={(fromIndex, toIndex) => commit(movePaired(collection, { fromIndex, toIndex }))}
      onRemove={(index) => commit(removePaired(collection, { index }))}
      renderItem={(index) => {
        const zh = collection.zh[index]; const en = collection.en[index];
        return zh === undefined || en === undefined ? null : <FacdevGroupFields index={index} rows={{ zh, en }} issues={issues} onChange={(rows) => commit(updatePaired(collection, { index, rows }))} />;
      }}
    />
  </EditorSection>;
}
