import type { Lang } from '@/i18n';
import { pick } from '@/i18n';

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
export type NewsScope = 'dept' | 'holistic';

interface RawAnnouncement {
  /** 發佈日期，格式 YYYY-MM-DD（用於排序與「最後更新」）。 */
  date: string;
  pinned?: boolean;
  /** 不填 = 'dept'（首頁）。 */
  scope?: NewsScope;
  tag: { zh: string; en: string };
  title: { zh: string; en: string };
  lines: { zh: string[]; en: string[] };
  /** 左側數據徽章（選填）。 */
  stat?: {
    top: string;
    topLabel: { zh: string; en: string };
    bottom?: string;
    bottomLabel?: { zh: string; en: string };
    /** 上方數字較長時設 true，字級會縮小。 */
    small?: boolean;
  };
}

const ANNOUNCEMENTS: RawAnnouncement[] = [
  {
    date: '2026-05-20',
    pinned: true,
    tag: { zh: '置頂', en: 'Pinned' },
    stat: {
      top: 'Q1',
      topLabel: { zh: '期刊分區', en: 'Journal Q' },
      bottom: 'IF 10.3',
      bottomLabel: { zh: '影響係數', en: 'Impact factor' },
    },
    title: { zh: '學術發表與國際舞台', en: 'Scholarship & the international stage' },
    lines: {
      zh: [
        'THSS 外科論文獲頂尖國際期刊 International Journal of Surgery 收錄（Q1，IF 10.3）。',
        '國際研討會 AMEE×3、ISQua×3；',
        'ISQua 2026 取得 30 分鐘專場，以 Virtual Patient 人機互動探討罕病 Calciphylaxis 之疼痛控制，獲主辦方來信肯定。',
      ],
      en: [
        'A THSS surgical paper accepted by the top journal International Journal of Surgery (Q1, IF 10.3).',
        'International conferences: AMEE ×3, ISQua ×3;',
        'ISQua 2026 granted a 30-min session using a Virtual Patient to explore pain control in the rare disease Calciphylaxis, praised by the organizers.',
      ],
    },
  },
  {
    date: '2026-04-15',
    // 全人中心的國際合作，列在中心頁而非首頁。
    scope: 'holistic',
    tag: { zh: '國際合作', en: 'International' },
    stat: {
      top: '56',
      topLabel: { zh: '人參與', en: 'attendees' },
    },
    title: {
      zh: '歐洲虛擬醫院跨域交流',
      en: 'Cross-border exchange with a European virtual hospital',
    },
    lines: {
      zh: [
        '捷克馬薩里克大學（Masaryk University）虛擬醫學部 Tereza Vafkova 副主任來校專題演講。',
        '56 位醫師、教授與研究人員線上線下參與，深化全人照護與 AI 輔助教學交流，強化「健康臺灣深耕計畫」國際合作。',
      ],
      en: [
        'Deputy Director Tereza Vafkova of the virtual medical faculty at Masaryk University (Czechia) gave a campus keynote.',
        '56 physicians, professors and researchers joined online and in person, deepening holistic-care and AI-assisted teaching exchange under the Healthy Taiwan initiative.',
      ],
    },
  },
  {
    date: '2023-05-01',
    tag: { zh: '公告', en: 'News' },
    stat: {
      top: '112.05.01',
      topLabel: { zh: '成立日', en: 'Founded' },
      small: true,
    },
    title: { zh: '全人照護教育中心正式成立', en: 'The Center is officially established' },
    lines: {
      zh: [
        '依《全人照護教育中心設置要點》於教學部成立；',
        '以勝任能力為導向，推動全人照護、靈性關懷與醫學人文之教學實踐及應用研究，並以教育與研究輔助院內各單位提升全人照護品質。',
      ],
      en: [
        "Established within the Dept. of Medical Education under the Center's founding charter;",
        'Competency-oriented, advancing teaching practice and applied research in holistic care, spiritual care and medical humanities, supporting every unit in raising holistic-care quality.',
      ],
    },
  },
];

export interface Announcement {
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
  return b.date.localeCompare(a.date);
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
  const newest = [...ANNOUNCEMENTS].sort((a, b) => b.date.localeCompare(a.date))[0];
  return newest ? formatDate(newest.date, lang) : '';
}

export function buildAnnouncements(lang: Lang, scope: NewsScope = 'dept'): Announcement[] {
  return ANNOUNCEMENTS.filter((a) => inScope(a, scope))
    .sort(byPinnedThenDate)
    .map((a, i) => ({
      pinned: !!a.pinned,
      tag: pick(lang, a.tag.zh, a.tag.en),
      date: formatDate(a.date, lang),
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

/* ------------------------------------------------------------------ *
 *  活動 Activities
 *  維護同上：複製一個 { ... } 區塊新增活動；sortDate 用 YYYY-MM-DD 排序，
 *  date 則是顯示用的完整字串（可含星期、時間）。
 * ------------------------------------------------------------------ */

interface RawActivity {
  /** 排序用日期 YYYY-MM-DD。 */
  sortDate: string;
  /** 不填 = 'dept'（首頁）。 */
  scope?: NewsScope;
  cat: { zh: string; en: string };
  title: { zh: string; en: string };
  date: { zh: string; en: string };
  place: { zh: string; en: string };
  speaker: { zh: string; en: string };
  topic: { zh: string; en: string };
  enrolled: { zh: string; en: string };
  status: { zh: string; en: string };
  link?: string;
}

const ACTIVITIES: RawActivity[] = [
  {
    sortDate: '2026-07-22',
    // 全人教師發展課程，列在中心頁的「近期活動」。
    scope: 'holistic',
    cat: { zh: '全人教師發展課程', en: 'Holistic Faculty Development' },
    title: { zh: '停下來，是最負責任的事', en: 'To pause is the most responsible act' },
    date: { zh: '2026/07/22（三）12:30–13:30', en: 'Wed 2026/07/22 12:30–13:30' },
    place: { zh: '線上視訊', en: 'Online' },
    speaker: { zh: '北醫附醫精神科 鐘國軒主任', en: 'Dir. Kuo-Hsuan Chung, Psychiatry, TMUH' },
    topic: { zh: '教師的全人自我觀照', en: "Teachers' whole-person self-reflection" },
    enrolled: { zh: '已報名 0 人', en: '0 enrolled' },
    status: { zh: 'TMS 5416', en: 'TMS 5416' },
    link: 'https://tms2.tmu.edu.tw/epf/dashboard/creditStatistics/courseRecords/5416',
  },
];

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
