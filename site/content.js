/* =========================================================
   臺北醫學大學附設醫院 教學部 — 內容資料
   Dept. of Medical Education, TMU Hospital — content data

   所有文字皆為 [中文, English] 配對；切換語言時由 main.js 取用。
   維護方式：直接修改此檔的字串即可，版面與樣式不需更動。
   ========================================================= */

/** 中英配對 helper. */
const T = (zh, en) => [zh, en];

/** 各中心代表色（沿用原網站設定）。 */
const ACCENT = {
  faculty_dev: '#A87A6B',
  clinical_skills: '#5E7A8C',
  ebm: '#B69B66',
  holistic: '#4f8c7d',
  med_edu_research: '#6E8A77',
  admin: '#8a8076',
};

const MAIN_PHONE = '(02) 2737-2181';
const ext = (n) => T(`${MAIN_PHONE} ＃${n}`, `${MAIN_PHONE} ext. ${n}`);

/** 人員：p(中文名, 英文名, 職稱, 單位/職級, slug, hubId, 主要業務) */
const p = (zh, en, role, dept, slug, hubId, duty) => ({
  name: T(zh, en),
  role,
  dept: dept || T('', ''),
  slug: slug || '',
  hubId: hubId || '',
  duty: duty || null,
});

/** 職稱對照。 */
const ROLE = {
  director: T('中心主任', 'Director'),
  deputy: T('中心副主任', 'Deputy Director'),
  cadmin: T('中心行政專員', 'Center Administrator'),
  instructor: T('指導員', 'Instructor'),
  seed: T('種子教師', 'Seed Teacher'),
  vp: T('教學副院長', 'VP · Medical Education'),
  lead: T('負責人', 'Lead'),
  ddir: T('教學部主任', 'Department Director'),
  ddep: T('教學部副主任', 'Deputy Director'),
  head: T('教學部組長', 'Section Head'),
  spec: T('行政專員', 'Administrative Specialist'),
  pm: T('專案經理', 'Project Manager'),
  ai: T('AI 專家顧問', 'AI Expert Advisor'),
  eng: T('專案工程師', 'Project Engineer'),
};

/**
 * 目前 assets/ 資料夾內實際存在的人像檔名（不含 .jpg）。
 * 新增人像時：把檔案放進 assets/，並把檔名加入此清單，照片就會自動顯示；
 * 不在清單中的人員，會以姓名英文縮寫的圓形色塊呈現。
 */
const PORTRAITS = [
  'chung-che-wu',
  'faith-ruofan-liao',
  'fang-chun-fan',
  'hsuan-lei-shao',
  'jeng-cheng-wu',
  'lai-lei-ting',
  'li-hsuan-wang',
  'ling-cheng-mong',
  'nien-hsuan-tsao',
  'tien-shang-chu',
];

/** 需要非置中裁切的人像。 */
const PORTRAIT_POSITION = {
  'chung-che-wu': 'center 18%',
  'tien-shang-chu': 'center 16%',
  'nien-hsuan-tsao': 'center 16%',
  'fang-chun-fan': 'center 16%',
  'chien-yu-chen': 'center 14%',
  'hsin-yi-chiu': 'center 10%',
  'hung-wei-tsai': 'center 8%',
};

