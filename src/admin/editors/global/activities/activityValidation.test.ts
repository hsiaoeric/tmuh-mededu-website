import { describe, expect, it } from 'vitest';
import type { CmsPayloadByKind } from '@/content/contracts/registry';
import { validateActivities } from './activityValidation';

type ActivitiesPayload = CmsPayloadByKind['activities'];
type Activity = ActivitiesPayload['zh']['department'][number];

function activity(date: string, link = ''): Activity {
  return {
    id: 'activity',
    sortDate: '2026-07-22',
    cat: '課程',
    date,
    enrolled: '0 人',
    link,
    place: '會議室',
    speaker: '講者',
    status: '報名中',
    title: '活動',
    topic: '主題',
  };
}

function payload(zhDate: string, enDate: string, link = ''): ActivitiesPayload {
  return {
    zh: { department: [activity(zhDate, link)], holistic: [] },
    en: { department: [activity(enDate, link)], holistic: [] },
  };
}

describe('activity authored-text validation', () => {
  it('accepts valid localized display dates without changing their text', () => {
    // Given / When
    const value = payload(
      '2026/07/22（三）12:30–13:30',
      'Wed 2026/07/22 12:30–13:30',
    );
    const result = validateActivities(value);

    // Then
    expect(result).toEqual([]);
    expect(value.zh.department[0]?.date).toBe('2026/07/22（三）12:30–13:30');
    expect(value.en.department[0]?.date).toBe('Wed 2026/07/22 12:30–13:30');
  });

  it.each([
    ['invalid calendar date', '2026/02/30（一）12:30–13:30'],
    ['invalid weekday or format', '2026/07/22(三) 12:30-13:30'],
    ['invalid clock endpoint', '2026/07/22（三）12:30–24:00'],
    ['reversed range', '2026/07/22（三）13:30–12:30'],
  ])('returns Chinese feedback for %s', (_caseName, date) => {
    // Given / When
    const result = validateActivities(payload(date, 'Wed 2026/07/22 12:30–13:30'));

    // Then
    expect(result).toHaveLength(1);
    expect(result[0]?.issue.message).toMatch(/日期.*時間.*格式/);
  });

  it('returns English feedback for an invalid English display date', () => {
    // Given / When
    const result = validateActivities(payload(
      '2026/07/22（三）12:30–13:30',
      'Wednesday 2026-07-22 12:30 to 13:30',
    ));

    // Then
    expect(result).toHaveLength(1);
    expect(result[0]?.issue.message).toMatch(/date and time format/i);
  });

  it.each(['', 'https://example.test/path?course=1'])('accepts link %j', (link) => {
    // Given / When / Then
    expect(validateActivities(payload(
      '2026/07/22（三）12:30–13:30',
      'Wed 2026/07/22 12:30–13:30',
      link,
    ))).toEqual([]);
  });

  it.each([
    ['HTTP', 'http://example.test/course'],
    ['credentials', 'https://user:pass@example.test/course'],
    ['surrounding whitespace', ' https://example.test/course '],
    ['malformed', 'not a link'],
  ])('returns localized HTTPS feedback for %s links', (_caseName, link) => {
    // Given / When
    const result = validateActivities(payload(
      '2026/07/22（三）12:30–13:30',
      'Wed 2026/07/22 12:30–13:30',
      link,
    ));

    // Then
    expect(result).toHaveLength(2);
    expect(result.map((issue) => issue.issue.message)).toEqual([
      expect.stringMatching(/HTTPS.*帳號.*密碼.*空白/),
      expect.stringMatching(/HTTPS.*credentials.*whitespace/i),
    ]);
  });
});
