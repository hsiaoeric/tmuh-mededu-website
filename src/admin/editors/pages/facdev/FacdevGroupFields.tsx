import { EditorBilingualFields, EditorTextField, EditorTextareaField } from '@/admin/editors/global/ui/EditorFields';
import type { PairedRows } from '@/admin/editors/global/pairedCollections';
import { FacdevLeadFields } from './FacdevLeadFields';
import type { FacdevGroup, FacdevIssues } from './types';

function LocaleGroupFields({ index, locale, row, issues, onChange }: {
  readonly index: number; readonly locale: 'zh' | 'en'; readonly row: FacdevGroup;
  readonly issues: FacdevIssues; readonly onChange: (row: FacdevGroup) => void;
}) {
  const prefix = locale === 'zh' ? `繁體中文培育小組 ${index + 1}` : `English cultivation group ${index + 1}`;
  const path = (field: 'name' | 'desc'): readonly PropertyKey[] => [locale, 'groups', index, field];
  return <div className="admin-field-grid">
    <EditorTextField label={`${prefix} ${locale === 'zh' ? '名稱' : 'name'}`} value={row.name} path={path('name')} issues={issues} onChange={(event) => onChange({ ...row, name: event.currentTarget.value })} />
    <EditorTextareaField label={`${prefix} ${locale === 'zh' ? '說明' : 'description'}`} value={row.desc} path={path('desc')} issues={issues} onChange={(event) => onChange({ ...row, desc: event.currentTarget.value })} />
  </div>;
}

export function FacdevGroupFields({ index, rows, issues, onChange }: {
  readonly index: number; readonly rows: PairedRows<FacdevGroup>; readonly issues: FacdevIssues;
  readonly onChange: (rows: PairedRows<FacdevGroup>) => void;
}) {
  return <div className="admin-stack">
    <EditorBilingualFields label={`培育小組 ${index + 1} 雙語內容`}
      zh={<LocaleGroupFields index={index} locale="zh" row={rows.zh} issues={issues} onChange={(zh) => onChange({ ...rows, zh })} />}
      en={<LocaleGroupFields index={index} locale="en" row={rows.en} issues={issues} onChange={(en) => onChange({ ...rows, en })} />}
    />
    <FacdevLeadFields index={index} leads={{ zh: rows.zh.lead, en: rows.en.lead }} issues={issues} onChange={(leads) => onChange({ zh: { ...rows.zh, lead: leads.zh }, en: { ...rows.en, lead: leads.en } })} />
  </div>;
}
