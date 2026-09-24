import type { Lang } from '@/i18n';

export function formatAdminTimestamp(timestamp: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-TW' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}
