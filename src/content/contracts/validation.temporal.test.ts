import { describe, expect, it } from 'vitest';
import snapshot from '../generated/cms-snapshot.json';
import { parsePublishedContentRows } from '../parsers';
import { ActivitiesPayloadSchema } from './activities';
import { HolisticPayloadSchema } from './holistic';
import { NewsPayloadSchema } from './news';

const activity = {
  id: 'activity', sortDate: '2026-07-22', cat: '', enrolled: '', link: '',
  place: '', speaker: '', status: '', title: '', topic: '',
};

describe('nested CMS temporal validation', () => {
  it('rejects unsafe activity links and malformed activity datetimes', () => {
    const invalid = {
      ...activity,
      date: '2026/13/40 28:90–29:00',
      link: 'javascript:alert(1)',
    };
    const locale = { department: [invalid], holistic: [] };

    const result = ActivitiesPayloadSchema.safeParse({ zh: locale, en: locale });

    expect(result.success).toBe(false);
  });

  it('rejects activity display strings with junk or invalid and reversed range endpoints', () => {
    const invalidDates = [
      'junk 2026/07/22 12:30–13:30 junk',
      '2026/07/22（三）12:30–99:00',
      'Wed 2026/07/22 13:30–12:30',
    ];

    const results = invalidDates.map((date) => {
      const locale = { department: [{ ...activity, date }], holistic: [] };
      return ActivitiesPayloadSchema.safeParse({ zh: locale, en: locale });
    });

    expect(results.every((result) => !result.success)).toBe(true);
  });

  it('accepts every current activity display format exactly', () => {
    const zh = { department: [{ ...activity, date: '2026/07/22（三）12:30–13:30' }], holistic: [] };
    const en = { department: [{ ...activity, date: 'Wed 2026/07/22 12:30–13:30' }], holistic: [] };

    const result = ActivitiesPayloadSchema.safeParse({ zh, en });

    expect(result.success).toBe(true);
  });

  it('rejects divergent canonical News dates across locales', () => {
    const row = snapshot.find((item) => item.kind === 'news');
    if (row === undefined) throw new TypeError('Missing news fixture');
    const payload = NewsPayloadSchema.parse(row.payload);
    const announcement = payload.zh.department[0];
    const englishAnnouncement = payload.en.department[0];
    if (announcement === undefined || englishAnnouncement === undefined) {
      throw new TypeError('Missing news announcement');
    }
    const wrongZhLocale = {
      ...payload,
      zh: {
        ...payload.zh,
        department: [{ ...announcement, publishedOn: '2026-08-27' }, ...payload.zh.department.slice(1)],
      },
    };
    const wrongEnLocale = {
      ...payload,
      en: {
        ...payload.en,
        department: [{ ...englishAnnouncement, publishedOn: '2026-08-27' }, ...payload.en.department.slice(1)],
      },
    };

    const results = [NewsPayloadSchema.safeParse(wrongZhLocale), NewsPayloadSchema.safeParse(wrongEnLocale)];

    expect(results.every((result) => !result.success)).toBe(true);
  });

  it('rejects Activity dates authored in the other locale', () => {
    const row = snapshot.find((item) => item.kind === 'activities');
    if (row === undefined) throw new TypeError('Missing activities fixture');
    const payload = ActivitiesPayloadSchema.parse(row.payload);
    const zhActivity = payload.zh.holistic[0];
    const enActivity = payload.en.holistic[0];
    if (zhActivity === undefined || enActivity === undefined) throw new TypeError('Missing activity');
    const wrongZhLocale = {
      ...payload,
      zh: {
        ...payload.zh,
        holistic: [{ ...zhActivity, date: 'Wed 2026/07/22 12:30–13:30' }, ...payload.zh.holistic.slice(1)],
      },
    };
    const wrongEnLocale = {
      ...payload,
      en: {
        ...payload.en,
        holistic: [{ ...enActivity, date: '2026/07/22（三）12:30–13:30' }, ...payload.en.holistic.slice(1)],
      },
    };

    const results = [ActivitiesPayloadSchema.safeParse(wrongZhLocale), ActivitiesPayloadSchema.safeParse(wrongEnLocale)];

    expect(results.every((result) => !result.success)).toBe(true);
  });

  it('rejects malformed symposium ranges and year mismatches', () => {
    const row = snapshot.find((item) => item.kind === 'holistic');
    if (row === undefined) throw new TypeError('Missing holistic fixture');
    const payload = HolisticPayloadSchema.parse(row.payload);
    const symposium = payload.zh.outcomes.symposiums[1];
    if (symposium === undefined) throw new TypeError('Missing symposium fixture');
    const invalidChanges = [
      { dates: `junk ${symposium.dates}` },
      { dates: '2022/12/04（六）– 12/03（日）' },
      { dates: '2022/12/03（六）– 02/30（日）' },
      { time: '08:00–99:00 / 08:00–12:00' },
      { time: '17:00–08:00 / 08:00–12:00' },
      { year: 2021 },
    ];

    const results = invalidChanges.map((change) => HolisticPayloadSchema.safeParse({
      ...payload,
      zh: {
        ...payload.zh,
        outcomes: {
          ...payload.zh.outcomes,
          symposiums: [
            ...payload.zh.outcomes.symposiums.slice(0, 1),
            { ...symposium, ...change },
            ...payload.zh.outcomes.symposiums.slice(2),
          ],
        },
      },
    }));

    expect(results.every((result) => !result.success)).toBe(true);
  });

  it('accepts every current symposium date and time format exactly', () => {
    const row = snapshot.find((item) => item.kind === 'holistic');
    if (row === undefined) throw new TypeError('Missing holistic fixture');

    const result = HolisticPayloadSchema.safeParse(row.payload);

    expect(result.success).toBe(true);
  });

  it('rejects malformed published datetimes', () => {
    const row = snapshot.find((item) => item.kind === 'news');
    if (row === undefined) throw new TypeError('Missing news fixture');
    const invalid = { ...row, published_at: '2026-08-14T00:00:00' };

    expect(() => parsePublishedContentRows([invalid])).toThrow();
  });
});
