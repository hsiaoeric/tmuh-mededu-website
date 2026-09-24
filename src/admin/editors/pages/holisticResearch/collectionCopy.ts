import type { EditorCollectionCopy } from '@/admin/editors/global/ui/EditorCollection';

function copy(noun: string, empty: string): EditorCollectionCopy {
  return {
    addLabel: `新增${noun}`,
    emptyTitle: `尚無${empty}`,
    emptyDescription: `建立第一筆${noun}，繁體中文與英文會同步新增。`,
    itemLabel: (position, total) => `${noun} ${position}，共 ${total} 筆`,
    moveUpLabel: (position) => `上移第 ${position} 筆${noun}`,
    moveDownLabel: (position) => `下移第 ${position} 筆${noun}`,
    removeLabel: (position) => `刪除第 ${position} 筆${noun}`,
    removeTitle: (position) => `刪除第 ${position} 筆${noun}？`,
    removeDescription: '繁體中文與英文內容會一起刪除。',
    removeBody: '請確認目前內容修訂仍是您要刪除的版本。',
    confirmRemoveLabel: '確認刪除',
    cancelRemoveLabel: '保留內容',
    movedAnnouncement: (from, to, total) => `${noun}已從第 ${from} 筆移至第 ${to} 筆，共 ${total} 筆。`,
  };
}

export const YEAR_COPY = copy('年度統計', '年度統計');
export const CLINICAL_COPY = copy('臨床統計', '臨床統計');

export const PAPER_COPY: EditorCollectionCopy = {
  ...copy('論文', '論文'),
  itemLabel: (position, total) => `論文 ${position}，共 ${total} 篇`,
  moveUpLabel: (position) => `上移第 ${position} 篇論文`,
  moveDownLabel: (position) => `下移第 ${position} 篇論文`,
  removeLabel: (position) => `刪除第 ${position} 篇論文`,
  removeTitle: (position) => `刪除第 ${position} 篇論文？`,
};

export function authorCopy(paperPosition: number): EditorCollectionCopy {
  const noun = `論文 ${paperPosition} 作者`;
  return {
    ...copy(noun, `${noun}`),
    addLabel: `新增${noun}`,
    emptyTitle: `${noun}尚無作者`,
    itemLabel: (position, total) => `${noun} ${position}，共 ${total} 位`,
    moveUpLabel: (position) => `上移論文 ${paperPosition} 的第 ${position} 位作者`,
    moveDownLabel: (position) => `下移論文 ${paperPosition} 的第 ${position} 位作者`,
    removeLabel: (position) => `刪除論文 ${paperPosition} 的第 ${position} 位作者`,
    removeTitle: (position) => `刪除論文 ${paperPosition} 的第 ${position} 位作者？`,
  };
}
