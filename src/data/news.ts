import type { Lang } from '@/i18n';
import { pick } from '@/i18n';
import {
  ACTIVITIES,
  ANNOUNCEMENTS,
  type AnnouncementCategory,
  type NewsScope,
  type RawAnnouncement,
} from './newsRecords';

export type { AnnouncementCategory, NewsScope } from './newsRecords';

export const ANN_URL =
  'https://script.google.com/a/macros/h.tmu.edu.tw/s/AKfycby2MW_ys1HQsgsgb_HnP0gKucbWONkN_cA_aFM3P98GJCS6f5B0JP4zTmiDeEVMjgnB/exec';

/* ------------------------------------------------------------------ *
 *  公告 Announcements
 *
 *  維護方式（給日後更新的人）：
 *  - 直接在下方 ANNOUNCEMENTS 陣列「複製一個 { ... } 區塊」即可新增一則。
 *  - date 請用 'YYYY-MM-DD' 格式，網站會自動「由新到舊」排序，
 *    並用最新一則的日期顯示「最後更新」。
 *  - pinned: true 的公告會永遠排在最前面。
 *  - 顏色、動畫等「呈現」參數由程式自動套用，這裡只需要填內容。
 * ------------------------------------------------------------------ */

/**
 * 這則消息／活動屬於哪一頁：
 *  'dept'     → 首頁「最新公告」（預設，不填就是這個）
 *  'holistic' → 全人照護教育中心頁的「近期活動」「國際合作」
 * 一則只會出現在一個地方，改這個欄位就等於把它搬到另一頁。
 */
const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, { zh: string; en: string }> = {
  department: { zh: '部務公告', en: 'Department' },
  achievement: { zh: '成果榮譽', en: 'Achievements' },
  international: { zh: '國際交流', en: 'International' },
};

export interface Announcement {
  category: AnnouncementCategory;
  categoryLabel: string;
  pinned: boolean;
  tag: string;
  date: string;
  statTop?: string;
  statTopLabel?: string;
  statBot?: string;
  statBotLabel?: string;
  title: string;
  lines: string[];
  tagColor: string;
  tagBg: string;
  statFont: string;
  delay: number;
}

/** Pinned first, then newest date first. */
function byPinnedThenDate(a: RawAnnouncement, b: RawAnnouncement): number {
  if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
  return b.publishedOn.localeCompare(a.publishedOn);
}

/** An entry with no explicit scope belongs to the department's home page. */
const inScope = (item: { scope?: NewsScope }, scope: NewsScope) =>
  (item.scope ?? 'dept') === scope;

