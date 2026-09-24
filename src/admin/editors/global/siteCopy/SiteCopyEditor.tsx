import type { ChangeEvent } from 'react';
import type { StructuredEditorIssueSummary as GlobalEditorIssueSummary } from '@/admin/editors/shared';
import type { CmsPayloadByKind } from '@/content/contracts/registry';
import {
  EditorBilingualFields,
  EditorTextField,
  EditorTextareaField,
} from '../ui/EditorFields';
import { EditorSection } from '../ui/EditorSection';
import {
  SITE_COPY_INLINE_FIELDS,
  SITE_COPY_STRING_FIELDS,
  type SiteCopyInlineKey,
  type SiteCopyStringsKey,
} from './siteCopyFields';

type SiteCopyPayload = CmsPayloadByKind['site_copy'];

export type SiteCopyEditorProps = {
  readonly payload: SiteCopyPayload;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onChange: (payload: SiteCopyPayload) => void;
};

export function SiteCopyEditor({ payload, issues, onChange }: SiteCopyEditorProps) {
  const updateString = (locale: 'zh' | 'en', key: SiteCopyStringsKey, value: string) => {
    const localized = payload[locale];
    onChange({
      ...payload,
      [locale]: {
        ...localized,
        strings: { ...localized.strings, [key]: value },
      },
    });
  };
  const updateInline = (locale: 'zh' | 'en', key: SiteCopyInlineKey, value: string) => {
    const localized = payload[locale];
    onChange({
      ...payload,
      [locale]: {
        ...localized,
        inline: { ...localized.inline, [key]: value },
      },
    });
  };

  return (
    <>
      <EditorSection
        id="site-copy-strings"
        title="全站共用文字"
        description="依欄位逐一維護繁體中文與英文；繁體中文固定顯示在前。"
      >
        {SITE_COPY_STRING_FIELDS.map((field) => {
          const zhProps = {
            path: ['zh', 'strings', field.key],
            issues,
            label: `繁體中文 ${field.key}`,
            value: payload.zh.strings[field.key],
            onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => (
              updateString('zh', field.key, event.currentTarget.value)
            ),
          };
          const enProps = {
            path: ['en', 'strings', field.key],
            issues,
            label: `English ${field.key}`,
            value: payload.en.strings[field.key],
            onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => (
              updateString('en', field.key, event.currentTarget.value)
            ),
          };
          return (
            <EditorBilingualFields
              key={field.key}
              label={`${field.label} · ${field.key}`}
              zh={field.multiline
                ? <EditorTextareaField {...zhProps} />
                : <EditorTextField {...zhProps} />}
              en={field.multiline
                ? <EditorTextareaField {...enProps} />
                : <EditorTextField {...enProps} />}
            />
          );
        })}
      </EditorSection>
      <EditorSection
        id="site-copy-inline"
        title="頁面內嵌文字"
        description="維護無集合結構的固定介面文字。"
      >
        {SITE_COPY_INLINE_FIELDS.map((field) => (
          <EditorBilingualFields
            key={field.key}
            label={`${field.label} · ${field.key}`}
            zh={(
              <EditorTextField
                path={['zh', 'inline', field.key]}
                issues={issues}
                label={`繁體中文 ${field.key}`}
                value={payload.zh.inline[field.key]}
                onChange={(event) => updateInline('zh', field.key, event.currentTarget.value)}
              />
            )}
            en={(
              <EditorTextField
                path={['en', 'inline', field.key]}
                issues={issues}
                label={`English ${field.key}`}
                value={payload.en.inline[field.key]}
                onChange={(event) => updateInline('en', field.key, event.currentTarget.value)}
              />
            )}
          />
        ))}
      </EditorSection>
    </>
  );
}
