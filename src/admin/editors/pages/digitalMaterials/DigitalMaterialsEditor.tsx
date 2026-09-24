import type { ChangeEvent } from 'react';
import {
  mapStructuredEditorIssues,
  type StructuredEditorCommit,
  type StructuredEditorCommitResult,
  type StructuredEditorIssueSummary,
} from '@/admin/editors/shared';
import type { EditableCmsPayloadByKind } from '@/content/contracts/registry';
import {
  EditorBilingualFields,
  EditorTextField,
  EditorTextareaField,
} from '../../global/ui/EditorFields';
import { EditorSection } from '../../global/ui/EditorSection';

type DigitalMaterialsPayload = EditableCmsPayloadByKind['digital_materials'];
type DigitalMaterialsField = keyof DigitalMaterialsPayload['zh'];
type Locale = keyof DigitalMaterialsPayload;

type FieldDefinition = {
  readonly key: DigitalMaterialsField;
  readonly legend: string;
  readonly zhLabel: string;
  readonly enLabel: string;
  readonly multiline: boolean;
};

type FieldChange = {
  readonly locale: Locale;
  readonly field: DigitalMaterialsField;
  readonly value: string;
};

const FIELDS = [
  { key: 'eyebrow', legend: '頁面眉標 / Eyebrow', zhLabel: '頁面眉標', enLabel: 'Eyebrow', multiline: false },
  { key: 'title', legend: '頁面標題 / Title', zhLabel: '頁面標題', enLabel: 'Title', multiline: false },
  { key: 'status', legend: '頁面狀態 / Status', zhLabel: '頁面狀態', enLabel: 'Status', multiline: false },
  { key: 'body', legend: '內容說明 / Body', zhLabel: '內容說明', enLabel: 'Body', multiline: true },
  { key: 'backLabel', legend: '返回連結文字 / Back label', zhLabel: '返回連結文字', enLabel: 'Back label', multiline: false },
] as const satisfies readonly FieldDefinition[];

const LOCALES = [
  { key: 'zh', message: '此欄位不可留白' },
  { key: 'en', message: 'This field is required' },
] as const satisfies readonly { readonly key: Locale; readonly message: string }[];

export type DigitalMaterialsEditorProps = {
  readonly payload: DigitalMaterialsPayload;
  readonly issues: readonly StructuredEditorIssueSummary[];
  readonly onChange: StructuredEditorCommit<DigitalMaterialsPayload>;
};

export function DigitalMaterialsEditor({
  payload,
  issues,
  onChange,
}: DigitalMaterialsEditorProps) {
  const requiredIssues = mapStructuredEditorIssues(FIELDS.flatMap((field) => (
    LOCALES.flatMap((locale) => (
      payload[locale.key][field.key].trim().length === 0
        ? [{ path: [locale.key, field.key], message: locale.message }]
        : []
    ))
  )));
  const mappedIssues = [
    ...issues,
    ...requiredIssues.filter((candidate) => (
      !issues.some((issue) => issue.fieldId === candidate.fieldId)
    )),
  ];
  const update = (change: FieldChange): StructuredEditorCommitResult => onChange({
    ...payload,
    [change.locale]: {
      ...payload[change.locale],
      [change.field]: change.value,
    },
  });

  return (
    <EditorSection
      id="digital-materials-editor"
      title="數位教材室頁面"
      description="依欄位成對維護繁體中文與英文；未填內容會保留並標示待修正。"
    >
      {FIELDS.map((field) => {
        const fieldFor = (locale: Locale) => ({
          path: [locale, field.key],
          issues: mappedIssues,
          required: true,
          requiredText: locale === 'zh' ? '必填' : 'Required',
          label: locale === 'zh'
            ? `${field.zhLabel}（繁體中文）`
            : `${field.enLabel} (English)`,
          value: payload[locale][field.key],
          onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update({
            locale,
            field: field.key,
            value: event.currentTarget.value,
          }),
        });
        return (
          <EditorBilingualFields
            key={field.key}
            label={field.legend}
            zh={field.multiline
              ? <EditorTextareaField {...fieldFor('zh')} />
              : <EditorTextField {...fieldFor('zh')} />}
            en={field.multiline
              ? <EditorTextareaField {...fieldFor('en')} />
              : <EditorTextField {...fieldFor('en')} />}
          />
        );
      })}
    </EditorSection>
  );
}
