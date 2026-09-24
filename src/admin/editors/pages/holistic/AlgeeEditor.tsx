import type { StructuredEditorCommitResult } from '@/admin/editors/shared';
import { insertPaired, movePaired, removePaired, updatePaired, type PairedCollectionResult, type PairedRows } from '@/admin/editors/global/pairedCollections';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { holisticCollectionCopy } from './collectionCopy';
import { PairedTextField } from './fieldPrimitives';
import type { AlgeeRow, HolisticEditorProps } from './types';

const COPY = holisticCollectionCopy({ item: 'ALGEE 步驟', empty: 'ALGEE 步驟', paired: '步驟內容' });
const NEW_ROWS: PairedRows<AlgeeRow> = {
  zh: { description: '', letter: '', title: '' },
  en: { description: '', letter: '', title: '' },
};

export function HolisticAlgeeEditor({ payload, issues, onChange }: HolisticEditorProps) {
  const collection = { zh: payload.zh.algee, en: payload.en.algee };
  const commit = (result: PairedCollectionResult<AlgeeRow>): StructuredEditorCommitResult => result.ok
    ? onChange({ zh: { ...payload.zh, algee: result.collection.zh }, en: { ...payload.en, algee: result.collection.en } })
    : { status: 'unchanged' };
  return (
    <EditorSection id="holistic-algee-editor" title="ALGEE" description="同步維護心理健康急救步驟的字母、標題與說明。">
      <EditorCollection id="holistic-algee" title="ALGEE 步驟" itemCount={collection.zh.length} revisionKeys={[collection.zh, collection.en]} copy={COPY} onAdd={() => commit(insertPaired(collection, { index: collection.zh.length, rows: NEW_ROWS }))} onMove={(fromIndex, toIndex) => commit(movePaired(collection, { fromIndex, toIndex }))} onRemove={(index) => commit(removePaired(collection, { index }))} renderItem={(index) => {
        const zh = collection.zh[index];
        const en = collection.en[index];
        if (zh === undefined || en === undefined) return null;
        const update = (rows: PairedRows<AlgeeRow>) => commit(updatePaired(collection, { index, rows }));
        const paths = (field: keyof AlgeeRow) => ({ zh: ['zh', 'algee', index, field], en: ['en', 'algee', index, field] });
        return <div className="admin-stack">
          <PairedTextField copy={{ label: '步驟字母', zh: '步驟字母（繁體中文）', en: 'Step letter (English)' }} paths={paths('letter')} values={{ zh: zh.letter, en: en.letter }} issues={issues} onChange={{ zh: (letter) => update({ zh: { ...zh, letter }, en }), en: (letter) => update({ zh, en: { ...en, letter } }) }} />
          <PairedTextField copy={{ label: '步驟標題', zh: '步驟標題（繁體中文）', en: 'Step title (English)' }} paths={paths('title')} values={{ zh: zh.title, en: en.title }} issues={issues} onChange={{ zh: (title) => update({ zh: { ...zh, title }, en }), en: (title) => update({ zh, en: { ...en, title } }) }} />
          <PairedTextField multiline copy={{ label: '步驟說明', zh: '步驟說明（繁體中文）', en: 'Step description (English)' }} paths={paths('description')} values={{ zh: zh.description, en: en.description }} issues={issues} onChange={{ zh: (description) => update({ zh: { ...zh, description }, en }), en: (description) => update({ zh, en: { ...en, description } }) }} />
        </div>;
      }} />
    </EditorSection>
  );
}
