import type {
  AudienceOwner,
  DepartmentPageSection,
  LinkGroupPurpose,
  OwnerId,
  PostChannel,
  ProgramId,
} from '@/content/contracts/archiveIds';
import type { BlockType } from '@/content/contracts/blocks';

// 公告與資料庫編輯器的介面文字。管理介面依目前語言顯示，識別碼本身不翻譯。

type Pair = { readonly zh: string; readonly en: string };

const OWNER_LABELS: Readonly<Record<OwnerId, Pair>> = {
  department: { zh: '教學部', en: 'Department of Medical Education' },
  faculty_dev: { zh: '教師發展中心', en: 'Center for Faculty Development' },
  clinical_skills: { zh: '臨床技能中心', en: 'Center for Clinical Skills' },
  ebm: { zh: '實證醫學中心', en: 'Center for Evidence-Based Medicine' },
  holistic: { zh: '全人照護教育中心', en: 'Center for Holistic Care Education' },
  med_edu_research: { zh: '醫學教育研究中心', en: 'Center for Research in Medical Education' },
  digital_materials: { zh: '數位教材室', en: 'Digital Materials Room' },
};

const PROGRAM_LABELS: Readonly<Record<ProgramId, Pair>> = {
  residents: { zh: '住院醫師', en: 'Residents' },
  pgy: { zh: '畢業後一般醫學訓練（PGY）', en: 'Post-graduate year training (PGY)' },
  'medical-students': { zh: '醫學生', en: 'Medical students' },
  'allied-health-trainees': { zh: '醫事見實習', en: 'Allied health trainees' },
  'joint-training': { zh: '代訓／聯合訓練', en: 'Commissioned and joint training' },
};

const CHANNEL_LABELS: Readonly<Record<PostChannel, Pair>> = {
  news: { zh: '公告', en: 'Announcements' },
  honors: { zh: '榮譽榜', en: 'Honor board' },
  center: { zh: '中心文章', en: 'Center articles' },
};

const SECTION_LABELS: Readonly<Record<DepartmentPageSection, Pair>> = {
  about: { zh: '關於教學部', en: 'About the department' },
  committee: { zh: '委員會', en: 'Committee' },
  program: { zh: '學員專區計畫', en: 'Trainee program' },
  center: { zh: '中心介紹', en: 'Center page' },
};

const PURPOSE_LABELS: Readonly<Record<LinkGroupPurpose, Pair>> = {
  related: { zh: '相關連結', en: 'Related links' },
  common: { zh: '常用資訊', en: 'Common information' },
  systems: { zh: '系統入口', en: 'Systems' },
};

const BLOCK_LABELS: Readonly<Record<BlockType, Pair>> = {
  paragraph: { zh: '段落', en: 'Paragraph' },
  heading: { zh: '標題', en: 'Heading' },
  list: { zh: '清單', en: 'List' },
  image: { zh: '圖片', en: 'Image' },
  table: { zh: '表格', en: 'Table' },
  divider: { zh: '分隔線', en: 'Divider' },
  video: { zh: 'YouTube 影片', en: 'YouTube video' },
};

const pick = (pair: Pair, isZh: boolean) => (isZh ? pair.zh : pair.en);

export function ownerLabel(owner: string, isZh: boolean): string {
  if (owner in OWNER_LABELS) return pick(OWNER_LABELS[owner as OwnerId], isZh);
  if (owner in PROGRAM_LABELS) return pick(PROGRAM_LABELS[owner as ProgramId], isZh);
  return owner;
}

export function audienceOwnerLabel(owner: AudienceOwner, isZh: boolean): string {
  const label = ownerLabel(owner, isZh);
  return owner in PROGRAM_LABELS ? (isZh ? `學員專區 · ${label}` : `Trainees · ${label}`) : label;
}

export function programLabel(program: ProgramId, isZh: boolean): string {
  return pick(PROGRAM_LABELS[program], isZh);
}

export function channelLabel(channel: string, isZh: boolean): string {
  return channel in CHANNEL_LABELS ? pick(CHANNEL_LABELS[channel as PostChannel], isZh) : channel;
}

export function sectionLabel(section: string, isZh: boolean): string {
  return section in SECTION_LABELS ? pick(SECTION_LABELS[section as DepartmentPageSection], isZh) : section;
}

