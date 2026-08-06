import type { Lang } from '@/i18n';
import { pick } from '@/i18n';

/**
 * Research output behind the 全人照護教育相關論文 figure, drawn from two audits:
 *
 * - 臺北醫學大學研究人員近5年研究成果彙整_全人照護教育標注, an NSTC pull of six
 *   researchers' output where 14 rows are tagged `✔ 全人照護教育(期刊)`. Those
 *   rows credit one author each, so they resolve to the ten distinct papers in
 *   HOLISTIC_EDU_PAPERS — two of them co-authored by three of the six.
 * - 108-111年全人相關論文清冊, a hospital-wide list of 全人相關 clinical research.
 *   It holds 85 papers, one of which (the BMC Medical Education paper below) is
 *   also tagged in the NSTC audit, leaving 84 counted as clinical here.
 *
 * Both are institution-wide rather than centre-only: most of the清冊's 57
 * authors hold no role on this site, so the section is framed as 全院 output.
 */

/** English names for the six researchers covered by the NSTC audit. */
const RESEARCHER_EN: Record<string, string> = {
  吳人傑: 'Jen-Chieh Wu',
  廖若帆: 'Faith Ruofan Liao',
  吳政誠: 'Jeng-Cheng Wu',
  郭淑柳: 'Shu-Liu Guo',
  陳建宇: 'Chien-Yu Chen',
};

export interface HolisticEduPaper {
  year: number;
  /** Publication month, used only to order papers within a year. */
  month: number;
  journal: string;
  title: string;
  /** Full byline as recorded by NSTC. */
  byline: string;
  /** The audit's tagged authors — all hold a role on this site. */
  authors: string[];
}

/**
 * The ten journal papers tagged 全人照護教育(期刊). Inclusion criteria recorded
 * in the source: 全人 / holistic / person-centred、以病人為中心與醫病溝通 / SDM、
 * 治療關係 / 同理心 / 靈性照護、speaking-up / 醫療倫理溝通, excluding purely
 * technical or knowledge-based teaching papers. Conference papers are excluded.
 */
export const HOLISTIC_EDU_PAPERS: HolisticEduPaper[] = [
  {
    year: 2025,
    month: 11,
    journal: 'Medical Teacher',
    title:
      "Future doctors' silence: An empirical study of declining speaking-up behavior among medical students",
    byline:
      'Hui-Wen Chen, Yi-Chun Chen, Hung-Wei Tsai, Enoch Yi-No Kang, Jen-Chieh Wu, S. Barry Issenberg',
    authors: ['吳人傑'],
  },
  {
    year: 2025,
    month: 9,
    journal: 'Medical Education',
    title:
      "Breaking the silence: Revealing drivers and barriers to medical students' speaking up in medical error",
    byline:
      'Jen-Chieh Wu, Hung-Chen Chen, Enoch Yi-No Kang, Hung-Wei Tsai, Yi-Chun Chen, Hao-Yu Chen, Hui-Wen Chen, S. Barry Issenberg',
    authors: ['吳人傑'],
  },
  {
    year: 2025,
    month: 4,
    journal: 'MedEdPublish',
    title:
      "Re-envisioning medical education: Integrating Carl Rogers' person-centred approach for holistic healthcare in Taiwan",
    byline: 'Faith Liao',
    authors: ['廖若帆'],
  },
  {
    year: 2024,
    month: 8,
    journal: 'Medical Teacher',
    title:
      "Transforming Medical Students' Speaking-Up Behaviors in Medical Errors: The Impact of Simulation and Personalized Debriefing",
    byline:
      'Hung-Wei Tsai, S. Barry Issenberg, Yi-Chun Chen, Enoch Y. Kang, Hui-Wen Chen, Jen-Chieh Wu',
    authors: ['吳人傑'],
  },
  {
    year: 2024,
    month: 7,
    journal: 'BMJ Evidence-Based Medicine',
    title:
      'Effectiveness of the coproduction the shared decision-making curriculum with clinical teachers, patients, and medical students',
    byline: 'Wen-Hsuan Hou, Jeng-Cheng Wu',
    authors: ['吳政誠'],
  },
  {
    year: 2023,
    month: 4,
    journal: 'Medical Teacher',
    title:
      "Exploration of students' reaction in medical error events and the impact of personalized training on the speaking-up behavior in medical error events",
    byline:
      'Yi-Chun Chen, S. Barry Issenberg, Yu-Jui Chiu, Hui-Wen Chen, Zachary Issenberg, Yi-No Kang, Che-Wei Lin, Jen-Chieh Wu',
    authors: ['吳人傑'],
  },
  {
    year: 2022,
    month: 11,
    journal: 'Patient Education and Counseling',
    title: 'Effectiveness of interprofessional shared decision-making training: A mixed-method study',
    byline:
      'Chih-Yin Hsiao, Jeng-Cheng Wu, Pi-Chu Lin, Pang-Yuan Yang, Faith Liao, Shu-Liu Guo, Wen-Hsuan Hou',
    authors: ['吳政誠', '廖若帆', '郭淑柳'],
  },
  {
    year: 2022,
    month: 1,
    journal: 'BMC Medical Education',
    title:
      'How technology-enhanced experiential e-learning can facilitate the development of person-centred communication skills online for health-care students: a qualitative study',
    byline:
      'Faith Liao, David Murphy, Jeng-Cheng Wu, Chien-Yu Chen, Chun-Chao Chang, Po-Fang Tsai',
    authors: ['廖若帆', '吳政誠', '陳建宇'],
  },
  {
    year: 2022,
    month: 1,
    journal: 'Medical Teacher',
    title:
      "Factors associated with medical students' speaking-up about medical errors: A cross-sectional study",
    byline:
      'Yi-Chun Chen, S. Barry Issenberg, Zachary Issenberg, Hui-Wen Cheng, Yi-No Kang, Jen-Chieh Wu',
    authors: ['吳人傑'],
  },
  {
    year: 2021,
    month: 6,
    journal: 'Journal of Palliative Medicine',
    title: 'Launching the Spiritual Care Training Project for Medical Professionals in Taiwan',
    byline:
      'Jeng-Fong Chiou, Ying-Wei Wang, Chiao-Wen Huang, Li-Hui Huang, Pao-Ling Chiang, Faith Liao',
    authors: ['廖若帆'],
  },
];

