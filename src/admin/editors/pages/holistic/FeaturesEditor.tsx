import type { StructuredEditorCommitResult } from '@/admin/editors/shared';
import { insertPaired, movePaired, removePaired, updatePaired, type PairedCollectionResult, type PairedRows } from '@/admin/editors/global/pairedCollections';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { holisticCollectionCopy } from './collectionCopy';
import { PairedNumberField, PairedTextField } from './fieldPrimitives';
import type { FeatureRow, HolisticEditorProps } from './types';

const COPY = holisticCollectionCopy({ item: '特色', empty: '中心特色', paired: '特色內容' });
const NEW_ROWS: PairedRows<FeatureRow> = {
  zh: { delay: 0, desc: '', iconId: '', title: '' },
  en: { delay: 0, desc: '', iconId: '', title: '' },
};

export function HolisticFeaturesEditor({ payload, issues, onChange }: HolisticEditorProps) {
  const collection = { zh: payload.zh.features, en: payload.en.features };
  const commit = (result: PairedCollectionResult<FeatureRow>): StructuredEditorCommitResult => result.ok
    ? onChange({ zh: { ...payload.zh, features: result.collection.zh }, en: { ...payload.en, features: result.collection.en } })
    : { status: 'unchanged' };
  return (
    <EditorSection id="holistic-features-editor" title="中心特色" description="特色卡片依輸入順序顯示，不會自動排序。">
      <EditorCollection id="holistic-features" title="特色列表" itemCount={collection.zh.length} revisionKeys={[collection.zh, collection.en]} copy={COPY} onAdd={() => commit(insertPaired(collection, { index: collection.zh.length, rows: NEW_ROWS }))} onMove={(fromIndex, toIndex) => commit(movePaired(collection, { fromIndex, toIndex }))} onRemove={(index) => commit(removePaired(collection, { index }))} renderItem={(index) => {
        const zh = collection.zh[index];
        const en = collection.en[index];
        if (zh === undefined || en === undefined) return null;
        const update = (rows: PairedRows<FeatureRow>) => commit(updatePaired(collection, { index, rows }));
        const paths = (field: keyof FeatureRow) => ({ zh: ['zh', 'features', index, field], en: ['en', 'features', index, field] });
        return <div className="admin-stack">
          <PairedTextField copy={{ label: '特色標題', zh: '特色標題（繁體中文）', en: 'Feature title (English)' }} paths={paths('title')} values={{ zh: zh.title, en: en.title }} issues={issues} onChange={{ zh: (title) => update({ zh: { ...zh, title }, en }), en: (title) => update({ zh, en: { ...en, title } }) }} />
          <PairedTextField multiline copy={{ label: '特色說明', zh: '特色說明（繁體中文）', en: 'Feature description (English)' }} paths={paths('desc')} values={{ zh: zh.desc, en: en.desc }} issues={issues} onChange={{ zh: (desc) => update({ zh: { ...zh, desc }, en }), en: (desc) => update({ zh, en: { ...en, desc } }) }} />
          <PairedTextField copy={{ label: '圖示識別碼', zh: '圖示識別碼（繁體中文）', en: 'Icon identifier (English)' }} paths={paths('iconId')} values={{ zh: zh.iconId, en: en.iconId }} issues={issues} onChange={{ zh: (iconId) => update({ zh: { ...zh, iconId }, en }), en: (iconId) => update({ zh, en: { ...en, iconId } }) }} />
          <PairedNumberField copy={{ label: '進場延遲', zh: '進場延遲（繁體中文）', en: 'Reveal delay (English)' }} paths={paths('delay')} values={{ zh: zh.delay, en: en.delay }} issues={issues} onChange={{ zh: (delay) => update({ zh: { ...zh, delay: delay ?? '' }, en }), en: (delay) => update({ zh, en: { ...en, delay: delay ?? '' } }) }} />
        </div>;
      }} />
    </EditorSection>
  );
}
