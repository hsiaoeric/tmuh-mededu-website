import { AdminCheckbox, AdminField, AdminTextarea } from '@/admin/AdminFields';
import type { ChangeEvent } from 'react';
import {
  fieldIdForStructuredEditorIssuePath as fieldIdForIssuePath,
} from '@/admin/editors/shared';
import {
  EditorBilingualFields,
  EditorTextareaField,
  EditorTextField,
} from '@/admin/editors/global/ui/EditorFields';
import type { HolisticIssues } from './types';

export type PairValues<Value> = {
  readonly zh: Value;
  readonly en: Value;
};

type PairFieldCopy = {
  readonly label: string;
  readonly zh: string;
  readonly en: string;
  readonly description?: string;
};

type PairFieldBase<Value> = {
  readonly copy: PairFieldCopy;
  readonly paths: PairValues<readonly PropertyKey[]>;
  readonly values: PairValues<Value>;
  readonly issues: HolisticIssues;
  readonly errors?: PairValues<string | undefined>;
  readonly onChange: PairValues<(value: Value) => void>;
};

function issueFor(path: readonly PropertyKey[], issues: HolisticIssues): string | undefined {
  const id = fieldIdForIssuePath(path);
  return issues.find((summary) => summary.fieldId === id)?.message;
}

type PairedTextFieldProps = PairFieldBase<string> & {
  readonly multiline?: boolean;
};

export function PairedTextField(props: PairedTextFieldProps) {
  const Field = props.multiline ? EditorTextareaField : EditorTextField;
  const field = (locale: 'zh' | 'en') => {
    const error = props.errors?.[locale];
    if (error !== undefined) {
      const shared = {
        id: fieldIdForIssuePath(props.paths[locale]),
        label: props.copy[locale],
        value: props.values[locale],
        error,
        onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => props.onChange[locale](event.currentTarget.value),
      };
      return props.multiline ? <AdminTextarea {...shared} /> : <AdminField {...shared} />;
    }
    return <Field path={props.paths[locale]} issues={props.issues} label={props.copy[locale]} value={props.values[locale]} onChange={(event) => props.onChange[locale](event.currentTarget.value)} />;
  };
  return (
    <EditorBilingualFields
      label={props.copy.label}
      description={props.copy.description}
      zh={field('zh')}
      en={field('en')}
    />
  );
}

const COMPLETE_NUMBER = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i;
const NUMBER_ERROR = '請輸入有效數字，可使用 0、負數或小數。';
const INTEGER_ERROR = '請輸入完整整數年份，例如 2026 或 2026.0。';

export function numberDraft(value: string): number | string {
  if (!COMPLETE_NUMBER.test(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

function validNumber(value: number | string, integer: boolean): boolean {
  const parsed = typeof value === 'number' ? value : numberDraft(value);
  return typeof parsed === 'number' && Number.isFinite(parsed) && (!integer || Number.isInteger(parsed));
}

type PairedNumberFieldProps = PairFieldBase<number | string | undefined> & {
  readonly integer?: boolean;
  readonly optional?: boolean;
};

export function PairedNumberField(props: PairedNumberFieldProps) {
  const integer = props.integer ?? false;
  const optional = props.optional ?? false;
  const field = (locale: 'zh' | 'en') => {
    const value = props.values[locale];
    const emptyOptional = optional && value === undefined;
    const localError = emptyOptional || validNumber(value ?? '', integer)
      ? undefined
      : integer ? INTEGER_ERROR : NUMBER_ERROR;
    const error = props.errors?.[locale] ?? localError ?? issueFor(props.paths[locale], props.issues);
    return (
      <AdminField
        id={fieldIdForIssuePath(props.paths[locale])}
        label={props.copy[locale]}
        value={value === undefined ? '' : String(value)}
        inputMode="decimal"
        error={error}
        onChange={(event) => {
          const authored = event.currentTarget.value;
          props.onChange[locale](optional && authored === '' ? undefined : numberDraft(authored));
        }}
      />
    );
  };
  return <EditorBilingualFields label={props.copy.label} description={props.copy.description} zh={field('zh')} en={field('en')} />;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const COLOR_ERROR = '請輸入 # 加上 6 位十六進位色碼，例如 #4f8c7d。';

type PairedColorFieldProps = PairFieldBase<string>;

export function PairedColorField(props: PairedColorFieldProps) {
  const field = (locale: 'zh' | 'en') => {
    const valid = HEX_COLOR.test(props.values[locale]);
    return (
      <AdminField
        id={fieldIdForIssuePath(props.paths[locale])}
        label={props.copy[locale]}
        value={props.values[locale]}
        status={valid ? 'valid' : undefined}
        helper={valid ? '色碼有效' : undefined}
        error={valid ? issueFor(props.paths[locale], props.issues) : COLOR_ERROR}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => props.onChange[locale](event.currentTarget.value)}
      />
    );
  };
  return <EditorBilingualFields label={props.copy.label} zh={field('zh')} en={field('en')} />;
}

type PairedCheckboxFieldProps = Omit<PairFieldBase<boolean>, 'paths' | 'issues' | 'errors'>;

export function PairedCheckboxField(props: PairedCheckboxFieldProps) {
  return (
    <EditorBilingualFields
      label={props.copy.label}
      zh={<AdminCheckbox label={props.copy.zh} checked={props.values.zh} onChange={(event) => props.onChange.zh(event.currentTarget.checked)} />}
      en={<AdminCheckbox label={props.copy.en} checked={props.values.en} onChange={(event) => props.onChange.en(event.currentTarget.checked)} />}
    />
  );
}
