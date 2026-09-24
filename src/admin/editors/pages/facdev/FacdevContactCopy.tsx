import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { FacdevCopyFields, type CopyFieldSpec } from './FacdevCopyFields';
import type { FacdevCommit, FacdevIssues, FacdevPayload } from './types';

const FIELDS = [
  { field: 'contactPerson', label: '聯絡人 / Contact person', zhLabel: '繁體中文聯絡人', enLabel: 'English contact person' },
  { field: 'contactExt', label: '聯絡分機 / Contact extension', zhLabel: '繁體中文聯絡分機', enLabel: 'English contact extension' },
  { field: 'contactPlace', label: '聯絡地點 / Contact place', zhLabel: '繁體中文聯絡地點', enLabel: 'English contact place' },
  { field: 'contactQuote', label: '聯絡引言 / Contact quote', zhLabel: '繁體中文聯絡引言', enLabel: 'English contact quote', multiline: true },
] as const satisfies readonly CopyFieldSpec[];

export function FacdevContactCopy(props: { readonly payload: FacdevPayload; readonly issues: FacdevIssues; readonly onChange: FacdevCommit }) {
  return <EditorSection id="facdev-contact-copy" title="聯絡資訊"><FacdevCopyFields {...props} fields={FIELDS} /></EditorSection>;
}
