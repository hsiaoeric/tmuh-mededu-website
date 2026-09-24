import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { FacdevCopyFields, type CopyFieldSpec } from './FacdevCopyFields';
import type { FacdevCommit, FacdevIssues, FacdevPayload } from './types';

const FIELDS = [
  { field: 'eyebrow', label: '頁首眉標 / Eyebrow', zhLabel: '繁體中文頁首眉標', enLabel: 'English eyebrow' },
  { field: 'heroTitle', label: '主標題 / Hero title', zhLabel: '繁體中文主標題', enLabel: 'English hero title' },
  { field: 'heroTag', label: '頁首說明 / Hero tag', zhLabel: '繁體中文頁首說明', enLabel: 'English hero tag', multiline: true },
  { field: 'servicesEyebrow', label: '服務眉標 / Services eyebrow', zhLabel: '繁體中文服務眉標', enLabel: 'English services eyebrow' },
  { field: 'servicesTitle', label: '服務標題 / Services title', zhLabel: '繁體中文服務標題', enLabel: 'English services title' },
  { field: 'servicesDesc', label: '服務說明 / Services description', zhLabel: '繁體中文服務說明', enLabel: 'English services description', multiline: true },
  { field: 'groupsEyebrow', label: '小組眉標 / Groups eyebrow', zhLabel: '繁體中文小組眉標', enLabel: 'English groups eyebrow' },
  { field: 'groupsTitle', label: '小組標題 / Groups title', zhLabel: '繁體中文小組標題', enLabel: 'English groups title' },
  { field: 'groupsDesc', label: '小組說明 / Groups description', zhLabel: '繁體中文小組說明', enLabel: 'English groups description', multiline: true },
  { field: 'groupLeadLabel', label: '負責人標籤 / Lead label', zhLabel: '繁體中文負責人標籤', enLabel: 'English lead label' },
  { field: 'groupRoot', label: '小組根節點 / Group root', zhLabel: '繁體中文小組根節點', enLabel: 'English group root' },
  { field: 'membersTitle', label: '成員標題 / Members title', zhLabel: '繁體中文成員標題', enLabel: 'English members title' },
  { field: 'actEyebrow', label: '活動眉標 / Activities eyebrow', zhLabel: '繁體中文活動眉標', enLabel: 'English activities eyebrow' },
  { field: 'actTitle', label: '活動標題 / Activities title', zhLabel: '繁體中文活動標題', enLabel: 'English activities title' },
] as const satisfies readonly CopyFieldSpec[];

export function FacdevScalarCopy(props: { readonly payload: FacdevPayload; readonly issues: FacdevIssues; readonly onChange: FacdevCommit }) {
  return <EditorSection id="facdev-scalar-copy" title="頁面主要文字" description="繁體中文與英文欄位成對顯示，文字內容各自保存。"><FacdevCopyFields {...props} fields={FIELDS} /></EditorSection>;
}
