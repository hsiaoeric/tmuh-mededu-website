import type { CmsDocumentKind } from '@/content/contracts/kinds';

type BilingualText = {
  readonly zh: string;
  readonly en: string;
};

export type CmsDocumentMetadata = {
  readonly label: BilingualText;
  readonly description: BilingualText;
};

export const CMS_DOCUMENT_METADATA = {
  site_copy: {
    label: { zh: '全站共用文案', en: 'Shared site copy' },
    description: {
      zh: '管理導覽、頁尾與跨頁共用的雙語文字。',
      en: 'Manage bilingual navigation, footer, and shared interface copy.',
    },
  },
  centers: {
    label: { zh: '教育中心', en: 'Education centers' },
    description: {
      zh: '管理五大教育中心的基本資料與聯絡內容。',
      en: 'Manage directory and contact content for the five education centers.',
    },
  },
  people: {
    label: { zh: '人員名錄', en: 'People directory' },
    description: {
      zh: '管理教學部與各中心的人員、職稱及聯絡資訊。',
      en: 'Manage people, roles, and contact details across the department.',
    },
  },
  news: {
    label: { zh: '公告', en: 'News' },
    description: {
      zh: '管理公告分類、置頂順序與雙語公告內容。',
      en: 'Manage categories, pinned order, and bilingual announcements.',
    },
  },
  activities: {
    label: { zh: '活動', en: 'Activities' },
    description: {
      zh: '管理活動日期、時間與雙語活動資訊。',
      en: 'Manage activity dates, times, and bilingual event details.',
    },
  },
  kpis: {
    label: { zh: '教學部指標', en: 'Department indicators' },
    description: {
      zh: '管理首頁呈現的教學部統計與關鍵指標。',
      en: 'Manage department statistics and key indicators shown on the home page.',
    },
  },
  honors: {
    label: { zh: '榮譽與獎項', en: 'Honors and awards' },
    description: {
      zh: '管理品質榮譽、獎項與年度成果紀錄。',
      en: 'Manage quality honors, awards, and annual achievement records.',
    },
  },
  digital_materials: {
    label: { zh: '數位教材室', en: 'Digital materials' },
    description: {
      zh: '管理數位教材室頁面的雙語內容。',
      en: 'Manage bilingual content for the digital materials page.',
    },
  },
  facdev: {
    label: { zh: '教師發展中心', en: 'Faculty development' },
    description: {
      zh: '管理教師發展中心專頁內容與服務資訊。',
      en: 'Manage the Faculty Development Center page and services.',
    },
  },
  ebm: {
    label: { zh: '實證醫學中心', en: 'Evidence-based medicine' },
    description: {
      zh: '管理實證醫學中心專頁內容與教學資源。',
      en: 'Manage the Evidence-Based Medicine Center page and resources.',
    },
  },
  holistic: {
    label: { zh: '全人照護教育中心', en: 'Holistic care education' },
    description: {
      zh: '管理全人照護教育中心專頁與年度內容。',
      en: 'Manage the Holistic Care Education Center page and yearly content.',
    },
  },
  holistic_research: {
    label: { zh: '全人照護研究', en: 'Holistic care research' },
    description: {
      zh: '管理全院全人照護研究論文與索引資料。',
      en: 'Manage hospital-wide holistic care publications and index data.',
    },
  },
} as const satisfies Readonly<Record<CmsDocumentKind, CmsDocumentMetadata>>;
