import type { ChangeEvent } from 'react';
import { insertPaired, movePaired, removePaired, type PairedCollection } from '../pairedCollections';
import { EditorCollection } from '../ui/EditorCollection';
import type { StructuredEditorCommitResult as GlobalEditorCommitResult } from '@/admin/editors/shared';
import { EditorBilingualFields, EditorTextField } from '../ui/EditorFields';
import { YEAR_COUNT_COPY } from './collectionCopy';
import { pairedCollection, type SnqYearCount } from './honorsTypes';

const EMPTY_YEAR_COUNT: SnqYearCount = { year: '', count: 0 };

type YearCountsEditorProps = {
  readonly value: PairedCollection<SnqYearCount>;
  readonly onChange: (value: PairedCollection<SnqYearCount>) => GlobalEditorCommitResult;
};

export function YearCountsEditor({ value, onChange }: YearCountsEditorProps) {
  const changeRow = (index: number, locale: 'zh' | 'en', row: SnqYearCount) => {
    onChange({ ...value, [locale]: value[locale].map((current, rowIndex) => rowIndex === index ? row : current) });
  };
  const numberChange = (index: number, locale: 'zh' | 'en') => (event: ChangeEvent<HTMLInputElement>) => {
    const current = value[locale][index];
    const count = event.currentTarget.value === '' ? 0 : event.currentTarget.valueAsNumber;
    changeRow(index, locale, { ...current, count });
  };
  return (
    <EditorCollection
      id="snq-year-counts"
      title="SNQ 年度統計"
      description="年度與件數皆為編輯內容，不會依專案自動推算。"
      itemCount={value.zh.length}
      revisionKeys={[value.zh, value.en]}
      copy={YEAR_COUNT_COPY}
      onAdd={() => onChange(pairedCollection(insertPaired(value, {
        index: value.zh.length,
        rows: { zh: EMPTY_YEAR_COUNT, en: EMPTY_YEAR_COUNT },
      })))}
      onMove={(fromIndex, toIndex) => onChange(pairedCollection(movePaired(value, { fromIndex, toIndex })))}
      onRemove={(index) => onChange(pairedCollection(removePaired(value, { index })))}
      renderItem={(index) => (
        <EditorBilingualFields
          label={`SNQ 年度統計 ${index + 1}`}
          zh={(
            <div className="admin-editor-year-count-fields">
              <EditorTextField label={`SNQ 年度統計 ${index + 1} 年度（繁體中文）`} path={['zh', 'snqYearCounts', index, 'year']} issues={[]} value={value.zh[index].year} onChange={(event) => changeRow(index, 'zh', { ...value.zh[index], year: event.currentTarget.value })} />
              <EditorTextField label={`SNQ 年度統計 ${index + 1} 件數（繁體中文）`} type="number" path={['zh', 'snqYearCounts', index, 'count']} issues={[]} value={value.zh[index].count} onChange={numberChange(index, 'zh')} />
            </div>
          )}
          en={(
            <div className="admin-editor-year-count-fields">
              <EditorTextField label={`SNQ 年度統計 ${index + 1} 年度（英文）`} path={['en', 'snqYearCounts', index, 'year']} issues={[]} value={value.en[index].year} onChange={(event) => changeRow(index, 'en', { ...value.en[index], year: event.currentTarget.value })} />
              <EditorTextField label={`SNQ 年度統計 ${index + 1} 件數（英文）`} type="number" path={['en', 'snqYearCounts', index, 'count']} issues={[]} value={value.en[index].count} onChange={numberChange(index, 'en')} />
            </div>
          )}
        />
      )}
    />
  );
}
