import type { EditorCollectionCopy } from '@/admin/editors/global/ui/EditorCollection';

type CollectionLabels = {
  readonly noun: string;
  readonly add: string;
  readonly empty: string;
};

export function collectionCopy(labels: CollectionLabels): EditorCollectionCopy {
  return {
    addLabel: labels.add,
    emptyTitle: labels.empty,
    emptyDescription: `新增第一組繁體中文與英文${labels.noun}。`,
    itemLabel: (position, total) => `${labels.noun} ${position}，共 ${total} 組`,
    moveUpLabel: (position) => `上移第 ${position} 個${labels.noun}`,
    moveDownLabel: (position) => `下移第 ${position} 個${labels.noun}`,
    removeLabel: (position) => `刪除第 ${position} 個${labels.noun}`,
    removeTitle: (position) => `刪除第 ${position} 個${labels.noun}？`,
    removeDescription: '繁體中文與英文資料會一起刪除。',
    removeBody: `確認後將移除這組${labels.noun}，其他內容不會改變。`,
    confirmRemoveLabel: `確認刪除${labels.noun}`,
    cancelRemoveLabel: `保留${labels.noun}`,
    movedAnnouncement: (from, to, total) => `已將第 ${from} 個${labels.noun}移至第 ${to} 個，共 ${total} 個。`,
  };
}
