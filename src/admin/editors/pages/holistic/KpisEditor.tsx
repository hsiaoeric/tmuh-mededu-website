import type { StructuredEditorCommitResult } from '@/admin/editors/shared';
import {
  insertPaired,
  movePaired,
  removePaired,
  updatePaired,
  type PairedCollectionResult,
  type PairedRows,
} from '@/admin/editors/global/pairedCollections';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { holisticCollectionCopy } from './collectionCopy';
import {
  PairedCheckboxField,
  PairedColorField,
  PairedNumberField,
  PairedTextField,
} from './fieldPrimitives';
import type { HolisticEditorProps, KpiRow } from './types';

const COPY = holisticCollectionCopy({ item: 'KPI', empty: 'KPI', paired: 'KPI 資料' });
const NEW_ROWS: PairedRows<KpiRow> = {
  zh: { num: 0, display: '', isStatic: false, label: '', color: '#4f8c7d', subtitle: '' },
  en: { num: 0, display: '', isStatic: false, label: '', color: '#4f8c7d', subtitle: '' },
};

export function HolisticKpisEditor({ payload, issues, onChange }: HolisticEditorProps) {
  const collection = { zh: payload.zh.kpis, en: payload.en.kpis };
  const commit = (result: PairedCollectionResult<KpiRow>): StructuredEditorCommitResult => result.ok
    ? onChange({
        zh: { ...payload.zh, kpis: result.collection.zh },
        en: { ...payload.en, kpis: result.collection.en },
      })
    : { status: 'unchanged' };
  return (
    <EditorSection id="holistic-kpis-editor" title="全人照護關鍵數據" description="依公開頁面順序成對維護中英文 KPI。">
      <EditorCollection
        id="holistic-kpis"
        title="KPI 列表"
        itemCount={collection.zh.length}
        revisionKeys={[collection.zh, collection.en]}
        copy={COPY}
        onAdd={() => commit(insertPaired(collection, { index: collection.zh.length, rows: NEW_ROWS }))}
        onMove={(fromIndex, toIndex) => commit(movePaired(collection, { fromIndex, toIndex }))}
        onRemove={(index) => commit(removePaired(collection, { index }))}
        renderItem={(index) => {
          const zh = collection.zh[index];
          const en = collection.en[index];
          if (zh === undefined || en === undefined) return null;
          const update = (rows: PairedRows<KpiRow>) => commit(updatePaired(collection, { index, rows }));
          const paths = (field: keyof KpiRow) => ({ zh: ['zh', 'kpis', index, field], en: ['en', 'kpis', index, field] });
          return (
            <div className="admin-stack">
              <PairedNumberField copy={{ label: 'KPI 數值', zh: 'KPI 數值（繁體中文）', en: 'KPI number (English)' }} paths={paths('num')} values={{ zh: zh.num, en: en.num }} issues={issues} onChange={{ zh: (num) => update({ zh: { ...zh, num: num ?? '' }, en }), en: (num) => update({ zh, en: { ...en, num: num ?? '' } }) }} />
              <PairedTextField copy={{ label: '顯示文字', zh: '顯示文字（繁體中文）', en: 'Display text (English)' }} paths={paths('display')} values={{ zh: zh.display, en: en.display }} issues={issues} onChange={{ zh: (display) => update({ zh: { ...zh, display }, en }), en: (display) => update({ zh, en: { ...en, display } }) }} />
              <PairedCheckboxField copy={{ label: '固定顯示', zh: '繁體中文固定顯示', en: 'English static display' }} values={{ zh: zh.isStatic, en: en.isStatic }} onChange={{ zh: (isStatic) => update({ zh: { ...zh, isStatic }, en }), en: (isStatic) => update({ zh, en: { ...en, isStatic } }) }} />
              <PairedTextField copy={{ label: 'KPI 標籤', zh: 'KPI 標籤（繁體中文）', en: 'KPI label (English)' }} paths={paths('label')} values={{ zh: zh.label, en: en.label }} issues={issues} onChange={{ zh: (label) => update({ zh: { ...zh, label }, en }), en: (label) => update({ zh, en: { ...en, label } }) }} />
              <PairedColorField copy={{ label: 'KPI 色碼', zh: 'KPI 色碼（繁體中文）', en: 'KPI color (English)' }} paths={paths('color')} values={{ zh: zh.color, en: en.color }} issues={issues} onChange={{ zh: (color) => update({ zh: { ...zh, color }, en }), en: (color) => update({ zh, en: { ...en, color } }) }} />
              <PairedTextField copy={{ label: '補充說明', zh: '補充說明（繁體中文）', en: 'Subtitle (English)' }} paths={paths('subtitle')} values={{ zh: zh.subtitle ?? '', en: en.subtitle ?? '' }} issues={issues} onChange={{ zh: (subtitle) => update({ zh: { ...zh, subtitle }, en }), en: (subtitle) => update({ zh, en: { ...en, subtitle } }) }} />
            </div>
          );
        }}
      />
    </EditorSection>
  );
}
