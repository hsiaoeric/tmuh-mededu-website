import { useMemo } from 'react';
import { useSite } from '@/app/site';
import type { Lang } from '@/i18n';

// 公告、文章、相簿等共用元件的介面文字。site_copy 的鍵值由資料庫鎖定，
// 因此這些標籤不放進 src/i18n，而是以 { zh, en } 成對放在這裡。
const CONTENT_COPY = {
  chineseOnly: { zh: '僅中文', en: 'Chinese only' },
  opensInNewTab: { zh: '（另開新分頁）', en: '(opens in a new tab)' },
  table: { zh: (n: number) => `表格 ${n}`, en: (n: number) => `Table ${n}` },
  imageUnavailable: { zh: '圖片無法顯示', en: 'Image unavailable' },
  playVideo: { zh: '播放影片：', en: 'Play video: ' },
  videoFallbackTitle: { zh: 'YouTube 影片', en: 'YouTube video' },
  pinned: { zh: '置頂', en: 'Pinned' },
  filters: { zh: '篩選', en: 'Filters' },
  category: { zh: '分類', en: 'Category' },
  all: { zh: '全部', en: 'All' },
  year: { zh: '年份', en: 'Year' },
  allYears: { zh: '全部年份', en: 'All years' },
  search: { zh: '搜尋', en: 'Search' },
  searchHint: { zh: '標題或摘要關鍵字', en: 'Title or summary' },
  clearFilters: { zh: '清除篩選', en: 'Clear filters' },
  results: {
    zh: (n: number) => `共 ${n} 筆`,
    en: (n: number) => (n === 1 ? '1 result' : `${n} results`),
  },
  noResults: { zh: '沒有符合條件的項目。', en: 'Nothing matches these filters.' },
  pagination: { zh: '分頁', en: 'Pagination' },
  previousPage: { zh: '上一頁', en: 'Previous page' },
  nextPage: { zh: '下一頁', en: 'Next page' },
  pageNumber: { zh: (n: number) => `第 ${n} 頁`, en: (n: number) => `Page ${n}` },
  photoDialog: { zh: (title: string) => `相片檢視：${title}`, en: (title: string) => `Photo viewer: ${title}` },
  closePhoto: { zh: '關閉相片檢視', en: 'Close photo viewer' },
  previousPhoto: { zh: '上一張', en: 'Previous photo' },
  nextPhoto: { zh: '下一張', en: 'Next photo' },
  photoPosition: {
    zh: (n: number, total: number) => `第 ${n} 張，共 ${total} 張`,
    en: (n: number, total: number) => `Photo ${n} of ${total}`,
  },
  photoFallbackAlt: {
    zh: (title: string, n: number) => `${title} — 相片 ${n}`,
    en: (title: string, n: number) => `${title} — photo ${n}`,
  },
} as const;

type Widen<T> = T extends string ? string : T;
type ContentCopyKey = keyof typeof CONTENT_COPY;
export type ContentCopy = { readonly [K in ContentCopyKey]: Widen<(typeof CONTENT_COPY)[K]['zh']> };

export function contentCopy(lang: Lang): ContentCopy {
  const entries = Object.entries(CONTENT_COPY).map(([key, value]) => [key, value[lang]] as const);
  return Object.fromEntries(entries) as unknown as ContentCopy;
}

/** The archive UI labels for the current site language. */
export function useContentCopy(): ContentCopy {
  const { lang } = useSite();
  return useMemo(() => contentCopy(lang), [lang]);
}