/**
 * Combined publication counts per year across both audits. The 清冊 stops at
 * June 2022 and the NSTC audit starts at 2021, so 2019–2020 is clinical-only
 * and 2023–2025 is education-only — the dip after 2022 reflects the sources'
 * coverage, not a drop in output.
 */
const PAPERS_BY_YEAR: Array<{ year: number; edu: number; clinical: number }> = [
  { year: 2019, edu: 0, clinical: 17 },
  { year: 2020, edu: 0, clinical: 19 },
  { year: 2021, edu: 1, clinical: 35 },
  { year: 2022, edu: 3, clinical: 13 },
  { year: 2023, edu: 1, clinical: 0 },
  { year: 2024, edu: 2, clinical: 0 },
  { year: 2025, edu: 3, clinical: 0 },
];

/** Total distinct papers across both audits, after removing the shared paper. */
export const HOLISTIC_PAPER_TOTAL = PAPERS_BY_YEAR.reduce(
  (sum, y) => sum + y.edu + y.clinical,
  0,
);

export function resolveAuthorName(zhName: string, lang: Lang): string {
  return lang === 'zh' ? zhName : (RESEARCHER_EN[zhName] ?? zhName);
}

export function buildHolisticResearch(lang: Lang) {
  return {
    eyebrow: 'Research',
    title: pick(lang, '全院全人相關研究', 'Hospital-Wide Holistic Care Research'),
    desc: pick(
      lang,
      '彙整國科會研究人才查詢之全人照護教育標注著作，以及 108–111 年全人相關論文清冊，呈現全院在全人照護領域的研究產出。',
      'Combining NSTC-listed publications tagged as holistic-care education with the 2019–2022 hospital-wide holistic research register.',
    ),
    totalLabel: pick(lang, '篇論文（2019–2025）', 'Papers (2019–2025)'),
    byYear: PAPERS_BY_YEAR,
    byYearTitle: pick(lang, '各年度論文數', 'Papers by Year'),
    eduLegend: pick(lang, '全人照護教育', 'Holistic care education'),
    clinicalLegend: pick(lang, '全人相關臨床研究', 'Holistic clinical research'),
    eduTitle: pick(lang, '全人照護教育期刊論文', 'Holistic Care Education Papers'),
    eduDesc: pick(
      lang,
      '主題涵蓋以病人為中心的溝通、醫病共享決策、靈性照護與醫療錯誤發聲行為，作者均為本院教學與中心主管群。',
      'Covering person-centred communication, shared decision-making, spiritual care and speaking-up behavior in medical error — all authored by our teaching and centre leadership.',
    ),
    authorsLabel: pick(lang, '本院作者', 'Our authors'),
    clinicalTitle: pick(lang, '全人相關臨床研究（108–111 年）', 'Holistic Clinical Research (2019–2022)'),
    clinicalDesc: pick(
      lang,
      '涵蓋 57 位院內作者、71 種國際期刊，主題包括安寧緩和、譫妄照護、醫病共享決策與健康識能。',
      'Spanning 57 hospital authors and 71 international journals, covering palliative care, delirium care, shared decision-making and health literacy.',
    ),
    clinicalStats: [
      { num: 84, label: pick(lang, '篇論文', 'Papers') },
      { num: 36, label: pick(lang, '篇為第一作者', 'As first author') },
      { num: 17, label: pick(lang, '篇為通訊作者', 'As corresponding author') },
    ],
  };
}
