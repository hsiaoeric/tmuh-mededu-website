import type { StructuredEditorCommit, StructuredEditorCommitResult, StructuredEditorIssueSummary } from '@/admin/editors/shared';
import { insertPaired, movePaired, removePaired, updatePaired, type PairedCollectionResult, type PairedRows } from '@/admin/editors/global/pairedCollections';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { collectionCopy } from './collectionCopy';
import { CourseRowsEditor } from './CourseRowsEditor';
import { EbmBilingualTextField } from './EbmFields';
import type { CourseGroup, EbmPayload, LocaleKey } from './types';

const EMPTY_GROUP: CourseGroup = { title: '', rows: [] };
const COPY = collectionCopy({ noun: '課程群組', add: '新增課程群組', empty: '尚無課程群組' });

type CourseGroupsEditorProps = {
  readonly payload: EbmPayload;
  readonly issues: readonly StructuredEditorIssueSummary[];
  readonly onChange: StructuredEditorCommit<EbmPayload>;
};

export function CourseGroupsEditor({ payload, issues, onChange }: CourseGroupsEditorProps) {
  const collection = { zh: payload.zh.courseGroups, en: payload.en.courseGroups };
  const commit = (result: PairedCollectionResult<CourseGroup>): StructuredEditorCommitResult => {
    if (!result.ok) return { status: 'unchanged' };
    return onChange({ zh: { ...payload.zh, courseGroups: result.collection.zh }, en: { ...payload.en, courseGroups: result.collection.en } });
  };
  const update = (index: number, rows: PairedRows<CourseGroup>) => commit(updatePaired(collection, { index, rows }));
  return (
    <EditorSection id="ebm-course-groups-section" title="年度訓練課程" description="群組與群組內課程列皆維持雙語位置對應及作者排序。">
      <EditorCollection
        id="ebm-course-groups"
        title="課程群組"
        itemCount={collection.zh.length}
        revisionKeys={[collection.zh, collection.en]}
        copy={COPY}
        onAdd={() => commit(insertPaired(collection, { index: collection.zh.length, rows: { zh: EMPTY_GROUP, en: EMPTY_GROUP } }))}
        onMove={(fromIndex, toIndex) => commit(movePaired(collection, { fromIndex, toIndex }))}
        onRemove={(index) => commit(removePaired(collection, { index }))}
        renderItem={(index) => {
          const zh = collection.zh[index];
          const en = collection.en[index];
          if (zh === undefined || en === undefined) return null;
          const rows = { zh, en };
          const change = (locale: LocaleKey, value: string) => update(index, { ...rows, [locale]: { ...rows[locale], title: value } });
          return (
            <div className="admin-stack">
              <EbmBilingualTextField label={`課程群組 ${index + 1} 標題`} path={['courseGroups', index, 'title']} zh={zh.title} en={en.title} issues={issues} onChange={change} />
              <CourseRowsEditor groupIndex={index} groups={rows} issues={issues} onChange={(nextRows) => update(index, nextRows)} />
            </div>
          );
        }}
      />
    </EditorSection>
  );
}
