import { AdminCheckbox } from '@/admin/AdminFields';
import type {
  StructuredEditorCommitResult as GlobalEditorCommitResult,
  StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';
import { EditorBilingualFields, EditorTextField } from '../ui/EditorFields';
import { setAnnouncementPinned, updateAnnouncementLocale, updateAnnouncementShared } from './newsModel';
import type { NewsAnnouncement, NewsLocale, NewsMutationResult, NewsPayload, NewsScope } from './newsTypes';
import { NewsLinesEditor } from './NewsLinesEditor';

type NewsAnnouncementFieldsProps = {
  readonly payload: NewsPayload;
  readonly scope: NewsScope;
  readonly index: number;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onChange: (result: NewsMutationResult) => GlobalEditorCommitResult;
};

type LocalTextField = 'tag' | 'title';
type OptionalTextField = 'statTop' | 'statTopLabel' | 'statBot' | 'statBotLabel';

function optionalField(row: NewsAnnouncement, field: OptionalTextField, value: string): NewsAnnouncement {
  switch (field) {
    case 'statTop': {
      const { statTop: _removed, ...rest } = row;
      return value === '' ? rest : { ...row, statTop: value };
    }
    case 'statTopLabel': {
      const { statTopLabel: _removed, ...rest } = row;
      return value === '' ? rest : { ...row, statTopLabel: value };
    }
    case 'statBot': {
      const { statBot: _removed, ...rest } = row;
      return value === '' ? rest : { ...row, statBot: value };
    }
    case 'statBotLabel': {
      const { statBotLabel: _removed, ...rest } = row;
      return value === '' ? rest : { ...row, statBotLabel: value };
    }
  }
}

export function NewsAnnouncementFields({ payload, scope, index, issues, onChange }: NewsAnnouncementFieldsProps) {
  const zh = payload.zh[scope][index];
  const en = payload.en[scope][index];
  if (zh === undefined || en === undefined) return null;
  const updateLocal = (locale: NewsLocale, field: LocalTextField, value: string) => onChange(updateAnnouncementLocale(
    payload, { scope, index, locale }, (row) => ({ ...row, [field]: value }),
  ));
  const updateOptional = (locale: NewsLocale, field: OptionalTextField, value: string) => onChange(updateAnnouncementLocale(
    payload, { scope, index, locale }, (row) => optionalField(row, field, value),
  ));
  const pair = (label: string, field: LocalTextField, zhLabel: string, enLabel: string) => (
    <EditorBilingualFields label={label}
      zh={<EditorTextField path={['zh', scope, index, field]} issues={issues} label={`${zhLabel}，第 ${index + 1} 則公告`} value={zh[field]} onChange={(event) => updateLocal('zh', field, event.currentTarget.value)} />}
      en={<EditorTextField path={['en', scope, index, field]} issues={issues} label={`${enLabel}, announcement ${index + 1}`} value={en[field]} onChange={(event) => updateLocal('en', field, event.currentTarget.value)} />}
    />
  );
  const optionalPair = (label: string, field: OptionalTextField, zhLabel: string, enLabel: string) => (
    <EditorBilingualFields label={label}
      zh={<EditorTextField path={['zh', scope, index, field]} issues={issues} label={`${zhLabel}，第 ${index + 1} 則公告`} value={zh[field] ?? ''} onChange={(event) => updateOptional('zh', field, event.currentTarget.value)} />}
      en={<EditorTextField path={['en', scope, index, field]} issues={issues} label={`${enLabel}, announcement ${index + 1}`} value={en[field] ?? ''} onChange={(event) => updateOptional('en', field, event.currentTarget.value)} />}
    />
  );
  const updateSharedText = (field: 'publishedOn' | 'category', value: string) => onChange(updateAnnouncementShared(
    payload, scope, index, (row) => ({ ...row, [field]: value }),
  ));
  const updateSharedOptional = (field: 'statTop' | 'statBot', value: string) => onChange(updateAnnouncementShared(
    payload, scope, index, (row) => optionalField(row, field, value),
  ));

  return (
    <div className="admin-stack">
      <AdminCheckbox switchControl checked={zh.pinned} label={`第 ${index + 1} 則公告置頂`} description="同步套用繁體中文與英文；公開網站會依置頂與日期排序。" onChange={(event) => onChange(setAnnouncementPinned(payload, scope, index, event.currentTarget.checked))} />
      <EditorTextField path={['zh', scope, index, 'publishedOn']} issues={issues} label={`公告日期，第 ${index + 1} 則公告`} helper="中英文共用，格式 YYYY-MM-DD。" value={zh.publishedOn} onChange={(event) => updateSharedText('publishedOn', event.currentTarget.value)} />
      <EditorTextField path={['zh', scope, index, 'category']} issues={issues} label={`公告分類，第 ${index + 1} 則公告`} helper="中英文共用：department、achievement 或 international。" value={zh.category} onChange={(event) => updateSharedText('category', event.currentTarget.value)} />
      {pair('公告標記', 'tag', '繁體中文標記', 'English tag')}
      {pair('公告標題', 'title', '繁體中文標題', 'English title')}
      <EditorTextField path={['zh', scope, index, 'statTop']} issues={issues} label={`共用上方統計值，第 ${index + 1} 則公告`} value={zh.statTop ?? ''} onChange={(event) => updateSharedOptional('statTop', event.currentTarget.value)} />
      {optionalPair('上方統計標籤', 'statTopLabel', '繁體中文上方統計標籤', 'English top stat label')}
      <EditorTextField path={['zh', scope, index, 'statBot']} issues={issues} label={`共用下方統計值，第 ${index + 1} 則公告`} value={zh.statBot ?? ''} onChange={(event) => updateSharedOptional('statBot', event.currentTarget.value)} />
      {optionalPair('下方統計標籤', 'statBotLabel', '繁體中文下方統計標籤', 'English bottom stat label')}
      <AdminCheckbox switchControl checked={zh.compactStat === true} label={`第 ${index + 1} 則公告使用緊湊統計字級`} description="僅保存語意選項；實際 CSS 字級由公開轉接器決定。" onChange={(event) => onChange(updateAnnouncementShared(payload, scope, index, (row) => ({ ...row, compactStat: event.currentTarget.checked })))} />
      <EditorBilingualFields label="公告內容行" description="兩種語言的行數可以獨立維護。"
        zh={<NewsLinesEditor payload={payload} scope={scope} index={index} locale="zh" issues={issues} onChange={onChange} />}
        en={<NewsLinesEditor payload={payload} scope={scope} index={index} locale="en" issues={issues} onChange={onChange} />}
      />
    </div>
  );
}
