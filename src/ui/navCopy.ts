import { useMemo } from 'react';
import { useSite } from '@/app/site';
import type { Lang } from '@/i18n';

// 導覽列與頁尾新增的介面文字。site_copy 的鍵值由資料庫鎖定，因此這些標籤不放進
// src/i18n，而是以 { zh, en } 成對放在這裡；既有的 navAbout／navNews 等仍取自 site_copy。
const NAV_COPY = {
  mainMenu: { zh: '主選單', en: 'Main menu' },
  siteMenu: { zh: '網站選單', en: 'Site menu' },
  menu: { zh: '選單', en: 'Menu' },
  department: { zh: '教學部', en: 'Department' },
  departmentIntro: { zh: '教學部介紹', en: 'About the department' },
  centers: { zh: '中心', en: 'Centers' },
  fiveCenters: { zh: '五大中心', en: 'The Five Centers' },
  digitalMaterials: { zh: '數位教材室', en: 'Digital Materials' },
  digitalMaterialsAlt: { zh: 'Digital Materials', en: '數位教材室' },
  announcementsFull: { zh: '公告訊息', en: 'Announcements' },
  allAnnouncements: { zh: '全部公告', en: 'All announcements' },
  trainees: { zh: '學員專區', en: 'Trainees' },
  traineesHub: { zh: '學員專區總覽', en: 'Trainee overview' },
  honors: { zh: '榮譽榜', en: 'Honors' },
  newsAndHonors: { zh: '公告與榮譽', en: 'News & honors' },
  more: { zh: '更多', en: 'More' },
  gallery: { zh: '活動花絮', en: 'Photo gallery' },
  galleryAlt: { zh: 'Photo gallery', en: '活動花絮' },
  videos: { zh: '影音看板', en: 'Videos' },
  videosAlt: { zh: 'Videos', en: '影音看板' },
  resources: { zh: '相關資源', en: 'Resources' },
  resourcesAlt: { zh: 'Links & downloads', en: '相關連結與下載' },
  relatedLinks: { zh: '相關連結', en: 'Related links' },
  downloads: { zh: '資源專區', en: 'Downloads' },
  eportfolio: { zh: 'E-Portfolio', en: 'E-Portfolio' },
  eportfolioAlt: { zh: '學習歷程系統', en: 'Learning portfolio system' },
  contactAlt: { zh: 'Contact', en: '聯絡我們' },
  honorsAlt: { zh: 'Honors', en: '榮譽榜' },
  externalSystems: { zh: '外部系統', en: 'External systems' },
  opensInNewTab: { zh: '（另開新分頁）', en: '(opens in a new tab)' },
} as const;

export type NavCopy = { readonly [K in keyof typeof NAV_COPY]: string };

export function navCopy(lang: Lang): NavCopy {
  const entries = Object.entries(NAV_COPY).map(([key, value]) => [key, value[lang]] as const);
  return Object.fromEntries(entries) as unknown as NavCopy;
}

/** Navigation and footer labels for the current site language. */
export function useNavCopy(): NavCopy {
  const { lang } = useSite();
  return useMemo(() => navCopy(lang), [lang]);
}
