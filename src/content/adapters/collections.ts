import type { PublishedCmsPayloadByKind } from '@/content/contracts/registry';
import type { AnnouncementCategorySchema, PublishedAnnouncement } from '@/content/contracts/news';
import type { Lang } from '@/i18n';
import type { z } from 'zod';

type AnnouncementCategory = z.infer<typeof AnnouncementCategorySchema>;
type NewsScope = 'department' | 'holistic';

const CATEGORY_LABELS: Readonly<Record<AnnouncementCategory, Readonly<Record<Lang, string>>>> = {
  department: { zh: '部務公告', en: 'Department' },
  achievement: { zh: '成果榮譽', en: 'Achievements' },
  international: { zh: '國際交流', en: 'International' },
};

function formatNewsDate(iso: string, lang: Lang): string {
  const [year, month, day] = iso.split('-');
  if (year === undefined || month === undefined || day === undefined) return iso;
  if (lang === 'zh') return `${year}/${month}/${day}`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
  const monthName = months[Number(month) - 1];
  return monthName === undefined ? iso : `${monthName} ${Number(day)}, ${year}`;
}

function newsOrder(left: PublishedAnnouncement, right: PublishedAnnouncement): number {
  if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
  return right.publishedOn.localeCompare(left.publishedOn);
}

function projectAnnouncement(row: PublishedAnnouncement, lang: Lang, index: number) {
  return {
    category: row.category,
    categoryLabel: CATEGORY_LABELS[row.category][lang],
    pinned: row.pinned,
    tag: row.tag,
    date: formatNewsDate(row.publishedOn, lang),
    statTop: row.statTop,
    statTopLabel: row.statTopLabel,
    statBot: row.statBot,
    statBotLabel: row.statBotLabel,
    title: row.title,
    lines: row.lines,
    tagColor: row.pinned ? '#B07A4A' : '#4f8c7d',
    tagBg: row.pinned
      ? 'color-mix(in srgb,#B07A4A 14%,transparent)'
      : 'color-mix(in srgb,#4f8c7d 13%,transparent)',
    statFont: row.compactStat === true ? '26px' : '40px',
    delay: index * 70,
  };
}

export function adaptNewsAnnouncements(payload: PublishedCmsPayloadByKind['news'], lang: Lang) {
  const scopes = (['department', 'holistic'] as const).map((scope) => {
    const rows = [...payload[lang][scope]].sort(newsOrder);
    const categories = [...new Set(rows.map((row) => row.category))]
      .map((id) => ({ id, label: CATEGORY_LABELS[id][lang] }));
    return [scope, { rows: rows.map((row, index) => projectAnnouncement(row, lang, index)), categories }] as const;
  });
  const byScope = Object.fromEntries(scopes);
  const latest = [...payload.zh.department, ...payload.zh.holistic]
    .map((row) => row.publishedOn)
    .sort((left, right) => right.localeCompare(left))[0];
  return {
    announcementBoardUrl: payload.announcementBoardUrl,
    department: byScope.department.rows,
    holistic: byScope.holistic.rows,
    categories: {
      department: byScope.department.categories,
      holistic: byScope.holistic.categories,
    },
    latestUpdate: latest === undefined ? '' : formatNewsDate(latest, lang),
  };
}

export function adaptActivitiesCalendar(payload: PublishedCmsPayloadByKind['activities'], lang: Lang) {
  const project = (scope: NewsScope) => [...payload[lang][scope]]
    .sort((left, right) => right.sortDate.localeCompare(left.sortDate))
    .map(({ id: _id, sortDate: _sortDate, ...row }) => row);
  return { department: project('department'), holistic: project('holistic') };
}

export function adaptHolisticResearchRegistry(
  payload: PublishedCmsPayloadByKind['holistic_research'],
  lang: Lang,
) {
  const localized = payload[lang];
  const byYear = [...localized.byYear].sort((left, right) => Number(right.year) - Number(left.year));
  const papers = [...localized.papers].sort((left, right) => (
    Number(right.year) - Number(left.year)
    || Number(right.month) - Number(left.month)
    || left.id.localeCompare(right.id)
  ));
  return {
    ...localized,
    total: payload.zh.byYear.reduce((sum, row) => sum + Number(row.edu) + Number(row.clinical), 0),
    byYear: byYear.map(({ id: _id, ...row }) => row),
    clinicalStats: localized.clinicalStats.map(({ id: _id, ...row }) => row),
    papers: papers.map(({ id: _id, ...row }) => row),
  };
}
