import type { Lang } from '@/i18n';
import { pick } from '@/i18n';
import { formatPhoneExt } from '@/utils/phone';

export const EBM_COLORS = {
  ink: 'var(--ebm-ink)',
  gold: 'var(--tone-gold)',
  goldSoft: 'var(--ebm-gold-soft)',
  blue: 'var(--tone-slate)',
};

export interface EbmKpi {
  num: number;
  suffix: string;
  label: string;
  en: string;
  color: string;
  delay: number;
}
export interface EbmMission {
  tag: string;
  title: string;
  desc: string;
}
export interface EbmAward {
  sess: string;
  award: string;
  tone: string;
  note?: string;
}
export interface EbmStage {
  phase: string;
  name: string;
  years: string;
  color: string;
  items: string[];
}
export interface EbmCourseGroup {
  gicon: string;
  title: string;
  color: string;
  rows: Array<{ name: string; detail: string }>;
}

export function buildEbm(lang: Lang) {
  const isZh = lang === 'zh';
  const { gold, blue } = EBM_COLORS;

  const kpis: EbmKpi[] = [
    { num: 20, suffix: '+', zh: '年實證深耕', en: 'Years since 2004', color: gold },
    { num: 4, suffix: '', zh: '大核心任務', en: 'Core Missions', color: blue },
    { num: 15, suffix: '+', zh: '年 NHQA 持續參與', en: 'Years at NHQA', color: 'var(--c-med-edu-research)' },
    { num: 3, suffix: '', zh: '大競賽組別', en: 'Contest Tracks', color: 'var(--c-faculty-dev)' },
  ].map((k, i) => ({ num: k.num, suffix: k.suffix, label: isZh ? k.zh : k.en, en: k.en, color: k.color, delay: i * 70 }));

  const missions: EbmMission[] = [
    { tag: '01', zh: 'NHQA（現為 NCMEA）實證醫學競賽', en: 'NHQA / NCMEA EBM Contest', descZh: '積極參與國家醫療品質獎（NHQA）實證醫學類競賽，自民國 109 年榮獲金獎及潛力獎，110 年更獲頒「持續參與特別獎（15 年）」。', descEn: 'Competing in the National Healthcare Quality Award (NHQA) EBM category — Gold and Potential Awards in 2020, and a 15-year Sustained Participation Award in 2021.' },
    { tag: '02', zh: '實證醫學研討會投稿', en: 'EBM Conference Submissions', descZh: '鼓勵全院各職類醫療人員共同參與論文投稿，促進院內外學術交流，提升實證醫學領域的能見度與影響力。', descEn: 'Encouraging staff across all disciplines to submit papers, fostering academic exchange and raising the hospital’s visibility in evidence-based medicine.' },
    { tag: '03', zh: 'EBQI 品質改善專案', en: 'EBQI Quality Improvement', descZh: '導入「實證醫學改善醫療品質方案（EBQI）」，跨領域發掘臨床問題，透過實證方法將研究證據轉化為實際的醫療品質改善行動。', descEn: 'Evidence-Based Quality Improvement (EBQI) turns clinical problems into solutions across departments, translating research evidence into real quality gains.' },
    { tag: '04', zh: '實證醫學教育培訓', en: 'EBM Education & Training', descZh: '定期辦理多層次實證醫學能力培訓課程，涵蓋初階至進階，並與圖書館資訊部門合作辦理文獻檢索課程。', descEn: 'Multi-level EBM training from beginner to advanced, with literature-search courses run alongside the library and information department.' },
  ].map((m) => ({ tag: m.tag, title: isZh ? m.zh : m.en, desc: isZh ? m.descZh : m.descEn }));

  const awardsLit: EbmAward[] = [
    { sess: pick(lang, '第 7 屆', '7th'), award: pick(lang, '銀獎', 'Silver'), tone: 'var(--muted)' },
    { sess: pick(lang, '第 14 ・15 屆', '14th · 15th'), award: pick(lang, '潛力獎', 'Potential'), tone: 'var(--c-med-edu-research)' },
    { sess: pick(lang, '第 16 ・21 屆', '16th · 21st'), award: pick(lang, '金獎', 'Gold'), tone: gold },
    { sess: pick(lang, '第 22 屆', '22nd'), award: pick(lang, '15 年以上持續參與特別獎', '15-yr Sustained'), tone: blue },
  ];

  const awardsClin: EbmAward[] = [
    { sess: pick(lang, '第 10 屆', '10th'), award: pick(lang, '潛力獎', 'Potential'), tone: 'var(--c-med-edu-research)', note: '' },
    { sess: pick(lang, '特別獎項', 'Special'), award: pick(lang, '金獎', 'Gold'), tone: gold, note: pick(lang, '全腹膜外內視鏡腹股溝痝氣修補手術之人工網膌固定改善專案', 'Mesh fixation improvement in TEP inguinal hernia repair') },
    { sess: pick(lang, '第 12 屆', '12th'), award: pick(lang, '潛力獎', 'Potential'), tone: 'var(--c-med-edu-research)', note: pick(lang, '預防性投與類固醇以改善全身麻醉手術後之冑心嘔吐專案', 'Prophylactic steroids to reduce post-anesthesia nausea & vomiting') },
  ];

  const awardsTrans: EbmAward[] = [
    { sess: pick(lang, '113 學年起', 'From AY113'), award: pick(lang, '新增參與', 'Newly Joined'), tone: 'var(--tone-slate)', note: pick(lang, '自 113 學年度起參與 NCMEA 知識轉譯組競賽，拓展實證應用新面向。', 'Joined the NCMEA Knowledge-Translation track from AY113, opening a new dimension of evidence application.') },
    { sess: pick(lang, '推動重點', 'Focus'), award: pick(lang, '證據轉化', 'Translation'), tone: 'var(--c-med-edu-research)', note: pick(lang, '以每月「實證醫學知識轉譯討論會」為基礎，推動證據轉化為臨床決策。', 'Built on the monthly knowledge-translation forum, turning evidence into clinical decisions.') },
  ];

  const stages: EbmStage[] = [
    { phase: pick(lang, '第一階段', 'Phase 1'), name: pick(lang, '奠基階段', 'Foundation'), years: pick(lang, '民國 93–103 年', '2004–2014'), color: gold, items: pick(lang, ['正式成立實證醫學中心，制定院內推動制度架構', '針對 R、PGY、UGY 及各類醫事人員開設適切課程', '定期舉辦 EBM Journal Club，建立臨床討論文化', '推動 Clinical based–PBL–EBM 整合課程'], ['Founded the EBM Center and its hospital-wide framework', 'Tailored courses for residents (R), PGY, UGY and allied health', 'Regular EBM Journal Club to build a clinical-discussion culture', 'Clinical-based PBL-EBM integrated curriculum']) },
    { phase: pick(lang, '第二階段', 'Phase 2'), name: pick(lang, '擴展階段', 'Expansion'), years: pick(lang, '民國 104–107 年', '2015–2018'), color: blue, items: pick(lang, ['首度協辦「北醫體系一校三院實證醫學競賽」', '辦理院內競賽成果發表會', '參與臺灣實證醫學學會，由院內人員遮選為理監事', '協助醫策會舉辦文獻查證競賽'], ['Co-hosted the TMU system one-university-three-hospital EBM contest', 'Held in-hospital contest result presentations', 'Active in the Taiwan EBM Association; elected to its board', 'Assisted the JCT in running literature-appraisal contests']) },
    { phase: pick(lang, '第三階段', 'Phase 3'), name: pick(lang, '深化階段', 'Deepening'), years: pick(lang, '民國 108–至今', '2019–Present'), color: 'var(--c-med-edu-research)', items: pick(lang, ['108 年舉辦「實證教學與臨床應用發表會」', '111–113 年每年舉辦實證醫學能力競賽暨成果發表會', '持續參與國際實證醫學學術活動', '籌設「臺北醫學大學考科藍臺灣校級研究中心」'], ['2019 “EBM Teaching & Clinical Application” showcase', 'Annual EBM competency contests, 2022–2024', 'Ongoing participation in international EBM activities', 'Establishing the Cochrane Taiwan university research center']) },
  ];

  const courseGroups: EbmCourseGroup[] = [
    { gicon: 'chart', title: pick(lang, '系統性課程', 'Systematic Courses'), color: gold, rows: pick(lang, [['實證醫學 Meta-analysis 帶狀課程', '每月 1 堂・全年持續'], ['文獻查證培訓班（初階）', '每年 2–4 月・奠定基礎'], ['文獻查證培訓班（進階）', '每年 5–7 月・進階分析']], [['Meta-analysis course series', 'Monthly · year-round'], ['Literature appraisal (Beginner)', 'Feb–Apr each year'], ['Literature appraisal (Advanced)', 'May–Jul each year']]).map((r) => ({ name: r[0], detail: r[1] })) },
    { gicon: 'skills', title: pick(lang, '應用與實踐', 'Application & Practice'), color: blue, rows: pick(lang, [['文獻查證院內競賽', '每年 1 次・實戰演練'], ['實證知識轉譯討論會', '每月 1 次・證據轉化'], ['其他相關課程', '每年不定期舉辦']], [['In-hospital appraisal contest', 'Once a year · hands-on'], ['Knowledge-translation forum', 'Monthly'], ['Other related courses', 'Periodically']]).map((r) => ({ name: r[0], detail: r[1] })) },
    { gicon: 'cap', title: pick(lang, '師資培育', 'Faculty Cultivation'), color: 'var(--c-med-edu-research)', rows: pick(lang, [['實證醫學種子師資培訓課程', '每年 3–4 堂'], ['院內實證教學人才庫', '系統性管理'], ['培養未來實證領導者', '長期培育計畫']], [['Seed-teacher training', '3–4 sessions/year'], ['Teaching talent pool', 'Systematic management'], ['Future EBM leaders', 'Long-term program']]).map((r) => ({ name: r[0], detail: r[1] })) },
  ];

  return {
    colors: EBM_COLORS,
    eyebrow: 'Evidence-Based Medicine Center',
    heroTitle: pick(lang, '提升醫療品質的關鍵引擎', 'The key engine for better care quality'),
    heroTag: pick(lang, '以「實證為基礎，引領臨床實踐，提升醫療品質，創造最佳病患照護」為核心使命，推動院內實證醫學文化。', 'Anchored in evidence to lead clinical practice, raise care quality and create the best patient outcomes — advancing a hospital-wide culture of evidence-based medicine.'),
    aboutEyebrow: pick(lang, '中心定位與核心使命', 'Mission & Positioning'),
    aboutTitle: pick(lang, '實證為基，深耕二十餘載', 'Evidence at the core, two decades deep'),
    aboutBody: pick(lang, '本中心隸屬於教學部，由林秀真主任帶領專業團隊，採多管齊下策略推動院內實證醫學文化：從競賽參與、品質改善專案到系統性教育培訓，建立起完整且可持續的發展體系。', 'Within the Department of Medical Education, Director Hsiu-Chen Lin leads a multi-pronged strategy — from contests and quality-improvement projects to systematic training — building a complete, sustainable evidence-based medicine system.'),
    aboutBody2: pick(lang, '長期致力於培育院內實證醫學專業人才，積極推動跨領域合作，並於國家級醫療品質競賽中屢創佳績。', 'Cultivating in-house EBM talent, driving cross-disciplinary collaboration, and repeatedly excelling at national healthcare-quality competitions.'),
    membersTitle: pick(lang, '中心成員', 'Center Members'),
    missionsEyebrow: pick(lang, '組織任務架構', 'Organizational Mandate'),
    missionsTitle: pick(lang, '四大核心任務', 'Four Core Missions'),
    missionsDesc: pick(lang, '分工明確、相互支援，共同推動全院實證醫學能量的提升。', 'Clearly divided yet mutually supportive, together raising the hospital’s evidence-based medicine capacity.'),
    awardsEyebrow: pick(lang, 'NHQA（現為 NCMEA）實證醫學競賽', 'NHQA / NCMEA Achievements'),
    awardsTitle: pick(lang, '競賽輝煌成就', 'A Record of Distinction'),
    awardsDesc: pick(lang, '長期投入國家醫療品質獎實證醫學類競賽，於文獻查證組與臨床應用組均有亮眼成績，並自 113 學年度起參與知識轉譯組，持續拓展實證應用面向。', 'Sustained investment in the NHQA EBM category — standout results in the literature-appraisal and clinical-application tracks, and from AY113 also competing in the knowledge-translation track.'),
    awardsLitTitle: pick(lang, '文獻查證組', 'Literature Appraisal Track'),
    awardsClinTitle: pick(lang, '臨床應用組', 'Clinical Application Track'),
    awardsTransTitle: pick(lang, '知識轉譯組', 'Knowledge Translation Track'),
    colSession: pick(lang, '屆別', 'Session'),
    colAward: pick(lang, '獲獎紀錄', 'Award'),
    journeyEyebrow: pick(lang, '二十年的卓越發展', 'Twenty Years of Progress'),
    journeyTitle: pick(lang, '實證醫學推動歷程', 'Our Journey'),
    journeyDesc: pick(lang, '自民國 93 年創立至今，歷經三個階段的持續耕耘，逐步建立完整的院內實證醫學生態系統。', 'From its founding in 2004, three phases of sustained effort have built a complete in-hospital EBM ecosystem.'),
    coursesEyebrow: pick(lang, '實證中心年度訓練課程', 'Annual Training Program'),
    coursesTitle: pick(lang, '階梯式訓練體系', 'A Stepwise Curriculum'),
    coursesDesc: pick(lang, '依循「系統性、階梯式」設計原則，由淺入深，將實證醫學能力落實於日常臨床實務。', 'A systematic, stepwise design that moves from basics to advanced application, embedding EBM into daily clinical practice.'),
    closingTitle: pick(lang, '讓實證成為每一次臨床決策的基石', 'Making evidence the foundation of every clinical decision'),
    closingBody: pick(lang, '教學部實證醫學中心歷經二十餘年耕耘，已在本院建立起完整的實證醫學推動體系。從教育培訓、競賽參與到品質改善，持續為病患提供最佳照護品質。', 'Over two decades the Center has built a complete EBM system — from training and contests to quality improvement — continually striving to deliver the best care for patients.'),
    contactPerson: pick(lang, '行政專員：江明憲', 'Administrator: Ming-Hsien Chiang'),
    contactExt: formatPhoneExt('3760', lang),
    contactPlace: pick(lang, '臺北醫學大學附設醫院 · 教學部 實證醫學中心', 'TMU Hospital · EBM Center, Dept. of Medical Education'),
    contactQuote: pick(lang, '以實證深耕醫療品質，讓最佳證據走進每一個臨床現場。', 'Deepening care quality through evidence — the best evidence at every bedside.'),
    kpis,
    missions,
    awardsLit,
    awardsClin,
    awardsTrans,
    stages,
    courseGroups,
  };
}
