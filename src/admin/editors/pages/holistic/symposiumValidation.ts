import { calendarDateFromParts, isOrderedClockRange } from '@/content/contracts/primitives';
import { numberDraft } from './fieldPrimitives';
import type { HolisticLocale, SymposiumRow } from './types';

type DateSummary = {
  readonly count: number;
  readonly year: number;
};

export type SymposiumErrors = {
  readonly dates?: string;
  readonly time?: string;
  readonly year?: string;
};

function calendarDate(year: string, month: string, day: string): string | undefined {
  return calendarDateFromParts(year, month, day);
}

function zhDate(value: string): DateSummary | null {
  const range = /^(\d{4})\/(\d{2})\/(\d{2})（[日一二三四五六]）– (\d{2})\/(\d{2})（[日一二三四五六]）$/.exec(value);
  if (range !== null) {
    const [year, month, day, endMonth, endDay] = range.slice(1);
    if (year !== undefined && month !== undefined && day !== undefined && endMonth !== undefined && endDay !== undefined) {
      const start = calendarDate(year, month, day);
      const end = calendarDate(year, endMonth, endDay);
      if (start !== undefined && end !== undefined && end > start) return { count: 2, year: Number(year) };
    }
    return null;
  }
  const single = /^(\d{4})\/(\d{2})\/(\d{2})(?:（[日一二三四五六]）)?$/.exec(value);
  const year = single?.[1];
  const month = single?.[2];
  const day = single?.[3];
  return year !== undefined && month !== undefined && day !== undefined && calendarDate(year, month, day) !== undefined
    ? { count: 1, year: Number(year) }
    : null;
}

function enDate(value: string): DateSummary | null {
  const range = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)–(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d{4})\/(\d{2})\/(\d{2})–(\d{2})$/.exec(value);
  if (range !== null) {
    const [year, month, day, endDay] = range.slice(1);
    if (year !== undefined && month !== undefined && day !== undefined && endDay !== undefined) {
      const start = calendarDate(year, month, day);
      const end = calendarDate(year, month, endDay);
      if (start !== undefined && end !== undefined && end > start) return { count: 2, year: Number(year) };
    }
    return null;
  }
  const single = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d{4})\/(\d{2})\/(\d{2})$/.exec(value);
  const plain = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(value);
  const year = single?.[1] ?? plain?.[1];
  const month = single?.[2] ?? plain?.[2];
  const day = single?.[3] ?? plain?.[3];
  return year !== undefined && month !== undefined && day !== undefined && calendarDate(year, month, day) !== undefined
    ? { count: 1, year: Number(year) }
    : null;
}

function dateSummary(locale: HolisticLocale, value: string): DateSummary | null {
  return locale === 'zh' ? zhDate(value) : enDate(value);
}

function orderedTimes(value: string, count: number): boolean {
  const ranges = value.split(' / ');
  return ranges.length === count && ranges.every((range) => {
    const match = /^(\d{2}:\d{2})–(\d{2}:\d{2})$/.exec(range);
    return match?.[1] !== undefined && match[2] !== undefined && isOrderedClockRange(match[1], match[2]);
  });
}

function authoredYear(value: number | string): number | null {
  const parsed = typeof value === 'number' ? value : numberDraft(value);
  return typeof parsed === 'number' && Number.isInteger(parsed) ? parsed : null;
}

export function symposiumErrors(locale: HolisticLocale, row: SymposiumRow): SymposiumErrors {
  const dates = dateSummary(locale, row.dates);
  const year = authoredYear(row.year);
  const dateError = locale === 'zh'
    ? '日期須使用繁體中文格式 YYYY/MM/DD（週），跨日活動須完整填寫結束月日，且結束日期須晚於開始日期。'
    : 'Use English date format Ddd YYYY/MM/DD; multi-day events use Ddd–Ddd YYYY/MM/DD–DD, with the end date after the start date.';
  return {
    dates: dates === null ? dateError : undefined,
    time: dates === null || orderedTimes(row.time, dates.count)
      ? undefined
      : '時間須使用由早到晚的 HH:MM–HH:MM；多日活動以「 / 」分隔每日時段。',
    year: year === null
      ? '年份為必填整數，例如 2026 或 2026.0。'
      : dates !== null && dates.year !== year
        ? '年份必須與日期中的年份一致。'
        : undefined,
  };
}
