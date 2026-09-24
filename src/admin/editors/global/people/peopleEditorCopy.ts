import type { EditorCollectionCopy } from '../ui/EditorCollection';

export function peopleCollectionCopy(isZh: boolean, kind: 'group' | 'person'): EditorCollectionCopy {
  const group = kind === 'group';
  const nounZh = group ? '中心群組' : '人員';
  const nounEn = group ? 'center group' : 'person';
  return {
    addLabel: isZh ? `新增${nounZh}` : `Add ${nounEn}`,
    emptyTitle: isZh ? `尚無${nounZh}` : `No ${group ? 'center groups' : 'people'} yet`,
    emptyDescription: isZh
      ? `建立第一個中英文配對${nounZh}。`
      : `Create the first paired Chinese and English ${nounEn}.`,
    itemLabel: (position, total) => isZh
      ? `${nounZh} ${position}，共 ${total} ${group ? '組' : '位'}`
      : `${nounEn} ${position} of ${total}`,
    moveUpLabel: (position) => isZh ? `上移第 ${position} ${group ? '個中心群組' : '位人員'}` : `Move ${nounEn} ${position} up`,
    moveDownLabel: (position) => isZh ? `下移第 ${position} ${group ? '個中心群組' : '位人員'}` : `Move ${nounEn} ${position} down`,
    removeLabel: (position) => isZh ? `刪除第 ${position} ${group ? '個中心群組' : '位人員'}` : `Delete ${nounEn} ${position}`,
    removeTitle: (position) => isZh ? `刪除第 ${position} ${nounZh}？` : `Delete ${nounEn} ${position}?`,
    removeDescription: isZh ? '繁體中文與英文資料會一併刪除。' : 'Chinese and English payload rows will be deleted together.',
    removeBody: isZh ? '只會刪除目前內容列，不會刪除 Storage 檔案。' : 'Only this payload row is deleted. Storage objects are not deleted.',
    confirmRemoveLabel: isZh ? `確認刪除${nounZh}` : `Delete ${nounEn}`,
    cancelRemoveLabel: isZh ? `保留${nounZh}` : `Keep ${nounEn}`,
    movedAnnouncement: (from, to, total) => isZh
      ? `已將第 ${from} ${group ? '個' : '位'}${nounZh}移至第 ${to} ${group ? '個' : '位'}，共 ${total} ${group ? '組' : '位'}。`
      : `Moved ${nounEn} ${from} to ${to} of ${total}.`,
  };
}
