import { EditorBilingualFields, EditorTextField, EditorTextareaField } from '@/admin/editors/global/ui/EditorFields';
import type { FacdevCommit, FacdevIssues, FacdevLocale, FacdevPayload } from './types';

export type CopyFieldSpec = {
  readonly field: keyof FacdevLocale;
  readonly label: string;
  readonly zhLabel: string;
  readonly enLabel: string;
  readonly multiline?: boolean;
};

type FacdevCopyFieldsProps = {
  readonly payload: FacdevPayload;
  readonly issues: FacdevIssues;
  readonly fields: readonly CopyFieldSpec[];
  readonly onChange: FacdevCommit;
};

export function FacdevCopyFields({ payload, issues, fields, onChange }: FacdevCopyFieldsProps) {
  return fields.map((spec) => {
    const zhValue = payload.zh[spec.field];
    const enValue = payload.en[spec.field];
    if (typeof zhValue !== 'string' || typeof enValue !== 'string') return null;
    const change = (locale: 'zh' | 'en', value: string): void => {
      if (value === payload[locale][spec.field]) return;
      onChange({ ...payload, [locale]: { ...payload[locale], [spec.field]: value } });
    };
    const Field = spec.multiline === true ? EditorTextareaField : EditorTextField;
    return (
      <EditorBilingualFields
        key={spec.field}
        label={spec.label}
        zh={<Field lang="zh-Hant" label={spec.zhLabel} value={zhValue} path={['zh', spec.field]} issues={issues} onChange={(event) => change('zh', event.currentTarget.value)} />}
        en={<Field lang="en" label={spec.enLabel} value={enValue} path={['en', spec.field]} issues={issues} onChange={(event) => change('en', event.currentTarget.value)} />}
      />
    );
  });
}
