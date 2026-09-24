import type { EditorCollectionCopy } from '../ui/EditorCollection';

export const CENTER_COLLECTION_COPY: EditorCollectionCopy = {
  addLabel: '新增中心',
  emptyTitle: '尚無中心資料',
  emptyDescription: '新增第一個繁體中文與英文配對中心。',
  itemLabel: (position, total) => `中心 ${position}，共 ${total} 個`,
  moveUpLabel: (position) => `上移第 ${position} 個中心`,
  moveDownLabel: (position) => `下移第 ${position} 個中心`,
  removeLabel: (position) => `刪除第 ${position} 個中心`,
  removeTitle: (position) => `刪除第 ${position} 個中心？`,
  removeDescription: '繁體中文、英文及其所有分支會一併刪除。',
  removeBody: '確認後才會刪除此配對中心。',
  confirmRemoveLabel: '確認刪除中心',
  cancelRemoveLabel: '保留中心',
  movedAnnouncement: (from, to, total) => `已將第 ${from} 個中心移至第 ${to} 個，共 ${total} 個。`,
};

export const BRANCH_COLLECTION_COPY: EditorCollectionCopy = {
  addLabel: '新增分支',
  emptyTitle: '尚無中心分支',
  emptyDescription: '新增第一個繁體中文與英文配對分支。',
  itemLabel: (position, total) => `分支 ${position}，共 ${total} 個`,
  moveUpLabel: (position) => `上移第 ${position} 個分支`,
  moveDownLabel: (position) => `下移第 ${position} 個分支`,
  removeLabel: (position) => `刪除第 ${position} 個分支`,
  removeTitle: (position) => `刪除第 ${position} 個分支？`,
  removeDescription: '繁體中文與英文分支會一併刪除。',
  removeBody: '確認後才會刪除此配對分支。',
  confirmRemoveLabel: '確認刪除分支',
  cancelRemoveLabel: '保留分支',
  movedAnnouncement: (from, to, total) => `已將第 ${from} 個分支移至第 ${to} 個，共 ${total} 個。`,
};
