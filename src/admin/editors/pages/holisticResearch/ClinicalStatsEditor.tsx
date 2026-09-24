import { insertPaired, movePaired, nextCollectionId, removePaired, updatePaired } from '@/admin/editors/global/pairedCollections';
import { EditorBilingualFields, EditorTextField } from '@/admin/editors/global/ui/EditorFields';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { ResearchNumberField } from './ResearchFields';
import { CLINICAL_COPY } from './collectionCopy';
import type { ResearchClinicalStat, ResearchEditorPartProps } from './types';

const EMPTY_STAT: ResearchClinicalStat = { id: '', label: '', num: 0 };

export function ClinicalStatsEditor({ payload, issues, onPayloadChange }: ResearchEditorPartProps) {
  const value = { zh: payload.zh.clinicalStats, en: payload.en.clinicalStats };
  const operation = (result: ReturnType<typeof insertPaired<ResearchClinicalStat>>) => {
    if (!result.ok) return { status: 'unchanged' as const };
    return onPayloadChange({
      zh: { ...payload.zh, clinicalStats: result.collection.zh },
      en: { ...payload.en, clinicalStats: result.collection.en },
    });
  };
  const updateLabel = (index: number, locale: 'zh' | 'en', row: ResearchClinicalStat) => {
    const zh = value.zh[index];
    const en = value.en[index];
    if (zh === undefined || en === undefined) return { status: 'unchanged' as const };
    return operation(updatePaired(value, { index, rows: locale === 'zh' ? { zh: row, en } : { zh, en: row } }));
  };
  const updateNumber = (index: number, num: ResearchClinicalStat['num']) => {
    const zh = value.zh[index];
    const en = value.en[index];
    if (zh === undefined || en === undefined) return { status: 'unchanged' as const };
    return operation(updatePaired(value, { index, rows: { zh: { ...zh, num }, en: { ...en, num } } }));
  };
  const fields = (index: number, locale: 'zh' | 'en', row: ResearchClinicalStat) => {
    const label = locale === 'zh' ? `繁體中文臨床統計 ${index + 1}` : `English clinical statistic ${index + 1}`;
    return (
      <div className="admin-field-grid">
        <EditorTextField label={locale === 'zh' ? `${label} 標籤` : `${label} label`} path={[locale, 'clinicalStats', index, 'label']} issues={issues} value={row.label} onChange={(event) => updateLabel(index, locale, { ...row, label: event.currentTarget.value })} />
      </div>
    );
  };
  return (
    <EditorCollection id="holistic-research-clinical-stats" title="臨床統計" itemCount={value.zh.length} revisionKeys={[value.zh, value.en]} copy={CLINICAL_COPY}
      onAdd={() => {
        const id = nextCollectionId('new-research-stat', [...value.zh.map((row) => row.id), ...value.en.map((row) => row.id)]);
        return operation(insertPaired(value, { index: value.zh.length, rows: { zh: { ...EMPTY_STAT, id }, en: { ...EMPTY_STAT, id } } }));
      }}
      onMove={(fromIndex, toIndex) => operation(movePaired(value, { fromIndex, toIndex }))}
      onRemove={(index) => operation(removePaired(value, { index }))}
      renderItem={(index) => {
        const zh = value.zh[index];
        const en = value.en[index];
        if (zh === undefined || en === undefined) return null;
        return <div className="admin-stack"><ResearchNumberField label={`臨床統計 ${index + 1} 共用數值`} path={['zh', 'clinicalStats', index, 'num']} issues={issues} value={zh.num} onChange={(num) => updateNumber(index, num)} /><EditorBilingualFields label={`臨床統計 ${index + 1}`} zh={fields(index, 'zh', zh)} en={fields(index, 'en', en)} /></div>;
      }}
    />
  );
}
