import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { FacdevCopyFields, type CopyFieldSpec } from './FacdevCopyFields';
import type { FacdevCommit, FacdevIssues, FacdevPayload } from './types';

const FIELDS = [
  { field: 'newsEyebrow', label: '公告眉標 / News eyebrow', zhLabel: '繁體中文公告眉標', enLabel: 'English news eyebrow' },
  { field: 'newsTitle', label: '公告標題 / News title', zhLabel: '繁體中文公告標題', enLabel: 'English news title' },
  { field: 'reservedTag', label: '預留標籤 / Reserved tag', zhLabel: '繁體中文預留標籤', enLabel: 'English reserved tag' },
  { field: 'reservedNote', label: '預留說明 / Reserved note', zhLabel: '繁體中文預留說明', enLabel: 'English reserved note', multiline: true },
  { field: 'closingTitle', label: '結尾標題 / Closing title', zhLabel: '繁體中文結尾標題', enLabel: 'English closing title' },
  { field: 'closingBody', label: '結尾內文 / Closing body', zhLabel: '繁體中文結尾內文', enLabel: 'English closing body', multiline: true },
] as const satisfies readonly CopyFieldSpec[];

export function FacdevNewsClosingCopy(props: { readonly payload: FacdevPayload; readonly issues: FacdevIssues; readonly onChange: FacdevCommit }) {
  return <EditorSection id="facdev-news-closing-copy" title="公告與結尾文字"><FacdevCopyFields {...props} fields={FIELDS} /></EditorSection>;
}
