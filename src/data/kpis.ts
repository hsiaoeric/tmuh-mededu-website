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
  [3, '', '教學部顧問', 'Department Advisors', '#A87A6B'],
  [3, '', '教學型主治', 'Teaching Attendings', '#B69B66'],
  [4, '', '教學型醫事人員', 'Teaching Allied Health', '#7A95A8'],
  [5, '', '教育中心', 'Education Centers', '#4f8c7d'],
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
