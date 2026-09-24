import { insertPaired, movePaired, nextCollectionId, removePaired, updatePaired } from '@/admin/editors/global/pairedCollections';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { ResearchNumberField } from './ResearchFields';
import { YEAR_COPY } from './collectionCopy';
import type { ResearchEditorPartProps, ResearchYear } from './types';

const EMPTY_YEAR: ResearchYear = { id: '', clinical: 0, edu: 0, year: '' };

export function YearTotalsEditor({ payload, issues, onPayloadChange }: ResearchEditorPartProps) {
  const value = { zh: payload.zh.byYear, en: payload.en.byYear };
  const commit = (next: typeof value) => onPayloadChange({
    zh: { ...payload.zh, byYear: next.zh },
    en: { ...payload.en, byYear: next.en },
  });
  const operation = (result: ReturnType<typeof insertPaired<ResearchYear>>) => (
    result.ok ? commit(result.collection) : { status: 'unchanged' as const }
  );
  const update = (index: number, row: ResearchYear) => {
    const zh = value.zh[index];
    const en = value.en[index];
    if (zh === undefined || en === undefined) return { status: 'unchanged' as const };
    const shared = { id: zh.id, year: row.year, clinical: row.clinical, edu: row.edu };
    return operation(updatePaired(value, { index, rows: { zh: shared, en: shared } }));
  };
  const fields = (index: number, row: ResearchYear) => {
    const prefix = `年度統計 ${index + 1}`;
    return (
      <div className="admin-field-grid">
        <ResearchNumberField label={`${prefix} 共用年份`} path={['zh', 'byYear', index, 'year']} issues={issues} value={row.year} onChange={(year) => update(index, { ...row, year })} />
        <ResearchNumberField label={`${prefix} 共用臨床篇數`} path={['zh', 'byYear', index, 'clinical']} issues={issues} value={row.clinical} onChange={(clinical) => update(index, { ...row, clinical })} />
        <ResearchNumberField label={`${prefix} 共用教育篇數`} path={['zh', 'byYear', index, 'edu']} issues={issues} value={row.edu} onChange={(edu) => update(index, { ...row, edu })} />
      </div>
    );
  };
  return (
    <EditorCollection id="holistic-research-by-year" title="年度論文統計" itemCount={value.zh.length} revisionKeys={[value.zh, value.en]} copy={YEAR_COPY}
      onAdd={() => {
        const id = nextCollectionId('new-research-year', [...value.zh.map((row) => row.id), ...value.en.map((row) => row.id)]);
        const row = { ...EMPTY_YEAR, id };
        return operation(insertPaired(value, { index: value.zh.length, rows: { zh: row, en: row } }));
      }}
      onMove={(fromIndex, toIndex) => operation(movePaired(value, { fromIndex, toIndex }))}
      onRemove={(index) => operation(removePaired(value, { index }))}
      renderItem={(index) => {
        const zh = value.zh[index];
        const en = value.en[index];
        if (zh === undefined || en === undefined) return null;
        return fields(index, zh);
      }}
    />
  );
}
