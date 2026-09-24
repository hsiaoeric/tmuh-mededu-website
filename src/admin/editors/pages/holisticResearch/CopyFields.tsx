import { EditorBilingualFields, EditorTextField } from '@/admin/editors/global/ui/EditorFields';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import type { ResearchEditorPartProps, ResearchLocale } from './types';

type TextKey = {
  readonly [K in keyof ResearchLocale]: ResearchLocale[K] extends string ? K : never;
}[keyof ResearchLocale];

const COPY_FIELDS = [
  ['eyebrow', '頁面眉標'], ['title', '頁面標題'], ['desc', '頁面說明'],
  ['totalLabel', '論文總數標籤'], ['byYearTitle', '年度統計標題'],
  ['clinicalTitle', '臨床研究標題'], ['clinicalDesc', '臨床研究說明'],
  ['clinicalLegend', '臨床研究圖例'], ['eduTitle', '教育論文標題'],
  ['eduDesc', '教育論文說明'], ['eduLegend', '教育論文圖例'],
  ['authorsLabel', '作者標籤'],
] as const satisfies readonly (readonly [TextKey, string])[];

export function CopyFields({ payload, issues, onPayloadChange }: ResearchEditorPartProps) {
  const changeText = (locale: 'zh' | 'en', key: TextKey, value: string): void => {
    if (payload[locale][key] === value) return;
    onPayloadChange({ ...payload, [locale]: { ...payload[locale], [key]: value } });
  };
  return (
    <EditorSection id="holistic-research-copy" title="全人研究內容" description="繁體中文在前，英文在後；編輯會保留未變更的欄位與清單順序。">
      {COPY_FIELDS.map(([key, label]) => (
        <EditorBilingualFields
          key={key}
          label={label}
          zh={<EditorTextField label={`繁體中文${label}`} path={['zh', key]} issues={issues} value={payload.zh[key]} onChange={(event) => changeText('zh', key, event.currentTarget.value)} />}
          en={<EditorTextField label={`English ${label}`} path={['en', key]} issues={issues} value={payload.en[key]} onChange={(event) => changeText('en', key, event.currentTarget.value)} />}
        />
      ))}
    </EditorSection>
  );
}
