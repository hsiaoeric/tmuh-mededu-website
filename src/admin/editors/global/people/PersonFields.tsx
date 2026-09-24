import { ROLES } from '@/data/people';
import type { StructuredEditorIssueSummary as GlobalEditorIssueSummary } from '@/admin/editors/shared';
import {
  EditorBilingualFields,
  EditorSelectField,
  EditorTextField,
} from '../ui/EditorFields';
import { PortraitStatus } from './PortraitStatus';
import type { Locale, Person, PersonField } from './peopleEditorModel';

type FieldSpec = {
  readonly field: Exclude<PersonField, 'roleKey'>;
  readonly label: string;
  readonly zhLabel: string;
  readonly enLabel: string;
  readonly type?: 'email';
};

const FIELD_SPECS: readonly FieldSpec[] = [
  { field: 'name', label: '姓名 / Name', zhLabel: '繁體中文姓名', enLabel: 'English name' },
  { field: 'alternateName', label: '別名 / Alternate name', zhLabel: '繁體中文別名', enLabel: 'English alternate name' },
  { field: 'role', label: '職稱 / Role', zhLabel: '繁體中文職稱', enLabel: 'English role' },
  { field: 'department', label: '部門 / Department', zhLabel: '繁體中文部門', enLabel: 'English department' },
  { field: 'slug', label: '照片代稱 / Portrait slug', zhLabel: '繁體中文照片代稱', enLabel: 'English portrait slug' },
  { field: 'hubId', label: '學術檔案 ID / Academic profile ID', zhLabel: '繁體中文學術檔案 ID', enLabel: 'English academic profile ID' },
  { field: 'duty', label: '職務 / Duty', zhLabel: '繁體中文職務', enLabel: 'English duty' },
  { field: 'ext', label: '分機 / Extension', zhLabel: '繁體中文分機', enLabel: 'English extension' },
  { field: 'email', label: '電子郵件 / Email', zhLabel: '繁體中文電子郵件', enLabel: 'English email', type: 'email' },
];

const roleOptions = (locale: Locale) => [
  { value: '', label: locale === 'zh' ? '未選擇' : 'Not selected' },
  ...Object.entries(ROLES).map(([value, labels]) => ({
    value,
    label: locale === 'zh' ? labels[0] : labels[1],
  })),
];

type PersonFieldsProps = {
  readonly zh: Person;
  readonly en: Person;
  readonly zhPath: readonly PropertyKey[];
  readonly enPath: readonly PropertyKey[];
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly isZh: boolean;
  readonly onChange: (locale: Locale, field: PersonField, value: string) => void;
};

export function PersonFields({ zh, en, zhPath, enPath, issues, isZh, onChange }: PersonFieldsProps) {
  return (
    <>
      {FIELD_SPECS.slice(0, 2).map((spec) => (
        <EditorBilingualFields key={spec.field} label={spec.label}
          zh={<EditorTextField lang="zh-Hant" label={spec.zhLabel} value={zh[spec.field]} path={[...zhPath, spec.field]} issues={issues} onChange={(event) => onChange('zh', spec.field, event.currentTarget.value)} />}
          en={<EditorTextField lang="en" label={spec.enLabel} value={en[spec.field]} path={[...enPath, spec.field]} issues={issues} onChange={(event) => onChange('en', spec.field, event.currentTarget.value)} />}
        />
      ))}
      <EditorBilingualFields label="職稱鍵 / Role key"
        zh={<EditorSelectField lang="zh-Hant" label="繁體中文職稱鍵" value={zh.roleKey} options={roleOptions('zh')} path={[...zhPath, 'roleKey']} issues={issues} onChange={(event) => onChange('zh', 'roleKey', event.currentTarget.value)} />}
        en={<EditorSelectField lang="en" label="English role key" value={en.roleKey} options={roleOptions('en')} path={[...enPath, 'roleKey']} issues={issues} onChange={(event) => onChange('en', 'roleKey', event.currentTarget.value)} />}
      />
      {FIELD_SPECS.slice(2).map((spec) => (
        <EditorBilingualFields key={spec.field} label={spec.label}
          zh={<EditorTextField lang="zh-Hant" type={spec.type} label={spec.zhLabel} value={zh[spec.field]} path={[...zhPath, spec.field]} issues={issues} onChange={(event) => onChange('zh', spec.field, event.currentTarget.value)} />}
          en={<EditorTextField lang="en" type={spec.type} label={spec.enLabel} value={en[spec.field]} path={[...enPath, spec.field]} issues={issues} onChange={(event) => onChange('en', spec.field, event.currentTarget.value)} />}
        />
      ))}
      <EditorBilingualFields label="照片狀態（唯讀） / Portrait status (read-only)"
        description={isZh
          ? '照片上傳、更換與取消連結由現有媒體工作區管理。'
          : 'Upload, replacement, and unlinking are managed in the existing media workbench.'}
        zh={<PortraitStatus person={zh} isZh />}
        en={<PortraitStatus person={en} isZh={false} />}
      />
    </>
  );
}
