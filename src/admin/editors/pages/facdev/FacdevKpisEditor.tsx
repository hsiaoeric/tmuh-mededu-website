import type { StructuredEditorCommitResult } from '@/admin/editors/shared';
import { insertPaired, movePaired, removePaired, updatePaired, type PairedCollectionResult, type PairedRows } from '@/admin/editors/global/pairedCollections';
import { EditorCollection, type EditorCollectionCopy } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { FacdevKpiFields } from './FacdevKpiFields';
import type { FacdevCommit, FacdevIssues, FacdevKpi, FacdevPayload } from './types';

const COPY: EditorCollectionCopy = {
  addLabel: '新增 KPI', emptyTitle: '尚無 KPI', emptyDescription: '新增第一組雙語 KPI。',
  itemLabel: (position, total) => `KPI ${position}，共 ${total} 組`,
  moveUpLabel: (position) => `上移第 ${position} 個 KPI`, moveDownLabel: (position) => `下移第 ${position} 個 KPI`,
  removeLabel: (position) => `刪除第 ${position} 個 KPI`, removeTitle: (position) => `刪除第 ${position} 個 KPI？`,
  removeDescription: '繁體中文與英文資料會一起刪除。', removeBody: '確認後將移除此組 KPI。',
  confirmRemoveLabel: '確認刪除', cancelRemoveLabel: '保留 KPI',
  movedAnnouncement: (from, to, total) => `已將第 ${from} 個 KPI 移至第 ${to} 個，共 ${total} 個。`,
};

const NEW_ROWS: PairedRows<FacdevKpi> = {
  zh: { num: 0, suffix: '', label: '新 KPI', en: 'New KPI' },
  en: { num: 0, suffix: '', label: 'New KPI', en: 'New KPI' },
};

export function FacdevKpisEditor({ payload, issues, onChange }: { readonly payload: FacdevPayload; readonly issues: FacdevIssues; readonly onChange: FacdevCommit }) {
  const collection = { zh: payload.zh.kpis, en: payload.en.kpis };
  const commit = (result: PairedCollectionResult<FacdevKpi>): StructuredEditorCommitResult => result.ok
    ? onChange({ ...payload, zh: { ...payload.zh, kpis: result.collection.zh }, en: { ...payload.en, kpis: result.collection.en } })
    : { status: 'unchanged' };
  return <EditorSection id="facdev-kpis" title="關鍵數據" description="新增、移動與刪除會同步套用至兩個語系。">
    <EditorCollection id="kpis" title="KPI 列表" itemCount={Math.max(collection.zh.length, collection.en.length)} revisionKeys={[collection.zh, collection.en]} copy={COPY}
      onAdd={() => commit(insertPaired(collection, { index: collection.zh.length, rows: NEW_ROWS }))}
      onMove={(fromIndex, toIndex) => commit(movePaired(collection, { fromIndex, toIndex }))}
      onRemove={(index) => commit(removePaired(collection, { index }))}
      renderItem={(index) => {
        const zh = collection.zh[index]; const en = collection.en[index];
        return zh === undefined || en === undefined ? null : <FacdevKpiFields index={index} rows={{ zh, en }} issues={issues} onChange={(rows) => commit(updatePaired(collection, { index, rows }))} />;
      }}
    />
  </EditorSection>;
}
