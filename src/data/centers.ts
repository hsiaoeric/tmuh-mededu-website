import type { IconName } from '@/components/common/Icon';
import { person, type RawPerson } from './people';
import type { CenterId } from '@/context/SiteContext';

export interface CenterBranch {
  id: string;
  zh: string;
  en: string;
  descZh: string;
  descEn: string;
  icon?: IconName;
  /** Anchor on a dedicated center page. */
  pageSection?: string;
  /** Section id within the homepage detail panel. */
  panelSection: 'intro' | 'team' | 'contact' | 'detail';
}

export interface Center {
  id: CenterId;
  zh: string;
  en: string;
  color: string;
  introZh: string;
  introEn: string;
  contactZh: string;
  contactEn: string;
  /** Extension number only (formatted at display time). */
  ext: string;
  /** Official external center website, when maintained outside this app. */
  externalUrl?: string;
  deep?: boolean;
  people: RawPerson[];
}

/** Lucide-style icon id per center. */
export const CENTER_ICON: Record<CenterId, string> = {
  faculty_dev: 'cap',
  clinical_skills: 'skills',
  ebm: 'chart',
  holistic: 'holistic',
  med_edu_research: 'research',
  admin: 'admin',
};

export const CENTER_BRANCHES: Record<CenterId, CenterBranch[]> = {
  faculty_dev: [
    {
      id: 'about',
      zh: '簡介',
      en: 'About',
      descZh: '全院臨床教師培育與教職支援的核心平台。',
      descEn: 'The core platform for hospital-wide faculty development and academic appointments.',
      icon: 'cap',
      pageSection: 'fd-about',
      panelSection: 'intro',
    },
    {
      id: 'services',
      zh: '核心業務',
      en: 'Services',
      descZh: '系統性師資培育、教學品質提升與跨職類教師支持。',
      descEn: 'Systematic faculty cultivation, teaching quality, and cross-profession support.',
      icon: 'book',
      pageSection: 'fd-services',
      panelSection: 'detail',
    },
    {
      id: 'contact',
      zh: '聯絡',
      en: 'Contact',
      descZh: '行政專員陳均茹，分機 3757。',
      descEn: 'Administrator Chun-Ju Chen, ext. 3757.',
      icon: 'phone',
      pageSection: 'fd-contact',
      panelSection: 'contact',
    },
  ],
  clinical_skills: [
    {
      id: 'about',
      zh: '簡介',
      en: 'About',
      descZh: '規劃 OSCE 與模擬訓練，培養紮實臨床技能。',
      descEn: 'OSCE and simulation training for solid clinical skills.',
      icon: 'skills',
      panelSection: 'intro',
    },
    {
      id: 'services',
      zh: '核心業務',
      en: 'Services',
      descZh: '客觀結構式臨床測驗（OSCE）與模擬訓練的規劃、執行與評量。',
      descEn: 'Planning, delivery, and assessment of OSCE and simulation-based training.',
      icon: 'clipboard',
      panelSection: 'detail',
    },
    {
      id: 'contact',
      zh: '聯絡',
      en: 'Contact',
      descZh: '張家銘、賴哲民，分機 3770。',
      descEn: 'Chia-Ming Chang & Che-Min Lai, ext. 3770.',
      icon: 'phone',
      panelSection: 'contact',
    },
  ],
  ebm: [
    {
      id: 'about',
      zh: '簡介',
      en: 'About',
      descZh: '推動實證醫學，將最佳證據融入臨床決策。',
      descEn: 'Advancing EBM and embedding best evidence in clinical decisions.',
      icon: 'chart',
      pageSection: 'ebm-about',
      panelSection: 'intro',
    },
    {
      id: 'services',
      zh: '核心業務',
      en: 'Services',
      descZh: '教育培訓、實證課程與品質改善，推動全院實證文化。',
      descEn: 'Training, EBM courses, and quality improvement fostering an evidence-based culture.',
      icon: 'bulb',
      pageSection: 'ebm-missions',
      panelSection: 'detail',
    },
    {
      id: 'contact',
      zh: '聯絡',
      en: 'Contact',
      descZh: '行政專員江明憲，分機 3760。',
      descEn: 'Administrator Ming-Hsien Chiang, ext. 3760.',
      icon: 'phone',
      pageSection: 'ebm-contact',
      panelSection: 'contact',
    },
  ],
  holistic: [
    {
      id: 'about',
      zh: '簡介',
      en: 'About',
      descZh: '以人為本，推動全人照護與醫學人文教育。',
      descEn: 'People-first holistic care and medical humanities education.',
      icon: 'holistic',
      pageSection: 'h-about',
      panelSection: 'intro',
    },
    {
      id: 'services',
      zh: '核心業務',
      en: 'Services',
      descZh: '心理健康急救（MHFA）推廣、跨領域種子教師培育與全人照護推動計畫。',
      descEn: 'Mental Health First Aid outreach, interdisciplinary seed-teacher training, and holistic-care programs.',
      icon: 'heart',
      pageSection: 'mhfa',
      panelSection: 'detail',
    },
    {
      id: 'contact',
      zh: '聯絡',
      en: 'Contact',
      descZh: '行政專員江明憲，分機 3760。',
      descEn: 'Administrator Ming-Hsien Chiang, ext. 3760.',
      icon: 'phone',
      pageSection: 'h-contact',
      panelSection: 'contact',
    },
  ],
  med_edu_research: [
    {
      id: 'about',
      zh: '簡介',
      en: 'About',
      descZh: '以實證與資料驅動方法研究醫學教育。',
      descEn: 'Evidence- and data-driven medical education research.',
      icon: 'research',
      panelSection: 'intro',
    },
    {
      id: 'services',
      zh: '核心業務',
      en: 'Services',
      descZh: '教學成效分析、評量工具開發與課程回饋，支持教師與課程精進。',
      descEn: 'Outcomes analysis, assessment-tool development, and curriculum feedback.',
      icon: 'chart',
      panelSection: 'detail',
    },
    {
      id: 'contact',
      zh: '聯絡',
      en: 'Contact',
      descZh: '行政專員陳麗玉。',
      descEn: 'Administrator Li-Yu Chen.',
      icon: 'phone',
      panelSection: 'contact',
    },
  ],
  admin: [
    {
      id: 'leadership',
      zh: '領導團隊',
      en: 'Leadership',
      descZh: '教學副院長、部主任、副主任與組長。',
      descEn: 'VP, directors, deputies, and section head.',
      icon: 'admin',
      panelSection: 'intro',
    },
    {
      id: 'duties',
      zh: '業務分工',
      en: 'Duties',
      descZh: '行政專員依業務領域分工支援五大中心。',
      descEn: 'Specialists supporting all centers by duty area.',
      icon: 'team',
      panelSection: 'team',
    },
    {
      id: 'extensions',
      zh: '分機資訊',
      en: 'Extensions',
      descZh: '各窗口已確認的桌機分機一覽。',
      descEn: 'Verified desk extensions for key contacts.',
      icon: 'phone',
      panelSection: 'contact',
    },
  ],
};

