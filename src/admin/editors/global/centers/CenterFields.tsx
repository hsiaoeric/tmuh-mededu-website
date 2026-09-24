import { AdminCheckbox } from '@/admin/AdminFields';
import {
  fieldIdForStructuredEditorIssuePath as fieldIdForIssuePath,
  type StructuredEditorCommit as GlobalEditorCommit,
  type StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';
import {
  EditorBilingualFields,
  EditorTextareaField,
  EditorTextField,
} from '../ui/EditorFields';
import {
  updateCenterDeep,
  updateCenterExternalUrl,
  updateCenterText,
} from './operations';
import type { CenterRecord, CentersPayload } from './types';

type CenterFieldsProps = {
  readonly index: number;
  readonly zh: CenterRecord;
  readonly en: CenterRecord;
  readonly payload: CentersPayload;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onChange: GlobalEditorCommit<CentersPayload>;
};

export function CenterFields({ index, zh, en, payload, issues, onChange }: CenterFieldsProps) {
  return (
    <div className="admin-editor-section-content">
      <EditorTextField
        label={`中心識別碼（中英文共用），第 ${index + 1} 個中心 / Shared center ID, center ${index + 1}`}
        helper="修改時會同步套用繁中與英文資料。Edits update both languages together."
        value={zh.id}
        issues={issues}
        path={['zh', 'centers', index, 'id']}
        onChange={(event) => onChange(updateCenterText(
          updateCenterText(payload, { locale: 'zh', index, field: 'id', value: event.currentTarget.value }),
          { locale: 'en', index, field: 'id', value: event.currentTarget.value },
        ))}
      />
      <EditorBilingualFields
        label="中心名稱"
        zh={<EditorTextField label="繁中中心名稱" value={zh.name} issues={issues} path={['zh', 'centers', index, 'name']} onChange={(event) => onChange(updateCenterText(payload, { locale: 'zh', index, field: 'name', value: event.currentTarget.value }))} />}
        en={<EditorTextField label="英文中心名稱" value={en.name} issues={issues} path={['en', 'centers', index, 'name']} onChange={(event) => onChange(updateCenterText(payload, { locale: 'en', index, field: 'name', value: event.currentTarget.value }))} />}
      />
      <EditorBilingualFields
        label="中心簡介"
        zh={<EditorTextareaField label="繁中中心簡介" value={zh.intro} issues={issues} path={['zh', 'centers', index, 'intro']} onChange={(event) => onChange(updateCenterText(payload, { locale: 'zh', index, field: 'intro', value: event.currentTarget.value }))} />}
        en={<EditorTextareaField label="英文中心簡介" value={en.intro} issues={issues} path={['en', 'centers', index, 'intro']} onChange={(event) => onChange(updateCenterText(payload, { locale: 'en', index, field: 'intro', value: event.currentTarget.value }))} />}
      />
      <EditorBilingualFields
        label="聯絡窗口"
        zh={<EditorTextField label="繁中聯絡窗口" value={zh.contact} issues={issues} path={['zh', 'centers', index, 'contact']} onChange={(event) => onChange(updateCenterText(payload, { locale: 'zh', index, field: 'contact', value: event.currentTarget.value }))} />}
        en={<EditorTextField label="英文聯絡窗口" value={en.contact} issues={issues} path={['en', 'centers', index, 'contact']} onChange={(event) => onChange(updateCenterText(payload, { locale: 'en', index, field: 'contact', value: event.currentTarget.value }))} />}
      />
      <EditorBilingualFields
        label="分機"
        zh={<EditorTextField label="繁中分機" value={zh.ext} issues={issues} path={['zh', 'centers', index, 'ext']} inputMode="numeric" onChange={(event) => onChange(updateCenterText(payload, { locale: 'zh', index, field: 'ext', value: event.currentTarget.value }))} />}
        en={<EditorTextField label="英文分機" value={en.ext} issues={issues} path={['en', 'centers', index, 'ext']} inputMode="numeric" onChange={(event) => onChange(updateCenterText(payload, { locale: 'en', index, field: 'ext', value: event.currentTarget.value }))} />}
      />
      <EditorBilingualFields
        label="外部網站（選填）"
        description="僅接受沒有帳號密碼的完整 HTTPS 網址；留白時不會建立欄位。"
        zh={<EditorTextField type="url" label="繁中外部網站" value={zh.externalUrl ?? ''} issues={issues} path={['zh', 'centers', index, 'externalUrl']} onChange={(event) => onChange(updateCenterExternalUrl(payload, { locale: 'zh', index, value: event.currentTarget.value }))} />}
        en={<EditorTextField type="url" label="英文外部網站" value={en.externalUrl ?? ''} issues={issues} path={['en', 'centers', index, 'externalUrl']} onChange={(event) => onChange(updateCenterExternalUrl(payload, { locale: 'en', index, value: event.currentTarget.value }))} />}
      />
      <EditorBilingualFields
        label="深層中心頁（選填）"
        description="未操作時保留原始缺省狀態。"
        zh={<AdminCheckbox id={fieldIdForIssuePath(['zh', 'centers', index, 'deep'])} label="繁中使用深層中心頁" checked={zh.deep ?? false} onChange={(event) => onChange(updateCenterDeep(payload, { locale: 'zh', index, value: event.currentTarget.checked }))} />}
        en={<AdminCheckbox id={fieldIdForIssuePath(['en', 'centers', index, 'deep'])} label="英文使用深層中心頁" checked={en.deep ?? false} onChange={(event) => onChange(updateCenterDeep(payload, { locale: 'en', index, value: event.currentTarget.checked }))} />}
      />
    </div>
  );
}
