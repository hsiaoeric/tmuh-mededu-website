import { assertNever } from '@/admin/documents/assertNever';
import type { StructuredEditorIssue } from './types';

const FIELD_ID_PREFIX = 'global-editor-field';

export type StructuredEditorIssueSummary = {
  readonly fieldId: string;
  readonly issue: StructuredEditorIssue;
  readonly message: string;
};

const CUSTOM_ZH_MESSAGES: Readonly<Record<string, string>> = {
  'English dates must use Mon D, YYYY': '英文日期請使用「Mon D, YYYY」格式。',
  'Enter a valid English calendar date': '請輸入有效的英文日曆日期。',
  'Invalid Chinese activity date or time': '中文活動日期或時間格式不正確。',
  'Invalid English activity date or time': '英文活動日期或時間格式不正確。',
  'Invalid symposium date or time': '研討會日期或時間格式不正確。',
  'Invalid research publication month': '論文發表月份必須介於 1 至 12。',
  'Localized collections must contain the same number of items': '繁體中文與英文的項目數量必須一致。',
  'Localized identifiers must match and remain in the same order': '繁體中文與英文的識別碼及順序必須一致。',
  'External URL must use HTTPS with a DNS host, no credentials or whitespace, and a valid port': '外部連結必須使用 HTTPS、有效網域與通訊埠，且不可包含帳號密碼或空白。',
};

type MessagePair = { readonly zh: string; readonly en: string };

/** Messages of the archive (localized-fields) contracts, which build their own issues. */
const ARCHIVE_MESSAGES: Readonly<Record<string, MessagePair>> = {
  'Text must not be empty': { zh: '此欄位為必填，請輸入內容。', en: 'This field is required.' },
  'Text must not contain control characters': { zh: '文字不可包含控制字元，請重新輸入或貼上純文字。', en: 'Text must not contain control characters. Retype it or paste plain text.' },
  'Text must be a single line': { zh: '此欄位只能有一行，請移除換行。', en: 'This field must be a single line. Remove the line breaks.' },
  'Text must not start or end with whitespace': { zh: '開頭與結尾不可有空白，請刪除多餘空白。', en: 'Remove the spaces at the start or end.' },
  'Text must not be blank': { zh: '此欄位不可只有空白。', en: 'This field cannot be only spaces.' },
  'Link must be an https, http, site path, mailto, or tel address': { zh: '連結必須是 https:// 或 http:// 網址、站內路徑（/ 開頭）、mailto: 或 tel:。', en: 'Links must be an https:// or http:// URL, a site path starting with /, mailto:, or tel:.' },
  'File link must be a safe link or a files/legacy/ path': { zh: '檔案連結必須是安全的網址，或 files/legacy/ 下的檔案路徑。', en: 'File links must be a safe URL or a path under files/legacy/.' },
  'Post categories must contain every canonical category exactly once': { zh: '文章分類必須剛好包含全部 14 個固定分類，請在進階 JSON 中修復。', en: 'Post categories must contain every fixed category exactly once. Repair them in the advanced JSON editor.' },
  'Post channel must match its category channel': { zh: '文章頻道必須與分類所屬頻道一致。', en: 'The post’s channel must match its category’s channel.' },
  'Center posts must belong to a center': { zh: '中心文章的所屬單位必須是中心。', en: 'A center article must belong to a center.' },
  'Programs must contain every canonical program exactly once': { zh: '學員專區必須剛好包含五個固定計畫，請在進階 JSON 中修復。', en: 'There must be exactly the five fixed trainee programs. Repair them in the advanced JSON editor.' },
};

function archiveMessage(message: string, isZh: boolean): string | undefined {
  const fixed = ARCHIVE_MESSAGES[message];
  if (fixed !== undefined) return isZh ? fixed.zh : fixed.en;
  const maximum = message.match(/^Text must be at most (\d+) characters$/u)?.[1];
  if (maximum !== undefined) return isZh ? `文字最多 ${maximum} 個字元。` : `Use at most ${maximum} characters.`;
  const category = message.match(/^Category (\S+) belongs to the (\S+) channel$/u);
  if (category !== null) return isZh ? `分類 ${category[1]} 屬於 ${category[2]} 頻道。` : message;
  const unknown = message.match(/^Unknown post category: (.+)$/u)?.[1];
  if (unknown !== undefined) return isZh ? `找不到分類「${unknown}」。` : `Unknown category “${unknown}”.`;
  const programPage = message.match(/^Program (\S+) \S+ must name a program page owned by that program$/u)?.[1];
  if (programPage !== undefined) {
    return isZh ? `計畫 ${programPage} 只能選擇類別為「學員專區計畫」且屬於該計畫的頁面。` : `Program ${programPage} can only use a trainee program page that belongs to it.`;
  }
  return undefined;
}

function invalidTypeMessage(message: string, isZh: boolean): string {
  if (message.includes('received undefined')) {
    return isZh ? '此欄位為必填，請輸入內容。' : 'This field is required.';
  }
  if (message.includes('expected string')) return isZh ? '請輸入文字。' : 'Enter text.';
  if (message.includes('expected number')) return isZh ? '請輸入數字。' : 'Enter a number.';
  if (message.includes('expected boolean')) return isZh ? '請選擇有效狀態。' : 'Select a valid state.';
  if (message.includes('expected array')) return isZh ? '請提供項目清單。' : 'Provide a list of items.';
  if (message.includes('expected object')) return isZh ? '請提供完整的資料結構。' : 'Provide the required object structure.';
  return isZh
    ? '此欄位的資料類型不正確，請檢查內容。'
    : 'This value has the wrong data type.';
}

