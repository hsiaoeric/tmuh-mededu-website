import type { ComponentProps } from 'react';
import {
  AdminField,
  AdminSelect,
  AdminTextarea,
  BilingualFieldPair,
} from '@/admin/AdminFields';
import {
  fieldIdForStructuredEditorIssuePath as fieldIdForIssuePath,
  type StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';

type ValidatedEditorField = {
  readonly path: readonly PropertyKey[];
  readonly issues: readonly GlobalEditorIssueSummary[];
};

type EditorTextFieldProps = Omit<ComponentProps<typeof AdminField>, 'id' | 'error'> & ValidatedEditorField;
type EditorTextareaFieldProps = Omit<ComponentProps<typeof AdminTextarea>, 'id' | 'error'> & ValidatedEditorField;
type EditorSelectFieldProps = Omit<ComponentProps<typeof AdminSelect>, 'id' | 'error'> & ValidatedEditorField;
type EditorBilingualFieldsProps = ComponentProps<typeof BilingualFieldPair>;

function validationFor(field: ValidatedEditorField): { readonly id: string; readonly error?: string } {
  const id = fieldIdForIssuePath(field.path);
  const error = field.issues.find((summary) => summary.fieldId === id)?.message;
  return error === undefined ? { id } : { id, error };
}

export function EditorTextField({ path, issues, ...fieldProps }: EditorTextFieldProps) {
  return <AdminField {...fieldProps} {...validationFor({ path, issues })} />;
}

export function EditorTextareaField({ path, issues, ...fieldProps }: EditorTextareaFieldProps) {
  return <AdminTextarea {...fieldProps} {...validationFor({ path, issues })} />;
}

export function EditorSelectField({ path, issues, ...fieldProps }: EditorSelectFieldProps) {
  return <AdminSelect {...fieldProps} {...validationFor({ path, issues })} />;
}

export function EditorBilingualFields(props: EditorBilingualFieldsProps) {
  return <BilingualFieldPair {...props} />;
}
