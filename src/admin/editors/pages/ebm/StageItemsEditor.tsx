import type { StructuredEditorCommitResult, StructuredEditorIssueSummary } from '@/admin/editors/shared';
import { insertPaired, movePaired, removePaired, updatePaired, type PairedCollectionResult, type PairedRows } from '@/admin/editors/global/pairedCollections';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { collectionCopy } from './collectionCopy';
import { EbmBilingualTextField } from './EbmFields';
import type { LocaleKey, Stage } from './types';

type StageItemsEditorProps = {
  readonly stageIndex: number;
  readonly rows: PairedRows<Stage>;
  readonly issues: readonly StructuredEditorIssueSummary[];
  readonly onChange: (rows: PairedRows<Stage>) => StructuredEditorCommitResult;
};

export function StageItemsEditor({ stageIndex, rows, issues, onChange }: StageItemsEditorProps) {
  const collection = { zh: rows.zh.items, en: rows.en.items };
  const commit = (result: PairedCollectionResult<string>): StructuredEditorCommitResult => {
    if (!result.ok) return { status: 'unchanged' };
    return onChange({ zh: { ...rows.zh, items: result.collection.zh }, en: { ...rows.en, items: result.collection.en } });
  };
  return (
    <EditorCollection
      id={`ebm-stage-${stageIndex}-items`}
      title={`階段 ${stageIndex + 1} 項目`}
      itemCount={collection.zh.length}
      revisionKeys={[collection.zh, collection.en]}
      copy={collectionCopy({ noun: '階段項目', add: '新增階段項目', empty: '尚無階段項目' })}
      onAdd={() => commit(insertPaired(collection, { index: collection.zh.length, rows: { zh: '', en: '' } }))}
      onMove={(fromIndex, toIndex) => commit(movePaired(collection, { fromIndex, toIndex }))}
      onRemove={(index) => commit(removePaired(collection, { index }))}
      renderItem={(index) => {
        const zh = collection.zh[index];
        const en = collection.en[index];
        if (zh === undefined || en === undefined) return null;
        const change = (locale: LocaleKey, value: string) => commit(updatePaired(collection, { index, rows: { zh: locale === 'zh' ? value : zh, en: locale === 'en' ? value : en } }));
        return <EbmBilingualTextField label={`階段 ${stageIndex + 1} 項目 ${index + 1}`} path={['stages', stageIndex, 'items', index]} zh={zh} en={en} multiline issues={issues} onChange={change} />;
      }}
    />
  );
}
