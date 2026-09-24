import type { ChangeEvent } from 'react';
import type { StructuredEditorIssueSummary as GlobalEditorIssueSummary } from '@/admin/editors/shared';
import {
  EditorBilingualFields,
  EditorTextField,
} from '../ui/EditorFields';
import type {
  Activity,
  ActivityScope,
  LocalActivityField,
} from './activityTypes';

type FieldCopy = {
  readonly key: LocalActivityField;
  readonly pairLabel: string;
  readonly zhLabel: string;
  readonly enLabel: string;
};

const FIELD_COPY: readonly FieldCopy[] = [
  { key: 'cat', pairLabel: '活動分類 / Category', zhLabel: '活動分類', enLabel: 'Activity category' },
  { key: 'title', pairLabel: '活動名稱 / Title', zhLabel: '活動名稱', enLabel: 'Activity title' },
  { key: 'date', pairLabel: '日期與時間 / Date and time', zhLabel: '日期與時間', enLabel: 'Date and time' },
  { key: 'place', pairLabel: '地點 / Place', zhLabel: '活動地點', enLabel: 'Activity place' },
  { key: 'speaker', pairLabel: '講者 / Speaker', zhLabel: '講者', enLabel: 'Speaker' },
  { key: 'topic', pairLabel: '主題 / Topic', zhLabel: '活動主題', enLabel: 'Activity topic' },
  { key: 'enrolled', pairLabel: '報名人數 / Enrollment', zhLabel: '報名人數', enLabel: 'Enrollment' },
  { key: 'status', pairLabel: '狀態 / Status', zhLabel: '活動狀態', enLabel: 'Activity status' },
] as const;

type ActivityFieldsProps = {
  readonly scope: ActivityScope;
  readonly index: number;
  readonly pairLabel: string;
  readonly zh: Activity;
  readonly en: Activity;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onZhChange: (field: LocalActivityField, value: string) => void;
  readonly onEnChange: (field: LocalActivityField, value: string) => void;
  readonly onSharedChange: (field: 'sortDate' | 'link', value: string) => void;
};

function helper(field: LocalActivityField, locale: 'zh' | 'en'): string | undefined {
  if (field === 'date') {
    return locale === 'zh'
      ? '格式：YYYY/MM/DD（週）HH:MM–HH:MM'
      : 'Format: Ddd YYYY/MM/DD HH:MM–HH:MM';
  }
  return undefined;
}

export function ActivityFields(props: ActivityFieldsProps) {
  return (
    <div className="admin-editor-activity-fields">
      <EditorTextField
        path={['zh', props.scope, props.index, 'sortDate']}
        issues={props.issues}
        label={`${props.pairLabel}：共用排序日期`}
        helper="中英文共用，格式 YYYY-MM-DD。"
        value={props.zh.sortDate}
        onChange={(event) => props.onSharedChange('sortDate', event.currentTarget.value)}
      />
      <EditorTextField
        path={['zh', props.scope, props.index, 'link']}
        issues={props.issues}
        label={`${props.pairLabel}：共用報名連結`}
        helper="可留空；填寫時須使用不含帳密的 HTTPS 完整網址。"
        value={props.zh.link}
        spellCheck={false}
        onChange={(event) => props.onSharedChange('link', event.currentTarget.value)}
      />
      {FIELD_COPY.map((field) => (
        <EditorBilingualFields
          key={field.key}
          label={`${props.pairLabel}：${field.pairLabel}`}
          zh={(
            <EditorTextField
              path={['zh', props.scope, props.index, field.key]}
              issues={props.issues}
              label={`${field.zhLabel}（繁體中文）`}
              helper={helper(field.key, 'zh')}
              value={props.zh[field.key]}
              onChange={(event: ChangeEvent<HTMLInputElement>) => props.onZhChange(field.key, event.currentTarget.value)}
            />
          )}
          en={(
            <EditorTextField
              path={['en', props.scope, props.index, field.key]}
              issues={props.issues}
              label={`${field.enLabel} (English)`}
              helper={helper(field.key, 'en')}
              value={props.en[field.key]}
              onChange={(event: ChangeEvent<HTMLInputElement>) => props.onEnChange(field.key, event.currentTarget.value)}
            />
          )}
        />
      ))}
    </div>
  );
}