const CONTENT = {
  accent: ACCENT,
  role: ROLE,
  portraits: PORTRAITS,
  portraitPosition: PORTRAIT_POSITION,
  mainPhone: MAIN_PHONE,

  /* ---------------- 網站基本資訊 ---------------- */
  meta: {
    brand1: T('臺北醫學大學附設醫院', 'Taipei Medical University Hospital'),
    brand2: T('教學部', 'Medical Education'),
    docTitle: T(
      '教學部 — 臺北醫學大學附設醫院',
      'Dept. of Medical Education — TMU Hospital',
    ),
    langBtn: T('EN', '中'),
  },

  nav: [
    { href: '#about', label: T('關於', 'About') },
    { href: '#centers', label: T('五大中心', 'Centers') },
    { href: '#org', label: T('組織架構', 'Organization') },
    { href: '#impact', label: T('品質榮譽', 'Honors') },
    { href: '#news', label: T('公告', 'News') },
    { href: '#contact', label: T('聯絡', 'Contact') },
  ],
  navCta: T('聯絡教學部', 'Contact us'),

  /* ---------------- Hero ---------------- */
  hero: {
    eyebrow: T('Taipei Medical University Hospital', 'Taipei Medical University Hospital'),
    title1: T('卓越醫學教育', 'Excellence in'),
    title2: T('育成醫療人才', 'medical education'),
    tag: T(
      '以人為本的全人醫療教育，結合教師發展、臨床技能、實證醫學與全人照護，培育兼具同理心與專業能力的醫療人才。',
      'People-centered medical education — uniting faculty development, clinical skills, evidence-based medicine and holistic care to cultivate caregivers with both empathy and expertise.',
    ),
    ctaPrimary: T('探索五大中心', 'Explore the centers'),
    ctaGhost: T('認識教學部', 'About the department'),
    scroll: T('向下捲動', 'Scroll'),
    stats: [
      { num: 3, label: T('教學型主治', 'Teaching Attendings') },
      { num: 4, label: T('職類教學型醫事人員', 'Teaching Allied Health') },
      { num: 5, label: T('教育中心', 'Education Centers') },
    ],
    statsNote: T(
      '資料來源：教學部 績效管理組 BI 團隊 · AY114',
      'Source: Performance Management · BI Team · AY114',
    ),
  },

  /* ---------------- 關於教學部 ---------------- */
  about: {
    eyebrow: T('About Us', 'About Us'),
    title: T('認識教學部', 'About the Department'),
    desc: T(
      '從人才培育到照護品質，讓教育成為醫療持續進步的力量。',
      'Education that advances people, practice, and quality of care.',
    ),
    cards: [
      {
        icon: 'heart',
        title: T('我們是誰', 'Who We Are'),
        body: T(
          '教學部是串聯臨床照護、人才培育與醫學教育創新的核心平台。',
          'The department connects clinical care, talent development, and innovation in medical education.',
        ),
      },
      {
        icon: 'skills',
        title: T('做什麼・服務誰', 'What We Do'),
        body: T(
          '服務醫學生、住院醫師與全院教師，推動師資培育、臨床技能、實證醫學、全人照護與教育研究。',
          'We support students, residents, and faculty through development, clinical skills, EBM, holistic care, and education research.',
        ),
      },
      {
        icon: 'research',
        title: T('願景與定位', 'Vision & Position'),
        body: T(
          '以學習者與病人為中心，打造跨職類、可驗證、持續精進的醫學教育體系。',
          'A learner- and patient-centered education system that is interprofessional, evidence-driven, and continuously improving.',
        ),
      },
    ],
  },

  /* ---------------- 五大中心 ---------------- */
  centers: {
    eyebrow: T('Five Centers', 'Five Centers'),
    title: T('五大中心', 'Five Centers'),
    desc: T(
      '以專業分工串聯完整的醫學教育支持系統。點開任一中心，查看團隊、業務與成果。',
      'Specialized centers forming one connected medical education system. Open a center to see its team, work and outcomes.',
    ),
    openLabel: T('展開中心內容', 'Open center'),
    closeLabel: T('收合', 'Close'),
    membersLabel: T('中心成員', 'Center Members'),
    contactLabel: T('聯絡窗口', 'Contact'),
    profileLabel: T('個人學術檔案', 'Academic Profile'),
    dutyLabel: T('主要業務', 'Main Duties'),

    list: [
      /* ---------- 教師發展中心 ---------- */
      {
        id: 'faculty_dev',
        icon: 'cap',
        name: T('教師發展中心', 'Faculty Development Center'),
        tagline: T('成就每一位卓越的臨床教師', 'Cultivating every outstanding clinical teacher'),
        intro: T(
          '全院臨床教師培育，並協助學校教職相關事務，提升整體教學品質與師資專業發展。',
          'Hospital-wide clinical faculty development and support for academic appointments, strengthening teaching quality and professional growth.',
        ),
        chips: [
          T('簡介', 'About'),
          T('核心業務', 'Services'),
          T('培育小組', 'Groups'),
          T('最新公告', 'News'),
          T('聯絡', 'Contact'),
        ],
        contactPerson: T('陳均茹', 'Chun-Ju Chen'),
        contactExt: ext('3757'),
        people: [
          p('陳明德', 'Ming-De Chen', 'director', T('西醫 · 副教授', 'Physician · Assoc. Prof.'), 'ming-de-chen', 'ming-de-chen'),
          p('陳淑美', 'Shu-Mei Chen', 'deputy', T('西醫 · 副教授', 'Physician · Assoc. Prof.'), 'shumei-chen', 'shumei-chen'),
          p('陳均茹', 'Chun-Ju Chen', 'cadmin', T('行政', 'Administration')),
        ],
        kpis: [
          { num: 102, label: T('種子教師', 'Seed Teachers'), color: '#A87A6B' },
          { num: 125, label: T('合聘教職', 'Joint Appointments'), color: '#7A95A8' },
          { num: 6, label: T('114 學年新聘教職', 'New Appointments (AY114)'), color: '#8FA898' },
          { num: 6, label: T('六大培育小組', 'Cultivation Groups'), color: '#B69B66' },
        ],
        body: [
          T(
            '教師發展中心隸屬於教學部，由陳明德主任帶領團隊，負責全院臨床教師的培育與學校教職相關事務，以系統性課程、評鑑遵循與委員會機制，持續提升整體教學品質與師資專業發展。',
            'Within the Department of Medical Education, Director Ming-De Chen leads a team responsible for hospital-wide faculty cultivation and academic-appointment affairs — systematic curricula, accreditation alignment and a committee mechanism that continually raises teaching quality.',
          ),
          T(
            '下設六大教學培育小組，串連 CBME、永續韌性、科技教學、實證醫學與全人照護，讓教學專業在各領域生根。',
            'Six cultivation groups span CBME, sustainability, technology-enhanced teaching, evidence-based medicine and holistic care — rooting pedagogical expertise across every domain.',
          ),
        ],
        blocks: [
          {
            kind: 'cards',
            title: T('四大核心業務', 'Four Core Services'),
            desc: T(
              '從培訓、教職、讀書會到委員會，全方位支援臨床教師的專業成長。',
              'From training and appointments to journal clubs and committee oversight — supporting clinical teachers at every step.',
            ),
            items: [
              {
                icon: 'cap',
                color: '#A87A6B',
                title: T('全院臨床教師發展與培訓', 'Hospital-wide Faculty Development & Training'),
                desc: T(
                  '依醫策會（JCT）規範與醫院評鑑要求，規劃系統性、分層的師資培育課程，培訓全院西醫、中醫、牙醫及各醫事職類臨床教師，奠定紮實的教學知能基礎。',
                  'Systematic, tiered faculty-training curricula aligned with JCT standards and hospital accreditation, covering clinical teachers across Western medicine, TCM, dentistry and all allied-health roles.',
                ),
              },
              {
                icon: 'award',
                color: '#7A95A8',
                title: T('教職新聘與升等業務', 'Academic Appointment & Promotion'),
                desc: T(
                  '協助臨床人員申請臺北醫學大學教職（新聘）與職級升等，提供資格諮詢、文件審查與流程協助，銜接臨床服務與學術發展。',
                  'Guiding clinical staff through TMU academic-appointment and promotion applications — eligibility advice, document review and process support that bridges clinical service and scholarship.',
                ),
              },
              {
                icon: 'bulb',
                color: '#B69B66',
                title: T('教學讀書會與獎項評選', 'Teaching Journal Club & Awards'),
                desc: T(
                  '每月舉辦教學讀書會，深化教學知能交流；每年辦理「優良教師獎」與「教學創新獎」評選，表揚卓越教學與創新教法，營造重視教學的院內文化。',
                  'Monthly teaching journal clubs deepen pedagogical exchange; annual Outstanding Teacher and Teaching Innovation awards celebrate excellence and nurture a teaching-valued culture.',
                ),
              },
              {
                icon: 'clipboard',
                color: '#8FA898',
                title: T('教師發展委員會', 'Faculty Development Committee'),
                desc: T(
                  '每季召開一次委員會，追蹤全院臨床教師培訓完成狀況，檢視醫院整體教學成效，並據以滾動修正師資發展策略。',
                  'Quarterly committee meetings track faculty-training completion across the hospital, review overall teaching effectiveness, and iteratively refine development strategy.',
                ),
              },
            ],
          },
          {
            kind: 'groups',
            title: T('六大教學培育小組', 'Six Teaching Cultivation Groups'),
            desc: T(
              '六個專責小組各司其職、互相協作，共同深化全院教學培育的各個面向。',
              'Six dedicated groups, each with its own focus, jointly deepening every dimension of hospital-wide faculty cultivation.',
            ),
            leadLabel: T('負責人', 'Lead'),
            items: [
              {
                name: T('CBME–課程組', 'CBME · Curriculum'),
                color: '#A87A6B',
                desc: T('規劃以勝任能力為導向（CBME）的課程設計與里程碑架構。', 'Competency-based curriculum design and milestone frameworks.'),
                lead: p('邱欣怡', 'Hsin-Yi Chiu', 'lead', T('西醫 · 助理教授', 'Physician · Asst. Prof.'), 'hsin-yi-chiu', 'hsin-yi-chiu'),
              },
              {
                name: T('CBME–評量組', 'CBME · Assessment'),
                color: '#7A95A8',
                desc: T('發展 Mini-CEX、DOPS、CbD 等評量工具與 EPA 信效度分析。', 'Mini-CEX, DOPS, CbD tools and EPA reliability/validity analysis.'),
                lead: p('吳政誠', 'Jeng-Cheng Wu', 'lead', T('西醫 · 助理教授', 'Physician · Asst. Prof.'), 'jeng-cheng-wu', 'jeng-cheng-wu'),
              },
              {
                name: T('永續韌性組', 'Sustainability & Resilience'),
                color: '#8FA898',
                desc: T('推動教師身心永續與職場韌性，深化教學熱情與職涯發展。', 'Faculty wellbeing, workplace resilience and career development.'),
                lead: p('陳建宇', 'Chien-Yu Chen', 'lead', T('西醫 · 教授', 'Physician · Professor'), 'chien-yu-chen', 'chien-yu-chen'),
              },
              {
                name: T('科技輔導教學組', 'Technology-Enhanced Teaching'),
                color: '#B69B66',
                desc: T('導入數位與模擬科技輔助教學，提升教學互動與學習成效。', 'Digital and simulation technology to enhance teaching and learning.'),
                lead: p('吳人傑', 'Jen-Chieh Wu', 'lead', T('西醫 · 助理教授', 'Physician · Asst. Prof.'), 'jen-chieh-wu', 'jen-chieh-wu'),
              },
              {
                name: T('實證醫學組', 'Evidence-Based Medicine'),
                color: '#9C6F8E',
                desc: T('將實證醫學精神融入教學，培養師生實證查證與應用能力。', 'Embedding evidence-based medicine into teaching practice.'),
                lead: p('林秀真', 'Hsiu-Chen Lin', 'lead', T('西醫 · 副教授', 'Physician · Assoc. Prof.'), 'hsiu-chen-lin', 'hsiu-chen-lin'),
              },
              {
                name: T('全人照護組', 'Holistic Care'),
                color: '#6E8A77',
                desc: T('發展全人照護教案與跨職類教學，落實以人為本的醫學教育。', 'Holistic-care teaching cases and cross-professional education.'),
                lead: p('廖若帆', 'Faith Ruofan Liao', 'lead', T('護理 · 副教授', 'Nursing · Assoc. Prof.'), 'faith-ruofan-liao', 'faith-ruofan-liao'),
              },
            ],
          },
        ],
        closing: T(
          '好的教師，是醫學教育最深的根基。',
          'Great teachers are the deepest roots of medical education.',
        ),
      },

      /* ---------- 臨床技能中心 ---------- */
      {
        id: 'clinical_skills',
        icon: 'skills',
        name: T('臨床技能中心', 'Clinical Skills Center'),
        tagline: T('把每一次演練，練成真實現場的從容', 'Rehearsal today, composure at the bedside'),
        intro: T(
          '規劃並執行醫學生客觀結構式臨床測驗（OSCE）與各式模擬訓練，培養紮實的臨床技能。',
          'Designing and running OSCE and simulation-based training to build solid clinical skills.',
        ),
        chips: [T('簡介', 'About'), T('OSCE', 'OSCE'), T('團隊', 'Team'), T('聯絡', 'Contact')],
        contactPerson: T('張家銘、賴哲民', 'Chia-Ming Chang · Che-Min Lai'),
        contactExt: ext('3770'),
        people: [
          p('吳人傑', 'Jen-Chieh Wu', 'director', T('西醫 · 助理教授', 'Physician · Asst. Prof.'), 'jen-chieh-wu', 'jen-chieh-wu'),
          p('蔡鴻維', 'Hung-Wei Tsai', 'deputy', T('西醫 · 講師', 'Physician · Lecturer'), 'hung-wei-tsai', 'hung-wei-tsai'),
          p('賴哲民', 'Che-Min Lai', 'cadmin', T('行政', 'Administration')),
          p('張家銘', 'Chia-Ming Chang', 'cadmin', T('行政', 'Administration')),
        ],
        body: [
          T(
            '臨床技能中心負責醫學生客觀結構式臨床測驗（OSCE）的試務規劃與執行，並提供各式模擬情境訓練場域，讓學員在進入真實臨床前，先於安全的環境中反覆練習問診、身體檢查與處置技能。',
            'The Center plans and runs the Objective Structured Clinical Examination (OSCE) for medical students and provides simulation-based training spaces, letting learners rehearse history-taking, physical examination and procedures safely before entering real clinical settings.',
          ),
        ],
        blocks: [],
        closing: T(
          '技能純熟，才能把注意力留給病人。',
          'Mastered skills free your attention for the patient.',
        ),
      },

      /* ---------- 實證醫學中心 ---------- */
      {
        id: 'ebm',
        icon: 'chart',
        name: T('實證醫學中心', 'Evidence-Based Medicine Center'),
        tagline: T('提升醫療品質的關鍵引擎', 'The key engine for better care quality'),
        intro: T(
          '推動實證醫學（EBM），將實證精神落實於醫療品質，提升臨床決策與照護成效。',
          'Advancing Evidence-Based Medicine, embedding evidence into care quality and clinical decisions.',
        ),
        chips: [
          T('簡介', 'About'),
          T('核心任務', 'Missions'),
          T('訓練課程', 'Courses'),
          T('競賽成就', 'Awards'),
          T('聯絡', 'Contact'),
        ],
        contactPerson: T('江明憲', 'Ming-Hsien Chiang'),
        contactExt: ext('3760'),
        people: [
          p('林秀真', 'Hsiu-Chen Lin', 'director', T('西醫 · 副教授', 'Physician · Assoc. Prof.'), 'hsiu-chen-lin', 'hsiu-chen-lin'),
          p('林聖峰', 'Sheng-Feng Lin', 'deputy', T('西醫 · 副教授', 'Physician · Assoc. Prof.'), 'sheng-feng-lin', 'sheng-feng-lin'),
          p('江明憲', 'Ming-Hsien Chiang', 'cadmin', T('行政', 'Administration')),
        ],
        kpis: [
          { num: 20, suffix: '+', label: T('年實證深耕', 'Years since 2004'), color: '#B0894B' },
          { num: 4, label: T('大核心任務', 'Core Missions'), color: '#5E7A8C' },
          { num: 15, suffix: '+', label: T('年 NHQA 持續參與', 'Years at NHQA'), color: '#6E8A77' },
          { num: 3, label: T('大競賽組別', 'Contest Tracks'), color: '#A87A6B' },
        ],
        body: [
          T(
            '本中心隸屬於教學部，由林秀真主任帶領專業團隊，採多管齊下策略推動院內實證醫學文化：從競賽參與、品質改善專案到系統性教育培訓，建立起完整且可持續的發展體系。',
            'Within the Department of Medical Education, Director Hsiu-Chen Lin leads a multi-pronged strategy — from contests and quality-improvement projects to systematic training — building a complete, sustainable evidence-based medicine system.',
          ),
          T(
            '長期致力於培育院內實證醫學專業人才，積極推動跨領域合作，並於國家級醫療品質競賽中屢創佳績。',
            'Cultivating in-house EBM talent, driving cross-disciplinary collaboration, and repeatedly excelling at national healthcare-quality competitions.',
          ),
        ],
        blocks: [
          {
            kind: 'numbered',
            title: T('四大核心任務', 'Four Core Missions'),
            desc: T(
              '分工明確、相互支援，共同推動全院實證醫學能量的提升。',
              'Clearly divided yet mutually supportive, together raising the hospital’s evidence-based medicine capacity.',
            ),
            items: [
              {
                tag: '01',
                title: T('NHQA（現為 NCMEA）實證醫學競賽', 'NHQA / NCMEA EBM Contest'),
                desc: T(
                  '積極參與國家醫療品質獎（NHQA）實證醫學類競賽，自民國 109 年榮獲金獎及潛力獎，110 年更獲頒「持續參與特別獎（15 年）」。',
                  'Competing in the National Healthcare Quality Award (NHQA) EBM category — Gold and Potential Awards in 2020, and a 15-year Sustained Participation Award in 2021.',
                ),
              },
              {
                tag: '02',
                title: T('實證醫學研討會投稿', 'EBM Conference Submissions'),
                desc: T(
                  '鼓勵全院各職類醫療人員共同參與論文投稿，促進院內外學術交流，提升實證醫學領域的能見度與影響力。',
                  'Encouraging staff across all disciplines to submit papers, fostering academic exchange and raising the hospital’s visibility in evidence-based medicine.',
                ),
              },
              {
                tag: '03',
                title: T('EBQI 品質改善專案', 'EBQI Quality Improvement'),
                desc: T(
                  '導入「實證醫學改善醫療品質方案（EBQI）」，跨領域發掘臨床問題，透過實證方法將研究證據轉化為實際的醫療品質改善行動。',
                  'Evidence-Based Quality Improvement (EBQI) turns clinical problems into solutions across departments, translating research evidence into real quality gains.',
                ),
              },
              {
                tag: '04',
                title: T('實證醫學教育培訓', 'EBM Education & Training'),
                desc: T(
                  '定期辦理多層次實證醫學能力培訓課程，涵蓋初階至進階，並與圖書館資訊部門合作辦理文獻檢索課程。',
                  'Multi-level EBM training from beginner to advanced, with literature-search courses run alongside the library and information department.',
                ),
              },
            ],
          },
          {
            kind: 'timeline',
            title: T('實證醫學推動歷程', 'Our Journey'),
            desc: T(
              '自民國 93 年創立至今，歷經三個階段的持續耕耘，逐步建立完整的院內實證醫學生態系統。',
              'From its founding in 2004, three phases of sustained effort have built a complete in-hospital EBM ecosystem.',
            ),
            items: [
              {
                phase: T('第一階段', 'Phase 1'),
                name: T('奠基階段', 'Foundation'),
                years: T('民國 93–103 年', '2004–2014'),
                color: '#B0894B',
                items: [
                  T('正式成立實證醫學中心，制定院內推動制度架構', 'Founded the EBM Center and its hospital-wide framework'),
                  T('針對 R、PGY、UGY 及各類醫事人員開設適切課程', 'Tailored courses for residents (R), PGY, UGY and allied health'),
                  T('定期舉辦 EBM Journal Club，建立臨床討論文化', 'Regular EBM Journal Club to build a clinical-discussion culture'),
                  T('推動 Clinical based–PBL–EBM 整合課程', 'Clinical-based PBL-EBM integrated curriculum'),
                ],
              },
              {
                phase: T('第二階段', 'Phase 2'),
                name: T('擴展階段', 'Expansion'),
                years: T('民國 104–107 年', '2015–2018'),
                color: '#5E7A8C',
                items: [
                  T('首度協辦「北醫體系一校三院實證醫學競賽」', 'Co-hosted the TMU system one-university-three-hospital EBM contest'),
                  T('辦理院內競賽成果發表會', 'Held in-hospital contest result presentations'),
                  T('參與臺灣實證醫學學會，由院內人員獲選為理監事', 'Active in the Taiwan EBM Association; elected to its board'),
                  T('協助醫策會舉辦文獻查證競賽', 'Assisted the JCT in running literature-appraisal contests'),
                ],
              },
              {
                phase: T('第三階段', 'Phase 3'),
                name: T('深化階段', 'Deepening'),
                years: T('民國 108–至今', '2019–Present'),
                color: '#6E8A77',
                items: [
                  T('108 年舉辦「實證教學與臨床應用發表會」', '2019 “EBM Teaching & Clinical Application” showcase'),
                  T('111–113 年每年舉辦實證醫學能力競賽暨成果發表會', 'Annual EBM competency contests, 2022–2024'),
                  T('持續參與國際實證醫學學術活動', 'Ongoing participation in international EBM activities'),
                  T('籌設「臺北醫學大學考科藍臺灣校級研究中心」', 'Establishing the Cochrane Taiwan university research center'),
                ],
              },
            ],
          },
          {
            kind: 'awardtracks',
            title: T('競賽輝煌成就', 'A Record of Distinction'),
            desc: T(
              '長期投入國家醫療品質獎實證醫學類競賽，於文獻查證組與臨床應用組均有亮眼成績，並自 113 學年度起參與知識轉譯組，持續拓展實證應用面向。',
              'Sustained investment in the NHQA EBM category — standout results in the literature-appraisal and clinical-application tracks, and from AY113 also competing in the knowledge-translation track.',
            ),
            colSession: T('屆別', 'Session'),
            colAward: T('獲獎紀錄', 'Award'),
            tracks: [
              {
                title: T('文獻查證組', 'Literature Appraisal Track'),
                rows: [
                  { sess: T('第 7 屆', '7th'), award: T('銀獎', 'Silver'), tone: '#9AA0A6' },
                  { sess: T('第 14・15 屆', '14th · 15th'), award: T('潛力獎', 'Potential'), tone: '#6E8A77' },
                  { sess: T('第 16・21 屆', '16th · 21st'), award: T('金獎', 'Gold'), tone: '#B0894B' },
                  { sess: T('第 22 屆', '22nd'), award: T('15 年以上持續參與特別獎', '15-yr Sustained'), tone: '#5E7A8C' },
                ],
              },
              {
                title: T('臨床應用組', 'Clinical Application Track'),
                rows: [
                  { sess: T('第 10 屆', '10th'), award: T('潛力獎', 'Potential'), tone: '#6E8A77' },
                  {
                    sess: T('特別獎項', 'Special'),
                    award: T('金獎', 'Gold'),
                    tone: '#B0894B',
                    note: T('全腹膜外內視鏡腹股溝疝氣修補手術之人工網膜固定改善專案', 'Mesh fixation improvement in TEP inguinal hernia repair'),
                  },
                  {
                    sess: T('第 12 屆', '12th'),
                    award: T('潛力獎', 'Potential'),
                    tone: '#6E8A77',
                    note: T('預防性投與類固醇以改善全身麻醉手術後之噁心嘔吐專案', 'Prophylactic steroids to reduce post-anesthesia nausea & vomiting'),
                  },
                ],
              },
              {
                title: T('知識轉譯組', 'Knowledge Translation Track'),
                rows: [
                  {
                    sess: T('113 學年起', 'From AY113'),
                    award: T('新增參與', 'Newly Joined'),
                    tone: '#7A95A8',
                    note: T('自 113 學年度起參與 NCMEA 知識轉譯組競賽，拓展實證應用新面向。', 'Joined the NCMEA Knowledge-Translation track from AY113, opening a new dimension of evidence application.'),
                  },
                  {
                    sess: T('推動重點', 'Focus'),
                    award: T('證據轉化', 'Translation'),
                    tone: '#6E8A77',
                    note: T('以每月「實證醫學知識轉譯討論會」為基礎，推動證據轉化為臨床決策。', 'Built on the monthly knowledge-translation forum, turning evidence into clinical decisions.'),
                  },
                ],
              },
            ],
          },
          {
            kind: 'courses',
            title: T('階梯式訓練體系', 'A Stepwise Curriculum'),
            desc: T(
              '依循「系統性、階梯式」設計原則，由淺入深，將實證醫學能力落實於日常臨床實務。',
              'A systematic, stepwise design that moves from basics to advanced application, embedding EBM into daily clinical practice.',
            ),
            groups: [
              {
                title: T('系統性課程', 'Systematic Courses'),
                color: '#B0894B',
                rows: [
                  { name: T('實證醫學 Meta-analysis 帶狀課程', 'Meta-analysis course series'), detail: T('每月 1 堂・全年持續', 'Monthly · year-round') },
                  { name: T('文獻查證培訓班（初階）', 'Literature appraisal (Beginner)'), detail: T('每年 2–4 月・奠定基礎', 'Feb–Apr each year') },
                  { name: T('文獻查證培訓班（進階）', 'Literature appraisal (Advanced)'), detail: T('每年 5–7 月・進階分析', 'May–Jul each year') },
                ],
              },
              {
                title: T('應用與實踐', 'Application & Practice'),
                color: '#5E7A8C',
                rows: [
                  { name: T('文獻查證院內競賽', 'In-hospital appraisal contest'), detail: T('每年 1 次・實戰演練', 'Once a year · hands-on') },
                  { name: T('實證知識轉譯討論會', 'Knowledge-translation forum'), detail: T('每月 1 次・證據轉化', 'Monthly') },
                  { name: T('其他相關課程', 'Other related courses'), detail: T('每年不定期舉辦', 'Periodically') },
                ],
              },
              {
                title: T('師資培育', 'Faculty Cultivation'),
                color: '#6E8A77',
                rows: [
                  { name: T('實證醫學種子師資培訓課程', 'Seed-teacher training'), detail: T('每年 3–4 堂', '3–4 sessions/year') },
                  { name: T('院內實證教學人才庫', 'Teaching talent pool'), detail: T('系統性管理', 'Systematic management') },
                  { name: T('培養未來實證領導者', 'Future EBM leaders'), detail: T('長期培育計畫', 'Long-term program') },
                ],
              },
            ],
          },
        ],
        closing: T(
          '以實證深耕醫療品質，讓最佳證據走進每一個臨床現場。',
          'Deepening care quality through evidence — the best evidence at every bedside.',
        ),
      },

      /* ---------- 全人照護教育中心 ---------- */
      {
        id: 'holistic',
        icon: 'holistic',
        name: T('全人照護教育中心', 'Center for Education in Holistic Care and Human Flourishing'),
        tagline: T('以人為本，照顧每一個完整的人', 'People first — caring for the whole person'),
        intro: T(
          '以人為本，照顧每一個完整的人。結合醫療、心理與關懷的力量，推動「心理健康急救 MHFA」，培育跨領域種子教師。',
          'People first — caring for the whole person. Uniting medical, psychological and compassionate care to promote Mental Health First Aid.',
        ),
        chips: [
          T('簡介', 'About'),
          T('MHFA', 'MHFA'),
          T('種子教師', 'Seed Teachers'),
          T('推動計畫', 'Programs'),
          T('聯絡', 'Contact'),
        ],
        contactPerson: T('江明憲', 'Ming-Hsien Chiang'),
        contactExt: ext('3760'),
        people: [
          p('廖若帆', 'Faith Ruofan Liao', 'director', T('護理 · 副教授', 'Nursing · Assoc. Prof.'), 'faith-ruofan-liao', 'faith-ruofan-liao'),
          p('孟令城', 'Ling-Cheng Mong', 'deputy', T('牙醫', 'Dentist'), 'ling-cheng-mong', 'ling-cheng-mong'),
          p('江明憲', 'Ming-Hsien Chiang', 'cadmin', T('行政', 'Administration')),
        ],
        kpis: [
          { num: 142, label: T('全人種子教師（累計）', 'Holistic Seed Teachers (total)'), color: '#4f8c7d' },
          {
            num: 87,
            label: T('113 學年種子教師', 'AY113 Seed Teachers'),
            color: '#6E8A77',
            subtitle: T('醫師 40 · 醫事 14 · 護理 33', 'Physicians 40 · Allied 14 · Nursing 33'),
          },
          { num: 11, label: T('MHFA 種子教師', 'MHFA Seed Teachers'), color: '#B69B66' },
          { num: 2, label: T('MHFA 指導員', 'MHFA Instructors'), color: '#5E7A8C' },
          { display: '?', label: T('全人照護教育相關論文', 'Holistic Care Education Papers'), color: '#A87A6B' },
        ],
        body: [
          T(
            '全人照護（Holistic Care）相信健康不只是沒有疾病，而是身、心、社會與心靈的整體安適。我們以教育為起點，讓每一位醫療同仁都具備關懷與初步協助的能力。',
            'Holistic care holds that health is not merely the absence of disease but the wellbeing of body, mind, society and spirit. Starting from education, we equip every colleague with the ability to care and to offer first-line help.',
          ),
        ],
        blocks: [
          {
            kind: 'cards',
            title: T('中心推動重點', 'What the Center Drives'),
            desc: T(
              '從課程、師資到跨科部協作，讓關懷成為可以被教、被練習的能力。',
              'From curricula to faculty and cross-department collaboration — making compassion a teachable, practiceable capability.',
            ),
            items: [
              {
                icon: 'brain',
                color: '#4f8c7d',
                title: T('心理健康急救', 'Mental Health First Aid'),
                desc: T('引進國際 MHFA 課程，培訓同仁辨識、陪伴並適時轉介需要協助的人。', 'International MHFA training to recognize, accompany and refer those who need help.'),
              },
              {
                icon: 'sprout',
                color: '#6E8A77',
                title: T('種子教師培育', 'Seed Teacher Cultivation'),
                desc: T('集結護理、醫師、藥劑、社工、心理、語言治療等跨領域人才，將關懷文化向下扎根。', 'Bringing together nursing, medicine, pharmacy, social work, psychology and more to root a culture of care.'),
              },
              {
                icon: 'network',
                color: '#5E7A8C',
                title: T('跨科部協作', 'Cross-Department Collaboration'),
                desc: T('串連臨床各單位與校園資源，打造彼此支持、能即時伸出援手的健康職場。', 'Linking clinical units and campus resources into a supportive, responsive, healthy workplace.'),
              },
              {
                icon: 'team',
                color: '#B69B66',
                title: T('全人教育小組', 'Holistic Education Working Group'),
                desc: T('跨越西醫、中醫、牙醫與各醫事職類，組成專責團隊，共同鑽研全人照護教案設計與教學發展，讓全人精神在每個專業領域生根。', 'A dedicated cross-professional team — uniting Western medicine, TCM, dentistry and all allied-health roles — to co-develop holistic-care teaching cases and curricula across every discipline.'),
              },
            ],
          },
          {
            kind: 'algee',
            title: T('心理健康急救 ALGEE', 'Mental Health First Aid — ALGEE'),
            desc: T(
              '就像 CPR 之於身體急救，MHFA 教我們在他人陷入心理困擾或危機時，能夠及時察覺、陪伴與協助轉介。點選每個字母，認識五個行動步驟。',
              'Like CPR for the body, MHFA teaches us to notice, accompany and refer when someone is in psychological distress or crisis. Select a letter to see each of the five action steps.',
            ),
            items: [
              {
                letter: 'A',
                title: T('接近、評估與協助危機', 'Approach, assess & assist'),
                desc: T('主動關懷，留意潛在的自傷或危機徵兆，在安全前提下評估狀況並適時介入。', 'Reach out with care, watch for signs of self-harm or crisis, and step in safely when needed.'),
              },
              {
                letter: 'L',
                title: T('不帶批判地聆聽', 'Listen non-judgmentally'),
                desc: T('放下評價，給予一個安全、被理解的傾訴空間，讓對方願意說出感受。', 'Set judgment aside and offer a safe, understanding space so the person feels heard.'),
              },
              {
                letter: 'G',
                title: T('給予支持與資訊', 'Give support & information'),
                desc: T('提供正確、實用的身心健康資訊，並表達理解與支持。', 'Share accurate, practical mental-health information alongside understanding and support.'),
              },
              {
                letter: 'E',
                title: T('鼓勵尋求專業協助', 'Encourage professional help'),
                desc: T('協助對方連結醫療與專業資源，跨出求助的第一步。', 'Help the person connect with medical and professional resources, and take the first step.'),
              },
              {
                letter: 'E',
                title: T('鼓勵其他支持', 'Encourage other supports'),
                desc: T('善用家庭、同儕與社區的支持網絡，讓關懷持續發生。', 'Draw on family, peer and community networks so support continues over time.'),
              },
            ],
          },
          {
            kind: 'people',
            title: T('中心指導員', 'Center Instructors'),
            items: [
              p('廖若帆', 'Faith Ruofan Liao', 'instructor', T('護理 · 副教授｜教學部 全人中心', 'Nursing · Assoc. Prof.｜Holistic Center'), 'faith-ruofan-liao', 'faith-ruofan-liao'),
              p('吳忠哲', 'Chung-Che Wu', 'instructor', T('西醫 · 副教授｜神經外科', 'Physician · Assoc. Prof.｜Neurosurgery'), 'chung-che-wu', 'chung-che-wu'),
            ],
          },
          {
            kind: 'people',
            title: T('MHFA 種子教師團隊', 'MHFA Seed Teacher Team'),
            desc: T(
              '來自全院 11 個科部、橫跨 10 種專業職類，將心理健康急救的種子帶回各自的工作現場。',
              'From 11 departments and 10 professions, carrying the seeds of Mental Health First Aid back to their own workplaces.',
            ),
            compact: true,
            items: [
              p('丁禮莉', 'Lai-Lei Ting', 'seed', T('西醫｜放射腫瘤科', 'Physician｜Radiation Oncology'), 'lai-lei-ting'),
              p('吳政誠', 'Jeng-Cheng Wu', 'seed', T('西醫 · 助理教授｜泌尿科', 'Physician · Asst. Prof.｜Urology'), 'jeng-cheng-wu'),
              p('彭思媛', 'Szu-Yuan Peng', 'seed', T('社工｜社工室', 'Social Work｜Social Work Office')),
              p('王莉萱', 'Li-Hsuan Wang', 'seed', T('藥劑 · 教授｜藥劑部', 'Pharmacy · Prof.｜Pharmacy'), 'li-hsuan-wang'),
              p('范芳郡', 'Fang-Chun Fan', 'seed', T('放射｜影像醫學部', 'Radiology｜Medical Imaging'), 'fang-chun-fan'),
              p('曹念萱', 'Nien-Hsuan Tsao', 'seed', T('護理｜護理部', 'Nursing｜Nursing Dept.'), 'nien-hsuan-tsao'),
              p('曲天尚', 'Tien-Shang Chu', 'seed', T('護理｜護理部', 'Nursing｜Nursing Dept.'), 'tien-shang-chu'),
              p('高倩琪', 'Chien-Chi Kao', 'seed', T('關懷師｜員工關懷中心', 'Chaplain｜Staff Care')),
              p('蔡宜庭', 'Yi-Ting Tsai', 'seed', T('臨床心理｜精神科', 'Clinical Psych.｜Psychiatry')),
              p('葉雅文', 'Ya-Wen Yeh', 'seed', T('語言治療｜復健醫學部', 'Speech Therapy｜Rehab Medicine')),
              p('王怡文', 'Yi-Wen Wang', 'seed', T('行政｜教學部', 'Administration｜Medical Education')),
            ],
          },
          {
            kind: 'ai',
            title: T('台灣健康深耕計畫範疇二：打造 AI 全人照護教育生態系', 'Healthy Taiwan Scope 2: An AI Holistic-Care Education Ecosystem'),
            desc: T(
              '本計畫的核心不是單一工具，而是一個可以反覆練習、即時回饋、持續累積案例的教學模擬生態系。以全人臨床情境為主軸，串接 AI 病人、教案 AI 化、平板與 VR 模擬練習、全人學習成效回饋，以及 Line AI ChatBot 隨身助教，讓教師設計情境、學生進入情境，AI 協助互動與回饋。',
              'The core is not a single tool but a teaching-simulation ecosystem for repeated practice, instant feedback and an accumulating case library — connecting AI patients, AI-authored cases, tablet & VR simulation, holistic learning feedback and a Line AI ChatBot assistant.',
            ),
            problemsTitle: T('生態系要解決什麼問題？', 'What does the ecosystem solve?'),
            problems: [
              T('讓全人照護不只停留在理念，而是變成可操作、可練習、可回饋的教學流程。', 'Make holistic care operational, practiceable and measurable — not just an ideal.'),
              T('讓學生在進入真實臨床前，先透過 AI 病人練習問診、判斷、溝通與治療計畫。', 'Let students rehearse history-taking, judgment, communication and treatment with AI patients before real clinics.'),
              T('讓教師能快速產出情境教案，並透過學習成效回饋持續修正課程。', 'Help faculty rapidly produce case scenarios and refine courses through learning-outcome feedback.'),
            ],
            flow: [
              {
                role: T('教師端', 'Faculty'),
                title: T('教案 AI 化', 'AI-authored cases'),
                text: T('把全人照護目標、臨床任務與討論問題轉成可互動的情境教案。', 'Turn holistic-care goals, clinical tasks and discussion prompts into interactive case scenarios.'),
                color: '#4f8c7d',
              },
              {
                role: T('情境內容', 'Scenario'),
                title: T('全人臨床情境', 'Whole-person clinical context'),
                text: T('以醫學、人文、心理、倫理與照護脈絡設計案例。', 'Cases designed across medical, humanistic, psychological, ethical and care contexts.'),
                color: '#6E8A77',
              },
              {
                role: T('學生端', 'Student'),
                title: T('平板與 VR 模擬練習', 'Tablet & VR simulation'),
                text: T('學生透過問診、判斷、醫令與治療計畫練習臨床推理。', 'Students practice clinical reasoning through history-taking, judgment, orders and treatment plans.'),
                color: '#5E7A8C',
              },
              {
                role: T('回饋端', 'Feedback'),
                title: T('即時回饋與 Line AI ChatBot', 'Instant feedback & Line AI ChatBot'),
                text: T('提供學習歷程回饋與全人臨床隨身助教，支援課後延伸學習。', 'Learning-process feedback plus an on-the-go holistic clinical assistant for after-class study.'),
                color: '#B69B66',
              },
            ],
            steps: [
              { n: '01', title: T('情境設計', 'Scenario design'), text: T('教師將全人照護能力指標轉為臨床任務與討論問題', 'Faculty translate holistic-care competencies into clinical tasks and prompts') },
              { n: '02', title: T('AI 病人互動', 'AI patient interaction'), text: T('學生與 AI 病人進行問診、診斷說明與治療溝通', 'Students conduct history-taking, diagnosis and treatment communication with an AI patient') },
              { n: '03', title: T('模擬練習導入', 'Simulation practice'), text: T('結合平板、VR 與小組討論，讓課程更貼近臨床現場', 'Tablet, VR and group discussion bring courses closer to the clinical floor') },
              { n: '04', title: T('回饋與延伸', 'Feedback & extension'), text: T('以即時回饋與 ChatBot 協助學生整理學習成效', 'Instant feedback and the ChatBot help students consolidate learning outcomes') },
            ],
            teamLabel: T('範疇二團隊', 'Scope 2 Team'),
            team: [
              p('廖若帆', 'Faith Ruofan Liao', 'pm', T('副主任 · 副教授', 'Deputy Director · Assoc. Prof.'), 'faith-ruofan-liao', 'faith-ruofan-liao'),
              p('邵軒磊', 'Hsuan-Lei Shao', 'ai', T('教授', 'Professor'), 'hsuan-lei-shao'),
              p('Diana Gonzalez', 'Diana Gonzalez', 'eng', T('MD · 範疇二團隊', 'MD · Scope 2 Team')),
            ],
          },
          {
            kind: 'symposium',
            title: T('全人研討會', 'Holistic Symposia'),
            desc: T(
              '教學部主辦之全人照護、靈性關懷與韌性相關國際研討會與論壇。',
              'International symposia and forums on holistic care, spiritual care and resilience hosted by the Department.',
            ),
            hostLabel: T('教學部主辦', 'Hosted by Medical Education'),
            attendeesLabel: T('人', 'attendees'),
            satisfactionLabel: T('滿意度', 'Satisfaction'),
            items: [
              { year: 2021, edition: T('第一屆', '1st'), title: T('靈性關懷國際研討會', 'International Symposium on Spiritual Care'), dates: T('2021/12/04（六）', 'Sat 2021/12/04'), time: '08:00–17:00', attendees: 382, satisfaction: 4.52 },
              { year: 2022, edition: T('第二屆', '2nd'), title: T('全人醫療—靈性關懷國際研討會', 'Holistic Medicine — Spiritual Care International Symposium'), dates: T('2022/12/03（六）– 12/04（日）', 'Sat–Sun 2022/12/03–04'), time: '08:00–17:00 / 08:00–12:00', attendees: 916 },
              { year: 2023, edition: T('第一屆', '1st'), title: T('韌性國際研討會', 'International Resilience Symposium'), dates: T('2023/04/30（日）', 'Sun 2023/04/30'), time: '10:00–16:00', attendees: 165, satisfaction: 4.88 },
              { year: 2024, edition: T('113 學年', 'AY113'), title: T('全人照護核心能力研討會', 'Holistic Care Core Competency Symposium'), dates: T('2024/06/15', '2024/06/15'), time: '08:30–12:30' },
            ],
            training: {
              title: T('113 學年全人照護師培課程', 'AY113 Holistic Care Faculty Training'),
              desc: T('全人照護種子教師培育與院內師資培訓成果摘要。', 'Summary of seed-teacher cultivation and in-house faculty training outcomes.'),
              stats: [
                { num: 7, label: T('場訓練', 'Sessions') },
                { num: 1482, label: T('人次', 'Participants') },
                { num: 4.75, suffix: '/5', label: T('整體滿意度', 'Overall Satisfaction') },
              ],
            },
          },
        ],
        closing: T(
          '以教育推動全人照護，讓關懷成為每一位醫療人的本能。',
          'Advancing holistic care through education — until compassion becomes instinct.',
        ),
      },

      /* ---------- 醫學教育研究中心 ---------- */
      {
        id: 'med_edu_research',
        icon: 'research',
        name: T('醫學教育研究中心', 'Medical Education Research Center'),
        tagline: T('用資料回答「教得好不好」', 'Letting data answer whether teaching works'),
        intro: T(
          '以實證與資料驅動的方法研究醫學教育，發展教學評量工具與成效分析，將研究成果回饋至課程設計與教師發展。',
          'Studying medical education with evidence- and data-driven methods, developing assessment tools and feeding findings back into curriculum design.',
        ),
        chips: [
          T('簡介', 'About'),
          T('研究任務', 'Research'),
          T('教學評量', 'Assessment'),
          T('團隊', 'Team'),
          T('聯絡', 'Contact'),
        ],
        contactPerson: T('陳麗玉', 'Li-Yu Chen'),
        contactExt: T('', ''),
        people: [
          p('陳建宇', 'Chien-Yu Chen', 'director', T('西醫 · 教授', 'Physician · Professor'), 'chien-yu-chen', 'chien-yu-chen'),
          p('邱欣怡', 'Hsin-Yi Chiu', 'deputy', T('西醫 · 助理教授', 'Physician · Asst. Prof.'), 'hsin-yi-chiu', 'hsin-yi-chiu'),
          p('陳麗玉', 'Li-Yu Chen', 'cadmin', T('行政', 'Administration')),
        ],
        body: [
          T(
            '中心以資料驅動的方法檢視教學成效：發展與驗證教學評量工具、分析學習歷程與成果，並將研究發現回饋到課程設計與教師發展，讓每一次課程調整都有依據。',
            'The Center examines teaching effectiveness with data-driven methods — developing and validating assessment instruments, analysing learning processes and outcomes, and feeding findings back into curriculum design and faculty development so every change rests on evidence.',
          ),
        ],
        blocks: [],
        closing: T(
          '有量測，才有改進。',
          'What gets measured can be improved.',
        ),
      },
    ],
  },

  /* ---------------- 組織架構 ---------------- */
  org: {
    eyebrow: T('Organizational Structure', 'Organizational Structure'),
    title: T('教學部組織架構', 'Department Structure'),
    desc: T(
      '六大功能單位協同運作，由教學副院長、主任、副主任、組長到行政專員，支援教學部各項業務的推動。',
      'Six functional units working in concert — from the VP for Medical Education and directors to administrative specialists — supporting every part of the department’s work.',
    ),
    rootTop: T('臺北醫學大學附設醫院', 'Taipei Medical University Hospital'),
    rootMain: T('教學部', 'Dept. of Medical Education'),
    leadershipTitle: T('領導團隊', 'Leadership'),
    specialistsTitle: T('行政專員與業務分工', 'Administrative Specialists & Duties'),
    dutyLabel: T('主要業務', 'Main Duties'),
    intro: T(
      '依職責與分工協同運作，從教學副院長、教學部主任、副主任、組長到各行政專員，支援教學部各項業務的推動。',
      'Working in coordinated roles — from the VP for Medical Education and department directors to administrative specialists — to support all teaching operations.',
    ),
    leadership: [
      p('張君照', 'Chun-Chao Chang', 'vp', T('西醫 · 教授', 'Physician · Professor'), 'chun-chao-chang', 'chun-chao-chang'),
      p('葉篤學', 'Tu-Hsueh Yeh', 'ddir', T('西醫 · 副教授', 'Physician · Assoc. Prof.'), 'tu-hsueh-yeh', 'tu-hsueh-yeh'),
      p('張瓈方', 'Li-Fang Chang', 'ddep', T('護理 · 助理教授', 'Nursing · Asst. Prof.'), 'li-fang-chang', 'li-fang-chang'),
      p('郭淑柳', 'Shu-Liu Guo', 'ddep', T('護理 · 助理教授', 'Nursing · Asst. Prof.'), 'shu-liu-guo', 'shu-liu-guo'),
      p('王怡文', 'Yi-Wen Wang', 'head', T('教學部綜整', 'Department Coordination')),
    ],
    specialists: [
      p('楊明芳', 'Ming-Fang Yang', 'spec', T('TMS、新人訓', 'TMS · Orientation'), '', '', T('TMS・新人訓', 'TMS · Orientation')),
      p('羅翊芳', 'Yi-Fang Lo', 'spec', T('職類、教學門診', 'Professions · Teaching Clinics'), '', '', T('職類・教學門診', 'Professions · Teaching Clinics')),
      p('曾牧雲', 'Mu-Yun Tseng', 'spec', T('實習醫學生', 'Clerkships'), '', '', T('實習醫學生', 'Clerkships')),
      p('李珮暄', 'Pei-Hsuan Lee', 'spec', T('住院醫師、PEC、CCC', 'Residents · PEC · CCC'), '', '', T('住院醫師・PEC・CCC', 'Residents · PEC · CCC')),
      p('張筱雯', 'Hsiao-Wen Chang', 'spec', T('PGY', 'PGY'), '', '', T('PGY', 'PGY')),
      p('陳均茹', 'Chun-Ju Chen', 'spec', T('教發、大人提、教職', 'Faculty Dev. · Grants · Appointments'), '', '', T('教發・大人提・教職', 'Faculty Dev. · Grants · Appointments')),
      p('江明憲', 'Ming-Hsien Chiang', 'spec', T('實證、全人、BI、EP', 'EBM · Holistic · BI · EP'), '', '', T('實證・全人・BI・EP', 'EBM · Holistic · BI · EP')),
      p('賴哲民', 'Che-Min Lai', 'spec', T('臨技、OSCE', 'Clinical Skills · OSCE'), '', '', T('臨技・OSCE', 'Clinical Skills · OSCE')),
      p('張家銘', 'Chia-Ming Chang', 'spec', T('臨技、OSCE', 'Clinical Skills · OSCE'), '', '', T('臨技・OSCE', 'Clinical Skills · OSCE')),
      p('張淑慧', 'Shu-Hui Chang', 'spec', T('美術、平面設計', 'Art · Graphic Design'), '', '', T('美術・平面設計', 'Art · Graphic Design')),
      p('高偉劭', 'Wei-Shao Kao', 'spec', T('影音', 'Audiovisual'), '', '', T('影音', 'Audiovisual')),
    ],
  },

  /* ---------------- 品質榮譽 ---------------- */
  impact: {
    eyebrow: T('Quality Honors', 'Quality Honors'),
    title: T('品質榮譽', 'Quality Honors'),
    desc: T(
      '教學部推動之專案於國家品質標章（SNQ）與國家醫療品質獎（NHQA）的認證與獲獎紀錄。',
      'SNQ certifications and NHQA awards for projects led by the Department of Medical Education.',
    ),
    snqTitle: T('SNQ 國家品質標章', 'SNQ National Quality Symbol'),
    nhqaTitle: T('NHQA 國家醫療品質獎', 'NHQA National Healthcare Quality Award'),
    colUnit: T('部門', 'Unit'),
    colRole: T('職稱', 'Role'),
    colPerson: T('負責人', 'Lead'),
    renewalLabel: T('續審', 'Renewal'),
    ebmLink: T('實證醫學類競賽詳見實證醫學中心 →', 'EBM contest awards — see the EBM Center →'),
    dataSource: T('資料來源：教學部 績效管理組 BI 團隊', 'Source: Performance Management · BI Team'),
    yearCounts: [
      { year: '2021', count: 1 },
      { year: '2022', count: 1 },
      { year: '2023', count: 1 },
      { year: '2024', count: 2 },
    ],
    snq: [
      {
        certYear: '2021',
        badge: T('2021年第一次通過（2020標章）', 'First certified 2021 (2020 badge)'),
        title: T('能力評量，精準教學', 'Competency Assessment & Precision Teaching'),
        renewal: T('通過續審：2022、2023、2024年', 'Renewed: 2022, 2023, 2024'),
        members: [
          { unit: T('院長室', "Director's Office"), role: T('教學副院長', 'VP · Medical Education'), person: T('張君照', 'Chun-Chao Chang') },
          { unit: T('教學部', 'Medical Education'), role: T('教學部主任', 'Department Director'), person: T('陳建宇', 'Chien-Yu Chen') },
          { unit: T('護理部', 'Nursing'), role: T('教師發展中心副主任', 'Deputy Dir. · Faculty Dev.'), person: T('郭淑柳', 'Shu-Liu Kuo') },
          { unit: T('泌尿科', 'Urology'), role: T('教學型主治醫師', 'Teaching Attending'), person: T('吳政誠', 'Jeng-Cheng Wu') },
        ],
      },
      {
        certYear: '2022',
        badge: T('2022年第一次通過（2021標章）', 'First certified 2022 (2021 badge)'),
        title: T('全人照護教育全啟動', 'Full Launch of Holistic Care Education'),
        renewal: T('通過續審：2023、2024年', 'Renewed: 2023, 2024'),
        members: [
          { unit: T('院長室', "Director's Office"), role: T('教學副院長', 'VP · Medical Education'), person: T('張君照', 'Chun-Chao Chang') },
          { unit: T('復健醫學部', 'Rehab Medicine'), role: T('實證醫學中心主任', 'EBM Center Director'), person: T('侯文萱', 'Wen-Hsuan Hou') },
          { unit: T('泌尿科', 'Urology'), role: T('教學型主治醫師', 'Teaching Attending'), person: T('吳政誠', 'Jeng-Cheng Wu') },
          { unit: T('教學部', 'Medical Education'), role: T('教學型醫事人員', 'Teaching Allied Health'), person: T('廖若帆', 'Faith Ruofan Liao') },
        ],
      },
      {
        certYear: '2023',
        badge: T('2023年第一次通過（2022標章）', 'First certified 2023 (2022 badge)'),
        title: T('智慧手術教學平台之建置及虛擬實境手術教學之導入', 'Smart Surgery Teaching Platform & VR Surgical Training'),
        renewal: T('通過續審：2024、2025年', 'Renewed: 2024, 2025'),
        members: [
          { unit: T('復健醫學部', 'Rehab Medicine'), role: T('教學副院長', 'VP · Medical Education'), person: T('曾頌惠', 'Sung-Hui Tseng') },
          { unit: T('院長室', "Director's Office"), role: T('醫品副院長', 'VP · Quality'), person: T('魏柏立', 'Po-Li Wei') },
          { unit: T('外科部', 'Surgery'), role: T('重症副院長', 'VP · Critical Care'), person: T('吳玉琮', 'Yu-Tsung Wu') },
          { unit: T('教學部', 'Medical Education'), role: T('教學部主任', 'Department Director'), person: T('陳建宇', 'Chien-Yu Chen') },
          { unit: T('外科部', 'Surgery'), role: T('教學型主治醫師', 'Teaching Attending'), person: T('邱欣怡', 'Hsin-Yi Chiu') },
        ],
      },
      {
        certYear: '2024',
        badge: T('2023年11月通過（2023標章）· 12/19 頒獎典禮', 'Certified Nov 2023 (2023 badge) · Ceremony 12/19'),
        title: T('「能力導向醫學教育」的治理與社會責任實踐', 'Governance & Social Responsibility of Competency-Based Medical Education'),
        renewal: T('通過續審：2024、2025年', 'Renewed: 2024, 2025'),
        members: [
          { unit: T('院長室', "Director's Office"), role: T('教學副院長', 'VP · Medical Education'), person: T('曾頌惠', 'Sung-Hui Tseng') },
          { unit: T('外科部', 'Surgery'), role: T('教學型主治醫師', 'Teaching Attending'), person: T('邱欣怡', 'Hsin-Yi Chiu') },
          { unit: T('教學部', 'Medical Education'), role: T('教學部主任', 'Department Director'), person: T('陳建宇', 'Chien-Yu Chen') },
          { unit: T('泌尿科', 'Urology'), role: T('教學型主治醫師', 'Teaching Attending'), person: T('吳政誠', 'Jeng-Cheng Wu') },
          { unit: T('護理部', 'Nursing'), role: T('護理部', 'Nursing Dept.'), person: T('郭淑柳', 'Shu-Liu Kuo') },
          { unit: T('教學部', 'Medical Education'), role: T('事務員', 'Administrative Staff'), person: T('吳玉琳', 'Yu-Lin Wu') },
        ],
      },
      {
        certYear: '2024',
        badge: T('2023年11月通過（2023標章）· 12/19 頒獎典禮', 'Certified Nov 2023 (2023 badge) · Ceremony 12/19'),
        title: T('點亮復原之路：實踐全人醫療與共創照護品質', 'Lighting the Road to Recovery: Holistic Medicine & Co-created Care Quality'),
        renewal: T('通過續審：2025年', 'Renewed: 2025'),
        members: [
          { unit: T('院長室', "Director's Office"), role: T('教學副院長', 'VP · Medical Education'), person: T('曾頌惠', 'Sung-Hui Tseng') },
          { unit: T('院長室', "Director's Office"), role: T('醫品副院長', 'VP · Quality'), person: T('魏柏立', 'Po-Li Wei') },
          { unit: T('院長室', "Director's Office"), role: T('教學副院長', 'VP · Medical Education'), person: T('張君照', 'Chun-Chao Chang') },
          { unit: T('教學部', 'Medical Education'), role: T('教學部主任', 'Department Director'), person: T('陳建宇', 'Chien-Yu Chen') },
          { unit: T('教學部', 'Medical Education'), role: T('教學型醫事人員', 'Teaching Allied Health'), person: T('廖若帆', 'Faith Ruofan Liao') },
          { unit: T('泌尿科', 'Urology'), role: T('教學型主治醫師', 'Teaching Attending'), person: T('吳政誠', 'Jeng-Cheng Wu') },
        ],
      },
    ],
    nhqa: {
      year: T('112年', 'AY112'),
      event: T('2022/10/20–21 @ 臺北榮民總醫院', 'Oct 20–21, 2022 @ Taipei Veterans General Hospital'),
      awardNote: T('111年標章', 'AY111 Badge'),
      group: T('智慧醫療類 · 智慧解決方案組', 'Smart Healthcare · Smart Solutions Track'),
      domain: T('教學研究領域', 'Teaching & Research'),
      project: T('智慧手術教學平台之建置及虛擬實境手術教學之導入', 'Smart Surgery Teaching Platform & VR Surgical Training'),
      leads: [
        T('曾頌惠', 'Sung-Hui Tseng'),
        T('魏柏立', 'Po-Li Wei'),
        T('吳玉琮', 'Yu-Tsung Wu'),
        T('陳建宇', 'Chien-Yu Chen'),
        T('邱欣怡', 'Hsin-Yi Chiu'),
      ],
      keywords: [
        T('虛擬實境', 'Virtual Reality'),
        T('教育平台', 'Education Platform'),
        T('外科教學', 'Surgical Teaching'),
        T('人工智慧', 'AI'),
      ],
    },
  },

  /* ---------------- 公告與活動 ---------------- */
  news: {
    eyebrow: T('Announcements', 'Announcements'),
    title: T('最新公告', 'Latest News'),
    desc: T(
      '中心與教學部的最新訊息。未來與活動管理平台串接後，將自動顯示「對外看板」的公告。',
      'The latest from the department and its centers. Once linked to the activity-management platform, the public board will appear here automatically.',
    ),
    updatedLabel: T('最後更新', 'Last updated'),
    boardLink: T('前往公告看板 →', 'Open the announcement board →'),
    boardUrl:
      'https://script.google.com/a/macros/h.tmu.edu.tw/s/AKfycby2MW_ys1HQsgsgb_HnP0gKucbWONkN_cA_aFM3P98GJCS6f5B0JP4zTmiDeEVMjgnB/exec',
    items: [
      {
        date: '2026-05-20',
        pinned: true,
        tag: T('置頂', 'Pinned'),
        stat: { top: 'Q1', topLabel: T('期刊分區', 'Journal Q'), bottom: 'IF 10.3', bottomLabel: T('影響係數', 'Impact factor') },
        title: T('學術發表與國際舞台', 'Scholarship & the international stage'),
        lines: [
          T('THSS 外科論文獲頂尖國際期刊 International Journal of Surgery 收錄（Q1，IF 10.3）。', 'A THSS surgical paper accepted by the top journal International Journal of Surgery (Q1, IF 10.3).'),
          T('國際研討會 AMEE×3、ISQua×3；', 'International conferences: AMEE ×3, ISQua ×3;'),
          T('ISQua 2026 取得 30 分鐘專場，以 Virtual Patient 人機互動探討罕病 Calciphylaxis 之疼痛控制，獲主辦方來信肯定。', 'ISQua 2026 granted a 30-min session using a Virtual Patient to explore pain control in the rare disease Calciphylaxis, praised by the organizers.'),
        ],
      },
      {
        date: '2026-04-15',
        tag: T('公告', 'News'),
        stat: { top: '56', topLabel: T('人參與', 'attendees') },
        title: T('歐洲虛擬醫院跨域交流', 'Cross-border exchange with a European virtual hospital'),
        lines: [
          T('捷克馬薩里克大學（Masaryk University）虛擬醫學部 Tereza Vafkova 副主任來校專題演講。', 'Deputy Director Tereza Vafkova of the virtual medical faculty at Masaryk University (Czechia) gave a campus keynote.'),
          T('56 位醫師、教授與研究人員線上線下參與，深化全人照護與 AI 輔助教學交流，強化「健康臺灣深耕計畫」國際合作。', '56 physicians, professors and researchers joined online and in person, deepening holistic-care and AI-assisted teaching exchange under the Healthy Taiwan initiative.'),
        ],
      },
      {
        date: '2023-05-01',
        tag: T('公告', 'News'),
        stat: { top: '112.05.01', topLabel: T('成立日', 'Founded'), small: true },
        title: T('全人照護教育中心正式成立', 'The Center is officially established'),
        lines: [
          T('依《全人照護教育中心設置要點》於教學部成立；', 'Established within the Dept. of Medical Education under the Center’s founding charter;'),
          T('以勝任能力為導向，推動全人照護、靈性關懷與醫學人文之教學實踐及應用研究，並以教育與研究輔助院內各單位提升全人照護品質。', 'Competency-oriented, advancing teaching practice and applied research in holistic care, spiritual care and medical humanities, supporting every unit in raising holistic-care quality.'),
        ],
      },
    ],
    actTitle: T('近期活動', 'Activities'),
    actDesc: T(
      '課程、講座與培訓資訊。未來將與「教學部活動管理平台」即時串接，自動顯示最新活動並開放線上報名。',
      'Courses, talks and training. Once linked to the activity-management platform, new events and online registration will appear here automatically.',
    ),
    activities: [
      {
        cat: T('全人教師發展課程', 'Holistic Faculty Development'),
        title: T('停下來，是最負責任的事', 'To pause is the most responsible act'),
        date: T('2026/07/22（三）12:30–13:30', 'Wed 2026/07/22 12:30–13:30'),
        place: T('線上視訊', 'Online'),
        speaker: T('北醫附醫精神科 鐘國軒主任', 'Dir. Kuo-Hsuan Chung, Psychiatry, TMUH'),
        topic: T('教師的全人自我觀照', 'Teachers’ whole-person self-reflection'),
        enrolled: T('已報名 0 人', '0 enrolled'),
        status: T('TMS 5416', 'TMS 5416'),
        link: 'https://tms2.tmu.edu.tw/epf/dashboard/creditStatistics/courseRecords/5416',
        labels: {
          place: T('地點', 'Place'),
          speaker: T('講者', 'Speaker'),
          topic: T('主題', 'Topic'),
        },
        cta: T('前往 TMS 報名 →', 'Register on TMS →'),
      },
    ],
  },

  /* ---------------- 聯絡 ---------------- */
  contact: {
    eyebrow: T('Contact', 'Contact'),
    title: T('聯絡我們', 'Contact Us'),
    desc: T(
      '各中心行政窗口與分機如下；一般業務諮詢也可直接填寫下方表單，我們會轉交給對應的承辦同仁。',
      'Center administrators and extensions are listed below. For general enquiries, use the form and we will route it to the right colleague.',
    ),
    windowLabel: T('行政窗口', 'Administrator'),
    cards: [
      { center: T('教師發展中心', 'Faculty Development Center'), person: T('陳均茹', 'Chun-Ju Chen'), ext: ext('3757'), color: ACCENT.faculty_dev },
      { center: T('臨床技能中心', 'Clinical Skills Center'), person: T('張家銘、賴哲民', 'Chia-Ming Chang · Che-Min Lai'), ext: ext('3770'), color: ACCENT.clinical_skills },
      { center: T('實證醫學中心', 'Evidence-Based Medicine Center'), person: T('江明憲', 'Ming-Hsien Chiang'), ext: ext('3760'), color: ACCENT.ebm },
      { center: T('全人照護教育中心', 'Holistic Care Education Center'), person: T('江明憲', 'Ming-Hsien Chiang'), ext: ext('3760'), color: ACCENT.holistic },
      { center: T('醫學教育研究中心', 'Medical Education Research Center'), person: T('陳麗玉', 'Li-Yu Chen'), ext: T('', ''), color: ACCENT.med_edu_research },
    ],
    info: [
      { k: T('地址', 'Address'), v: T('110301 臺北市信義區吳興街 252 號', 'No. 252 Wuxing St., Xinyi Dist., Taipei 110301, Taiwan') },
      { k: T('總機', 'Phone'), v: T(MAIN_PHONE, MAIN_PHONE) },
      { k: T('單位', 'Unit'), v: T('臺北醫學大學附設醫院 教學部', 'Dept. of Medical Education, TMU Hospital') },
    ],
    mapTitle: T('臺北醫學大學附設醫院位置地圖', 'Map showing Taipei Medical University Hospital'),
    mapQuery: '臺北醫學大學附設醫院',

    form: {
      title: T('線上聯絡表單', 'Enquiry form'),
      note: T(
        '本表單為展示用途，送出後不會實際寄出；正式上線後將串接教學部信箱。',
        'This form is for demonstration only and does not send mail; it will be wired to the department mailbox when the site goes live.',
      ),
      nameLabel: T('姓名', 'Name'),
      nameError: T('請填寫您的姓名。', 'Please tell us your name.'),
      emailLabel: T('電子郵件', 'Email'),
      emailError: T('請填寫有效的電子郵件，例如 name@example.com。', 'Enter a valid email, e.g. name@example.com'),
      phoneLabel: T('聯絡電話', 'Phone'),
      phoneOptional: T('（選填）', '(optional)'),
      phoneError: T('請填寫 8–15 位數字的電話號碼。', 'Use 8–15 digits, e.g. 02 2737 2181'),
      unitLabel: T('單位／身分', 'Unit / Role'),
      unitError: T('請填寫您的單位或身分。', 'Please tell us your unit or role.'),
      topicLabel: T('諮詢主題', 'Topic'),
      topicPlaceholder: T('請選擇主題', 'Select a topic'),
      topicError: T('請選擇最接近的主題，細節可寫在下方。', 'Pick the closest topic — details can go below.'),
      topics: [
        T('師資培育與教職申請', 'Faculty development & academic appointments'),
        T('OSCE 與臨床技能訓練', 'OSCE & clinical skills training'),
        T('實證醫學課程與競賽', 'EBM courses & contests'),
        T('全人照護與 MHFA', 'Holistic care & MHFA'),
        T('醫學教育研究合作', 'Medical education research'),
        T('其他業務諮詢', 'Other enquiries'),
      ],
      messageLabel: T('內容', 'Message'),
      messageError: T('請簡述您的需求（至少 15 個字），方便我們轉給對的承辦同仁。', 'A sentence or two helps us route your enquiry (15 characters minimum).'),
      consentLabel: T('我同意教學部就此次諮詢與我聯繫。', 'I agree to be contacted about this enquiry.'),
      consentError: T('需要您的同意，我們才能回覆。', 'We need your consent to reply.'),
      submit: T('送出諮詢', 'Send enquiry'),
      sending: T('傳送中…', 'Sending…'),
      invalid: T('請修正標示的欄位後再送出。', 'Please fix the highlighted fields and try again.'),
      success: T('已收到您的訊息，教學部將於三個工作天內回覆。', 'Thank you — the department will reply within three working days.'),
    },
  },

  /* ---------------- 頁尾 ---------------- */
  footer: {
    copy: T(
      '© 臺北醫學大學附設醫院 教學部　本網站僅供單位展示使用。',
      '© Dept. of Medical Education, TMU Hospital — for departmental display purposes only.',
    ),
    links: [
      { label: T('北醫附醫官網', 'TMU Hospital'), href: 'https://www.tmuh.org.tw/', icon: 'globe' },
      { label: T('TMU Hub 學術檔案', 'TMU Hub'), href: 'https://hub.tmu.edu.tw/', icon: 'hub' },
      { label: T('TMS 教學管理系統', 'TMS'), href: 'https://tms2.tmu.edu.tw/', icon: 'cap' },
      { label: T('公告看板', 'Announcement board'), href: 'https://script.google.com/a/macros/h.tmu.edu.tw/s/AKfycby2MW_ys1HQsgsgb_HnP0gKucbWONkN_cA_aFM3P98GJCS6f5B0JP4zTmiDeEVMjgnB/exec', icon: 'board' },
    ],
  },
};

window.CONTENT = CONTENT;
