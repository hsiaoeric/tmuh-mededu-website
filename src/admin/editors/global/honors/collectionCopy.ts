import type { EditorCollectionCopy } from '../ui/EditorCollection';

const SHARED_CONFIRMATION = {
  confirmRemoveLabel: '確認刪除',
  cancelRemoveLabel: '保留項目',
} as const;

export const PROJECT_COPY: EditorCollectionCopy = {
  ...SHARED_CONFIRMATION,
  addLabel: '新增 SNQ 專案',
  emptyTitle: '尚無 SNQ 專案',
  emptyDescription: '新增第一個繁體中文與英文配對的 SNQ 專案。',
  itemLabel: (position, total) => `SNQ 專案 ${position}，共 ${total} 個`,
  moveUpLabel: (position) => `上移第 ${position} 個 SNQ 專案`,
  moveDownLabel: (position) => `下移第 ${position} 個 SNQ 專案`,
  removeLabel: (position) => `刪除第 ${position} 個 SNQ 專案`,
  removeTitle: (position) => `刪除第 ${position} 個 SNQ 專案？`,
  removeDescription: '繁體中文與英文專案及其成員會一併刪除。',
  removeBody: '確認後會刪除此配對專案，其他專案與 NHQA 內容不受影響。',
  movedAnnouncement: (from, to, total) => `已將第 ${from} 個 SNQ 專案移至第 ${to} 位，共 ${total} 個。`,
};

export const YEAR_COUNT_COPY: EditorCollectionCopy = {
  ...SHARED_CONFIRMATION,
  addLabel: '新增年度統計',
  emptyTitle: '尚無 SNQ 年度統計',
  emptyDescription: '新增第一筆繁體中文與英文配對的年度與件數。',
  itemLabel: (position, total) => `年度統計 ${position}，共 ${total} 筆`,
  moveUpLabel: (position) => `上移第 ${position} 筆年度統計`,
  moveDownLabel: (position) => `下移第 ${position} 筆年度統計`,
  removeLabel: (position) => `刪除第 ${position} 筆年度統計`,
  removeTitle: (position) => `刪除第 ${position} 筆年度統計？`,
  removeDescription: '兩個語言版本的年度與件數會一併刪除。',
  removeBody: '件數為編輯者提供的內容，不會依專案數量重新計算。',
  movedAnnouncement: (from, to, total) => `已將第 ${from} 筆年度統計移至第 ${to} 位，共 ${total} 筆。`,
};

export function memberCopy(projectPosition: number): EditorCollectionCopy {
  return {
    ...SHARED_CONFIRMATION,
    addLabel: `新增專案 ${projectPosition} 成員`,
    emptyTitle: `專案 ${projectPosition} 尚無成員`,
    emptyDescription: '新增第一位繁體中文與英文配對的成員。',
    itemLabel: (position, total) => `專案 ${projectPosition} 成員 ${position}，共 ${total} 位`,
    moveUpLabel: (position) => `上移專案 ${projectPosition} 的第 ${position} 位成員`,
    moveDownLabel: (position) => `下移專案 ${projectPosition} 的第 ${position} 位成員`,
    removeLabel: (position) => `刪除專案 ${projectPosition} 的第 ${position} 位成員`,
    removeTitle: (position) => `刪除專案 ${projectPosition} 的第 ${position} 位成員？`,
    removeDescription: '兩個語言版本的成員資料會一併刪除。',
    removeBody: '確認後會刪除此配對成員，專案其他內容不受影響。',
    movedAnnouncement: (from, to, total) => `已將專案 ${projectPosition} 的第 ${from} 位成員移至第 ${to} 位，共 ${total} 位。`,
  };
}

export function nhqaListCopy(label: '負責人' | '關鍵字'): EditorCollectionCopy {
  return {
    ...SHARED_CONFIRMATION,
    addLabel: `新增 NHQA ${label}`,
    emptyTitle: `尚無 NHQA ${label}`,
    emptyDescription: `新增第一筆繁體中文與英文配對的 NHQA ${label}。`,
    itemLabel: (position, total) => `NHQA ${label} ${position}，共 ${total} 筆`,
    moveUpLabel: (position) => `上移第 ${position} 筆 NHQA ${label}`,
    moveDownLabel: (position) => `下移第 ${position} 筆 NHQA ${label}`,
    removeLabel: (position) => `刪除第 ${position} 筆 NHQA ${label}`,
    removeTitle: (position) => `刪除第 ${position} 筆 NHQA ${label}？`,
    removeDescription: `兩個語言版本的 NHQA ${label}會一併刪除。`,
    removeBody: '確認後會刪除此配對項目，NHQA 其他內容不受影響。',
    movedAnnouncement: (from, to, total) => `已將第 ${from} 筆 NHQA ${label}移至第 ${to} 位，共 ${total} 筆。`,
  };
}
