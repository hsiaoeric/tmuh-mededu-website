// 舊站（tmuh-education.tmuh.org.tw）分類與代碼對照。此檔為手寫的網站分類法：
// 分類名稱與學員專區計畫必須同時提供中英文；文章內容本身則可僅有中文。
import {
  POST_CATEGORY_CHANNELS,
  POST_CATEGORY_IDS,
  type DepartmentPageSection,
  type OwnerId,
  type PostCategoryId,
  type PostChannel,
  type ProgramId,
} from '@/content/contracts/archiveIds';

type Bilingual = { readonly zh: string; readonly en: string };

export type PostCategoryTaxonomy = {
  readonly id: PostCategoryId;
  readonly channel: PostChannel;
  readonly order: number;
  readonly label: Bilingual;
};

const CATEGORY_LABELS = {
  'hospital-courses': { zh: '全院性課程', en: 'Hospital-wide courses' },
  recruitment: { zh: '招募相關', en: 'Recruitment' },
  'further-training': { zh: '進修相關', en: 'Further training' },
  faculty: { zh: '教師相關專區', en: 'For faculty' },
  'center-notices': { zh: '其他中心重要訊息', en: 'Center notices' },
  'trainee-notices': { zh: '學員專區重要訊息', en: 'Trainee notices' },
  'hospital-events': { zh: '本院重要活動', en: 'Hospital events' },
  'external-events': { zh: '院外活動宣傳', en: 'External events' },
  'teaching-recognition': { zh: '教學肯定', en: 'Teaching recognition' },
  'competitions-awards': { zh: '參賽與獲獎', en: 'Competitions and awards' },
  'publications-training': { zh: '國內外發表與進修', en: 'Presentations and study abroad' },
  'faculty-certification': { zh: '師資認證', en: 'Faculty certification' },
  'center-about': { zh: '中心簡介', en: 'About the center' },
  'center-events': { zh: '中心活動', en: 'Center events' },
} as const satisfies Readonly<Record<PostCategoryId, Bilingual>>;

/** 公告（N001–N008）、榮譽榜（BOARD01–04）與中心文章分類，依顯示順序排列。 */
export const POST_CATEGORY_TAXONOMY: readonly PostCategoryTaxonomy[] = POST_CATEGORY_IDS.map((id, order) => ({ id, channel: POST_CATEGORY_CHANNELS[id], order, label: CATEGORY_LABELS[id] }));

export type ProgramTaxonomy = {
  readonly id: ProgramId;
  readonly order: number;
  readonly title: Bilingual;
  readonly summary: Bilingual;
};

/** 學員專區五個訓練計畫。 */
export const PROGRAM_TAXONOMY: readonly ProgramTaxonomy[] = [
  {
    id: 'residents',
    order: 0,
    title: { zh: '住院醫師', en: 'Residents' },
    summary: {
      zh: '住院醫師的訓練計畫與排程、訓練成果、活動花絮與常用資訊。',
      en: 'Training plans and schedules, outcomes, photos, and resources for residents.',
    },
  },
  {
    id: 'pgy',
    order: 1,
    title: { zh: '畢業後一般醫學訓練', en: 'Post-graduate year training' },
    summary: {
      zh: '畢業後一般醫學訓練（PGY）的訓練計畫與排程、訓練成果、活動花絮與常用資訊。',
      en: 'Training plans and schedules, outcomes, photos, and resources for post-graduate year (PGY) trainees.',
    },
  },
  {
    id: 'medical-students',
    order: 2,
    title: { zh: '醫學生', en: 'Medical students' },
    summary: {
      zh: '醫學生見實習的訓練計畫與排程、訓練成果、活動花絮與常用資訊。',
      en: 'Clerkship and internship plans, outcomes, photos, and resources for medical students.',
    },
  },
  {
    id: 'allied-health-trainees',
    order: 3,
    title: { zh: '醫事見實習', en: 'Allied health trainees' },
    summary: {
      zh: '各醫事職類見實習學生的訓練計畫與排程、訓練成果、活動花絮與常用資訊。',
      en: 'Training plans and schedules, outcomes, photos, and resources for allied health students.',
    },
  },
  {
    id: 'joint-training',
    order: 4,
    title: { zh: '代訓／聯合訓練', en: 'Commissioned and joint training' },
    summary: {
      zh: '代訓與聯合訓練學員的訓練計畫與排程、訓練成果、活動花絮與常用資訊。',
      en: 'Training plans and schedules, outcomes, photos, and resources for commissioned and joint trainees.',
    },
  },
];

