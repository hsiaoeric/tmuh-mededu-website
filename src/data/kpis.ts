import type { Lang } from '@/i18n';

export const DEPARTMENT_KPI_IDS = [
  'department_advisors',
  'teaching_attendings',
  'teaching_allied_health',
  'education_centers',
] as const;

export const DEPARTMENT_MEMBER_GROUP_IDS = [
  'department_advisors',
  'teaching_attendings',
  'teaching_allied_health',
] as const;

export type DepartmentKpiId = (typeof DEPARTMENT_KPI_IDS)[number];
export type DepartmentMemberGroupId = (typeof DEPARTMENT_MEMBER_GROUP_IDS)[number];

export type Kpi = {
  readonly id: DepartmentKpiId;
  readonly num: number;
  readonly suffix: string;
  readonly label: string;
  readonly en: string;
  readonly color: string;
  readonly delay: number;
  readonly panelTitle: string;
  readonly panelDescription?: string;
};

const DEPT_KPIS = [
  { id: 'department_advisors', num: 3, suffix: '', zh: '教學部顧問', en: 'Department Advisors', color: '#A87A6B', panelZh: '教學部顧問', panelEn: 'Department Advisors' },
  { id: 'teaching_attendings', num: 3, suffix: '', zh: '教學型主治', en: 'Teaching Attendings', color: '#B69B66', panelZh: '教學型主治成員', panelEn: 'Teaching Attendings' },
  { id: 'teaching_allied_health', num: 4, suffix: '', zh: '教學型醫事人員', en: 'Teaching Allied Health', color: '#7A95A8', panelZh: '教學型醫事人員成員', panelEn: 'Teaching Allied Health' },
  {
    id: 'education_centers', num: 5, suffix: '', zh: '教育中心', en: 'Education Centers', color: '#4f8c7d',
    panelZh: '五大教育中心', panelEn: 'The Five Education Centers',
    descriptionZh: '每一個中心承擔一段教育旅程：從教師的養成、技能的錘鍊、證據的檢驗，到照護一個完整的\u2060人。',
    descriptionEn: 'Each center carries one stage of the journey — growing teachers, honing skills, testing evidence, and caring for the whole person.',
  },
] as const;

export function deptKpis(lang: Lang): readonly Kpi[] {
  const isZh = lang === 'zh';
  return DEPT_KPIS.map((k, i) => ({
    id: k.id,
    num: k.num,
    suffix: k.suffix,
    label: isZh ? k.zh : k.en,
    en: k.en,
    color: k.color,
    delay: i * 70,
    panelTitle: isZh ? k.panelZh : k.panelEn,
    ...('descriptionZh' in k
      ? { panelDescription: isZh ? k.descriptionZh : k.descriptionEn }
      : {}),
  }));
}
