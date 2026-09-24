import type { StructuredEditorCommitResult } from '@/admin/editors/shared';
import { insertPaired, movePaired, removePaired, updatePaired, type PairedCollectionResult, type PairedRows } from '@/admin/editors/global/pairedCollections';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { holisticCollectionCopy } from './collectionCopy';
import { PairedTextField } from './fieldPrimitives';
import { SymposiumPairFields } from './SymposiumPairFields';
import type { HolisticEditorProps, SymposiumRow } from './types';

const COPY = holisticCollectionCopy({ item: '研討會', empty: '研討會', paired: '研討會資料' });
const NEW_ROWS: PairedRows<SymposiumRow> = {
  zh: { dates: '2026/01/01（四）', edition: '', time: '09:00–12:00', title: '', year: 2026 },
  en: { dates: 'Thu 2026/01/01', edition: '', time: '09:00–12:00', title: '', year: 2026 },
};

export function HolisticSymposiumsEditor({ payload, issues, onChange }: HolisticEditorProps) {
  const zh = payload.zh.outcomes;
  const en = payload.en.outcomes;
  const collection = { zh: zh.symposiums, en: en.symposiums };
  const commit = (result: PairedCollectionResult<SymposiumRow>): StructuredEditorCommitResult => result.ok
    ? onChange({
        zh: { ...payload.zh, outcomes: { ...zh, symposiums: result.collection.zh } },
        en: { ...payload.en, outcomes: { ...en, symposiums: result.collection.en } },
      })
    : { status: 'unchanged' };
  const scalar = (field: 'attendeesLabel' | 'hostLabel' | 'satisfactionLabel' | 'symposiumDesc' | 'symposiumEyebrow' | 'symposiumTitle', label: string, multiline = false) => (
    <PairedTextField multiline={multiline} copy={{ label, zh: `${label}（繁體中文）`, en: `${label} (English)` }} paths={{ zh: ['zh', 'outcomes', field], en: ['en', 'outcomes', field] }} values={{ zh: zh[field], en: en[field] }} issues={issues} onChange={{ zh: (value) => onChange({ ...payload, zh: { ...payload.zh, outcomes: { ...zh, [field]: value } } }), en: (value) => onChange({ ...payload, en: { ...payload.en, outcomes: { ...en, [field]: value } } }) }} />
  );
  return (
    <EditorSection id="holistic-symposiums-editor" title="研討會與論壇" description="日期、時間、年份及選填數值保留可修復的原始輸入狀態。">
      <div className="admin-stack">
        {scalar('symposiumEyebrow', '研討會眉標')}
        {scalar('symposiumTitle', '研討會區標題')}
        {scalar('symposiumDesc', '研討會區說明', true)}
        {scalar('hostLabel', '主辦標籤')}
        {scalar('attendeesLabel', '參與人數標籤')}
        {scalar('satisfactionLabel', '滿意度標籤')}
        <EditorCollection id="holistic-symposiums" title="研討會列表" itemCount={collection.zh.length} revisionKeys={[collection.zh, collection.en]} copy={COPY} onAdd={() => commit(insertPaired(collection, { index: collection.zh.length, rows: NEW_ROWS }))} onMove={(fromIndex, toIndex) => commit(movePaired(collection, { fromIndex, toIndex }))} onRemove={(index) => commit(removePaired(collection, { index }))} renderItem={(index) => {
          const zhRow = collection.zh[index];
          const enRow = collection.en[index];
          if (zhRow === undefined || enRow === undefined) return null;
          return <SymposiumPairFields index={index} rows={{ zh: zhRow, en: enRow }} issues={issues} onChange={(rows) => commit(updatePaired(collection, { index, rows }))} />;
        }} />
      </div>
    </EditorSection>
  );
}
