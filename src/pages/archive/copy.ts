import { useMemo } from 'react';
import { useSite } from '@/app/site';
import type { Lang } from '@/i18n';

// 教學部、公告、學員專區、活動花絮、影音看板、相關資源等頁面的介面文字。
// site_copy 的鍵值由資料庫鎖定，因此這些標籤不放進 src/i18n，而是以 { zh, en } 成對放在這裡。
const ARCHIVE_PAGE_COPY = {
  // 教學部
  departmentTitle: { zh: '教學部', en: 'Department of Medical Education' },
  departmentEyebrow: { zh: 'Department of Medical Education', en: '教學部' },
  departmentLede: {
    zh: '主管的話、行政團隊、教學師資與各委員會，一頁看懂教學部如何運作。',
    en: 'Messages from leadership, the administrative team, teaching faculty, and committees: how the department works, on one page.',
  },
  messagesTitle: { zh: '主管的話', en: 'Messages from leadership' },
  teamTitle: { zh: '行政團隊', en: 'Administrative team' },
  teamDesc: {
    zh: '教學部行政團隊負責全院教學業務的規劃、協調與執行。',
    en: 'The administrative team plans, coordinates, and runs teaching across the hospital.',
  },
  teamSpecialists: { zh: '行政專員業務分工', en: 'Specialists & duties' },
  teamContactColumn: { zh: '分機 · 信箱', en: 'Ext. · Email' },
  teamRosterPage: { zh: '查看完整團隊介紹', en: 'Full team introduction' },
  facultyTitle: { zh: '教學師資與教學長', en: 'Teaching faculty and leads' },
  committeesTitle: { zh: '委員會', en: 'Committees' },
  committeesDesc: {
    zh: '教學相關委員會的組成、任務與運作。',
    en: 'How the teaching committees are made up, what they do, and how they work.',
  },
  readMore: { zh: '閱讀全文', en: 'Read more' },
  backToDepartment: { zh: '返回教學部', en: 'Back to the department' },
  updatedOn: { zh: '更新日期', en: 'Updated' },

  // 公告
  announcementsTitle: { zh: '公告', en: 'Announcements' },
  announcementsLede: {
    zh: '教學部最新消息、教育活動與常用資訊。',
    en: 'Department news, education activities and frequently used information.',
  },
  publicBoard: { zh: '對外看板', en: 'Public board' },
  highlightsTitle: { zh: '精選公告', en: 'Highlights' },
  archiveTitle: { zh: '公告訊息', en: 'All announcements' },
  archiveEmpty: { zh: '目前沒有公告。', en: 'There are no announcements yet.' },
  eventsTitle: { zh: '近期活動', en: 'Upcoming events' },
  backToAnnouncements: { zh: '返回公告', en: 'Back to announcements' },

  // 榮譽榜
  boardTitle: { zh: '榮譽榜', en: 'Honor board' },
  boardDesc: {
    zh: '教學肯定、參賽獲獎、國內外發表與進修，以及師資認證。',
    en: 'Teaching recognition, awards, presentations and study abroad, and faculty certification.',
  },
  boardEmpty: { zh: '榮譽榜尚無內容。', en: 'The honor board has no entries yet.' },
  backToHonors: { zh: '返回榮譽榜', en: 'Back to the honor board' },

  // 文章
  attachments: { zh: '附件', en: 'Attachments' },
  newerPost: { zh: '較新', en: 'Newer' },
  olderPost: { zh: '較舊', en: 'Older' },
  postNavigation: { zh: '前後篇', en: 'More posts' },
  backToCenter: { zh: (name: string) => `返回${name}`, en: (name: string) => `Back to ${name}` },

  // 學員專區
  traineesTitle: { zh: '學員專區', en: 'Trainees' },
  traineesLede: {
    zh: '住院醫師、PGY、醫學生、醫事見實習與代訓學員的訓練計畫、重要訊息與常用資訊。',
    en: 'Training plans, notices, and resources for residents, PGY trainees, medical students, allied health trainees, and joint trainees.',
  },
  noticesTitle: { zh: '重要訊息', en: 'Notices' },
  noticesEmpty: { zh: '目前沒有學員重要訊息。', en: 'There are no trainee notices yet.' },
  allNotices: { zh: '查看全部重要訊息', en: 'All trainee notices' },
  programsTitle: { zh: '訓練計畫', en: 'Training programs' },
  programOpen: { zh: '進入專區', en: 'Open' },
  backToTrainees: { zh: '返回學員專區', en: 'Back to trainees' },
  programContents: { zh: '本頁內容', en: 'On this page' },
  programIntro: { zh: '計畫簡介', en: 'Introduction' },
  outcomesTitle: { zh: '訓練成果', en: 'Training outcomes' },
  scheduleTitle: { zh: '訓練計劃與排程', en: 'Training plan and schedule' },
  programPostsTitle: { zh: '相關公告', en: 'Related announcements' },
  linksTitle: { zh: '常用資訊', en: 'Useful links' },
  downloadsTitle: { zh: '資源下載', en: 'Downloads' },
  programEmpty: {
    zh: '本專區內容整理中，完成後將於此發布。',
    en: 'This section is still being gathered and will be published here once ready.',
  },

  // 活動花絮、影音看板
  galleryTitle: { zh: '活動花絮', en: 'Photo gallery' },
  galleryLede: {
    zh: '教學部、各中心與學員活動的相簿。',
    en: 'Albums from department, center, and trainee events.',
  },
  galleryEmpty: { zh: '目前沒有相簿。', en: 'There are no albums yet.' },
  albumsTitle: { zh: '活動花絮', en: 'Photos' },
  photoCount: { zh: (n: number) => `${n} 張相片`, en: (n: number) => (n === 1 ? '1 photo' : `${n} photos`) },
  backToGallery: { zh: '返回活動花絮', en: 'Back to the gallery' },
  videosTitle: { zh: '影音看板', en: 'Videos' },
  videosLede: {
    zh: '課程、研討會與教學活動的影片紀錄。',
    en: 'Recordings of courses, symposia, and teaching events.',
  },
  videosEmpty: { zh: '目前沒有影片。', en: 'There are no videos yet.' },
  ownerFilter: { zh: '單位', en: 'Unit' },
  ownerAll: { zh: '全部', en: 'All' },
  showAll: { zh: (n: number) => `顯示全部（${n}）`, en: (n: number) => `Show all (${n})` },
  showFewer: { zh: '收合', en: 'Show fewer' },

  // 中心文章
  centerArticlesTitle: { zh: '公告與活動', en: 'News and events' },
  centerPagesTitle: { zh: '中心資訊', en: 'About the center' },

  // 相關資源
  resourcesTitle: { zh: '相關資源', en: 'Resources' },
  resourcesLede: {
    zh: '常用連結、表單與文件下載，以及教學相關系統入口。',
    en: 'Frequently used links, forms and documents, and the teaching systems.',
  },
  relatedLinksTitle: { zh: '相關連結', en: 'Related links' },
  resourceDownloadsTitle: { zh: '資源專區', en: 'Downloads' },
  systemsTitle: { zh: '系統入口', en: 'Systems' },
  eportfolioGroup: { zh: '學習歷程', en: 'Learning portfolio' },
  eportfolioLabel: { zh: 'E-Portfolio 學習歷程系統', en: 'E-Portfolio' },
  eportfolioDesc: {
    zh: '臺北醫學大學學習歷程與評量系統。',
    en: 'The Taipei Medical University learning portfolio and assessment system.',
  },
  resourcesEmpty: { zh: '尚無資料。', en: 'Nothing here yet.' },

  // 單位名稱（無中心資料可讀時的後備）
  ownerDepartment: { zh: '教學部', en: 'Department' },
} as const;

type Widen<T> = T extends string ? string : T;
type ArchivePageCopyKey = keyof typeof ARCHIVE_PAGE_COPY;
export type ArchivePageCopy = { readonly [K in ArchivePageCopyKey]: Widen<(typeof ARCHIVE_PAGE_COPY)[K]['zh']> };

export function archivePageCopy(lang: Lang): ArchivePageCopy {
  const entries = Object.entries(ARCHIVE_PAGE_COPY).map(([key, value]) => [key, value[lang]] as const);
  return Object.fromEntries(entries) as unknown as ArchivePageCopy;
}

/** The archive page labels for the current site language. */
export function useArchivePageCopy(): ArchivePageCopy {
  const { lang } = useSite();
  return useMemo(() => archivePageCopy(lang), [lang]);
}
