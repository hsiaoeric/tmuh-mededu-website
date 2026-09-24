import { describe, expect, it } from 'vitest';
import { ActivitiesPayloadSchema } from '@/content/contracts/activities';
import { HolisticResearchPayloadSchema } from '@/content/contracts/holisticResearch';
import { NewsPayloadSchema } from '@/content/contracts/news';
import { adaptActivitiesCalendar, adaptNewsAnnouncements } from './global';
import { adaptHolisticResearchRegistry } from './pages';

const newsRow = (id: string, publishedOn: string, pinned = false) => ({
  id,
  publishedOn,
  pinned,
  category: pinned ? 'achievement' : 'department',
  tag: pinned ? 'Pinned' : 'News',
  title: `Title ${id}`,
  lines: [`Line ${id}`],
  ...(pinned ? { statTop: 'Q1', statTopLabel: 'Journal Q', compactStat: true } : {}),
});

function newsPayload() {
  const zh = [newsRow('old', '2026-01-01'), newsRow('new', '2026-05-20'), newsRow('pinned', '2026-02-01', true)];
  const en = zh.map((row) => ({ ...row }));
  return NewsPayloadSchema.parse({
    announcementBoardUrl: 'https://example.com/announcements',
    zh: { department: zh, holistic: [] },
    en: { department: en, holistic: [] },
  });
}

const activityRow = (id: string, sortDate: string, date: string) => ({
  id,
  sortDate,
  cat: 'Category',
  date,
  enrolled: '0 enrolled',
  link: 'https://example.com/register',
  place: 'Online',
  speaker: 'Speaker',
  status: 'Open',
  title: `Title ${id}`,
  topic: 'Topic',
});

function activitiesPayload() {
  return ActivitiesPayloadSchema.parse({
    zh: { department: [
      activityRow('old', '2026-06-01', '2026/06/01（一）12:30–13:30'),
      activityRow('new', '2026-07-22', '2026/07/22（三）12:30–13:30'),
    ], holistic: [] },
    en: { department: [
      activityRow('old', '2026-06-01', 'Mon 2026/06/01 12:30–13:30'),
      activityRow('new', '2026-07-22', 'Wed 2026/07/22 12:30–13:30'),
    ], holistic: [] },
  });
}

function researchPayload() {
  const locale = (authors: readonly string[]) => ({
    authorsLabel: 'Authors',
    byYear: [
      { id: 'year-2025', clinical: 2, edu: 1, year: 2025 },
      { id: 'year-2024', clinical: 3, edu: 1, year: 2024 },
    ],
    byYearTitle: 'By year',
    clinicalDesc: 'Description',
    clinicalLegend: 'Clinical',
    clinicalStats: [{ id: 'clinical-papers', label: 'Papers', num: 5 }],
    clinicalTitle: 'Clinical research',
    desc: 'Description',
    eduDesc: 'Description',
    eduLegend: 'Education',
    eduTitle: 'Education research',
    eyebrow: 'Research',
    papers: [
      { id: 'paper-a', authors: [authors[0]], byline: 'Author A', journal: 'Journal', month: 5, title: 'Paper A', year: 2025 },
      { id: 'paper-b', authors: [authors[1]], byline: 'Author B', journal: 'Journal', month: 4, title: 'Paper B', year: 2024 },
    ],
    title: 'Research',
    totalLabel: 'Papers',
  });
  return HolisticResearchPayloadSchema.parse({ zh: locale(['作者甲', '作者乙']), en: locale(['Author A', 'Author B']) });
}

describe('collection semantic adapters', () => {
  it('derives news order, dates, latest update, categories, and presentation', () => {
    // Given
    const payload = newsPayload();

    // When
    const result = adaptNewsAnnouncements(payload, 'en');

    // Then
    expect(result.department.map((row) => row.title)).toEqual(['Title pinned', 'Title new', 'Title old']);
    expect(result.department.map((row) => row.date)).toEqual(['Feb 1, 2026', 'May 20, 2026', 'Jan 1, 2026']);
    expect(result.latestUpdate).toBe('May 20, 2026');
    expect(result.categories.department.map((category) => category.id)).toEqual(['achievement', 'department']);
    expect(result.department[0]).toMatchObject({ tagColor: '#B07A4A', tagBg: 'color-mix(in srgb,#B07A4A 14%,transparent)', statFont: '26px', delay: 0 });
    expect(result.department[1]).toMatchObject({ tagColor: '#4f8c7d', tagBg: 'color-mix(in srgb,#4f8c7d 13%,transparent)', statFont: '40px', delay: 70 });
  });

  it('ignores contract-valid news input order and reacts to canonical pinning and dates', () => {
    // Given
    const original = newsPayload();
    const reordered = NewsPayloadSchema.parse({
      ...original,
      zh: { ...original.zh, department: [...original.zh.department].reverse() },
      en: { ...original.en, department: [...original.en.department].reverse() },
    });

    // When
    const result = adaptNewsAnnouncements(reordered, 'zh');

    // Then
    expect(result.department.map((row) => row.title)).toEqual(['Title pinned', 'Title new', 'Title old']);
    expect(result.latestUpdate).toBe('2026/05/20');
  });

  it('sorts activities by canonical dates while preserving localized display copy and links', () => {
    // Given
    const payload = activitiesPayload();

    // When
    const result = adaptActivitiesCalendar(payload, 'en');

    // Then
    expect(result.department.map((row) => row.title)).toEqual(['Title new', 'Title old']);
    expect(result.department.map((row) => row.date)).toEqual(['Wed 2026/07/22 12:30–13:30', 'Mon 2026/06/01 12:30–13:30']);
    expect(result.department.every((row) => row.link === 'https://example.com/register')).toBe(true);
  });

  it('derives research total and strips semantic record identities from the public model', () => {
    // Given
    const payload = researchPayload();

    // When
    const result = adaptHolisticResearchRegistry(payload, 'en');

    // Then
    expect(result.total).toBe(7);
    expect(result.byYear[0]).toEqual({ clinical: 2, edu: 1, year: 2025 });
    expect(result.clinicalStats[0]).toEqual({ label: 'Papers', num: 5 });
    expect(result.papers[0]?.authors).toEqual(['Author A']);
    expect(result.papers[0]).not.toHaveProperty('id');
  });
});
