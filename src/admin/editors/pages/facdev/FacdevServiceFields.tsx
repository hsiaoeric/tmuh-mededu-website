import { EditorBilingualFields, EditorTextField, EditorTextareaField } from '@/admin/editors/global/ui/EditorFields';
import type { PairedRows } from '@/admin/editors/global/pairedCollections';
import type { FacdevIssues, FacdevService } from './types';

function LocaleServiceFields({ index, locale, row, issues, onChange }: {
  readonly index: number; readonly locale: 'zh' | 'en'; readonly row: FacdevService;
  readonly issues: FacdevIssues; readonly onChange: (row: FacdevService) => void;
}) {
  const prefix = locale === 'zh' ? `繁體中文核心服務 ${index + 1}` : `English core service ${index + 1}`;
  const path = (field: keyof FacdevService): readonly PropertyKey[] => [locale, 'services', index, field];
  return <div className="admin-field-grid">
    <EditorTextField label={`${prefix} ${locale === 'zh' ? '標題' : 'title'}`} value={row.title} path={path('title')} issues={issues} onChange={(event) => onChange({ ...row, title: event.currentTarget.value })} />
    <EditorTextareaField label={`${prefix} ${locale === 'zh' ? '說明' : 'description'}`} value={row.desc} path={path('desc')} issues={issues} onChange={(event) => onChange({ ...row, desc: event.currentTarget.value })} />
  </div>;
}

export function FacdevServiceFields({ index, rows, issues, onChange }: {
  readonly index: number; readonly rows: PairedRows<FacdevService>; readonly issues: FacdevIssues;
  readonly onChange: (rows: PairedRows<FacdevService>) => void;
}) {
  return <EditorBilingualFields label={`核心服務 ${index + 1} 雙語內容`}
    zh={<LocaleServiceFields index={index} locale="zh" row={rows.zh} issues={issues} onChange={(zh) => onChange({ ...rows, zh })} />}
    en={<LocaleServiceFields index={index} locale="en" row={rows.en} issues={issues} onChange={(en) => onChange({ ...rows, en })} />}
  />;
}
