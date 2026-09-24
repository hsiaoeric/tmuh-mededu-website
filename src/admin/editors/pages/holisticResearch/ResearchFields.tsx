import type { ChangeEvent } from 'react';
import { EditorTextField } from '@/admin/editors/global/ui/EditorFields';
import type { AuthoredNumber, ResearchIssues } from './types';

const COMPLETE_NUMBER = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i;

export function authoredNumber(value: string): AuthoredNumber {
  if (!COMPLETE_NUMBER.test(value)) return value;
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
}

type ResearchNumberFieldProps = {
  readonly label: string;
  readonly path: readonly PropertyKey[];
  readonly value: AuthoredNumber;
  readonly issues: ResearchIssues;
  readonly onChange: (value: AuthoredNumber) => void;
};

export function ResearchNumberField({ label, path, value, issues, onChange }: ResearchNumberFieldProps) {
  const change = (event: ChangeEvent<HTMLInputElement>): void => {
    const next = authoredNumber(event.currentTarget.value);
    if (next !== value) onChange(next);
  };
  return (
    <EditorTextField
      label={label}
      path={path}
      issues={issues}
      value={String(value)}
      inputMode="decimal"
      onChange={change}
    />
  );
}
