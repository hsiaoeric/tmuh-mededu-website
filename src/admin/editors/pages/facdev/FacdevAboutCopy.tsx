import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { FacdevCopyFields, type CopyFieldSpec } from './FacdevCopyFields';
import type { FacdevCommit, FacdevIssues, FacdevPayload } from './types';

const FIELDS = [
  { field: 'aboutEyebrow', label: '關於眉標 / About eyebrow', zhLabel: '繁體中文關於眉標', enLabel: 'English about eyebrow' },
  { field: 'aboutTitle', label: '關於標題 / About title', zhLabel: '繁體中文關於標題', enLabel: 'English about title' },
  { field: 'aboutBody', label: '關於內文一 / About body one', zhLabel: '繁體中文關於內文一', enLabel: 'English about body one', multiline: true },
  { field: 'aboutBody2', label: '關於內文二 / About body two', zhLabel: '繁體中文關於內文二', enLabel: 'English about body two', multiline: true },
] as const satisfies readonly CopyFieldSpec[];

export function FacdevAboutCopy(props: { readonly payload: FacdevPayload; readonly issues: FacdevIssues; readonly onChange: FacdevCommit }) {
  return <EditorSection id="facdev-about-copy" title="中心定位"><FacdevCopyFields {...props} fields={FIELDS} /></EditorSection>;
}
