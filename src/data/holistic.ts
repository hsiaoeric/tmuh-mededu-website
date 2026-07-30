import { person, type RawPerson } from './people';
import { HOLISTIC_PAPER_TOTAL } from './holisticPapers';
import type { Lang } from '@/i18n';
import { pick } from '@/i18n';

export const HOLISTIC_INSTRUCTORS: RawPerson[] = [
  person('廖若帆', 'Faith Ruofan Liao', 'instructor', '護理 · 副教授<br>教學部 全人中心', 'Nursing · Assoc. Prof.<br>Holistic Center', 'faith-ruofan-liao', 'faith-ruofan-liao'),
  person('吳忠哲', 'Chung-Che Wu', 'instructor', '西醫 · 副教授<br>神經外科', 'Physician · Assoc. Prof.<br>Neurosurgery', 'chung-che-wu', 'chung-che-wu'),
];

export const HOLISTIC_SEED: RawPerson[] = [
  person('丁禮莉', 'Lai-Lei Ting', 'seed', '西醫<br>放射腫瘤科', 'Physician<br>Radiation Oncology', 'lai-lei-ting'),
  person('吳政誠', 'Jeng-Cheng Wu', 'seed', '西醫 · 助理教授<br>泌尿科', 'Physician · Asst. Prof.<br>Urology', 'jeng-cheng-wu'),
  person('彭思媛', 'Szu-Yuan Peng', 'seed', '社工<br>社工室', 'Social Work<br>Social Work Office'),
  person('王莉萱', 'Li-Hsuan Wang', 'seed', '藥劑 · 教授<br>藥劑部', 'Pharmacy · Prof.<br>Pharmacy', 'li-hsuan-wang'),
  person('范芳郡', 'Fang-Chun Fan', 'seed', '放射<br>影像醫學部', 'Radiology<br>Medical Imaging', 'fang-chun-fan'),
  person('曹念萱', 'Nien-Hsuan Tsao', 'seed', '護理<br>護理部', 'Nursing<br>Nursing Dept.', 'nien-hsuan-tsao'),
  person('曲天尚', 'Tien-Shang Chu', 'seed', '護理<br>護理部', 'Nursing<br>Nursing Dept.', 'tien-shang-chu'),
  person('高倩琪', 'Chien-Chi Kao', 'seed', '關懷師<br>員工關懷中心', 'Chaplain<br>Staff Care'),
  person('蔡宜庭', 'Yi-Ting Tsai', 'seed', '臨床心理<br>精神科', 'Clinical Psych.<br>Psychiatry'),
  person('葉雅文', 'Ya-Wen Yeh', 'seed', '語言治療<br>復健醫學部', 'Speech Therapy<br>Rehab Medicine'),
  person('王怡文', 'Yi-Wen Wang', 'seed', '行政<br>教學部', 'Administration<br>Medical Education'),
];

export const HOLISTIC_AI_TEAM: RawPerson[] = [
  person('廖若帆', 'Faith Ruofan Liao', 'pm', '副主任 · 副教授', 'Deputy Director · Assoc. Prof.', 'faith-ruofan-liao', 'faith-ruofan-liao'),
  person('邵軒磊', 'Hsuan-Lei Shao', 'ai', '教授', 'Professor', 'hsuan-lei-shao'),
  person('Diana Gonzalez', 'Diana Gonzalez', 'eng', 'MD · 範疇二團隊', 'MD · Scope 2 Team'),
];

interface AlgeeStep {
  letter: string;
  zh: [string, string];
  en: [string, string];
}

