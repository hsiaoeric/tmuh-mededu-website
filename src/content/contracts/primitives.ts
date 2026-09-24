import { z } from 'zod';
export {
  DraftMediaPathSchema,
  DraftMediaReferenceSchema,
  LocalMediaPathSchema,
  LocalMediaReferenceSchema,
  MediaReferenceSchema,
  MediaTypeSchema,
  PublicMediaPathSchema,
  PublicMediaReferenceSchema,
  PublishedMediaReferenceSchema,
  Sha256Schema,
  type DraftMediaReference,
  type LocalMediaReference,
  type MediaReference,
  type MediaType,
  type PublicMediaReference,
  type PublishedMediaReference,
  type Sha256,
} from '@/content/media/references';

export const NonEmptyStringSchema = z.string().min(1);
export const HexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);
export const CalendarDateSchema = z.iso.date();
export const CalendarDateTimeSchema = z.iso.datetime({ offset: true });
export const CmsDocumentIdSchema = z.uuid().brand('CmsDocumentId');
export const CmsRevisionIdSchema = z.uuid().brand('CmsRevisionId');
export type CmsDocumentId = z.infer<typeof CmsDocumentIdSchema>;
export type CmsRevisionId = z.infer<typeof CmsRevisionIdSchema>;

const CREDENTIAL_FREE_HTTPS_URL_PATTERN = /^https:\/\/([A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)*)(?::([0-9]{1,5}))?(?:[/?#][^\s\u0000-\u001f\u007f]*)?$/i;
const MAX_DNS_HOST_LENGTH = 253;
const MAX_TCP_PORT = 65_535;

const ENGLISH_MONTHS: Readonly<Record<string, string>> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
} as const;

function addStringIssue(context: z.core.ParsePayload<string>, message: string): void {
  context.issues.push({ code: 'custom', message, input: context.value });
}

export const ChineseNewsDateSchema = z.string().check((context) => {
  const match = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(context.value);
  if (match === null) {
    addStringIssue(context, '繁體中文日期格式應為 YYYY/MM/DD');
    return;
  }
  const [, year, month, day] = match;
  if (year === undefined || month === undefined || day === undefined
    || calendarDateFromParts(year, month, day) === undefined) {
    addStringIssue(context, '請輸入有效的繁體中文日曆日期');
  }
});

export const EnglishNewsDateSchema = z.string().check((context) => {
  const match = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4})$/.exec(context.value);
  if (match === null) {
    addStringIssue(context, 'English dates must use Mon D, YYYY');
    return;
  }
  const [, monthName, day, year] = match;
  const month = monthName === undefined ? undefined : ENGLISH_MONTHS[monthName];
  if (year === undefined || month === undefined || day === undefined
    || calendarDateFromParts(year, month, day.padStart(2, '0')) === undefined) {
    addStringIssue(context, 'Enter a valid English calendar date');
  }
});

function checkActivityDate(
  context: z.core.ParsePayload<string>,
  pattern: RegExp,
  message: string,
): void {
  const match = pattern.exec(context.value);
  const year = match?.[1];
  const month = match?.[2];
  const day = match?.[3];
  const start = match?.[4];
  const end = match?.[5];
  const validDate = year !== undefined && month !== undefined && day !== undefined
    && calendarDateFromParts(year, month, day) !== undefined;
  const validTime = start !== undefined && end !== undefined && isOrderedClockRange(start, end);
  if (!validDate || !validTime) addStringIssue(context, message);
}

export const ChineseActivityDateSchema = z.string().check((context) => {
  checkActivityDate(
    context,
    /^(\d{4})\/(\d{2})\/(\d{2})（[日一二三四五六]）(\d{2}:\d{2})–(\d{2}:\d{2})$/,
    'Invalid Chinese activity date or time',
  );
});

export const EnglishActivityDateSchema = z.string().check((context) => {
  checkActivityDate(
    context,
    /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d{4})\/(\d{2})\/(\d{2}) (\d{2}:\d{2})–(\d{2}:\d{2})$/,
    'Invalid English activity date or time',
  );
});

export const HttpsUrlSchema = z.string().check((context) => {
  const match = CREDENTIAL_FREE_HTTPS_URL_PATTERN.exec(context.value);
  const hostname = match?.[1];
  const port = match?.[2];
  const validPort = port === undefined || Number(port) >= 1 && Number(port) <= MAX_TCP_PORT;
  if (hostname === undefined || hostname.length > MAX_DNS_HOST_LENGTH || !validPort) {
    context.issues.push({
      code: 'custom',
      message: 'External URL must use HTTPS with a DNS host, no credentials or whitespace, and a valid port',
      input: context.value,
    });
  }
});

export function calendarDateFromParts(year: string, month: string, day: string): string | undefined {
  const date = `${year}-${month}-${day}`;
  return CalendarDateSchema.safeParse(date).success ? date : undefined;
}

export function isOrderedClockRange(start: string, end: string): boolean {
  const startMatch = /^(\d{2}):(\d{2})$/.exec(start);
  const endMatch = /^(\d{2}):(\d{2})$/.exec(end);
  if (startMatch === null || endMatch === null) return false;
  const startHour = Number(startMatch[1]);
  const startMinute = Number(startMatch[2]);
  const endHour = Number(endMatch[1]);
  const endMinute = Number(endMatch[2]);
  if (startHour > 23 || endHour > 23 || startMinute > 59 || endMinute > 59) return false;
  return startHour * 60 + startMinute < endHour * 60 + endMinute;
}
