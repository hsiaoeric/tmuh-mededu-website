import { SLUG_ID_MAX_LENGTH, SLUG_ID_PATTERN } from '@/content/contracts/archiveIds';

export function isSlugId(value: string): boolean {
  return value.length <= SLUG_ID_MAX_LENGTH && SLUG_ID_PATTERN.test(value);
}

/** `${prefix}-${n}` for the smallest n ≥ 1 not already taken. */
export function nextSequencedId(prefix: string, existing: Iterable<string>): string {
  const taken = new Set(existing);
  for (let sequence = 1; ; sequence += 1) {
    const candidate = `${prefix}-${sequence}`;
    if (!taken.has(candidate)) return candidate;
  }
}

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/u;

/**
 * A new post's id: its date plus a sequence number, such as `2026-11-04-1`. Lowercase digits and
 * hyphens always satisfy the slug rule, and the sequence keeps it unique among existing posts.
 */
export function newPostId(publishedOn: string, existing: Iterable<string>): string {
  return nextSequencedId(CALENDAR_DATE.test(publishedOn) ? publishedOn : 'post', existing);
}

/** Today in the editor's local time zone, as YYYY-MM-DD. */
export function localToday(now = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export type SlugIdProblem = 'empty' | 'format' | 'duplicate';

export function slugIdProblem(value: string, others: Iterable<string>): SlugIdProblem | null {
  if (value === '') return 'empty';
  if (!isSlugId(value)) return 'format';
  for (const other of others) if (other === value) return 'duplicate';
  return null;
}

export function slugIdMessage(problem: SlugIdProblem, isZh: boolean): string {
  switch (problem) {
    case 'empty':
      return isZh ? '請輸入識別碼。' : 'Enter an id.';
    case 'format':
      return isZh
        ? `識別碼只能使用小寫英文字母、數字與單一連字號，最多 ${SLUG_ID_MAX_LENGTH} 字元，例如 2026-11-04-1。`
        : `Use lowercase letters, digits, and single hyphens, up to ${SLUG_ID_MAX_LENGTH} characters, such as 2026-11-04-1.`;
    case 'duplicate':
      return isZh ? '這個識別碼已被其他項目使用。' : 'Another item already uses this id.';
  }
}
