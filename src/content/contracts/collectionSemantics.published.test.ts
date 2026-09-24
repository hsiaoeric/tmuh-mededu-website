import { describe, expect, it } from 'vitest';
import { ActivitiesPayloadSchema } from './activities';
import { HolisticResearchPayloadSchema } from './holisticResearch';
import { NewsPayloadSchema } from './news';

const newsRow = (id: string, publishedOn: string) => ({
  id,
  publishedOn,
  pinned: false,
  category: 'department',
  tag: 'News',
  title: `Title ${id}`,
  lines: [`Line ${id}`],
});

function newsPayload() {
  return {
    announcementBoardUrl: 'https://example.com/announcements',
    zh: { department: [newsRow('news-a', '2026-05-20'), newsRow('news-b', '2026-04-15')], holistic: [] },
    en: { department: [newsRow('news-a', '2026-05-20'), newsRow('news-b', '2026-04-15')], holistic: [] },
  };
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
  const zh = [
    activityRow('activity-a', '2026-07-22', '2026/07/22（三）12:30–13:30'),
    activityRow('activity-b', '2026-06-01', '2026/06/01（一）12:30–13:30'),
  ];
  const en = [
    activityRow('activity-a', '2026-07-22', 'Wed 2026/07/22 12:30–13:30'),
    activityRow('activity-b', '2026-06-01', 'Mon 2026/06/01 12:30–13:30'),
  ];
  return { zh: { department: zh, holistic: [] }, en: { department: en, holistic: [] } };
}

function researchLocale() {
  return {
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
      { id: 'paper-a', authors: ['Author'], byline: 'Author', journal: 'Journal', month: 5, title: 'Paper A', year: 2025 },
      { id: 'paper-b', authors: ['Author'], byline: 'Author', journal: 'Journal', month: 4, title: 'Paper B', year: 2024 },
    ],
    title: 'Research',
    totalLabel: 'Papers',
  };
}

function researchPayload() {
  return { zh: researchLocale(), en: researchLocale() };
}

describe('published collection semantic authority', () => {
  it('accepts semantic-only records with stable bilingual identities', () => {
    // Given
    const payloads = [
      [NewsPayloadSchema, newsPayload()],
      [ActivitiesPayloadSchema, activitiesPayload()],
      [HolisticResearchPayloadSchema, researchPayload()],
    ] as const;

    // When
    const results = payloads.map(([schema, payload]) => schema.safeParse(payload));

    // Then
    expect(results.every((result) => result.success)).toBe(true);
  });

  it('rejects independently authored news and research derived fields', () => {
    // Given
    const news = newsPayload();
    const research = researchPayload();
    const staleNews = {
      ...news,
      zh: { ...news.zh, latestUpdate: '1999/01/01' },
      en: { ...news.en, latestUpdate: 'Jan 1, 1999' },
    };
    const staleResearch = {
      zh: { ...research.zh, total: 999 },
      en: { ...research.en, total: 999 },
    };

    // When
    const results = [NewsPayloadSchema.safeParse(staleNews), HolisticResearchPayloadSchema.safeParse(staleResearch)];

    // Then
    expect(results.every((result) => !result.success)).toBe(true);
  });

  it.each([
    ['news duplicate ID', NewsPayloadSchema, () => {
      const payload = newsPayload();
      payload.zh.department[1] = { ...payload.zh.department[1], id: 'news-a' };
      return payload;
    }],
    ['news locale order', NewsPayloadSchema, () => {
      const payload = newsPayload();
      payload.en.department.reverse();
      return payload;
    }],
    ['news semantic divergence', NewsPayloadSchema, () => {
      const payload = newsPayload();
      payload.en.department[0] = { ...payload.en.department[0], publishedOn: '2020-01-01' };
      return payload;
    }],
    ['activity duplicate ID', ActivitiesPayloadSchema, () => {
      const payload = activitiesPayload();
      payload.en.department[1] = { ...payload.en.department[1], id: 'activity-a' };
      return payload;
    }],
    ['activity locale order', ActivitiesPayloadSchema, () => {
      const payload = activitiesPayload();
      payload.en.department.reverse();
      return payload;
    }],
    ['activity semantic divergence', ActivitiesPayloadSchema, () => {
      const payload = activitiesPayload();
      payload.en.department[0] = { ...payload.en.department[0], sortDate: '2020-01-01' };
      return payload;
    }],
    ['research duplicate ID', HolisticResearchPayloadSchema, () => {
      const payload = researchPayload();
      payload.zh.papers[1] = { ...payload.zh.papers[1], id: 'paper-a' };
      return payload;
    }],
    ['research locale order', HolisticResearchPayloadSchema, () => {
      const payload = researchPayload();
      payload.en.byYear.reverse();
      return payload;
    }],
    ['research semantic divergence', HolisticResearchPayloadSchema, () => {
      const payload = researchPayload();
      payload.en.byYear[0] = { ...payload.en.byYear[0], clinical: 999 };
      return payload;
    }],
  ] as const)('rejects %s', (_name, schema, fixture) => {
    // Given
    const payload = fixture();

    // When
    const result = schema.safeParse(payload);

    // Then
    expect(result.success).toBe(false);
  });
});
