export type NewsScope = 'dept' | 'holistic';
export type AnnouncementCategory = 'department' | 'achievement' | 'international';

export interface RawAnnouncement {
  id: string;
  publishedOn: string;
  pinned?: boolean;
  scope?: NewsScope;
  category: AnnouncementCategory;
  tag: { zh: string; en: string };
  title: { zh: string; en: string };
  lines: { zh: string[]; en: string[] };
  stat?: {
    top: string;
    topLabel: { zh: string; en: string };
    bottom?: string;
    bottomLabel?: { zh: string; en: string };
    small?: boolean;
  };
}

export const ANNOUNCEMENTS: RawAnnouncement[] = [
  {
    id: 'academic-publication-2026',
    publishedOn: '2026-05-20',
    pinned: true,
    category: 'achievement',
    tag: { zh: '置頂', en: 'Pinned' },
    stat: {
      top: 'Q1',
      topLabel: { zh: '期刊分區', en: 'Journal Q' },
      bottom: 'IF 10.3',
      bottomLabel: { zh: '影響係數', en: 'Impact factor' },
    },
    title: { zh: '學術發表與國際舞台', en: 'Scholarship & the international stage' },
    lines: {
      zh: [
        'THSS 外科論文獲頂尖國際期刊 International Journal of Surgery 收錄（Q1，IF 10.3）。',
        '國際研討會 AMEE×3、ISQua×3；',
        'ISQua 2026 取得 30 分鐘專場，以 Virtual Patient 人機互動探討罕病 Calciphylaxis 之疼痛控制，獲主辦方來信肯定。',
      ],
      en: [
        'A THSS surgical paper accepted by the top journal International Journal of Surgery (Q1, IF 10.3).',
        'International conferences: AMEE ×3, ISQua ×3;',
        'ISQua 2026 granted a 30-min session using a Virtual Patient to explore pain control in the rare disease Calciphylaxis, praised by the organizers.',
      ],
    },
  },
  {
    id: 'masaryk-exchange-2026',
    publishedOn: '2026-04-15',
    scope: 'holistic',
    category: 'international',
    tag: { zh: '國際合作', en: 'International' },
    stat: {
      top: '56',
      topLabel: { zh: '人參與', en: 'attendees' },
    },
    title: {
      zh: '歐洲虛擬醫院跨域交流',
      en: 'Cross-border exchange with a European virtual hospital',
    },
    lines: {
      zh: [
        '捷克馬薩里克大學（Masaryk University）虛擬醫學部 Tereza Vafkova 副主任來校專題演講。',
        '56 位醫師、教授與研究人員線上線下參與，深化全人照護與 AI 輔助教學交流，強化「健康臺灣深耕計畫」國際合作。',
      ],
      en: [
        'Deputy Director Tereza Vafkova of the virtual medical faculty at Masaryk University (Czechia) gave a campus keynote.',
        '56 physicians, professors and researchers joined online and in person, deepening holistic-care and AI-assisted teaching exchange under the Healthy Taiwan initiative.',
      ],
    },
  },
  {
    id: 'holistic-center-founded-2023',
    publishedOn: '2023-05-01',
    category: 'department',
    tag: { zh: '公告', en: 'News' },
    stat: {
      top: '112.05.01',
      topLabel: { zh: '成立日', en: 'Founded' },
      small: true,
    },
    title: { zh: '全人照護教育中心正式成立', en: 'The Center is officially established' },
    lines: {
      zh: [
        '依《全人照護教育中心設置要點》於教學部成立；',
        '以勝任能力為導向，推動全人照護、靈性關懷與醫學人文之教學實踐及應用研究，並以教育與研究輔助院內各單位提升全人照護品質。',
      ],
      en: [
        "Established within the Dept. of Medical Education under the Center's founding charter;",
        'Competency-oriented, advancing teaching practice and applied research in holistic care, spiritual care and medical humanities, supporting every unit in raising holistic-care quality.',
      ],
    },
  },
];

export interface RawActivity {
  id: string;
  sortDate: string;
  scope?: NewsScope;
  cat: { zh: string; en: string };
  title: { zh: string; en: string };
  date: { zh: string; en: string };
  place: { zh: string; en: string };
  speaker: { zh: string; en: string };
  topic: { zh: string; en: string };
  enrolled: { zh: string; en: string };
  status: { zh: string; en: string };
  link?: string;
}

export const ACTIVITIES: RawActivity[] = [
  {
    id: 'responsible-pause-2026',
    sortDate: '2026-07-22',
    scope: 'holistic',
    cat: { zh: '全人教師發展課程', en: 'Holistic Faculty Development' },
    title: { zh: '停下來，是最負責任的事', en: 'To pause is the most responsible act' },
    date: { zh: '2026/07/22（三）12:30–13:30', en: 'Wed 2026/07/22 12:30–13:30' },
    place: { zh: '線上視訊', en: 'Online' },
    speaker: { zh: '北醫附醫精神科 鐘國軒主任', en: 'Dir. Kuo-Hsuan Chung, Psychiatry, TMUH' },
    topic: { zh: '教師的全人自我觀照', en: "Teachers' whole-person self-reflection" },
    enrolled: { zh: '已報名 0 人', en: '0 enrolled' },
    status: { zh: 'TMS 5416', en: 'TMS 5416' },
    link: 'https://tms2.tmu.edu.tw/epf/dashboard/creditStatistics/courseRecords/5416',
  },
];
