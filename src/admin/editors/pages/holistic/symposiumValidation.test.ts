import { describe, expect, it } from 'vitest';
import { symposiumErrors } from './symposiumValidation';
import type { SymposiumRow } from './types';

const ZH: SymposiumRow = {
  attendees: 382,
  dates: '2021/12/04（六）',
  edition: '第一屆',
  satisfaction: 4.52,
  time: '08:00–17:00',
  title: '靈性關懷國際研討會',
  year: 2021,
};

const EN: SymposiumRow = {
  attendees: 382,
  dates: 'Sat 2021/12/04',
  edition: '1st',
  satisfaction: 4.52,
  time: '08:00–17:00',
  title: 'International Symposium on Spiritual Care',
  year: 2021,
};

describe('symposium mapped validation', () => {
  it.each([
    ['zh locale format', 'zh', { ...ZH, dates: 'Sat 2021/12/04' }, 'dates'],
    ['en locale format', 'en', { ...EN, dates: '2021年12月04日' }, 'dates'],
    ['missing authored year', 'zh', { ...ZH, year: '' }, 'year'],
    ['mismatched year', 'en', { ...EN, year: 2022 }, 'year'],
    ['reversed zh multi-day range', 'zh', { ...ZH, dates: '2021/12/05（日）– 12/04（六）', time: '08:00–12:00 / 13:00–17:00' }, 'dates'],
    ['reversed en multi-day range', 'en', { ...EN, dates: 'Sun–Sat 2021/12/05–04', time: '08:00–12:00 / 13:00–17:00' }, 'dates'],
    ['reversed time', 'zh', { ...ZH, time: '17:00–08:00' }, 'time'],
    ['malformed time', 'en', { ...EN, time: '8am-5pm' }, 'time'],
  ] as const)('maps %s to its repair field', (_name, locale, row, field) => {
    // Given / When
    const errors = symposiumErrors(locale, row);

    // Then
    expect(errors[field]).toBeTypeOf('string');
  });

  it('accepts single-day and chronological multi-day locale dates', () => {
    // Given / When / Then
    expect(symposiumErrors('zh', { ...ZH, year: Number('2021.0') })).toEqual({ dates: undefined, time: undefined, year: undefined });
    expect(symposiumErrors('en', EN)).toEqual({ dates: undefined, time: undefined, year: undefined });
    expect(symposiumErrors('zh', { ...ZH, dates: '2021/12/04（六）– 12/05（日）', time: '08:00–12:00 / 13:00–17:00' })).toEqual({ dates: undefined, time: undefined, year: undefined });
    expect(symposiumErrors('en', { ...EN, dates: 'Sat–Sun 2021/12/04–05', time: '08:00–12:00 / 13:00–17:00' })).toEqual({ dates: undefined, time: undefined, year: undefined });
  });
});
