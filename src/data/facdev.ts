import { person, type RawPerson } from './people';
import type { Lang } from '@/i18n';
import { pick } from '@/i18n';
import { formatPhoneExt } from '@/utils/phone';

export const FD_COLORS = {
  ink: '#3A2E25',
  clay: '#A87A6B',
  claySoft: '#C49A8C',
  sage: '#8FA898',
  blue: '#7A95A8',
  ochre: '#B69B66',
};

export interface FdKpi {
  num: number;
  suffix: string;
  label: string;
  en: string;
  color: string;
  delay: number;
}
export interface FdService {
  icon: string;
  tone: string;
  title: string;
  desc: string;
}
export interface FdGroup {
  name: string;
  tone: string;
  desc: string;
  lead: RawPerson;
}

export function buildFacdev(lang: Lang) {
  const isZh = lang === 'zh';
  const { clay, blue, sage, ochre } = FD_COLORS;

  const kpis: FdKpi[] = [
    { num: 102, suffix: '', zh: '種子教師', en: 'Seed Teachers', color: clay },
    { num: 125, suffix: '', zh: '合聘教職', en: 'Joint Appointments', color: blue },
    { num: 6, suffix: '', zh: '114 學年新聘教職', en: 'New Appointments (AY114)', color: sage },
    { num: 6, suffix: '', zh: '六大培育小組', en: 'Cultivation Groups', color: ochre },
  ].map((k, i) => ({ num: k.num, suffix: k.suffix, label: isZh ? k.zh : k.en, en: k.en, color: k.color, delay: i * 70 }));

  const services: FdService[] = [
    { icon: 'cap', tone: clay, zh: '全院臨床教師發展與培訓', en: 'Hospital-wide Faculty Development & Training', descZh: '依醫策會（JCT）規範與醫院評鑑要求，規劃系統性、分層的師資培育課程，培訓全院西醫、中醫、牙醫及各醫事職類臨床教師，奠定紮實的教學知能基礎。', descEn: 'Systematic, tiered faculty-training curricula aligned with JCT standards and hospital accreditation, covering clinical teachers across Western medicine, TCM, dentistry and all allied-health roles.' },
    { icon: 'award', tone: blue, zh: '教職新聘與升等業務', en: 'Academic Appointment & Promotion', descZh: '協助臨床人員申請臺北醫學大學教職（新聘）與職級升等，提供資格論診、文件審查與流程協助，銘接臨床服務與學術發展。', descEn: 'Guiding clinical staff through TMU academic-appointment and promotion applications — eligibility advice, document review and process support that bridges clinical service and scholarship.' },
    { icon: 'bulb', tone: ochre, zh: '教學讀書會與獎項評選', en: 'Teaching Journal Club & Awards', descZh: '每月舉辦教學讀書會，深化教學知能交流；每年辦理「優良教師獎」與「教學創新獎」評選，表揚卓越教學與創新教法，營造重視教學的院內文化。', descEn: 'Monthly teaching journal clubs deepen pedagogical exchange; annual Outstanding Teacher and Teaching Innovation awards celebrate excellence and nurture a teaching-valued culture.' },
    { icon: 'clipboard', tone: sage, zh: '教師發展委員會', en: 'Faculty Development Committee', descZh: '每季召開一次委員會，追蹤全院臨床教師培訓完成狀況，檢視醫院整體教學成效，並據以滾動修正師資發展策略。', descEn: 'Quarterly committee meetings track faculty-training completion across the hospital, review overall teaching effectiveness, and iteratively refine development strategy.' },
  ].map((s) => ({ icon: s.icon, tone: s.tone, title: isZh ? s.zh : s.en, desc: isZh ? s.descZh : s.descEn }));

  const groups: FdGroup[] = [
    { zh: 'CBME–課程組', en: 'CBME · Curriculum', tone: clay, lead: person('邱欣怡', 'Hsin-Yi Chiu', 'lead', '西醫 · 助理教授', 'Physician · Asst. Prof.', 'hsin-yi-chiu', 'hsin-yi-chiu'), descZh: '規劃以勝任能力為導向（CBME）的課程設計與里程碑架構。', descEn: 'Competency-based curriculum design and milestone frameworks.' },
    { zh: 'CBME–評量組', en: 'CBME · Assessment', tone: blue, lead: person('吳政誠', 'Jeng-Cheng Wu', 'lead', '西醫 · 助理教授', 'Physician · Asst. Prof.', 'jeng-cheng-wu', 'jeng-cheng-wu'), descZh: '發展 Mini-CEX、DOPS、CbD 等評量工具與 EPA 信效度分析。', descEn: 'Mini-CEX, DOPS, CbD tools and EPA reliability/validity analysis.' },
    { zh: '永續韌性組', en: 'Sustainability & Resilience', tone: sage, lead: person('陳建宇', 'Chien-Yu Chen', 'lead', '西醫 · 教授', 'Physician · Professor', 'chien-yu-chen', 'chien-yu-chen'), descZh: '推動教師身心永續與職場韌性，深化教學熱情與職涯發展。', descEn: 'Faculty wellbeing, workplace resilience and career development.' },
    { zh: '科技輔導教學組', en: 'Technology-Enhanced Teaching', tone: ochre, lead: person('吳人傑', 'Jen-Chieh Wu', 'lead', '西醫 · 助理教授', 'Physician · Asst. Prof.', 'jen-chieh-wu', 'jen-chieh-wu'), descZh: '導入數位與模擬科技輔助教學，提升教學互動與學習成效。', descEn: 'Digital and simulation technology to enhance teaching and learning.' },
    { zh: '實證醫學組', en: 'Evidence-Based Medicine', tone: '#9C6F8E', lead: person('林秀真', 'Hsiu-Chen Lin', 'lead', '西醫 · 副教授', 'Physician · Assoc. Prof.', 'hsiu-chen-lin', 'hsiu-chen-lin'), descZh: '將實證醫學精神融入教學，培養師生實證查證與應用能力。', descEn: 'Embedding evidence-based medicine into teaching practice.' },
    { zh: '全人照護組', en: 'Holistic Care', tone: '#6E8A77', lead: person('廖若帆', 'Faith Ruofan Liao', 'lead', '護理 · 副教授', 'Nursing · Assoc. Prof.', 'faith-ruofan-liao', 'faith-ruofan-liao'), descZh: '發展全人照護教案與跨職類教學，落實以人為本的醫學教育。', descEn: 'Holistic-care teaching cases and cross-professional education.' },
  ].map((g) => ({ name: isZh ? g.zh : g.en, tone: g.tone, desc: isZh ? g.descZh : g.descEn, lead: g.lead }));

  return {
    colors: FD_COLORS,
    eyebrow: 'Center for Faculty Development',
    heroTitle: pick(lang, '成就每一位卓越的臨床教師', 'Cultivating every outstanding clinical teacher'),
    heroTag: pick(lang, '以師資培育為根本，串連課程、評量、教職與獎勵機制，打造全院跨職類的教學卓越文化。', 'Rooted in faculty cultivation — weaving together curriculum, assessment, appointments and recognition to build a hospital-wide culture of teaching excellence.'),
    aboutEyebrow: pick(lang, '中心定位與使命', 'Mission & Positioning'),
    aboutTitle: pick(lang, '以教師發展，成就醫學教育', 'Faculty growth, the root of medical education'),
    aboutBody: pick(lang, '教師發展中心隸屬於教學部，由陳明德主任帶領團隊，負責全院臨床教師的培育與學校教職相關事務，以系統性課程、評鑑遵循與委員會機制，持續提升整體教學品質與師資專業發展。', 'Within the Department of Medical Education, Director Ming-De Chen leads a team responsible for hospital-wide faculty cultivation and academic-appointment affairs — systematic curricula, accreditation alignment and a committee mechanism that continually raises teaching quality.'),
    aboutBody2: pick(lang, '下設六大教學培育小組，串連 CBME、永續韌性、科技教學、實證醫學與全人照護，讓教學專業在各領域生根。', 'Six cultivation groups span CBME, sustainability, technology-enhanced teaching, evidence-based medicine and holistic care — rooting pedagogical expertise across every domain.'),
    membersTitle: pick(lang, '中心成員', 'Center Members'),
    servicesEyebrow: pick(lang, '中心核心業務', 'Core Services'),
    servicesTitle: pick(lang, '四大核心業務', 'Four Core Services'),
    servicesDesc: pick(lang, '從培訓、教職、讀書會到委員會，全方位支援臨床教師的專業成長。', 'From training and appointments to journal clubs and committee oversight — supporting clinical teachers at every step.'),
    groupsEyebrow: pick(lang, '教學培育組織', 'Cultivation Structure'),
    groupsTitle: pick(lang, '六大教學培育小組', 'Six Teaching Cultivation Groups'),
    groupsDesc: pick(lang, '六個專責小組各司其職、互相協作，共同深化全院教學培育的各個面向。', 'Six dedicated groups, each with its own focus, jointly deepening every dimension of hospital-wide faculty cultivation.'),
    groupRoot: pick(lang, '教師發展中心', 'Center for Faculty Development'),
    groupLeadLabel: pick(lang, '負責人', 'Lead'),
    newsEyebrow: 'Announcements',
    newsTitle: pick(lang, '最新公告', 'Latest News'),
    actEyebrow: 'Activities',
    actTitle: pick(lang, '近期活動', 'Activities'),
    reservedNote: pick(lang, '此區塊已預留給中心最新公告與近期活動。未來與活動管理平台串接後，將自動顯示「對外看板」的公告與報名資訊。', 'This space is reserved for the center’s latest news and activities. Once linked to the activity-management platform, the public board’s announcements will appear here automatically.'),
    reservedTag: pick(lang, '內容建置中', 'Coming soon'),
    closingTitle: pick(lang, '好的教師，是醫學教育最深的根基', 'Great teachers are the deepest roots of medical education'),
    closingBody: pick(lang, '教師發展中心以系統性培育、教職支持與六大小組協作，陸續協助全院跨職類教師成長，為醫學教育的永續發展扎下深厚根基。', 'Through systematic cultivation, appointment support and six collaborating groups, the Center helps clinical teachers across all professions grow — laying deep roots for the sustainable future of medical education.'),
    contactPerson: pick(lang, '行政專員：陳均茹', 'Administrator: Chun-Ju Chen'),
    contactExt: formatPhoneExt('3757', lang),
    contactPlace: pick(lang, '臺北醫學大學附設醫院 · 教學部 教師發展中心', 'TMU Hospital · Center for Faculty Development, Dept. of Medical Education'),
    contactQuote: pick(lang, '成就教師，就是成就每一位未來的醫療人才。', 'To grow a teacher is to grow every future caregiver.'),
    kpis,
    services,
    groups,
  };
}
