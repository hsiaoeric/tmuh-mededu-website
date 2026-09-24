import type { EditorCollectionCopy } from '../ui/EditorCollection';
import type { NewsLocale } from './newsTypes';

export function announcementCopy(): EditorCollectionCopy {
  return {
    addLabel: '新增公告',
    emptyTitle: '尚無公告',
    emptyDescription: '新增第一則中英文配對公告，手動順序會原樣保存。',
    itemLabel: (position, total) => `第 ${position} 則公告，共 ${total} 則`,
    moveUpLabel: (position) => `上移第 ${position} 則公告`,
    moveDownLabel: (position) => `下移第 ${position} 則公告`,
    removeLabel: (position) => `刪除第 ${position} 則公告`,
    removeTitle: (position) => `刪除第 ${position} 則公告？`,
    removeDescription: '繁體中文與英文公告會一併刪除。',
    removeBody: '此操作只移除目前配對公告，不會重新排序其他公告。',
    confirmRemoveLabel: '確認刪除',
    cancelRemoveLabel: '保留公告',
    movedAnnouncement: (from, to, total) => `已將第 ${from} 則公告移至第 ${to} 則，共 ${total} 則。`,
  };
}

export function categoryCopy(): EditorCollectionCopy {
  return {
    addLabel: '新增分類',
    emptyTitle: '尚無分類',
    emptyDescription: '新增第一個中英文配對分類。分類 ID 是內容欄位，兩種語言必須一致。',
    itemLabel: (position, total) => `第 ${position} 個分類，共 ${total} 個`,
    moveUpLabel: (position) => `上移第 ${position} 個分類`,
    moveDownLabel: (position) => `下移第 ${position} 個分類`,
    removeLabel: (position) => `刪除第 ${position} 個分類`,
    removeTitle: (position) => `刪除第 ${position} 個分類？`,
    removeDescription: '繁體中文與英文分類會一併刪除。',
    removeBody: '現有公告的分類值與顯示標籤不會被自動改寫。',
    confirmRemoveLabel: '確認刪除',
    cancelRemoveLabel: '保留分類',
    movedAnnouncement: (from, to, total) => `已將第 ${from} 個分類移至第 ${to} 個，共 ${total} 個。`,
  };
}

export function lineCopy(locale: NewsLocale, announcement: number): EditorCollectionCopy {
  const language = locale === 'zh' ? '繁體中文' : '英文';
  return {
    addLabel: `新增第 ${announcement} 則公告的${language}內容行`,
    emptyTitle: `尚無${language}內容行`,
    emptyDescription: `新增第一行${language}公告內容。`,
    itemLabel: (position, total) => `${language}第 ${position} 行，共 ${total} 行`,
    moveUpLabel: (position) => `上移${language}第 ${position} 行`,
    moveDownLabel: (position) => `下移${language}第 ${position} 行`,
    removeLabel: (position) => `刪除${language}第 ${position} 行`,
    removeTitle: (position) => `刪除${language}第 ${position} 行？`,
    removeDescription: '只會刪除這個語言的內容行。',
    removeBody: '另一種語言的內容行不會改變。',
    confirmRemoveLabel: '確認刪除',
    cancelRemoveLabel: '保留內容行',
    movedAnnouncement: (from, to, total) => `已將${language}第 ${from} 行移至第 ${to} 行，共 ${total} 行。`,
  };
}
