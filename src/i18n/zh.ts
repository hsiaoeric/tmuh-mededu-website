export const zh = {
  brand1: '臺北醫學大學附設醫院',
  brand2: '教學部 · Medical Education',
  langBtn: 'EN',
  footBrand: '臺北醫學大學附設醫院 教學部',
  footBrandEn: 'Dept. of Medical Education · TMU Hospital',
  footAddr: '地址：110301 臺北市信義區吳興街 252 號',
  footTel: '電話：(02) 2737-2181',

  navAbout: '關於',
  navOrg: '組織架構',
  navHolistic: '全人照護中心',
  navNews: '公告',
  navContact: '聯絡',
  navMhfa: '心理健康急救',
  navSeed: '種子教師',
  backDept: '返回教學部',

  heroEyebrow: 'Taipei Medical University Hospital',
  heroTitle1: '卓越醫學教育',
  heroTitle2: '育成醫療人才',
  heroTag:
    '以人為本的全人醫療教育，結合教師發展、臨床技能、實證醫學與全人照護，培育兼具同理心與專業能力的醫療人才。',
  ctaOrg: '探索組織架構',
  chipCenters: '教育中心',
  chipSeed: '種子教師',

  kpiEyebrow: 'At a Glance',
  kpiTitle: '教學部一覽',

  orgTitle: '教學部組織架構',
  orgDesc: '六大功能單位協同運作，點擊任一中心查看核心業務與聯絡窗口。',
  layoutTree: '組織樹',
  layoutHub: '中樞圖',

  hospital: '臺北醫學大學附設醫院',
  dept: '教學部',
  deptShort: '教學部',
  members: '團隊成員',
  formingTeam: '團隊籌備中，敬請期待。',

  comingSoon: '即將串接',
  contactTitle: '聯絡我們',

  newsZh: '最新公告',
  newsEn: 'Announcements',
  newsDesc:
    '中心與教學部的最新訊息。未來與活動管理平台串接後，將自動顯示「對外看板」的公告。',
  eventsZh: '近期活動',
  eventsEn: 'Activities',
  eventsDesc:
    '課程、講座與培訓資訊。未來將與「教學部活動管理平台」即時串接，自動顯示最新活動並開放線上報名。',

  hHeroTitle: '以人為本，照顧每一個完整的人',
  hHeroTag:
    '全人照護教育中心結合醫療、心理與關懷的力量，推動「心理健康急救 Mental Health First Aid」，培育跨領域種子教師，讓身心健康的支持，走進每一個臨床現場與校園角落。',
  hCtaMhfa: '了解心理健康急救',
  hAboutTitle: '關於全人照護教育中心',
  /* `\u2060` is a word joiner: an invisible character that forbids a line break
     at that point. Chinese wraps between any two characters, so without it
     「整體安適」 can be split across two lines. */
  hAboutBody:
    '全人照護（Holistic Care）相信健康不只是沒有疾病，而是身、心、社會與心靈的整\u2060體\u2060安\u2060適。我們以教育為起點，讓每一位醫療同仁都具備關懷與初步協助的能力。',
  mhfaTitle: '心理健康急救 ALGEE',
  mhfaIntro:
    '就像 CPR 之於身體急救，MHFA 教我們在他人陷入心理困擾或危機時，能夠及時察覺、陪伴與協助轉介。點選每個字母，認識五個行動步驟。',
  instructorsTitle: '中心指導員',
  seedTitle: 'MHFA 種子教師團隊',
  seedDesc:
    '來自全院 11 個科部、橫跨 10 種專業職類，將心理健康急救的種子帶回各自的工作現場。',
  /* The space after 「：」 is load-bearing. SplitText segments words on ordinary
     whitespace only, so without it 「打造」 stays glued to the run before it as
     one 14em word — wider than the title measure, which makes that word wrap
     inside its own box and strands 「AI」 on a third line. The measure guarantees
     the line always breaks at this space, so it collapses and never shows. */
  aiTitle: '台灣健康深耕計畫範疇二： 打造 AI 全人照護教育生態系',
  aiBody:
    '本範疇以「打造 AI 全人照護教育生態系」為核心，串連全人照護教育、人工智慧專業、醫學教育研究與實作場域，發展可導入臨床與校園的 AI 輔助教學資源、案例素材與評量回饋機制，支持醫療人才在科技輔助下深化同理、溝通與全人照護能力。',
  hContactPerson: '行政專員：江明憲',
  hContactExt: '(02) 2737-2181 ＃3760',
  hContactPlace: '臺北醫學大學附設醫院 · 教學部 全人照護教育中心',
  hContactQuote: '以教育推動全人照護，讓關懷成為每一位醫療人的本能。',
  footNote: '© 臺北醫學大學附設醫院 教學部　本網站僅供單位展示使用。',
};

export type Strings = typeof zh;