export const CENTERS: Center[] = [
  {
    id: 'faculty_dev',
    zh: '教師發展中心',
    en: 'Faculty Development Center',
    color: '#A87A6B',
    introZh:
      '全院臨床教師培育，並協助學校教職相關事務，提升整體教學品質與師資專業發展。',
    introEn:
      'Hospital-wide clinical faculty development and support for academic appointments, strengthening teaching quality and professional growth.',
    contactZh: '陳均茹',
    contactEn: 'Chun-Ju Chen',
    ext: '3757',
    people: [
      person('陳明德', 'Ming-De Chen', 'director', '西醫 · 副教授', 'Physician · Assoc. Prof.', 'ming-de-chen', 'ming-de-chen'),
      person('陳淑美', 'Shu-Mei Chen', 'deputy', '西醫 · 副教授', 'Physician · Assoc. Prof.', 'shumei-chen', 'shumei-chen'),
      person('陳均茹', 'Chun-Ju Chen', 'cadmin', '行政', 'Administration'),
    ],
  },
  {
    id: 'clinical_skills',
    zh: '臨床技能中心',
    en: 'Clinical Skills Center',
    color: '#5E7A8C',
    introZh:
      '規劃並執行醫學生客觀結構式臨床測驗（OSCE）與各式模擬訓練，培養紮實的臨床技能。',
    introEn:
      'Designing and running OSCE and simulation-based training to build solid clinical skills.',
    contactZh: '張家銘、賴哲民',
    contactEn: 'Chia-Ming Chang · Che-Min Lai',
    ext: '3770',
    externalUrl: 'https://tmuh-education.tmuh.org.tw/center/about/clinical/abt02',
    people: [
      person('吳人傑', 'Jen-Chieh Wu', 'director', '西醫 · 助理教授', 'Physician · Asst. Prof.', 'jen-chieh-wu', 'jen-chieh-wu'),
      person('蔡鴻維', 'Hung-Wei Tsai', 'deputy', '西醫 · 講師', 'Physician · Lecturer', 'hung-wei-tsai', 'hung-wei-tsai'),
      person('賴哲民', 'Che-Min Lai', 'cadmin', '行政', 'Administration'),
      person('張家銘', 'Chia-Ming Chang', 'cadmin', '行政', 'Administration'),
    ],
  },
  {
    id: 'ebm',
    zh: '實證醫學中心',
    en: 'Evidence-Based Medicine Center',
    color: '#B69B66',
    introZh:
      '推動實證醫學（EBM），將實證精神落實於醫療品質，提升臨床決策與照護成效。',
    introEn:
      'Advancing Evidence-Based Medicine, embedding evidence into care quality and clinical decisions.',
    contactZh: '江明憲',
    contactEn: 'Ming-Hsien Chiang',
    ext: '3760',
    people: [
      person('林秀真', 'Hsiu-Chen Lin', 'director', '西醫 · 副教授', 'Physician · Assoc. Prof.', 'hsiu-chen-lin', 'hsiu-chen-lin'),
      person('林聖峰', 'Sheng-Feng Lin', 'deputy', '西醫 · 副教授', 'Physician · Assoc. Prof.', 'sheng-feng-lin', 'sheng-feng-lin'),
      person('江明憲', 'Ming-Hsien Chiang', 'cadmin', '行政', 'Administration'),
    ],
  },
  {
    id: 'holistic',
    zh: '全人照護教育中心',
    en: 'Center for Education in Holistic Care and Human Flourishing',
    color: '#4f8c7d',
    introZh:
      '以人為本，照顧每一個完整的人。結合醫療、心理與關懷的力量，推動「心理健康急救 MHFA」，培育跨領域種子教師。',
    introEn:
      'People first — caring for the whole person. Uniting medical, psychological and compassionate care to promote Mental Health First Aid.',
    contactZh: '江明憲',
    contactEn: 'Ming-Hsien Chiang',
    ext: '3760',
    deep: true,
    people: [
      person('廖若帆', 'Faith Ruofan Liao', 'director', '護理 · 副教授', 'Nursing · Assoc. Prof.', 'faith-ruofan-liao', 'faith-ruofan-liao'),
      person('孟令城', 'Ling-Cheng Mong', 'deputy', '牙醫', 'Dentist', 'ling-cheng-mong', 'ling-cheng-mong'),
      person('邵軒磊', 'Hsuan-Lei Shao', 'advisor', '教授', 'Professor', 'hsuan-lei-shao'),
      person('江明憲', 'Ming-Hsien Chiang', 'cadmin', '行政', 'Administration'),
    ],
  },
  {
    id: 'med_edu_research',
    zh: '醫學教育研究中心',
    en: 'Medical Education Research Center',
    color: '#6E8A77',
    introZh:
      '以實證與資料驅動的方法研究醫學教育，發展教學評量工具與成效分析，將研究成果回饋至課程設計與教師發展。',
    introEn:
      'Studying medical education with evidence- and data-driven methods, developing assessment tools and feeding findings back into curriculum design.',
    contactZh: '陳麗玉',
    contactEn: 'Li-Yu Chen',
    ext: '',
    externalUrl: 'https://tmuh.ai/u/jc2jc/med-ed-research-center/#overview',
    people: [
      person('陳建宇', 'Chien-Yu Chen', 'director', '西醫 · 教授', 'Physician · Professor', 'chien-yu-chen', 'chien-yu-chen'),
      person('邱欣怡', 'Hsin-Yi Chiu', 'deputy', '西醫 · 助理教授', 'Physician · Asst. Prof.', 'hsin-yi-chiu', 'hsin-yi-chiu'),
      person('陳麗玉', 'Li-Yu Chen', 'cadmin', '行政', 'Administration'),
    ],
  },
  {
    id: 'admin',
    zh: '行政團隊',
    en: 'Administrative Team',
    color: '#8a8076',
    introZh:
      '依職責與分工協同運作，從教學副院長、教學部主任、副主任、組長到各行政專員，支援教學部各項業務的推動。',
    introEn:
      'Working in coordinated roles — from the VP for Medical Education and department directors to administrative specialists — to support all teaching operations.',
    contactZh: '',
    contactEn: '',
    ext: '',
    people: [
      person('張君照', 'Chun-Chao Chang', 'vp', '西醫 · 教授', 'Physician · Professor', 'chun-chao-chang', 'chun-chao-chang'),
      person('葉篤學', 'Tu-Hsueh Yeh', 'ddir', '西醫 · 副教授', 'Physician · Assoc. Prof.', 'tu-hsueh-yeh', 'tu-hsueh-yeh'),
      person('張瓈方', 'Li-Fang Chang', 'ddep', '護理 · 助理教授', 'Nursing · Asst. Prof.', 'li-fang-chang', 'li-fang-chang'),
      person('郭淑柳', 'Shu-Liu Guo', 'ddep', '護理 · 助理教授', 'Nursing · Asst. Prof.', 'shu-liu-guo', 'shu-liu-guo'),
      person('王怡文', 'Yi-Wen Wang', 'head', '教學部綜整', 'Department Coordination'),
      person('楊明芳', 'Ming-Fang Yang', 'spec', 'TMS、新人訓', 'TMS · Orientation', '', '', 'TMS・新人訓', 'TMS · Orientation'),
      person('羅翊芳', 'Yi-Fang Lo', 'spec', '職類、教學門診', 'Professions · Teaching Clinics', '', '', '職類・教學門診', 'Professions · Teaching Clinics'),
      person('曾牧雲', 'Mu-Yun Tseng', 'spec', '實習醫學生', 'Clerkships', '', '', '實習醫學生', 'Clerkships'),
      person('李珮暄', 'Pei-Hsuan Lee', 'spec', '住院醫師、PEC、CCC', 'Residents · PEC · CCC', '', '', '住院醫師・PEC・CCC', 'Residents · PEC · CCC'),
      person('張筱雯', 'Hsiao-Wen Chang', 'spec', 'PGY', 'PGY', '', '', 'PGY', 'PGY'),
      person('陳均茹', 'Chun-Ju Chen', 'spec', '教發、大人提、教職', 'Faculty Dev. · Grants · Appointments', '', '', '教發・大人提・教職', 'Faculty Dev. · Grants · Appointments'),
      person('江明憲', 'Ming-Hsien Chiang', 'spec', '實證、全人、BI、EP', 'EBM · Holistic · BI · EP', '', '', '實證・全人・BI・EP', 'EBM · Holistic · BI · EP'),
      person('賴哲民', 'Che-Min Lai', 'spec', '臨技、OSCE', 'Clinical Skills · OSCE', '', '', '臨技・OSCE', 'Clinical Skills · OSCE'),
      person('張家銘', 'Chia-Ming Chang', 'spec', '臨技、OSCE', 'Clinical Skills · OSCE', '', '', '臨技・OSCE', 'Clinical Skills · OSCE'),
      person('張淑慧', 'Shu-Hui Chang', 'spec', '美術、平面設計', 'Art · Graphic Design', '', '', '美術・平面設計', 'Art · Graphic Design'),
      person('高偉劭', 'Wei-Shao Kao', 'spec', '影音', 'Audiovisual', '', '', '影音', 'Audiovisual'),
    ],
  },
];

export const centerById = (id: CenterId): Center | undefined =>
  CENTERS.find((c) => c.id === id);

/** Centers that have a dedicated deep page. */
export const READY_CENTER_PAGES: CenterId[] = ['holistic', 'ebm', 'faculty_dev'];

/** Order of centers shown as "center page" entry links. */
export const CENTER_LINK_ORDER: CenterId[] = [
  'faculty_dev',
  'clinical_skills',
  'ebm',
  'holistic',
  'med_edu_research',
];