/** Format an ISO date for display (zh: 2026/05/20, en: May 20, 2026). */
export function formatDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  if (lang === 'zh') return `${y}/${m}/${d}`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(m) - 1]} ${Number(d)}, ${y}`;
}

/** The most recent announcement date, formatted — drives "最後更新". */
export function latestUpdate(lang: Lang): string {
  const newest = [...ANNOUNCEMENTS].sort((a, b) => b.publishedOn.localeCompare(a.publishedOn))[0];
  return newest ? formatDate(newest.publishedOn, lang) : '';
}

export function buildAnnouncements(lang: Lang, scope: NewsScope = 'dept'): Announcement[] {
  return ANNOUNCEMENTS.filter((a) => inScope(a, scope))
    .sort(byPinnedThenDate)
    .map((a, i) => ({
      pinned: !!a.pinned,
      category: a.category,
      categoryLabel: pick(lang, ANNOUNCEMENT_CATEGORY_LABELS[a.category].zh, ANNOUNCEMENT_CATEGORY_LABELS[a.category].en),
      tag: pick(lang, a.tag.zh, a.tag.en),
      date: formatDate(a.publishedOn, lang),
      statTop: a.stat?.top,
      statTopLabel: a.stat ? pick(lang, a.stat.topLabel.zh, a.stat.topLabel.en) : undefined,
      statBot: a.stat?.bottom,
      statBotLabel: a.stat?.bottomLabel
        ? pick(lang, a.stat.bottomLabel.zh, a.stat.bottomLabel.en)
        : undefined,
      title: pick(lang, a.title.zh, a.title.en),
      lines: pick(lang, a.lines.zh, a.lines.en),
      tagColor: a.pinned ? '#B07A4A' : '#4f8c7d',
      tagBg: a.pinned
        ? 'color-mix(in srgb,#B07A4A 14%,transparent)'
        : 'color-mix(in srgb,#4f8c7d 13%,transparent)',
      statFont: a.stat?.small ? '26px' : '40px',
      delay: i * 70,
    }));
}

/** Only offer filters that currently have content in the requested section. */
export function buildAnnouncementCategories(lang: Lang, scope: NewsScope = 'dept') {
  return [...new Set(ANNOUNCEMENTS.filter((a) => inScope(a, scope)).map((a) => a.category))].map(
    (id) => ({ id, label: pick(lang, ANNOUNCEMENT_CATEGORY_LABELS[id].zh, ANNOUNCEMENT_CATEGORY_LABELS[id].en) }),
  );
}

export function buildAnnouncementRecords(lang: Lang, scope: NewsScope = 'dept') {
  return ANNOUNCEMENTS.filter((announcement) => inScope(announcement, scope)).map((announcement) => ({
    id: announcement.id,
    publishedOn: announcement.publishedOn,
    pinned: announcement.pinned ?? false,
    category: announcement.category,
    tag: pick(lang, announcement.tag.zh, announcement.tag.en),
    statTop: announcement.stat?.top,
    statTopLabel: announcement.stat ? pick(lang, announcement.stat.topLabel.zh, announcement.stat.topLabel.en) : undefined,
    statBot: announcement.stat?.bottom,
    statBotLabel: announcement.stat?.bottomLabel
      ? pick(lang, announcement.stat.bottomLabel.zh, announcement.stat.bottomLabel.en)
      : undefined,
    compactStat: announcement.stat?.small,
    title: pick(lang, announcement.title.zh, announcement.title.en),
    lines: pick(lang, announcement.lines.zh, announcement.lines.en),
  }));
}

/* ------------------------------------------------------------------ *
 *  活動 Activities
 *  維護同上：複製一個 { ... } 區塊新增活動；sortDate 用 YYYY-MM-DD 排序，
 *  date 則是顯示用的完整字串（可含星期、時間）。
 * ------------------------------------------------------------------ */

export interface Activity {
  cat: string;
  title: string;
  date: string;
  place: string;
  speaker: string;
  topic: string;
  enrolled: string;
  status: string;
  link: string;
}

export function buildActivities(lang: Lang, scope: NewsScope = 'dept'): Activity[] {
  return ACTIVITIES.filter((a) => inScope(a, scope))
    .sort((a, b) => b.sortDate.localeCompare(a.sortDate))
    .map((a) => ({
      cat: pick(lang, a.cat.zh, a.cat.en),
      title: pick(lang, a.title.zh, a.title.en),
      date: pick(lang, a.date.zh, a.date.en),
      place: pick(lang, a.place.zh, a.place.en),
      speaker: pick(lang, a.speaker.zh, a.speaker.en),
      topic: pick(lang, a.topic.zh, a.topic.en),
      enrolled: pick(lang, a.enrolled.zh, a.enrolled.en),
      status: pick(lang, a.status.zh, a.status.en),
      link: a.link ?? '',
    }));
}

export function buildActivityRecords(lang: Lang, scope: NewsScope = 'dept') {
  return ACTIVITIES.filter((activity) => inScope(activity, scope)).map((activity) => ({
    id: activity.id,
    sortDate: activity.sortDate,
    cat: pick(lang, activity.cat.zh, activity.cat.en),
    title: pick(lang, activity.title.zh, activity.title.en),
    date: pick(lang, activity.date.zh, activity.date.en),
    place: pick(lang, activity.place.zh, activity.place.en),
    speaker: pick(lang, activity.speaker.zh, activity.speaker.en),
    topic: pick(lang, activity.topic.zh, activity.topic.en),
    enrolled: pick(lang, activity.enrolled.zh, activity.enrolled.en),
    status: pick(lang, activity.status.zh, activity.status.en),
    link: activity.link ?? '',
  }));
}
