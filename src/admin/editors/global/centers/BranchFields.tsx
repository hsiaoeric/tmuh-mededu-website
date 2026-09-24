import type { StructuredEditorIssueSummary as GlobalEditorIssueSummary } from '@/admin/editors/shared';
import {
  EditorBilingualFields,
  EditorTextareaField,
  EditorTextField,
} from '../ui/EditorFields';
import { updateBranchText } from './operations';
import type { BranchRecord, CentersPayload } from './types';

type BranchFieldsProps = {
  readonly centerIndex: number;
  readonly index: number;
  readonly zh: BranchRecord;
  readonly en: BranchRecord;
  readonly payload: CentersPayload;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onChange: (payload: CentersPayload) => void;
};

export function BranchFields({ centerIndex, index, zh, en, payload, issues, onChange }: BranchFieldsProps) {
  const zhPath = ['zh', 'centers', centerIndex, 'branches', index] as const;
  const enPath = ['en', 'centers', centerIndex, 'branches', index] as const;
  return (
    <div className="admin-editor-section-content">
      <EditorTextField
        label={`分支識別碼（中英文共用），第 ${index + 1} 個分支 / Shared branch ID, branch ${index + 1}`}
        helper="同一中心內必須唯一；修改時會同步套用繁中與英文資料。Must be unique within this center; edits update both languages together."
        value={zh.id}
        issues={issues}
        path={[...zhPath, 'id']}
        onChange={(event) => onChange(updateBranchText(
          updateBranchText(payload, { locale: 'zh', centerIndex, index, field: 'id', value: event.currentTarget.value }),
          { locale: 'en', centerIndex, index, field: 'id', value: event.currentTarget.value },
        ))}
      />
      <EditorBilingualFields
        label="分支名稱"
        zh={<EditorTextField label="繁中分支名稱" value={zh.name} issues={issues} path={[...zhPath, 'name']} onChange={(event) => onChange(updateBranchText(payload, { locale: 'zh', centerIndex, index, field: 'name', value: event.currentTarget.value }))} />}
        en={<EditorTextField label="英文分支名稱" value={en.name} issues={issues} path={[...enPath, 'name']} onChange={(event) => onChange(updateBranchText(payload, { locale: 'en', centerIndex, index, field: 'name', value: event.currentTarget.value }))} />}
      />
      <EditorBilingualFields
        label="分支說明"
        zh={<EditorTextareaField label="繁中分支說明" value={zh.description} issues={issues} path={[...zhPath, 'description']} onChange={(event) => onChange(updateBranchText(payload, { locale: 'zh', centerIndex, index, field: 'description', value: event.currentTarget.value }))} />}
        en={<EditorTextareaField label="英文分支說明" value={en.description} issues={issues} path={[...enPath, 'description']} onChange={(event) => onChange(updateBranchText(payload, { locale: 'en', centerIndex, index, field: 'description', value: event.currentTarget.value }))} />}
      />
    </div>
  );
}
