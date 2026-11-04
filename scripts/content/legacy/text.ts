import { calendarDateFromParts } from '../../../src/content/contracts/primitives';

/** Zero-width characters the old editor left behind; they carry no meaning and break URLs. */
const ZERO_WIDTH = /[​-‍⁠﻿]/g;
/** C0 controls and DEL other than TAB and LF; the contracts reject them. */
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F]/g;
/**
 * ASCII whitespace plus NBSP collapse to one space. U+3000 (ideographic space) is deliberately
 * absent: the old pages indent with it, and the contracts keep it.
 */
const COLLAPSIBLE_SPACE = /[\t\n\r\f\v  ]+/g;
const ASCII_EDGE_SPACE = /^[\t\n\r\f\v ]+|[\t\n\r\f\v ]+$/g;

/** Inline text from a DOM text node: invisible characters removed, ASCII whitespace collapsed. */
export function normalizeInlineText(value: string): string {
  return value.replace(ZERO_WIDTH, '').replace(CONTROL, ' ').replace(COLLAPSIBLE_SPACE, ' ');
}

/** Trims ASCII whitespace only, so a leading or trailing U+3000 survives. */
export function trimAscii(value: string): string {
  return value.replace(ASCII_EDGE_SPACE, '');
}

/** One-line text (titles, labels, captions): collapsed, trimmed, newlines folded into spaces. */
export function singleLine(value: string | null | undefined): string {
  return trimAscii(normalizeInlineText(value ?? ''));
}

/** True when the text holds nothing visible (ASCII, NBSP, U+3000 and other Unicode spaces). */
export function isBlank(value: string): boolean {
  return /^[\s　]*$/u.test(value.replace(ZERO_WIDTH, ''));
}

/** Truncates to `max` UTF-16 code units, ending in an ellipsis, without leaving edge spaces. */
export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${trimAscii(value.slice(0, max - 1))}…`;
}

/** `2022.12.17` or `2025/9/14` → `2022-12-17`; anything else (or an impossible date) → undefined. */
export function parseLegacyDate(value: string | null | undefined): string | undefined {
  const match = /^\s*(\d{4})[./-](\d{1,2})[./-](\d{1,2})\s*$/.exec(value ?? '');
  if (match === null) return undefined;
  const [, year, month, day] = match as unknown as [string, string, string, string];
  return calendarDateFromParts(year, month.padStart(2, '0'), day.padStart(2, '0'));
}

/**
 * A Republic of China calendar date written as seven digits (`1130702` → 2024-07-02), the way
 * the old site suffixes event titles. Only years 100–139 (2011–2050) are accepted, so other
 * seven-digit numbers are not mistaken for dates.
 */
export function parseRocDate(digits: string): string | undefined {
  const match = /^(1[0-3]\d)(\d{2})(\d{2})$/.exec(digits);
  if (match === null) return undefined;
  const [, year, month, day] = match as unknown as [string, string, string, string];
  return calendarDateFromParts(String(Number(year) + 1911), month, day);
}

/** The last ROC date embedded in a title (`…-蔡宗良助理教授1130702`), if any. */
export function rocDateInText(value: string): string | undefined {
  const candidates = [...value.matchAll(/(?<!\d)(1[0-3]\d{5})(?!\d)/g)].map((match) => parseRocDate(match[1] ?? ''));
  return candidates.filter((date): date is string => date !== undefined).at(-1);
}

/** An upload timestamp in a file name (`20230408162719.jpg` → 2023-04-08). */
export function timestampDateInFileName(value: string): string | undefined {
  const match = /(?<!\d)(20\d{2})(\d{2})(\d{2})\d{6}(?:\d{0,3})(?!\d)/.exec(value);
  if (match === null) return undefined;
  const [, year, month, day] = match as unknown as [string, string, string, string];
  return calendarDateFromParts(year, month, day);
}
