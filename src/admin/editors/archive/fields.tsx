import { useEffect, useState, type ReactNode } from 'react';
import { AdminField, AdminSelect, type AdminSelectOption } from '@/admin/AdminFields';
import { fieldIdForStructuredEditorIssuePath } from '@/admin/editors/shared';
import { useEditorDensity } from '@/admin/editors/global/ui/EditorDensity';
import { checkHref, hrefErrorMessage, hrefHelper } from './hrefs';
import { lockedIdHelper } from './copy';
import { slugIdMessage, slugIdProblem } from './ids';
import type { ArchiveCommitResult, ArchiveIssues, JsonPath } from './archiveTypes';

/** The admin's language, from the workspace; Chinese when an editor renders on its own. */
export function useIsZh(): boolean {
  return useEditorDensity().isZh;
}

export function issueFor(path: JsonPath, issues: ArchiveIssues): string | undefined {
  const id = fieldIdForStructuredEditorIssuePath(path);
  return issues.find((summary) => summary.fieldId === id)?.message;
}

/** Issues at or below `path`, such as every problem inside one collapsed post. */
export function issuesWithin(path: JsonPath, issues: ArchiveIssues): ArchiveIssues {
  return issues.filter((summary) => (
    summary.issue.path.length >= path.length && path.every((segment, index) => summary.issue.path[index] === segment)
  ));
}

type BaseFieldProps = {
  readonly path: JsonPath;
  readonly issues: ArchiveIssues;
  readonly label: string;
  readonly helper?: string;
  readonly required?: boolean;
  /** Full accessible name when the visible label is shortened by its surroundings. */
  readonly accessibleLabel?: string;
};

const REQUIRED_TEXT = { zh: '必填', en: 'Required' } as const;

export function requiredText(isZh: boolean): string {
  return isZh ? REQUIRED_TEXT.zh : REQUIRED_TEXT.en;
}

type TextProps = BaseFieldProps & {
  readonly value: string;
  readonly onChange: (value: string) => ArchiveCommitResult | void;
  readonly error?: string;
  readonly type?: 'text' | 'url' | 'search';
  readonly mono?: boolean;
  readonly readOnly?: boolean;
  readonly placeholder?: string;
  readonly lang?: string;
};

export function TextField({ path, issues, label, helper, required, value, onChange, error, type = 'text', mono, readOnly, placeholder, lang, accessibleLabel }: TextProps) {
  const isZh = useIsZh();
  return (
    <AdminField
      id={fieldIdForStructuredEditorIssuePath(path)}
      label={label}
      helper={helper}
      error={error ?? issueFor(path, issues)}
      required={required}
      requiredText={requiredText(isZh)}
      type={type}
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      lang={lang}
      {...(accessibleLabel === undefined ? {} : { 'aria-label': accessibleLabel })}
      className={mono ? 'mono' : undefined}
      spellCheck={mono ? false : undefined}
      autoComplete="off"
      onChange={(event) => { onChange(event.currentTarget.value); }}
    />
  );
}

type SelectProps = BaseFieldProps & {
  readonly value: string;
  readonly options: readonly AdminSelectOption[];
  readonly onChange: (value: string) => ArchiveCommitResult | void;
};

/** A select that keeps showing a value outside its options, so a broken reference stays visible. */
export function SelectField({ path, issues, label, helper, required, value, options, onChange, accessibleLabel }: SelectProps) {
  const isZh = useIsZh();
  const known = options.some((option) => option.value === value);
  const shown = known ? options : [...options, { value, label: isZh ? `${value}（無效）` : `${value} (invalid)` }];
  return (
    <AdminSelect
      id={fieldIdForStructuredEditorIssuePath(path)}
      label={label}
      helper={helper}
      error={issueFor(path, issues)}
      required={required}
      value={value}
      options={shown}
      {...(accessibleLabel === undefined ? {} : { 'aria-label': accessibleLabel })}
      onChange={(event) => { onChange(event.currentTarget.value); }}
    />
  );
}

type DateProps = BaseFieldProps & {
  readonly value: string | undefined;
  /** `undefined` clears an optional date. */
  readonly onChange: (value: string | undefined) => ArchiveCommitResult | void;
};

