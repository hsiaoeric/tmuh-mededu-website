import { EditorBilingualFields, EditorTextField } from '@/admin/editors/global/ui/EditorFields';
import { PortraitStatus } from '@/admin/editors/global/people/PortraitStatus';
import type { PairedRows } from '@/admin/editors/global/pairedCollections';
import type { FacdevIssues, FacdevLead, FacdevLeadField } from './types';

type LeadFieldSpec = {
  readonly field: FacdevLeadField;
  readonly zh: string;
  readonly en: string;
  readonly type?: 'email';
};

const FIELDS: readonly LeadFieldSpec[] = [
  { field: 'name', zh: '姓名', en: 'name' }, { field: 'alternateName', zh: '別名', en: 'alternate name' },
  { field: 'roleKey', zh: '職稱鍵', en: 'role key' }, { field: 'role', zh: '職稱', en: 'role' },
  { field: 'department', zh: '部門', en: 'department' }, { field: 'slug', zh: '照片代稱', en: 'portrait slug' },
  { field: 'hubId', zh: '學術檔案 ID', en: 'academic profile ID' }, { field: 'duty', zh: '職務', en: 'duty' },
  { field: 'ext', zh: '分機', en: 'extension' }, { field: 'email', zh: '電子郵件', en: 'email', type: 'email' },
];

export function FacdevLeadFields({ index, leads, issues, onChange }: {
  readonly index: number; readonly leads: PairedRows<FacdevLead>; readonly issues: FacdevIssues;
  readonly onChange: (leads: PairedRows<FacdevLead>) => void;
}) {
  const change = (locale: 'zh' | 'en', field: FacdevLeadField, value: string): void => {
    if (value === leads[locale][field]) return;
    onChange({ ...leads, [locale]: { ...leads[locale], [field]: value } });
  };
  return <div className="admin-stack">
    {FIELDS.map((spec) => <EditorBilingualFields key={spec.field} label={`第 ${index + 1} 組負責人${spec.zh} / Lead ${spec.en}`}
      zh={<EditorTextField lang="zh-Hant" type={spec.type} label={`繁體中文第 ${index + 1} 組負責人${spec.zh}`} value={leads.zh[spec.field]} path={['zh', 'groups', index, 'lead', spec.field]} issues={issues} onChange={(event) => change('zh', spec.field, event.currentTarget.value)} />}
      en={<EditorTextField lang="en" type={spec.type} label={`English group ${index + 1} lead ${spec.en}`} value={leads.en[spec.field]} path={['en', 'groups', index, 'lead', spec.field]} issues={issues} onChange={(event) => change('en', spec.field, event.currentTarget.value)} />}
    />)}
    <EditorBilingualFields label={`第 ${index + 1} 組負責人照片狀態 / Lead portrait status`} description="照片連結由現有媒體工作區管理。"
      zh={<PortraitStatus person={leads.zh} isZh />}
      en={<PortraitStatus person={leads.en} isZh={false} />}
    />
  </div>;
}