function rangeMessage(issue: StructuredEditorIssue, isZh: boolean): string | undefined {
  if (issue.message.includes('string') && issue.message.includes('>=1')) {
    return isZh ? '此欄位為必填，請輸入內容。' : 'This field is required.';
  }
  const minimum = issue.message.match(/to be >=([^ ]+)/)?.[1];
  if (minimum !== undefined) {
    return isZh ? `數值不得小於 ${minimum}。` : `Enter a value greater than or equal to ${minimum}.`;
  }
  const maximum = issue.message.match(/to be <=([^ ]+)/)?.[1];
  if (maximum !== undefined) {
    return isZh ? `數值不得大於 ${maximum}。` : `Enter a value less than or equal to ${maximum}.`;
  }
  return undefined;
}

function formatMessage(issue: StructuredEditorIssue, isZh: boolean): string {
  if (issue.message.includes('[0-9a-f]{6}')) {
    return isZh
      ? '請輸入 6 位十六進位色碼，例如 #286f5d。'
      : 'Enter a six-digit hex color, such as #286f5d.';
  }
  const path = issue.path.map(String);
  if (path.some((segment) => segment.toLowerCase().includes('month'))) {
    return isZh ? '請輸入有效月份。' : 'Enter a valid month.';
  }
  if (path.some((segment) => segment.toLowerCase().includes('date'))) {
    return isZh ? '請輸入有效日期。' : 'Enter a valid date.';
  }
  return isZh
    ? '此欄位的格式不正確，請依欄位要求修正。'
    : 'This value does not match the required format.';
}

export function displayStructuredEditorIssue(
  issue: StructuredEditorIssue,
  isZh: boolean,
): string {
  if (issue.message === 'Malformed JSON') {
    return isZh ? 'JSON 格式不正確，請修正語法後再試。' : 'The JSON syntax is invalid. Correct it and try again.';
  }
  if (issue.message === 'Expected a JSON object') {
    return isZh ? '最外層內容必須是 JSON 物件。' : 'The top-level value must be a JSON object.';
  }
  const archive = archiveMessage(issue.message, isZh);
  if (archive !== undefined) return archive;
  const customZh = CUSTOM_ZH_MESSAGES[issue.message];
  if (customZh !== undefined) return isZh ? customZh : issue.message;
  const duplicate = issue.message.match(/^Duplicate identifier: (.+)$/)?.[1];
  if (duplicate !== undefined) return isZh ? `識別碼「${duplicate}」重複。` : `Duplicate identifier: ${duplicate}`;
  if (issue.code === 'invalid_type' || issue.message.startsWith('Invalid input: expected')) {
    return invalidTypeMessage(issue.message, isZh);
  }
  if (issue.code === 'too_small' || issue.code === 'too_big') {
    return rangeMessage(issue, isZh) ?? (isZh
      ? '數值超出允許範圍，請檢查內容。'
      : 'This value is outside the allowed range.');
  }
  if (issue.code === 'invalid_format' || issue.message.startsWith('Invalid string:')) {
    return formatMessage(issue, isZh);
  }
  if (issue.message === 'Invalid input' || (issue.code !== undefined && issue.code !== 'custom')) {
    return isZh
      ? '此欄位的值不符合驗證規則，請檢查內容。'
      : 'This value does not satisfy the field validation requirements.';
  }
  return issue.message;
}

// Path segments are payload keys, so the set is small; every field renders its id, and long
// archives render thousands of fields and rows, so each key is encoded once.
const ENCODED_SEGMENTS = new Map<string, string>();
const MAX_CACHED_SEGMENTS = 2048;

function encodeString(value: string): string {
  if (value.length === 0) return 'empty';
  const cached = ENCODED_SEGMENTS.get(value);
  if (cached !== undefined) return cached;
  const encoded = Array.from(value, (character) => (
    (character.codePointAt(0) ?? 0).toString(16)
  )).join('_');
  if (ENCODED_SEGMENTS.size < MAX_CACHED_SEGMENTS) ENCODED_SEGMENTS.set(value, encoded);
  return encoded;
}

function encodePathSegment(segment: PropertyKey): string {
  switch (typeof segment) {
    case 'string':
      return `s-${encodeString(segment)}`;
    case 'number':
      return Number.isSafeInteger(segment) && segment >= 0
        ? `n-${segment}`
        : `n-x-${encodeString(String(segment))}`;
    case 'symbol':
      return `y-${encodeString(Symbol.keyFor(segment) ?? segment.description ?? '')}`;
    default:
      return assertNever(segment, 'structured editor issue path segment');
  }
}

export function fieldIdForStructuredEditorIssuePath(
  path: readonly PropertyKey[],
): string {
  return path.length === 0
    ? `${FIELD_ID_PREFIX}-root`
    : `${FIELD_ID_PREFIX}-${path.map(encodePathSegment).join('-')}`;
}

export function mapStructuredEditorIssues(
  issues: readonly StructuredEditorIssue[],
  isZh = true,
): readonly StructuredEditorIssueSummary[] {
  return issues.map((issue) => ({
    fieldId: fieldIdForStructuredEditorIssuePath(issue.path),
    issue,
    message: displayStructuredEditorIssue(issue, isZh),
  }));
}
