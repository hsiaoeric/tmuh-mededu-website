import { AdminField } from '@/admin/AdminFields';
import {
  fieldIdForStructuredEditorIssuePath as fieldIdForIssuePath,
  type StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';
import type { EditableCmsPayloadByKind } from '@/content/contracts/registry';
import type { PairedRows } from '../pairedCollections';
import { EditorBilingualFields, EditorTextField } from '../ui/EditorFields';

type KpisPayload = EditableCmsPayloadByKind['kpis'];
type KpiRow = KpisPayload['zh']['items'][number];
type Locale = 'zh' | 'en';
type NumericField = 'num' | 'delay';
type TextField = 'suffix' | 'label' | 'en' | 'panelTitle' | 'panelDescription';
type KpiPairFieldsProps = {
  readonly index: number;
  readonly rows: PairedRows<KpiRow>;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onChange: (rows: PairedRows<KpiRow>) => void;
};

type LocaleFieldsProps = {
  readonly index: number;
  readonly locale: Locale;
  readonly row: KpiRow;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onChange: (row: KpiRow) => void;
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const COMPLETE_NUMBER = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i;
const NUMBER_ERROR = '請輸入有效數字，可使用 0、負數或小數。';
const COLOR_ERROR = '請輸入 # 加上 6 位十六進位色碼，例如 #4f8c7d。';

const LABELS = {
  zh: {
    num: '繁體中文數值',
    suffix: '繁體中文後綴',
    label: '繁體中文標籤',
    en: '繁體中文英文輔助標籤',
    color: '繁體中文色碼',
    delay: '繁體中文延遲（毫秒）',
    panelTitle: '繁體中文面板標題',
    panelDescription: '繁體中文面板說明（選填）',
  },
  en: {
    num: 'English number',
    suffix: 'English suffix',
    label: 'English label',
    en: 'English auxiliary English label',
    color: 'English color',
    delay: 'English delay (ms)',
    panelTitle: 'English panel title',
    panelDescription: 'English panel description (optional)',
  },
} as const;

function finiteNumber(value: string): number | null {
  if (!COMPLETE_NUMBER.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numericDraft(value: string): number | string {
  return finiteNumber(value) ?? value;
}

function KpiLocaleFields({ index, locale, row, issues, onChange }: LocaleFieldsProps) {
  const labels = LABELS[locale];

  const path = (field: keyof KpiRow): readonly PropertyKey[] => [locale, 'items', index, field];
  const issue = (field: keyof KpiRow): string | undefined => {
    const fieldId = fieldIdForIssuePath(path(field));
  return issues.find((summary) => summary.fieldId === fieldId)?.message;
  };
  const changeText = (field: TextField, value: string): void => {
    if (value === (row[field] ?? '')) return;
    onChange({ ...row, [field]: value });
  };
  const changeNumber = (field: NumericField, value: string): void => {
    const next = numericDraft(value);
    if (next === row[field]) return;
    onChange({ ...row, [field]: next });
  };
  const changeColor = (value: string): void => {
    if (value === row.color) return;
    onChange({ ...row, color: value });
  };
  const numberField = (field: NumericField) => (
    <AdminField
      id={fieldIdForIssuePath(path(field))}
      label={labels[field]}
      value={String(row[field])}
      inputMode="decimal"
      error={finiteNumber(String(row[field])) === null ? NUMBER_ERROR : issue(field)}
      onChange={(event) => changeNumber(field, event.currentTarget.value)}
    />
  );

  return (
    <div className="admin-field-grid">
      {numberField('num')}
      <EditorTextField path={path('suffix')} issues={issues} label={labels.suffix} value={row.suffix} onChange={(event) => changeText('suffix', event.currentTarget.value)} />
      <EditorTextField path={path('label')} issues={issues} label={labels.label} value={row.label} onChange={(event) => changeText('label', event.currentTarget.value)} />
      <EditorTextField path={path('en')} issues={issues} label={labels.en} value={row.en} onChange={(event) => changeText('en', event.currentTarget.value)} />
      <EditorTextField path={path('panelTitle')} issues={issues} label={labels.panelTitle} value={row.panelTitle} onChange={(event) => changeText('panelTitle', event.currentTarget.value)} />
      <EditorTextField path={path('panelDescription')} issues={issues} label={labels.panelDescription} value={row.panelDescription ?? ''} onChange={(event) => changeText('panelDescription', event.currentTarget.value)} />
      <AdminField
        id={fieldIdForIssuePath(path('color'))}
        label={labels.color}
        value={row.color}
        helper={HEX_COLOR.test(row.color) ? '色碼有效' : undefined}
        status={HEX_COLOR.test(row.color) ? 'valid' : undefined}
        error={HEX_COLOR.test(row.color) ? issue('color') : COLOR_ERROR}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => changeColor(event.currentTarget.value)}
      />
      {numberField('delay')}
    </div>
  );
}

export function KpiPairFields({ index, rows, issues, onChange }: KpiPairFieldsProps) {
  return (
    <>
      <AdminField id={`kpi-${index}-stable-id`} label="固定識別碼 / Stable ID" value={rows.zh.id} readOnly />
      <EditorBilingualFields
        label={`KPI 雙語內容 ${index + 1}`}
        description="繁體中文在前；固定識別碼不可修改。"
        zh={<KpiLocaleFields index={index} locale="zh" row={rows.zh} issues={issues} onChange={(zh) => onChange({ ...rows, zh })} />}
        en={<KpiLocaleFields index={index} locale="en" row={rows.en} issues={issues} onChange={(en) => onChange({ ...rows, en })} />}
      />
    </>
  );
}
