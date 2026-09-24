export const CENTER_IDS = [
  'faculty_dev',
  'clinical_skills',
  'ebm',
  'holistic',
  'med_edu_research',
  'admin',
] as const;

export type CenterId = (typeof CENTER_IDS)[number];

export const CENTER_BRANCH_IDS = {
  faculty_dev: ['about', 'services', 'contact'],
  clinical_skills: ['about', 'services', 'contact'],
  ebm: ['about', 'services', 'contact'],
  holistic: ['about', 'services', 'contact'],
  med_edu_research: ['about', 'services', 'contact'],
  admin: ['leadership', 'duties', 'extensions'],
} as const satisfies Readonly<Record<CenterId, readonly string[]>>;
