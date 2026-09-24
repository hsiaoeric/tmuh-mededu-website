import type { StructuredEditorCommit, StructuredEditorCommitResult, StructuredEditorIssueSummary } from '@/admin/editors/shared';
import { insertPaired, movePaired, removePaired, updatePaired, type PairedCollectionResult, type PairedRows } from '@/admin/editors/global/pairedCollections';
import { EditorBilingualFields, EditorTextField } from '@/admin/editors/global/ui/EditorFields';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { collectionCopy } from './collectionCopy';
import { EbmNumberField } from './EbmFields';
import type { EbmPayload, Kpi, LocaleKey } from './types';

const COPY = collectionCopy({ noun: 'KPI', add: '新增 KPI', empty: '尚無 KPI' });
const EMPTY_KPI: Kpi = { num: 0, suffix: '', label: '', en: '' };

type KpisEditorProps = {
  readonly payload: EbmPayload;
  readonly issues: readonly StructuredEditorIssueSummary[];
  readonly onChange: StructuredEditorCommit<EbmPayload>;
};

type KpiPairFieldsProps = {
  readonly index: number;
  readonly rows: PairedRows<Kpi>;
  readonly issues: readonly StructuredEditorIssueSummary[];
  readonly onChange: (rows: PairedRows<Kpi>) => void;
};

function KpiPairFields({ index, rows, issues, onChange }: KpiPairFieldsProps) {
  const change = (locale: LocaleKey, field: keyof Kpi, value: string | number) => {
    onChange({ ...rows, [locale]: { ...rows[locale], [field]: value } });
  };
  const localeFields = (locale: LocaleKey) => {
    const row = rows[locale];
    const language = locale === 'zh' ? '繁體中文' : '英文';
    const path = (field: keyof Kpi): readonly PropertyKey[] => [locale, 'kpis', index, field];
    return (
      <div className="admin-field-grid">
        <EbmNumberField label={`KPI ${index + 1} 數值（${language}）`} path={path('num')} value={row.num} issues={issues} onChange={(value) => change(locale, 'num', value)} />
        <EditorTextField label={`KPI ${index + 1} 後綴（${language}）`} path={path('suffix')} issues={issues} value={row.suffix} onChange={(event) => change(locale, 'suffix', event.currentTarget.value)} />
        <EditorTextField label={`KPI ${index + 1} 標籤（${language}）`} path={path('label')} issues={issues} value={row.label} onChange={(event) => change(locale, 'label', event.currentTarget.value)} />
        <EditorTextField label={`KPI ${index + 1} 英文輔助標籤（${language}）`} path={path('en')} issues={issues} value={row.en} onChange={(event) => change(locale, 'en', event.currentTarget.value)} />
      </div>
    );
  };
  return <EditorBilingualFields label={`KPI ${index + 1} 雙語內容`} zh={localeFields('zh')} en={localeFields('en')} />;
}

export function KpisEditor({ payload, issues, onChange }: KpisEditorProps) {
  const collection = { zh: payload.zh.kpis, en: payload.en.kpis };
  const commit = (result: PairedCollectionResult<Kpi>): StructuredEditorCommitResult => {
    if (!result.ok) return { status: 'unchanged' };
    return onChange({ zh: { ...payload.zh, kpis: result.collection.zh }, en: { ...payload.en, kpis: result.collection.en } });
  };
  return (
    <EditorSection id="ebm-kpis-section" title="關鍵數據" description="數值與文字依位置維持雙語配對。">
      <EditorCollection
        id="ebm-kpis"
        title="KPI 列表"
        itemCount={collection.zh.length}
        revisionKeys={[collection.zh, collection.en]}
        copy={COPY}
        onAdd={() => commit(insertPaired(collection, { index: collection.zh.length, rows: { zh: EMPTY_KPI, en: EMPTY_KPI } }))}
        onMove={(fromIndex, toIndex) => commit(movePaired(collection, { fromIndex, toIndex }))}
        onRemove={(index) => commit(removePaired(collection, { index }))}
        renderItem={(index) => {
          const zh = collection.zh[index];
          const en = collection.en[index];
          if (zh === undefined || en === undefined) return null;
          return <KpiPairFields index={index} rows={{ zh, en }} issues={issues} onChange={(rows) => commit(updatePaired(collection, { index, rows }))} />;
        }}
      />
    </EditorSection>
  );
}
