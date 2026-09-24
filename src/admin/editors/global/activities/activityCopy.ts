import type { EditorCollectionCopy } from '../ui/EditorCollection';
import type { ActivityScope } from './activityTypes';

type ActivityScopeCopy = {
  readonly title: string;
  readonly description: string;
  readonly pairLabel: (position: number) => string;
  readonly collection: EditorCollectionCopy;
};

function collectionCopy(name: string): EditorCollectionCopy {
  return {
    addLabel: `新增${name}`,
    emptyTitle: `尚無${name}`,
    emptyDescription: `新增第一筆${name}後，繁體中文與英文內容會在此成對顯示。`,
    itemLabel: (position, total) => `${name}第 ${position} 項，共 ${total} 項`,
    moveUpLabel: (position) => `上移${name}第 ${position} 項`,
    moveDownLabel: (position) => `下移${name}第 ${position} 項`,
    removeLabel: (position) => `刪除${name}第 ${position} 項`,
    removeTitle: (position) => `刪除${name}第 ${position} 項？`,
    removeDescription: '繁體中文與英文活動會一併刪除。',
    removeBody: '確認後將刪除這組雙語活動；其他活動與另一個活動範圍不受影響。',
    confirmRemoveLabel: '確認刪除',
    cancelRemoveLabel: '保留活動',
    movedAnnouncement: (from, to, total) => `已將${name}第 ${from} 項移至第 ${to} 項，共 ${total} 項。`,
  };
}

export const ACTIVITY_SCOPE_COPY: Readonly<Record<ActivityScope, ActivityScopeCopy>> = {
  department: {
    title: '教學部活動',
    description: '維護教學部首頁顯示的活動順序與雙語內容。',
    pairLabel: (position) => `教學部活動第 ${position} 項雙語內容`,
    collection: collectionCopy('教學部活動'),
  },
  holistic: {
    title: '全人照護活動',
    description: '維護全人照護中心顯示的活動順序與雙語內容。',
    pairLabel: (position) => `全人照護活動第 ${position} 項雙語內容`,
    collection: collectionCopy('全人照護活動'),
  },
};
