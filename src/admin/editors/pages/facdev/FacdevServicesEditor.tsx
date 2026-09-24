import type { StructuredEditorCommitResult } from '@/admin/editors/shared';
import { insertPaired, movePaired, removePaired, updatePaired, type PairedCollectionResult, type PairedRows } from '@/admin/editors/global/pairedCollections';
import { EditorCollection, type EditorCollectionCopy } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { FacdevServiceFields } from './FacdevServiceFields';
import type { FacdevCommit, FacdevIssues, FacdevPayload, FacdevService } from './types';

const COPY: EditorCollectionCopy = {
  addLabel: '新增核心服務', emptyTitle: '尚無核心服務', emptyDescription: '新增第一組雙語核心服務。',
  itemLabel: (position, total) => `核心服務 ${position}，共 ${total} 組`,
  moveUpLabel: (position) => `上移第 ${position} 個核心服務`, moveDownLabel: (position) => `下移第 ${position} 個核心服務`,
  removeLabel: (position) => `刪除第 ${position} 個核心服務`, removeTitle: (position) => `刪除第 ${position} 個核心服務？`,
  removeDescription: '繁體中文與英文資料會一起刪除。', removeBody: '確認後將移除此組核心服務。',
  confirmRemoveLabel: '確認刪除', cancelRemoveLabel: '保留核心服務',
  movedAnnouncement: (from, to, total) => `已將第 ${from} 個核心服務移至第 ${to} 個，共 ${total} 個。`,
};

const NEW_ROWS: PairedRows<FacdevService> = {
  zh: { title: '新核心服務', desc: '' },
  en: { title: 'New core service', desc: '' },
};

export function FacdevServicesEditor({ payload, issues, onChange }: { readonly payload: FacdevPayload; readonly issues: FacdevIssues; readonly onChange: FacdevCommit }) {
  const collection = { zh: payload.zh.services, en: payload.en.services };
  const commit = (result: PairedCollectionResult<FacdevService>): StructuredEditorCommitResult => result.ok
    ? onChange({ ...payload, zh: { ...payload.zh, services: result.collection.zh }, en: { ...payload.en, services: result.collection.en } })
    : { status: 'unchanged' };
  return <EditorSection id="facdev-services" title="核心服務">
    <EditorCollection id="services" title="核心服務列表" itemCount={Math.max(collection.zh.length, collection.en.length)} revisionKeys={[collection.zh, collection.en]} copy={COPY}
      onAdd={() => commit(insertPaired(collection, { index: collection.zh.length, rows: NEW_ROWS }))}
      onMove={(fromIndex, toIndex) => commit(movePaired(collection, { fromIndex, toIndex }))}
      onRemove={(index) => commit(removePaired(collection, { index }))}
      renderItem={(index) => {
        const zh = collection.zh[index]; const en = collection.en[index];
        return zh === undefined || en === undefined ? null : <FacdevServiceFields index={index} rows={{ zh, en }} issues={issues} onChange={(rows) => commit(updatePaired(collection, { index, rows }))} />;
      }}
    />
  </EditorSection>;
}
