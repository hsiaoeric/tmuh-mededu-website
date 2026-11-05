import type { Lang } from '@/i18n';

// Building an Intl formatter is far slower than using one, and the workspace formats several
// timestamps on every render, so one formatter per language is kept.
const FORMATTERS = new Map<Lang, Intl.DateTimeFormat>();

export function formatAdminTimestamp(timestamp: string, lang: Lang): string {
  let formatter = FORMATTERS.get(lang);
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-TW' : 'en', { dateStyle: 'medium', timeStyle: 'short' });
    FORMATTERS.set(lang, formatter);
  }
  return formatter.format(new Date(timestamp));
}
