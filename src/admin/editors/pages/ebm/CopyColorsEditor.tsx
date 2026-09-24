import type {
  StructuredEditorCommit,
  StructuredEditorIssueSummary,
} from '@/admin/editors/shared';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { EbmBilingualTextField } from './EbmFields';
import type { EbmLocale, EbmPayload, LocaleKey } from './types';

type ScalarKey = {
  readonly [Key in keyof EbmLocale]: EbmLocale[Key] extends string ? Key : never;
}[keyof EbmLocale];

const SCALARS = [
  ['eyebrow', '頁面眉標', false], ['heroTitle', '頁面標題', false], ['heroTag', '頁面引言', true],
  ['aboutEyebrow', '中心定位眉標', false], ['aboutTitle', '中心定位標題', false], ['aboutBody', '中心定位內文一', true],
  ['aboutBody2', '中心定位內文二', true], ['membersTitle', '中心成員標題', false],
  ['missionsEyebrow', '任務眉標', false], ['missionsTitle', '任務標題', false], ['missionsDesc', '任務說明', true],
  ['awardsEyebrow', '獎項眉標', false], ['awardsTitle', '獎項標題', false], ['awardsDesc', '獎項說明', true],
  ['awardsLitTitle', '文獻查證組標題', false], ['awardsClinTitle', '臨床應用組標題', false],
  ['awardsTransTitle', '知識轉譯組標題', false], ['colSession', '屆別欄標題', false], ['colAward', '獎項欄標題', false],
  ['journeyEyebrow', '發展歷程眉標', false], ['journeyTitle', '發展歷程標題', false], ['journeyDesc', '發展歷程說明', true],
  ['coursesEyebrow', '課程眉標', false], ['coursesTitle', '課程標題', false], ['coursesDesc', '課程說明', true],
  ['closingTitle', '結語標題', false], ['closingBody', '結語內文', true], ['contactPerson', '聯絡人', false],
  ['contactExt', '聯絡分機', false], ['contactPlace', '聯絡地點', true], ['contactQuote', '聯絡引言', true],
] as const satisfies readonly (readonly [ScalarKey, string, boolean])[];

type CopyColorsEditorProps = {
  readonly payload: EbmPayload;
  readonly issues: readonly StructuredEditorIssueSummary[];
  readonly onChange: StructuredEditorCommit<EbmPayload>;
};

export function CopyColorsEditor({ payload, issues, onChange }: CopyColorsEditorProps) {
  const changeScalar = (locale: LocaleKey, key: ScalarKey, value: string) => {
    if (payload[locale][key] === value) return;
    onChange({ ...payload, [locale]: { ...payload[locale], [key]: value } });
  };
  return (
    <EditorSection id="ebm-copy" title="實證醫學頁面文案" description="依公開頁面閱讀順序維護雙語文案。">
      {SCALARS.map(([key, label, multiline]) => (
        <EbmBilingualTextField
          key={key}
          label={label}
          path={[key]}
          zh={payload.zh[key]}
          en={payload.en[key]}
          multiline={multiline}
          issues={issues}
          onChange={(locale, value) => changeScalar(locale, key, value)}
        />
      ))}
    </EditorSection>
  );
}