export function purposeLabel(purpose: string, isZh: boolean): string {
  return purpose in PURPOSE_LABELS ? pick(PURPOSE_LABELS[purpose as LinkGroupPurpose], isZh) : purpose;
}

export function blockLabel(type: BlockType, isZh: boolean): string {
  return pick(BLOCK_LABELS[type], isZh);
}

/** Labels for a bilingual field pair: the pair's title, then each side's accessible name. */
export function pairLabels(title: Pair | string, isZh: boolean): { readonly legend: string; readonly zh: string; readonly en: string } {
  const legend = typeof title === 'string' ? title : pick(title, isZh);
  return isZh
    ? { legend, zh: `${legend}（中文）`, en: `${legend}（英文）` }
    : { legend, zh: `${legend} (Chinese)`, en: `${legend} (English)` };
}

/** Collection copy for `EditorCollection`, in the admin's language. */
export function collectionCopy(noun: Pair, isZh: boolean, extra?: { readonly removeBody?: string }) {
  const name = pick(noun, isZh);
  return isZh
    ? {
        addLabel: `新增${name}`,
        emptyTitle: `尚無${name}`,
        emptyDescription: `新增第一個${name}。`,
        itemLabel: (position: number, total: number) => `${name} ${position}／${total}`,
        moveUpLabel: (position: number) => `上移${name} ${position}`,
        moveDownLabel: (position: number) => `下移${name} ${position}`,
        removeLabel: (position: number) => `刪除${name} ${position}`,
        removeTitle: (position: number) => `刪除${name} ${position}？`,
        removeDescription: `只會刪除這個${name}。`,
        removeBody: extra?.removeBody ?? '儲存草稿前都可以用「復原」還原。',
        confirmRemoveLabel: '確認刪除',
        cancelRemoveLabel: '保留',
        movedAnnouncement: (from: number, to: number, total: number) => `已將${name} ${from} 移至第 ${to} 個，共 ${total} 個。`,
      }
    : {
        addLabel: `Add ${name.toLowerCase()}`,
        emptyTitle: `No ${name.toLowerCase()} yet`,
        emptyDescription: `Add the first ${name.toLowerCase()}.`,
        itemLabel: (position: number, total: number) => `${name} ${position} of ${total}`,
        moveUpLabel: (position: number) => `Move ${name.toLowerCase()} ${position} up`,
        moveDownLabel: (position: number) => `Move ${name.toLowerCase()} ${position} down`,
        removeLabel: (position: number) => `Delete ${name.toLowerCase()} ${position}`,
        removeTitle: (position: number) => `Delete ${name.toLowerCase()} ${position}?`,
        removeDescription: `Only this ${name.toLowerCase()} is deleted.`,
        removeBody: extra?.removeBody ?? 'You can still undo this before saving the draft.',
        confirmRemoveLabel: 'Delete',
        cancelRemoveLabel: 'Keep',
        movedAnnouncement: (from: number, to: number, total: number) => `Moved ${name.toLowerCase()} ${from} to position ${to} of ${total}.`,
      };
}

export const NOUNS = {
  post: { zh: '文章', en: 'Post' },
  attachment: { zh: '附件', en: 'Attachment' },
  page: { zh: '頁面', en: 'Page' },
  program: { zh: '計畫', en: 'Program' },
  linkGroup: { zh: '連結群組', en: 'Link group' },
  link: { zh: '連結', en: 'Link' },
  download: { zh: '下載群組', en: 'Download group' },
  downloadItem: { zh: '檔案', en: 'File' },
  album: { zh: '相簿', en: 'Album' },
  photo: { zh: '照片', en: 'Photo' },
  video: { zh: '影片', en: 'Video' },
  block: { zh: '區塊', en: 'Block' },
  run: { zh: '文字片段', en: 'Text run' },
  listItem: { zh: '清單項目', en: 'List item' },
} as const satisfies Readonly<Record<string, Pair>>;

export function untranslatedLabel(isZh: boolean): string {
  return isZh ? '未翻譯' : 'Not translated';
}

export function lockedIdHelper(isZh: boolean): string {
  return isZh
    ? '已發布或有舊網站連結轉址到這個識別碼，因此不能修改。'
    : 'This id is published or a legacy redirect points to it, so it can no longer change.';
}
