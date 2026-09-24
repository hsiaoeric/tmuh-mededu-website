import type { EditorCollectionCopy } from '@/admin/editors/global/ui/EditorCollection';

type CollectionNouns = {
  readonly item: string;
  readonly empty: string;
  readonly paired: string;
};

export function holisticCollectionCopy(nouns: CollectionNouns): EditorCollectionCopy {
  return {
    addLabel: `新增 ${nouns.item}`,
    emptyTitle: `尚無${nouns.empty}`,
    emptyDescription: `新增第一組繁體中文與英文${nouns.paired}。`,
    itemLabel: (position, total) => `${nouns.item} ${position}，共 ${total} 組`,
    moveUpLabel: (position) => `上移第 ${position} 個 ${nouns.item}`,
    moveDownLabel: (position) => `下移第 ${position} 個 ${nouns.item}`,
    removeLabel: (position) => `刪除第 ${position} 個 ${nouns.item}`,
    removeTitle: (position) => `刪除第 ${position} 個 ${nouns.item}？`,
    removeDescription: '繁體中文與英文資料會一起刪除。',
    removeBody: `確認後將移除這組${nouns.paired}，其他資料不會改變。`,
    confirmRemoveLabel: `確認刪除 ${nouns.item}`,
    cancelRemoveLabel: `保留 ${nouns.item}`,
    movedAnnouncement: (from, to, total) => `已將第 ${from} 個 ${nouns.item}移至第 ${to} 個，共 ${total} 個。`,
  };
}