export const ALGEE: AlgeeStep[] = [
  { letter: 'A', zh: ['接近、評估與協助危機', '主動關懷，留意潛在的自傷或危機徵兆，在安全前提下評估狀況並適時介入。'], en: ['Approach, assess & assist', 'Reach out with care, watch for signs of self-harm or crisis, and step in safely when needed.'] },
  { letter: 'L', zh: ['不帶批判地聆聽', '放下評價，給予一個安全、被理解的傾訴空間，讓對方願意說出感受。'], en: ['Listen non-judgmentally', 'Set judgment aside and offer a safe, understanding space so the person feels heard.'] },
  { letter: 'G', zh: ['給予支持與資訊', '提供正確、實用的身心健康資訊，並表達理解與支持。'], en: ['Give support & information', 'Share accurate, practical mental-health information alongside understanding and support.'] },
  { letter: 'E', zh: ['鼓勵尋求專業協助', '協助對方連結醫療與專業資源，跨出求助的第一步。'], en: ['Encourage professional help', 'Help the person connect with medical and professional resources, and take the first step.'] },
  { letter: 'E', zh: ['鼓勵其他支持', '善用家庭、同儕與社區的支持網絡，讓關懷持續發生。'], en: ['Encourage other supports', 'Draw on family, peer and community networks so support continues over time.'] },
];

export interface HolisticKpi {
  num: number;
  display: string;
  isStatic: boolean;
  label: string;
  color: string;
  subtitle?: string;
}

export function holisticKpis(lang: Lang): HolisticKpi[] {
  const raw: Array<
    | { num: number; label: string; color: string; subtitle?: string }
    | { display: string; label: string; color: string }
  > = [
    { num: 142, label: pick(lang, '全人種子教師（累計）', 'Holistic Seed Teachers (total)'), color: 'var(--c-holistic)' },
    {
      num: 87,
      label: pick(lang, '113 學年種子教師', 'AY113 Seed Teachers'),
      color: 'var(--c-research)',
      subtitle: pick(lang, '醫師 40 · 醫事 14 · 護理 33', 'Physicians 40 · Allied 14 · Nursing 33'),
    },
    { num: 11, label: pick(lang, 'MHFA 種子教師', 'MHFA Seed Teachers'), color: 'var(--c-ebm)' },
    { num: 2, label: pick(lang, 'MHFA 指導員', 'MHFA Instructors'), color: 'var(--c-skills)' },
    {
      num: HOLISTIC_PAPER_TOTAL,
      label: pick(lang, '全院全人相關研究論文', 'Hospital-Wide Holistic Research'),
      color: 'var(--c-facdev)',
      subtitle: pick(lang, '2019–2025 · 含 10 篇全人照護教育', '2019–2025 · incl. 10 on education'),
    },
  ];
  return raw.map((k) => ({
    num: 'num' in k ? k.num : 0,
    display: 'display' in k ? k.display : '',
    isStatic: 'display' in k,
    label: k.label,
    color: k.color,
    subtitle: 'subtitle' in k ? k.subtitle : undefined,
  }));
}

export interface HolisticFeature {
  iconId: string;
  title: string;
  desc: string;
  delay: number;
}

export function holisticFeatures(lang: Lang): HolisticFeature[] {
  return [
    { iconId: 'brain', title: pick(lang, '心理健康急救', 'Mental Health First Aid'), desc: pick(lang, '引進國際 MHFA 課程，培訓同仁辨識、陪伴並適時轉介需要協助的人。', 'International MHFA training to recognize, accompany and refer those who need help.'), delay: 0 },
    { iconId: 'sprout', title: pick(lang, '種子教師培育', 'Seed Teacher Cultivation'), desc: pick(lang, '集結護理、醫師、藥劑、社工、心理、語言治療等跨領域人才，將關懷文化向下扎根。', 'Bringing together nursing, medicine, pharmacy, social work, psychology and more to root a culture of care.'), delay: 100 },
    { iconId: 'network', title: pick(lang, '跨科部協作', 'Cross-Department Collaboration'), desc: pick(lang, '串連臨床各單位與校園資源，打造彼此支持、能即時伸出援手的健康職場。', 'Linking clinical units and campus resources into a supportive, responsive, healthy workplace.'), delay: 200 },
    { iconId: 'team', title: pick(lang, '全人教育小組', 'Holistic Education Working Group'), desc: pick(lang, '跨越西醫、中醫、牙醫與各醫事職類，組成專責團隊，共同鑽研全人照護教案設計與教學發展，讓全人精神在每個專業領域生根。', 'A dedicated cross-professional team — uniting Western medicine, TCM, dentistry and all allied-health roles — to co-develop holistic-care teaching cases and curricula across every discipline.'), delay: 300 },
  ];
}

