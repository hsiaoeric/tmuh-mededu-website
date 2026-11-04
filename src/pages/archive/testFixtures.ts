// 測試用的公告、教學部資訊與相簿樣本（僅供測試與畫面檢查，不寫入產生的快照檔）。
import committedSnapshot from '@/content/generated/cms-snapshot.json';
import { POST_CATEGORY_TAXONOMY, PROGRAM_TAXONOMY } from '@/data/legacy/taxonomy';

const paragraph = (text: string) => ({ type: 'paragraph', runs: [{ text }] });
const image = (path: string, alt: string) => ({ type: 'image', media: { kind: 'local', path }, alt });


export const SAMPLE_POSTS_PAYLOAD = {
  contentModel: 'localized-fields-v1',
  categories: POST_CATEGORY_TAXONOMY.map(({ id, channel, label, order }) => ({ id, channel, label, order })),
  posts: [
    {
      id: '185', channel: 'news', categoryId: 'hospital-courses', owner: 'department', publishedOn: '2026-09-18', pinned: true,
      title: { zh: '【TMUH】115/11/21(六) 2026 科技模擬國際研討會' },
      summary: { zh: '2026 International Conference for Medical Education in Technology and Simulation' },
      body: { zh: [paragraph('2026 科技模擬國際研討會\n2026 International Conference for Medical Education in Technology and Simulation'), image('assets/hero.jpg', '研討會海報')] },
      attachments: [{ id: 'agenda', label: { zh: '議程表' }, href: 'https://tmuh.org.tw/agenda.pdf' }],
    },
    {
      id: '184', channel: 'news', categoryId: 'recruitment', owner: 'department', publishedOn: '2024-04-22', pinned: false,
      title: { zh: '【醫事人員聯合訓練申請辦法】', en: 'Joint training applications for allied health staff' },
      body: { zh: [paragraph('申請辦法如附件。')], en: [paragraph('See the attached rules.')] },
      attachments: [],
    },
    {
      id: '183', channel: 'news', categoryId: 'trainee-notices', owner: 'department', audiences: ['pgy', 'residents'], publishedOn: '2023-07-17', pinned: false,
      title: { zh: '【台灣醫學教育學會活動】112年研討會論文摘要投稿及研究獎申請' },
      body: { zh: [paragraph('歡迎踴躍投稿。')] },
      attachments: [],
    },
    {
      id: '150', channel: 'honors', categoryId: 'competitions-awards', owner: 'department', publishedOn: '2025-03-02', pinned: false,
      title: { zh: '本院團隊榮獲 OSCE 教案競賽佳作' }, cover: { kind: 'local', path: 'assets/hero.jpg' },
      body: { zh: [paragraph('恭喜本院團隊。')] },
      attachments: [],
    },
    {
      id: '120', channel: 'center', categoryId: 'center-events', owner: 'ebm', publishedOn: '2025-05-10', pinned: false,
      title: { zh: '實證醫學競賽說明會' },
      body: { zh: [paragraph('說明會內容。'), { type: 'video', youtubeId: 'dQw4w9WgXcQ' }] },
      attachments: [],
    },
    {
      id: '119', channel: 'center', categoryId: 'center-about', owner: 'digital_materials', publishedOn: '2024-02-01', pinned: false,
      title: { zh: '數位教材室簡介' },
      body: { zh: [paragraph('數位教材室負責教材錄製與後製。')] },
      attachments: [],
    },
  ],
};

export const SAMPLE_DEPARTMENT_INFO_PAYLOAD = {
  contentModel: 'localized-fields-v1',
  pages: [
    {
      id: 'director-message', section: 'about', order: 1, title: { zh: '教學部主任的話' }, subtitle: { zh: '主任 吳政誠' },
      summary: { zh: '以學習者為中心，持續精進醫學教育。' },
      portrait: { kind: 'local', path: 'assets/jeng-cheng-wu.jpg' },
      body: { zh: [paragraph('歡迎來到教學部。')] },
    },
    {
      id: 'teaching-faculty', section: 'about', order: 2, title: { zh: '教學師資' },
      body: { zh: [paragraph('本院教學師資介紹。')] },
    },
    {
      id: 'teaching-committee', section: 'committee', order: 0, title: { zh: '教學委員會', en: 'Teaching Committee' },
      summary: { zh: '督導全院教學業務。', en: 'Oversees teaching across the hospital.' },
      body: { zh: [paragraph('委員會組成與任務。')], en: [paragraph('Membership and remit.')] },
      updatedOn: '2024-06-01',
    },
    {
      id: 'pgy-outcomes', section: 'program', owner: 'pgy', order: 0, title: { zh: 'PGY 訓練成果' },
      body: { zh: [paragraph('一一三年度訓練成果。')] },
    },
  ],
  programs: PROGRAM_TAXONOMY.map(({ id, order, title, summary }) => (
    id === 'pgy' ? { id, order, title, summary, outcomesPageId: 'pgy-outcomes' } : { id, order, title, summary }
  )),
  linkGroups: [
    {
      id: 'related', owner: 'department', purpose: 'related', order: 0, title: { zh: '相關連結', en: 'Related links' },
      links: [{ id: 'tmu', label: { zh: '臺北醫學大學' }, href: 'https://www.tmu.edu.tw/' }],
    },
    {
      id: 'pgy-common', owner: 'pgy', purpose: 'common', order: 1, title: { zh: 'PGY 常用資訊' },
      links: [{ id: 'pgy-form', label: { zh: '請假單' }, href: 'https://tmuh.org.tw/leave' }],
    },
  ],
  downloads: [
    {
      id: 'forms', owner: 'department', title: { zh: '表單下載' },
      items: [{ id: 'form-a', label: { zh: '教學活動申請表' }, href: 'files/legacy/forms/form-a.pdf', publishedOn: '2023-03-01' }],
    },
  ],
};

export const SAMPLE_GALLERY_PAYLOAD = {
  contentModel: 'localized-fields-v1',
  albums: [
    {
      id: 'pgy-orientation-2024', owner: 'pgy', title: { zh: '2024 PGY 新進人員訓練' }, date: '2024-08-01',
      photos: [
        { id: 'p1', media: { kind: 'local', path: 'assets/hero.jpg' } },
        { id: 'p2', media: { kind: 'local', path: 'assets/chung-che-wu.jpg' }, caption: { zh: '開訓典禮' } },
      ],
    },
    {
      id: 'ebm-contest-2023', owner: 'ebm', title: { zh: '實證醫學競賽', en: 'EBM contest' }, date: '2023-05-01',
      photos: [{ id: 'p1', media: { kind: 'local', path: 'assets/hero.jpg' } }],
    },
  ],
  videos: [
    { id: 'pgy-intro', owner: 'pgy', title: { zh: 'PGY 訓練介紹' }, youtubeId: 'dQw4w9WgXcQ', publishedOn: '2024-09-01' },
    { id: 'ebm-talk', owner: 'ebm', title: { zh: '實證醫學講座', en: 'EBM talk' }, youtubeId: 'aqz-KE-bpKQ' },
  ],
};

/** The committed snapshot rows with the three archive documents replaced by the samples above. */
export function sampleSnapshotRows(): unknown[] {
  return committedSnapshot.map((row) => {
    if (row.kind === 'posts') return { ...row, payload: SAMPLE_POSTS_PAYLOAD };
    if (row.kind === 'department_info') return { ...row, payload: SAMPLE_DEPARTMENT_INFO_PAYLOAD };
    if (row.kind === 'gallery') return { ...row, payload: SAMPLE_GALLERY_PAYLOAD };
    return row;
  });
}
