import type { StructuredEditorCommitResult, StructuredEditorIssueSummary } from '@/admin/editors/shared';
import { insertPaired, movePaired, removePaired, updatePaired, type PairedCollectionResult, type PairedRows } from '@/admin/editors/global/pairedCollections';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { collectionCopy } from './collectionCopy';
import { EbmBilingualTextField } from './EbmFields';
import type { CourseGroup, CourseRow, LocaleKey } from './types';

const EMPTY_ROW: CourseRow = { name: '', detail: '' };

type CourseRowsEditorProps = {
  readonly groupIndex: number;
  readonly groups: PairedRows<CourseGroup>;
  readonly issues: readonly StructuredEditorIssueSummary[];
  readonly onChange: (groups: PairedRows<CourseGroup>) => StructuredEditorCommitResult;
};

export function CourseRowsEditor({ groupIndex, groups, issues, onChange }: CourseRowsEditorProps) {
  const collection = { zh: groups.zh.rows, en: groups.en.rows };
  const commit = (result: PairedCollectionResult<CourseRow>): StructuredEditorCommitResult => {
    if (!result.ok) return { status: 'unchanged' };
    return onChange({ zh: { ...groups.zh, rows: result.collection.zh }, en: { ...groups.en, rows: result.collection.en } });
  };
  return (
    <EditorCollection
      id={`ebm-course-group-${groupIndex}-rows`}
      title={`課程群組 ${groupIndex + 1} 課程列`}
      itemCount={collection.zh.length}
      revisionKeys={[collection.zh, collection.en]}
      copy={collectionCopy({ noun: '課程列', add: '新增課程列', empty: '尚無課程列' })}
      onAdd={() => commit(insertPaired(collection, { index: collection.zh.length, rows: { zh: EMPTY_ROW, en: EMPTY_ROW } }))}
      onMove={(fromIndex, toIndex) => commit(movePaired(collection, { fromIndex, toIndex }))}
      onRemove={(index) => commit(removePaired(collection, { index }))}
      renderItem={(index) => {
        const zh = collection.zh[index];
        const en = collection.en[index];
        if (zh === undefined || en === undefined) return null;
        const change = (locale: LocaleKey, field: keyof CourseRow, value: string) => commit(updatePaired(collection, { index, rows: { zh: locale === 'zh' ? { ...zh, [field]: value } : zh, en: locale === 'en' ? { ...en, [field]: value } : en } }));
        return (
          <div className="admin-stack">
            <EbmBilingualTextField label={`課程群組 ${groupIndex + 1} 課程 ${index + 1} 名稱`} path={['courseGroups', groupIndex, 'rows', index, 'name']} zh={zh.name} en={en.name} issues={issues} onChange={(locale, value) => change(locale, 'name', value)} />
            <EbmBilingualTextField label={`課程群組 ${groupIndex + 1} 課程 ${index + 1} 說明`} path={['courseGroups', groupIndex, 'rows', index, 'detail']} zh={zh.detail} en={en.detail} issues={issues} onChange={(locale, value) => change(locale, 'detail', value)} />
          </div>
        );
      }}
    />
  );
}