export function DateField({ path, issues, label, helper, required, value, onChange }: DateProps) {
  const isZh = useIsZh();
  return (
    <AdminField
      id={fieldIdForStructuredEditorIssuePath(path)}
      label={label}
      helper={helper}
      error={issueFor(path, issues)}
      required={required}
      requiredText={requiredText(isZh)}
      type="date"
      value={value ?? ''}
      onChange={(event) => {
        const next = event.currentTarget.value;
        onChange(next === '' && !required ? undefined : next);
      }}
    />
  );
}

type NumberProps = BaseFieldProps & {
  readonly value: number;
  readonly min?: number;
  readonly onChange: (value: number) => ArchiveCommitResult | void;
};

const WHOLE_NUMBER = /^\d+$/u;

/** A whole-number field that keeps a half-typed value locally until it is a number again. */
export function OrderField({ path, issues, label, helper, value, min = 0, onChange }: NumberProps) {
  const isZh = useIsZh();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => {
    setDraft((current) => (Number(current) === value && WHOLE_NUMBER.test(current) ? current : String(value)));
  }, [value]);
  const invalid = !WHOLE_NUMBER.test(draft) || Number(draft) < min;
  return (
    <AdminField
      id={fieldIdForStructuredEditorIssuePath(path)}
      label={label}
      helper={helper ?? (isZh ? '數字越小越前面。' : 'Lower numbers come first.')}
      error={invalid ? (isZh ? `請輸入 ${min} 以上的整數。` : `Enter a whole number of ${min} or more.`) : issueFor(path, issues)}
      inputMode="numeric"
      value={draft}
      className="admin-archive-order"
      onChange={(event) => {
        const next = event.currentTarget.value.trim();
        setDraft(next);
        if (WHOLE_NUMBER.test(next) && Number(next) >= min) onChange(Number(next));
      }}
    />
  );
}

type HrefProps = BaseFieldProps & {
  readonly value: string;
  readonly allowFile: boolean;
  readonly onChange: (value: string) => ArchiveCommitResult | void;
};

/** A link target, checked as it is typed against the same rules publication enforces. */
export function HrefField({ path, issues, label, required = true, value, allowFile, onChange, accessibleLabel }: HrefProps) {
  const isZh = useIsZh();
  const check = checkHref(value, allowFile);
  const localError = check.status === 'empty' && !required ? undefined : hrefErrorMessage(check, allowFile, isZh);
  return (
    <AdminField
      id={fieldIdForStructuredEditorIssuePath(path)}
      label={label}
      helper={hrefHelper(check, isZh)}
      status={check.status === 'valid' && check.kind === 'http' ? 'warning' : undefined}
      error={localError ?? issueFor(path, issues)}
      required={required}
      requiredText={requiredText(isZh)}
      type="text"
      inputMode="url"
      value={value}
      className="mono"
      spellCheck={false}
      autoComplete="off"
      placeholder={allowFile ? 'https://… / files/legacy/…' : 'https://…'}
      {...(accessibleLabel === undefined ? {} : { 'aria-label': accessibleLabel })}
      onChange={(event) => { onChange(event.currentTarget.value.trim()); }}
    />
  );
}

type IdProps = BaseFieldProps & {
  readonly value: string;
  readonly locked: boolean;
  /** Ids of the other items in the same collection. */
  readonly others: readonly string[];
  readonly onChange: (value: string) => ArchiveCommitResult | void;
};

/**
 * An item id. Ids appear in public URLs and legacy redirects, so once published (or redirected
 * to) they are read-only; a new item's id can still be corrected before it goes live.
 */
export function IdField({ path, issues, label, value, locked, others, onChange }: IdProps) {
  const isZh = useIsZh();
  const problem = locked ? null : slugIdProblem(value, others);
  return (
    <AdminField
      id={fieldIdForStructuredEditorIssuePath(path)}
      label={label}
      helper={locked ? lockedIdHelper(isZh) : (isZh ? '出現在網址中；發布後不能修改。' : 'Appears in the URL; it cannot change after publishing.')}
      error={problem === null ? issueFor(path, issues) : slugIdMessage(problem, isZh)}
      readOnly={locked}
      required={!locked}
      requiredText={requiredText(isZh)}
      value={value}
      className="mono"
      spellCheck={false}
      autoComplete="off"
      data-id-locked={locked || undefined}
      onChange={(event) => { if (!locked) onChange(event.currentTarget.value.trim().toLowerCase()); }}
    />
  );
}

export function FieldGrid({ children }: { readonly children: ReactNode }) {
  return <div className="admin-field-grid admin-archive-field-grid">{children}</div>;
}
