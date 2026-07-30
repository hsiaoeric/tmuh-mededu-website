import type { Lang } from '@/i18n';

export interface Kpi {
  num: number;
  suffix: string;
  label: string;
  /** English caption shown under the localized label. */
  en: string;
  color: string;
  delay: number;
}

const DEPT_KPIS: Array<[number, string, string, string, string]> = [
  [3, '', '教學型主治', 'Teaching Attendings', 'var(--c-ebm)'],
  [4, '', '職類教學型醫事人員', 'Teaching Allied Health', 'var(--c-skills)'],
  [5, '', '教育中心', 'Education Centers', 'var(--c-holistic)'],
];

export function deptKpis(lang: Lang): Kpi[] {
  const isZh = lang === 'zh';
  return DEPT_KPIS.map((k, i) => ({
    num: k[0],
    suffix: k[1],
    label: isZh ? k[2] : k[3],
    en: k[3],
    color: k[4],
    delay: i * 70,
  }));
}