export interface AiFlowStep {
  role: string;
  title: string;
  text: string;
  color: string;
}
export interface AiStep {
  n: string;
  title: string;
  text: string;
}

export function buildAiEcosystem(lang: Lang) {
  return {
    title: pick(lang, 'AI 全人照護教學模擬生態系', 'AI Holistic-Care Teaching Simulation Ecosystem'),
    body: pick(
      lang,
      '本計畫的核心不是單一工具，而是一個可以反覆練習、即時回饋、持續累積案例的教學模擬生態系。以全人臨床情境為主軸，串接 AI 病人、教案 AI 化、平板與 VR 模擬練習、全人學習成效回饋，以及 Line AI ChatBot 隨身助教，讓教師設計情境、學生進入情境，AI 協助互動與回饋。',
      'The core is not a single tool but a teaching-simulation ecosystem for repeated practice, instant feedback and an accumulating case library — connecting AI patients, AI-authored cases, tablet & VR simulation, holistic learning feedback and a Line AI ChatBot assistant.',
    ),
    problemsTitle: pick(lang, '生態系要解決什麼問題？', 'What does the ecosystem solve?'),
    teamLabel: pick(lang, '範疇二团隊', 'Scope 2 Team'),
    flow: [
      { role: pick(lang, '教師端', 'Faculty'), title: pick(lang, '教案 AI 化', 'AI-authored cases'), text: pick(lang, '把全人照護目標、臨床任務與討論問題轉成可互動的情境教案。', 'Turn holistic-care goals, clinical tasks and discussion prompts into interactive case scenarios.'), color: 'var(--c-holistic)' },
      { role: pick(lang, '情境內容', 'Scenario'), title: pick(lang, '全人臨床情境', 'Whole-person clinical context'), text: pick(lang, '以醫學、人文、心理、倫理與照護脈絡設計案例。', 'Cases designed across medical, humanistic, psychological, ethical and care contexts.'), color: 'var(--c-research)' },
      { role: pick(lang, '學生端', 'Student'), title: pick(lang, '平板與 VR 模擬練習', 'Tablet & VR simulation'), text: pick(lang, '學生透過問診、判斷、醫令與治療計畫練習臨床推理。', 'Students practice clinical reasoning through history-taking, judgment, orders and treatment plans.'), color: 'var(--c-skills)' },
      { role: pick(lang, '回饋端', 'Feedback'), title: pick(lang, '即時回饋與 Line AI ChatBot', 'Instant feedback & Line AI ChatBot'), text: pick(lang, '提供學習歷程回饋與全人臨床隨身助教，支援課後延伸學習。', 'Learning-process feedback plus an on-the-go holistic clinical assistant for after-class study.'), color: 'var(--c-ebm)' },
    ] as AiFlowStep[],
    steps: [
      { n: '01', title: pick(lang, '情境設計', 'Scenario design'), text: pick(lang, '教師將全人照護能力指標轉為臨床任務與討論問題', 'Faculty translate holistic-care competencies into clinical tasks and prompts') },
      { n: '02', title: pick(lang, 'AI 病人互動', 'AI patient interaction'), text: pick(lang, '學生與 AI 病人進行問診、診斷說明與治療溝通', 'Students conduct history-taking, diagnosis and treatment communication with an AI patient') },
      { n: '03', title: pick(lang, '模擬練習導入', 'Simulation practice'), text: pick(lang, '結合平板、VR 與小組討論，讓課程更貼近臨床現場', 'Tablet, VR and group discussion bring courses closer to the clinical floor') },
      { n: '04', title: pick(lang, '回饋與延伸', 'Feedback & extension'), text: pick(lang, '以即時回饋與 ChatBot 協助學生整理學習成效', 'Instant feedback and the ChatBot help students consolidate learning outcomes') },
    ] as AiStep[],
    problems: pick(
      lang,
      [
        '讓全人照護不只停留在理念，而是變成可操作、可練習、可回饋的教學流程。',
        '讓學生在進入真實臨床前，先透過 AI 病人練習問診、判斷、溝通與治療計畫。',
        '讓教師能快速產出情境教案，並透過學習成效回饋持續修正課程。',
      ],
      [
        'Make holistic care operational, practiceable and measurable — not just an ideal.',
        'Let students rehearse history-taking, judgment, communication and treatment with AI patients before real clinics.',
        'Help faculty rapidly produce case scenarios and refine courses through learning-outcome feedback.',
      ],
    ),
  };
}

