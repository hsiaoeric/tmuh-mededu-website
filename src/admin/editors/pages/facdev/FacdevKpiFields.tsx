import { AdminField } from '@/admin/AdminFields';
import { fieldIdForStructuredEditorIssuePath as fieldIdForIssuePath } from '@/admin/editors/shared';
import { EditorBilingualFields, EditorTextField } from '@/admin/editors/global/ui/EditorFields';
import type { PairedRows } from '@/admin/editors/global/pairedCollections';
import type { FacdevIssues, FacdevKpi } from './types';

const COMPLETE_NUMBER = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i;

function numericDraft(value: string): number | string {
  if (!COMPLETE_NUMBER.test(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

type LocaleKpiFieldsProps = {
  readonly index: number;
  readonly locale: 'zh' | 'en';
  readonly row: FacdevKpi;
  readonly issues: FacdevIssues;
  readonly onChange: (row: FacdevKpi) => void;
};

function LocaleKpiFields({ index, locale, row, issues, onChange }: LocaleKpiFieldsProps) {
  const prefix = locale === 'zh' ? `繁體中文 KPI ${index + 1}` : `English KPI ${index + 1}`;
  const path = (field: keyof FacdevKpi): readonly PropertyKey[] => [locale, 'kpis', index, field];
  const numberField = () => {
    const value = String(row.num);
    const id = fieldIdForIssuePath(path('num'));
  const mappedError = issues.find((summary) => summary.fieldId === id)?.message;
    return <AdminField id={id} label={`${prefix} ${locale === 'zh' ? '數值' : 'number'}`} inputMode="decimal" value={value} error={COMPLETE_NUMBER.test(value) && Number.isFinite(Number(value)) ? mappedError : '請輸入有效數字。'} onChange={(event) => onChange({ ...row, num: numericDraft(event.currentTarget.value) })} />;
  };
  return (
    <div className="admin-field-grid">
      {numberField()}
      <EditorTextField label={`${prefix} ${locale === 'zh' ? '後綴' : 'suffix'}`} value={row.suffix} path={path('suffix')} issues={issues} onChange={(event) => onChange({ ...row, suffix: event.currentTarget.value })} />
      <EditorTextField label={`${prefix} ${locale === 'zh' ? '標籤' : 'label'}`} value={row.label} path={path('label')} issues={issues} onChange={(event) => onChange({ ...row, label: event.currentTarget.value })} />
      <EditorTextField label={`${prefix} ${locale === 'zh' ? '英文輔助標籤' : 'auxiliary label'}`} value={row.en} path={path('en')} issues={issues} onChange={(event) => onChange({ ...row, en: event.currentTarget.value })} />
    </div>
  );
}

export function FacdevKpiFields({ index, rows, issues, onChange }: {
  readonly index: number;
  readonly rows: PairedRows<FacdevKpi>;
  readonly issues: FacdevIssues;
  readonly onChange: (rows: PairedRows<FacdevKpi>) => void;
}) {
  return <EditorBilingualFields label={`KPI ${index + 1} 雙語內容`}
    zh={<LocaleKpiFields index={index} locale="zh" row={rows.zh} issues={issues} onChange={(zh) => onChange({ ...rows, zh })} />}
    en={<LocaleKpiFields index={index} locale="en" row={rows.en} issues={issues} onChange={(en) => onChange({ ...rows, en })} />}
  />;
}
