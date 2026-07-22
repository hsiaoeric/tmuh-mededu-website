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
  /** Hub-layout geometry. */
  hx: number;
  hy: number;
  hleft: string;
  htop: string;
  introZh: string;
  introEn: string;
  contactZh: string;
  contactEn: string;
  /** Extension number only (formatted at display time). */
  ext: string;
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
      id: 'groups',
      zh: '培育小組',
      en: 'Groups',
      descZh: '六大培育小組協作，支援不同職類教師成長路徑。',
      descEn: 'Six collaborating groups supporting growth paths for every profession.',
      icon: 'team',
      pageSection: 'fd-groups',
      panelSection: 'detail',
    },
    {
      id: 'news',
      zh: '最新公告',
      en: 'News',
      descZh: '教師發展相關公告、活動與重要時程。',
      descEn: 'Announcements, events, and key dates for faculty development.',
      icon: 'bell',
      pageSection: 'fd-news',
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
      id: 'osce',
      zh: 'OSCE',
      en: 'OSCE',
      descZh: '客觀結構式臨床測驗的規劃、執行與評量。',
      descEn: 'Planning, delivery, and assessment of OSCE.',
      icon: 'clipboard',
      panelSection: 'detail',
    },
    {
      id: 'team',
      zh: '團隊',
      en: 'Team',
      descZh: '中心主任、副主任與 OSCE 行政秘書。',
      descEn: 'Director, deputies, and OSCE administrators.',
      icon: 'team',
      panelSection: 'team',
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
      id: 'missions',
      zh: '核心任務',
      en: 'Missions',
      descZh: '教育培訓、品質改善與實證文化推動。',
      descEn: 'Training, quality improvement, and an evidence-based culture.',
      icon: 'bulb',
      pageSection: 'ebm-missions',
      panelSection: 'detail',
    },
    {
      id: 'courses',
      zh: '訓練課程',
      en: 'Courses',
      descZh: 'EBM 核心課程與臨床應用訓練。',
      descEn: 'Core EBM courses and clinical application training.',
      icon: 'book',
      pageSection: 'ebm-courses',
      panelSection: 'detail',
    },
    {
      id: 'awards',
      zh: '競賽成就',
      en: 'Awards',
      descZh: '國內外實證醫學競賽與品質改善成果。',
      descEn: 'Domestic and international EBM contest achievements.',
      icon: 'award',
      pageSection: 'ebm-awards',
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
      id: 'mhfa',
      zh: 'MHFA',
      en: 'MHFA',
      descZh: '心理健康急救（MHFA）種子培育與推廣。',
      descEn: 'Mental Health First Aid seed training and outreach.',
      icon: 'heart',
      pageSection: 'mhfa',
      panelSection: 'detail',
    },
    {
      id: 'seed',
      zh: '種子教師',
      en: 'Seed Teachers',
      descZh: '跨領域種子教師培育，擴散全人照護教學。',
      descEn: 'Interdisciplinary seed teachers spreading holistic-care teaching.',
      icon: 'sprout',
      pageSection: 'seed',
      panelSection: 'detail',
    },
    {
      id: 'programs',
      zh: '推動計畫',
      en: 'Programs',
      descZh: '健康台灣深耕計畫與 AI 全人照護教育生態系。',
      descEn: 'Healthy Taiwan initiative and AI holistic-care education ecosystem.',
      icon: 'network',
      pageSection: 'scope2',
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
      id: 'research',
      zh: '研究任務',
      en: 'Research',
      descZh: '教學成效分析、評量工具開發與課程回饋。',
      descEn: 'Outcomes analysis, assessment tools, and curriculum feedback.',
      icon: 'chart',
      panelSection: 'detail',
    },
    {
      id: 'assessment',
      zh: '教學評量',
      en: 'Assessment',
      descZh: '發展教學評量工具，支持教師與課程精進。',
      descEn: 'Developing assessment instruments for teaching improvement.',
      icon: 'clipboard',
      panelSection: 'detail',
    },
    {
      id: 'team',
      zh: '團隊',
      en: 'Team',
      descZh: '中心主任、副主任與行政專員。',
      descEn: 'Director, deputies, and center administrator.',
      icon: 'team',
      panelSection: 'team',
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
    hx: 50,
    hy: 6,
    hleft: '50%',
    htop: '9%',
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
    hx: 84,
    hy: 21,
    hleft: '85%',
    htop: '30%',
    introZh:
      '規劃並執行醫學生客觀結構式臨床測驗（OSCE）與各式模擬訓練，培養紮實的臨床技能。',
    introEn:
      'Designing and running OSCE and simulation-based training to build solid clinical skills.',
    contactZh: '張家銘、賴哲民',
    contactEn: 'Chia-Ming Chang · Che-Min Lai',
    ext: '3770',
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
    hx: 84,
    hy: 49,
    hleft: '85%',
    htop: '71%',
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
    hx: 50,
    hy: 64,
    hleft: '50%',
    htop: '91%',
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
      person('江明憲', 'Ming-Hsien Chiang', 'cadmin', '行政', 'Administration'),
    ],
  },
  {
    id: 'med_edu_research',
    zh: '醫學教育研究中心',
    en: 'Medical Education Research Center',
    color: '#6E8A77',
    hx: 16,
    hy: 49,
    hleft: '15%',
    htop: '71%',
    introZh:
      '以實證與資料驅動的方法研究醫學教育，發展教學評量工具與成效分析，將研究成果回饋至課程設計與教師發展。',
    introEn:
      'Studying medical education with evidence- and data-driven methods, developing assessment tools and feeding findings back into curriculum design.',
    contactZh: '陳麗玉',
    contactEn: 'Li-Yu Chen',
    ext: '',
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
    hx: 16,
    hy: 21,
    hleft: '15%',
    htop: '30%',
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
