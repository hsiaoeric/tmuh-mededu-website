import type { ChangeEvent } from 'react';
import { AdminField } from '@/admin/AdminFields';
import {
  fieldIdForStructuredEditorIssuePath as fieldIdForIssuePath,
  type StructuredEditorIssueSummary,
} from '@/admin/editors/shared';
import {
  EditorBilingualFields,
  EditorTextareaField,
  EditorTextField,
} from '@/admin/editors/global/ui/EditorFields';
import type { LocaleKey } from './types';

const COMPLETE_NUMBER = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i;
const NUMBER_ERROR = '請輸入有效數字，可使用 0、負數或小數。';

type IssuesProps = {
  readonly issues: readonly StructuredEditorIssueSummary[];
};

type BilingualTextFieldProps = IssuesProps & {
  readonly label: string;
  readonly path: readonly PropertyKey[];
  readonly zh: string;
  readonly en: string;
  readonly multiline?: boolean;
  readonly onChange: (locale: LocaleKey, value: string) => void;
};

type NumberFieldProps = IssuesProps & {
  readonly label: string;
  readonly path: readonly PropertyKey[];
  readonly value: number | string;
  readonly onChange: (value: number | string) => void;
};

function issueFor(path: readonly PropertyKey[], issues: readonly StructuredEditorIssueSummary[]): string | undefined {
  const fieldId = fieldIdForIssuePath(path);
  return issues.find((summary) => summary.fieldId === fieldId)?.message;
}

function textControl(props: {
  readonly label: string;
  readonly path: readonly PropertyKey[];
  readonly issues: readonly StructuredEditorIssueSummary[];
  readonly value: string;
  readonly multiline: boolean;
  readonly onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return props.multiline
    ? <EditorTextareaField label={props.label} path={props.path} issues={props.issues} value={props.value} onChange={props.onChange} />
    : <EditorTextField label={props.label} path={props.path} issues={props.issues} value={props.value} onChange={props.onChange} />;
}

export function EbmBilingualTextField({ label, path, zh, en, multiline = false, issues, onChange }: BilingualTextFieldProps) {
  return (
    <EditorBilingualFields
      label={label}
      description="繁體中文在前，英文在後；兩個語系獨立輸入並保留原始順序。"
      zh={textControl({ label: `${label}（繁體中文）`, path: ['zh', ...path], issues, value: zh, multiline, onChange: (event) => onChange('zh', event.currentTarget.value) })}
      en={textControl({ label: `${label}（英文）`, path: ['en', ...path], issues, value: en, multiline, onChange: (event) => onChange('en', event.currentTarget.value) })}
    />
  );
}

export function EbmNumberField({ label, path, value, issues, onChange }: NumberFieldProps) {
  const source = String(value);
  const parsed = COMPLETE_NUMBER.test(source) ? Number(source) : null;
  const valid = parsed !== null && Number.isFinite(parsed);
  return (
    <AdminField
      id={fieldIdForIssuePath(path)}
      label={label}
      value={source}
      inputMode="decimal"
      error={valid ? issueFor(path, issues) : NUMBER_ERROR}
      onChange={(event) => {
        const nextSource = event.currentTarget.value;
        const nextNumber = COMPLETE_NUMBER.test(nextSource) ? Number(nextSource) : null;
        onChange(nextNumber !== null && Number.isFinite(nextNumber) ? nextNumber : nextSource);
      }}
    />
  );
}
