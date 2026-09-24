import { describe, expect, it } from 'vitest';
import { adaptHolisticResearchRegistry } from '@/content/adapters/pages';
import { ActivitiesPayloadSchema } from './activities';
import { HolisticResearchPayloadSchema } from './holisticResearch';
import { NewsPayloadSchema } from './news';

const announcement = (id: string) => ({
  id,
  publishedOn: '2026-05-20',
  pinned: false,
  category: 'department',
  tag: 'News',
  title: `Title ${id}`,
  lines: [],
});

function newsWithCrossScopeDuplicate() {
  const row = announcement('shared-id');
  return {
    announcementBoardUrl: 'https://example.com/announcements',
    zh: { department: [row], holistic: [row] },
    en: { department: [row], holistic: [row] },
  };
}

function activity(id: string, date: string) {
  return {
    id,
    sortDate: '2026-07-22',
    cat: 'Category',
    date,
    enrolled: '0 enrolled',
    link: '',
    place: 'Online',
    speaker: 'Speaker',
    status: 'Open',
    title: `Title ${id}`,
    topic: 'Topic',
  };
}

function activitiesWithDates(zhDate: string, enDate: string) {
  return {
    zh: { department: [activity('activity-a', zhDate)], holistic: [] },
    en: { department: [activity('activity-a', enDate)], holistic: [] },
  };
}

function activitiesWithCrossScopeDuplicate() {
  const zh = activity('shared-id', '2026/07/22（三）12:30–13:30');
  const en = activity('shared-id', 'Wed 2026/07/22 12:30–13:30');
  return {
    zh: { department: [zh], holistic: [zh] },
    en: { department: [en], holistic: [en] },
  };
}

function paper(id: string, year: number, month: number, title: string) {
  return { id, authors: ['Author'], byline: 'Author', journal: 'Journal', month, title, year };
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
    papers: [paper('paper-a', 2025, 5, 'Paper A'), paper('paper-b', 2024, 4, 'Paper B')],
    title: 'Research',
    totalLabel: 'Papers',
  };
}

function researchPayload() {
  return { zh: researchLocale(), en: researchLocale() };
}

describe('published collection blocker fixes', () => {
  it('rejects duplicate news IDs across scopes', () => {
    // Given / When
    const result = NewsPayloadSchema.safeParse(newsWithCrossScopeDuplicate());

    // Then
    expect(result.success).toBe(false);
  });

  it('rejects duplicate activity IDs across scopes', () => {
    // Given / When
    const result = ActivitiesPayloadSchema.safeParse(activitiesWithCrossScopeDuplicate());

    // Then
    expect(result.success).toBe(false);
  });

  it.each([
    ['Chinese', '2026/07/23（四）12:30–13:30', 'Wed 2026/07/22 12:30–13:30'],
    ['English', '2026/07/22（三）12:30–13:30', 'Thu 2026/07/23 12:30–13:30'],
  ])('rejects sortDate that disagrees with the %s display date', (_locale, zhDate, enDate) => {
    // Given / When
    const result = ActivitiesPayloadSchema.safeParse(activitiesWithDates(zhDate, enDate));

    // Then
    expect(result.success).toBe(false);
  });

  it.each([
    ['negative yearly education count', 'edu', -1],
    ['fractional yearly clinical count', 'clinical', 1.5],
  ] as const)('rejects %s', (_caseName, field, value) => {
    // Given
    const payload = researchPayload();
    payload.zh.byYear[0] = { ...payload.zh.byYear[0], [field]: value };
    payload.en.byYear[0] = { ...payload.en.byYear[0], [field]: value };

    // When / Then
    expect(HolisticResearchPayloadSchema.safeParse(payload).success).toBe(false);
  });

  it.each([['negative', -1], ['fractional', 2.5]] as const)('rejects %s clinical statistic counts', (_caseName, value) => {
    // Given
    const payload = researchPayload();
    payload.zh.clinicalStats[0] = { ...payload.zh.clinicalStats[0], num: value };
    payload.en.clinicalStats[0] = { ...payload.en.clinicalStats[0], num: value };

    // When / Then
    expect(HolisticResearchPayloadSchema.safeParse(payload).success).toBe(false);
  });

  it('rejects duplicate yearly research values with distinct row IDs', () => {
    // Given
    const payload = researchPayload();
    for (const locale of ['zh', 'en'] as const) {
      payload[locale].byYear[1] = { ...payload[locale].byYear[1], year: 2025 };
      payload[locale].papers = [payload[locale].papers[0]];
    }

    // When / Then
    expect(HolisticResearchPayloadSchema.safeParse(payload).success).toBe(false);
  });

  it.each([['below', 1899], ['above', 2101]] as const)('rejects yearly research years %s the published range', (_caseName, year) => {
    // Given
    const payload = researchPayload();
    for (const locale of ['zh', 'en'] as const) {
      payload[locale].byYear = [{ ...payload[locale].byYear[0], edu: 0, year }];
      payload[locale].papers = [];
    }

    // When / Then
    expect(HolisticResearchPayloadSchema.safeParse(payload).success).toBe(false);
  });

  it('rejects per-year education counts that disagree with paper years', () => {
    // Given
    const payload = researchPayload();
    for (const locale of ['zh', 'en'] as const) {
      payload[locale].byYear = [
        { ...payload[locale].byYear[0], edu: 0 },
        { ...payload[locale].byYear[1], edu: 2 },
      ];
    }

    // When / Then
    expect(HolisticResearchPayloadSchema.safeParse(payload).success).toBe(false);
  });

  it('canonicalizes dual-locale research years and papers deterministically', () => {
    // Given
    const payload = researchPayload();
    for (const locale of ['zh', 'en'] as const) {
      payload[locale].byYear = [
        { ...payload[locale].byYear[1] },
        { ...payload[locale].byYear[0], edu: 2 },
      ];
      payload[locale].papers = [
        paper('paper-z', 2025, 5, 'Alpha title'),
        paper('paper-b', 2024, 4, 'Middle title'),
        paper('paper-a', 2025, 5, 'Zeta title'),
      ];
    }
    const published = HolisticResearchPayloadSchema.parse(payload);

    // When
    const result = adaptHolisticResearchRegistry(published, 'en');

    // Then
    expect(result.byYear.map((row) => row.year)).toEqual([2025, 2024]);
    expect(result.papers.map((row) => row.title)).toEqual(['Zeta title', 'Alpha title', 'Middle title']);
  });
});
