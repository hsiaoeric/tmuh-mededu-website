import type { CmsPayloadByKind } from '@/content/contracts/registry';

type SiteCopyPayload = CmsPayloadByKind['site_copy'];
export type SiteCopyStringsKey = keyof SiteCopyPayload['zh']['strings'];
export type SiteCopyInlineKey = keyof SiteCopyPayload['zh']['inline'];

export type SiteCopyField<Key extends PropertyKey> = {
  readonly key: Key;
  readonly label: string;
  readonly multiline: boolean;
};

export const SITE_COPY_STRING_FIELDS = [
  { key: 'aiBody', label: 'AI 全人照護計畫內文', multiline: true },
  { key: 'aiTitle', label: 'AI 全人照護計畫標題', multiline: false },
  { key: 'backDept', label: '返回教學部', multiline: false },
  { key: 'brand1', label: '品牌主標', multiline: false },
  { key: 'brand2', label: '品牌副標', multiline: false },
  { key: 'chipCenters', label: '教育中心標籤', multiline: false },
  { key: 'chipSeed', label: '種子教師標籤', multiline: false },
  { key: 'comingSoon', label: '即將推出提示', multiline: false },
  { key: 'contactTitle', label: '聯絡區標題', multiline: false },
  { key: 'ctaOrg', label: '組織架構行動文字', multiline: false },
  { key: 'dept', label: '教學部名稱', multiline: false },
  { key: 'deptShort', label: '教學部短名稱', multiline: false },
  { key: 'eventsDesc', label: '活動區說明', multiline: true },
  { key: 'eventsEn', label: '活動區英文眉標', multiline: false },
  { key: 'eventsZh', label: '活動區中文標題', multiline: false },
  { key: 'footAddr', label: '頁尾地址', multiline: false },
  { key: 'footBrand', label: '頁尾品牌', multiline: false },
  { key: 'footBrandEn', label: '頁尾英文品牌', multiline: false },
  { key: 'footNote', label: '頁尾版權說明', multiline: true },
  { key: 'footTel', label: '頁尾電話', multiline: false },
  { key: 'formingTeam', label: '團隊籌備提示', multiline: false },
  { key: 'hAboutBody', label: '全人中心關於內文', multiline: true },
  { key: 'hAboutTitle', label: '全人中心關於標題', multiline: false },
  { key: 'hContactExt', label: '全人中心聯絡分機', multiline: false },
  { key: 'hContactPerson', label: '全人中心聯絡人', multiline: false },
  { key: 'hContactPlace', label: '全人中心聯絡地點', multiline: true },
  { key: 'hContactQuote', label: '全人中心聯絡引言', multiline: true },
  { key: 'hCtaMhfa', label: '心理健康急救行動文字', multiline: false },
  { key: 'hHeroTag', label: '全人中心主視覺說明', multiline: true },
  { key: 'hHeroTitle', label: '全人中心主視覺標題', multiline: false },
  { key: 'heroEyebrow', label: '首頁主視覺眉標', multiline: false },
  { key: 'heroTag', label: '首頁主視覺說明', multiline: true },
  { key: 'heroTitle1', label: '首頁主標第一行', multiline: false },
  { key: 'heroTitle2', label: '首頁主標第二行', multiline: false },
  { key: 'hospital', label: '醫院名稱', multiline: false },
  { key: 'instructorsTitle', label: '中心指導員標題', multiline: false },
  { key: 'kpiEyebrow', label: '教學部一覽眉標', multiline: false },
  { key: 'kpiTitle', label: '教學部一覽標題', multiline: false },
  { key: 'langBtn', label: '語言切換按鈕', multiline: false },
  { key: 'layoutHub', label: '中樞圖切換文字', multiline: false },
  { key: 'layoutTree', label: '組織樹切換文字', multiline: false },
  { key: 'members', label: '團隊成員標題', multiline: false },
  { key: 'mhfaIntro', label: '心理健康急救介紹', multiline: true },
  { key: 'mhfaTitle', label: '心理健康急救標題', multiline: false },
  { key: 'navAbout', label: '導覽：關於', multiline: false },
  { key: 'navContact', label: '導覽：聯絡', multiline: false },
  { key: 'navHolistic', label: '導覽：全人照護', multiline: false },
  { key: 'navMhfa', label: '導覽：心理健康急救', multiline: false },
  { key: 'navNews', label: '導覽：公告', multiline: false },
  { key: 'navOrg', label: '導覽：組織架構', multiline: false },
  { key: 'navSeed', label: '導覽：種子教師', multiline: false },
  { key: 'newsDesc', label: '公告區說明', multiline: true },
  { key: 'newsEn', label: '公告區英文眉標', multiline: false },
  { key: 'newsZh', label: '公告區中文標題', multiline: false },
  { key: 'orgDesc', label: '組織架構說明', multiline: true },
  { key: 'orgTitle', label: '組織架構標題', multiline: false },
  { key: 'seedDesc', label: '種子教師說明', multiline: true },
  { key: 'seedTitle', label: '種子教師標題', multiline: false },
] as const satisfies readonly SiteCopyField<SiteCopyStringsKey>[];

export const SITE_COPY_INLINE_FIELDS = [
  { key: 'skipToContent', label: '跳到主要內容', multiline: false },
  { key: 'holisticAdministrativeTeam', label: '全人中心行政團隊', multiline: false },
  { key: 'holisticResearchTeam', label: '全人中心研究團隊', multiline: false },
  { key: 'holisticClosingTitle', label: '全人中心結尾標題', multiline: false },
] as const satisfies readonly SiteCopyField<SiteCopyInlineKey>[];