/** 公告分類代碼（路徑中大小寫不一，比對時一律轉為大寫）。 */
export const LEGACY_NEWS_CATEGORY_CODES = {
  N001: 'hospital-courses',
  N002: 'recruitment',
  N003: 'further-training',
  N004: 'faculty',
  N005: 'center-notices',
  N006: 'trainee-notices',
  N007: 'hospital-events',
  N008: 'external-events',
} as const satisfies Readonly<Record<string, PostCategoryId>>;

/** 榮譽榜分類代碼。 */
export const LEGACY_BOARD_CATEGORY_CODES = {
  BOARD01: 'teaching-recognition',
  BOARD02: 'competitions-awards',
  BOARD03: 'publications-training',
  BOARD04: 'faculty-certification',
} as const satisfies Readonly<Record<string, PostCategoryId>>;

/**
 * 學員專區計畫代碼。stu05（代訓／聯合訓練）沿用 alb04／sch04／trn04／dwn04 等第 04 組代碼，
 * 因此計畫一律依路徑中的 stuNN 判定，不可依後綴數字推論。
 */
export const LEGACY_PROGRAM_CODES = {
  stu01: 'residents',
  stu02: 'pgy',
  stu03: 'medical-students',
  stu04: 'allied-health-trainees',
  stu05: 'joint-training',
} as const satisfies Readonly<Record<string, ProgramId>>;

/** 相簿代碼 ALB01–04 與 STU01–03（無 stuNN 路徑可參考時使用）。 */
export const LEGACY_PROGRAM_ALBUM_CODES = {
  ALB01: 'residents',
  ALB02: 'pgy',
  ALB03: 'medical-students',
  ALB04: 'allied-health-trainees',
  STU01: 'residents',
  STU02: 'pgy',
  STU03: 'medical-students',
} as const satisfies Readonly<Record<string, ProgramId>>;

/** 中心路徑代碼。digital（數位教材室）對應 digital_materials，於 /digital-materials 呈現。 */
export const LEGACY_CENTER_CODES = {
  medical: 'ebm',
  clinical: 'clinical_skills',
  develop: 'faculty_dev',
  digital: 'digital_materials',
  care: 'holistic',
} as const satisfies Readonly<Record<string, OwnerId>>;

/** 中心內容代碼（ABT/EVT/ELB/CVD 加兩位數字）的數字部分，以及 MEDICAL 相簿代碼。 */
export const LEGACY_CENTER_NUMBER_OWNERS = {
  '01': 'ebm',
  '02': 'clinical_skills',
  '03': 'faculty_dev',
  '04': 'digital_materials',
  '05': 'holistic',
} as const satisfies Readonly<Record<string, OwnerId>>;

/** 中心內容代碼前綴：ABT 為中心簡介文章、EVT 為中心活動文章、ELB 為相簿、CVD 為影片。 */
export const LEGACY_CENTER_SECTION_PREFIXES = {
  ABT: { kind: 'post', categoryId: 'center-about' },
  EVT: { kind: 'post', categoryId: 'center-events' },
  ELB: { kind: 'album' },
  CVD: { kind: 'video' },
} as const satisfies Readonly<Record<string, { readonly kind: 'post'; readonly categoryId: PostCategoryId } | { readonly kind: 'album' | 'video' }>>;

/** 中心代碼（如 ABT01、elb03、CVD05、MEDICAL）對應的擁有者；無法辨識時回傳 undefined。 */
export function legacyCenterOwnerForCode(code: string): OwnerId | undefined {
  const upper = code.toUpperCase();
  if (upper === 'MEDICAL') return 'ebm';
  const match = /^(?:ABT|EVT|ELB|CVD)(0[1-5])$/.exec(upper);
  if (match === null) return undefined;
  const number = match[1] as keyof typeof LEGACY_CENTER_NUMBER_OWNERS;
  return LEGACY_CENTER_NUMBER_OWNERS[number];
}

export type LegacyDepartmentPage = {
  readonly id: string;
  readonly section: Extract<DepartmentPageSection, 'about' | 'committee'>;
};

/** about/detail/28–32 與 about/info/committee/33–36 對應的教學部頁面。 */
export const LEGACY_DEPARTMENT_PAGES = {
  28: { id: 'vice-superintendent-message', section: 'about' },
  29: { id: 'director-message', section: 'about' },
  30: { id: 'teaching-faculty', section: 'about' },
  31: { id: 'administrative-team', section: 'about' },
  32: { id: 'teaching-leads', section: 'about' },
  33: { id: 'medical-education-committee', section: 'committee' },
  34: { id: 'faculty-development-committee', section: 'committee' },
  35: { id: 'clinical-competency-committee', section: 'committee' },
  36: { id: 'program-evaluation-committee', section: 'committee' },
} as const satisfies Readonly<Record<number, LegacyDepartmentPage>>;
