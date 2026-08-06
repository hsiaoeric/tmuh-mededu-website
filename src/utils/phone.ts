import type { Lang } from '@/i18n';

export const MAIN_PHONE = '(02) 2737-2181';

/** Format a hospital extension for display, e.g. (02) 2737-2181 ＃3760 */
export function formatPhoneExt(ext: string | number, lang: Lang): string {
  const num = String(ext).replace(/\D/g, '');
  if (!num) return '';
  return lang === 'zh'
    ? `${MAIN_PHONE} ＃${num}`
    : `${MAIN_PHONE} ext. ${num}`;
}

/** Extension on its own, for dense lists where the main number would repeat. */
export function formatExtShort(ext: string | number, lang: Lang): string {
  const num = String(ext).replace(/\D/g, '');
  if (!num) return '';
  return lang === 'zh' ? `＃${num}` : `ext. ${num}`;
}