export interface HolisticSymposium {
  year: number;
  edition: string;
  title: string;
  dates: string;
  time?: string;
  attendees?: number;
  satisfaction?: number;
}

const HOLISTIC_SYMPOSIUMS_ZH: HolisticSymposium[] = [
  {
    year: 2021,
    edition: '第一屆',
    title: '靈性關懷國際研討會',
    dates: '2021/12/04（六）',
    time: '08:00–17:00',
    attendees: 382,
    satisfaction: 4.52,
  },
  {
    year: 2022,
    edition: '第二屆',
    title: '全人醫療—靈性關懷國際研討會',
    dates: '2022/12/03（六）– 12/04（日）',
    time: '08:00–17:00 / 08:00–12:00',
    attendees: 916,
  },
  {
    year: 2023,
    edition: '第一屆',
    title: '韌性國際研討會',
    dates: '2023/04/30（日）',
    time: '10:00–16:00',
    attendees: 165,
    satisfaction: 4.88,
  },
  {
    year: 2024,
    edition: '113 學年',
    title: '全人照護核心能力研討會',
    dates: '2024/06/15',
    time: '08:30–12:30',
  },
];

const HOLISTIC_SYMPOSIUMS_EN: HolisticSymposium[] = [
  {
    year: 2021,
    edition: '1st',
    title: 'International Symposium on Spiritual Care',
    dates: 'Sat 2021/12/04',
    time: '08:00–17:00',
    attendees: 382,
    satisfaction: 4.52,
  },
  {
    year: 2022,
    edition: '2nd',
    title: 'Holistic Medicine — Spiritual Care International Symposium',
    dates: 'Sat–Sun 2022/12/03–04',
    time: '08:00–17:00 / 08:00–12:00',
    attendees: 916,
  },
  {
    year: 2023,
    edition: '1st',
    title: 'International Resilience Symposium',
    dates: 'Sun 2023/04/30',
    time: '10:00–16:00',
    attendees: 165,
    satisfaction: 4.88,
  },
  {
    year: 2024,
    edition: 'AY113',
    title: 'Holistic Care Core Competency Symposium',
    dates: '2024/06/15',
    time: '08:30–12:30',
  },
];

export function buildHolisticOutcomes(lang: Lang) {
  const isZh = lang === 'zh';
  return {
    symposiumEyebrow: pick(lang, 'Symposia', 'Symposia'),
    symposiumTitle: pick(lang, '全人研討會', 'Holistic Symposia'),
    symposiumDesc: pick(
      lang,
      '教學部主辦之全人照護、靈性關懷與韌性相關國際研討會與論壇。',
      'International symposia and forums on holistic care, spiritual care and resilience hosted by the Department.',
    ),
    symposiums: isZh ? HOLISTIC_SYMPOSIUMS_ZH : HOLISTIC_SYMPOSIUMS_EN,
    hostLabel: pick(lang, '教學部主辦', 'Hosted by Medical Education'),
    attendeesLabel: pick(lang, '人', 'attendees'),
    satisfactionLabel: pick(lang, '滿意度', 'Satisfaction'),
    trainingEyebrow: pick(lang, 'Faculty Training', 'Faculty Training'),
    trainingTitle: pick(lang, '113 學年全人照護師培課程', 'AY113 Holistic Care Faculty Training'),
    trainingDesc: pick(lang, '全人照護種子教師培育與院內師資培訓成果摘要。', 'Summary of seed-teacher cultivation and in-house faculty training outcomes.'),
    trainingSessions: { num: 7, label: pick(lang, '場訓練', 'Sessions') },
    trainingParticipants: { num: 1482, label: pick(lang, '人次', 'Participants') },
    trainingSatisfaction: { num: 4.75, label: pick(lang, '整體滿意度', 'Overall Satisfaction'), suffix: '/5' },
  };
}

