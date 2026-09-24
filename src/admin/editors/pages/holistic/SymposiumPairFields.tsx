import type { PairedRows } from '@/admin/editors/global/pairedCollections';
import { PairedNumberField, PairedTextField } from './fieldPrimitives';
import { symposiumErrors } from './symposiumValidation';
import type { HolisticIssues, SymposiumRow } from './types';

type SymposiumPairFieldsProps = {
  readonly index: number;
  readonly rows: PairedRows<SymposiumRow>;
  readonly issues: HolisticIssues;
  readonly onChange: (rows: PairedRows<SymposiumRow>) => void;
};

function withoutOptional(row: SymposiumRow, field: 'attendees' | 'satisfaction'): SymposiumRow {
  const { attendees, satisfaction, ...required } = row;
  if (field === 'attendees') return satisfaction === undefined ? required : { ...required, satisfaction };
  return attendees === undefined ? required : { ...required, attendees };
}

export function SymposiumPairFields({ index, rows, issues, onChange }: SymposiumPairFieldsProps) {
  const zhErrors = symposiumErrors('zh', rows.zh);
  const enErrors = symposiumErrors('en', rows.en);
  const paths = (field: keyof SymposiumRow) => ({ zh: ['zh', 'outcomes', 'symposiums', index, field], en: ['en', 'outcomes', 'symposiums', index, field] });
  const text = (field: 'dates' | 'edition' | 'time' | 'title', label: string, errors?: { readonly zh?: string; readonly en?: string }) => (
    <PairedTextField copy={{ label, zh: `${label}（繁體中文）`, en: `${label} (English)` }} paths={paths(field)} values={{ zh: rows.zh[field], en: rows.en[field] }} issues={issues} errors={errors === undefined ? undefined : { zh: errors.zh, en: errors.en }} onChange={{ zh: (value) => onChange({ ...rows, zh: { ...rows.zh, [field]: value } }), en: (value) => onChange({ ...rows, en: { ...rows.en, [field]: value } }) }} />
  );
  const optional = (field: 'attendees' | 'satisfaction', label: string) => (
    <PairedNumberField optional copy={{ label, zh: `${label}（繁體中文）`, en: `${label} (English)` }} paths={paths(field)} values={{ zh: rows.zh[field], en: rows.en[field] }} issues={issues} onChange={{
      zh: (value) => onChange({ ...rows, zh: value === undefined ? withoutOptional(rows.zh, field) : { ...rows.zh, [field]: value } }),
      en: (value) => onChange({ ...rows, en: value === undefined ? withoutOptional(rows.en, field) : { ...rows.en, [field]: value } }),
    }} />
  );
  return (
    <div className="admin-stack">
      {text('edition', '屆次')}
      {text('title', '研討會標題')}
      {text('dates', '日期', { zh: zhErrors.dates, en: enErrors.dates })}
      {text('time', '時間', { zh: zhErrors.time, en: enErrors.time })}
      <PairedNumberField integer copy={{ label: '年份', zh: '年份（繁體中文）', en: 'Year (English)' }} paths={paths('year')} values={{ zh: rows.zh.year, en: rows.en.year }} issues={issues} errors={{ zh: zhErrors.year, en: enErrors.year }} onChange={{ zh: (year) => onChange({ ...rows, zh: { ...rows.zh, year: year ?? '' } }), en: (year) => onChange({ ...rows, en: { ...rows.en, year: year ?? '' } }) }} />
      {optional('attendees', '參與人數')}
      {optional('satisfaction', '滿意度')}
    </div>
  );
}
