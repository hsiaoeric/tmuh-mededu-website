import type { StructuredEditorCommit, StructuredEditorCommitResult, StructuredEditorIssueSummary } from '@/admin/editors/shared';
import { insertPaired, movePaired, removePaired, updatePaired, type PairedCollectionResult, type PairedRows } from '@/admin/editors/global/pairedCollections';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { collectionCopy } from './collectionCopy';
import { EbmBilingualTextField } from './EbmFields';
import { StageItemsEditor } from './StageItemsEditor';
import type { EbmPayload, LocaleKey, Stage } from './types';

const EMPTY_STAGE: Stage = { phase: '', name: '', years: '', items: [] };
const COPY = collectionCopy({ noun: '發展階段', add: '新增發展階段', empty: '尚無發展階段' });

type StagesEditorProps = {
  readonly payload: EbmPayload;
  readonly issues: readonly StructuredEditorIssueSummary[];
  readonly onChange: StructuredEditorCommit<EbmPayload>;
};

export function StagesEditor({ payload, issues, onChange }: StagesEditorProps) {
  const collection = { zh: payload.zh.stages, en: payload.en.stages };
  const commit = (result: PairedCollectionResult<Stage>): StructuredEditorCommitResult => {
    if (!result.ok) return { status: 'unchanged' };
    return onChange({ zh: { ...payload.zh, stages: result.collection.zh }, en: { ...payload.en, stages: result.collection.en } });
  };
  const update = (index: number, rows: PairedRows<Stage>) => commit(updatePaired(collection, { index, rows }));
  return (
    <EditorSection id="ebm-stages-section" title="發展歷程" description="階段及其項目均以相同索引同步維護，不會自動排序。">
      <EditorCollection
        id="ebm-stages"
        title="發展階段"
        itemCount={collection.zh.length}
        revisionKeys={[collection.zh, collection.en]}
        copy={COPY}
        onAdd={() => commit(insertPaired(collection, { index: collection.zh.length, rows: { zh: EMPTY_STAGE, en: EMPTY_STAGE } }))}
        onMove={(fromIndex, toIndex) => commit(movePaired(collection, { fromIndex, toIndex }))}
        onRemove={(index) => commit(removePaired(collection, { index }))}
        renderItem={(index) => {
          const zh = collection.zh[index];
          const en = collection.en[index];
          if (zh === undefined || en === undefined) return null;
          const rows = { zh, en };
          const change = (locale: LocaleKey, field: 'phase' | 'name' | 'years', value: string) => update(index, { ...rows, [locale]: { ...rows[locale], [field]: value } });
          return (
            <div className="admin-stack">
              <EbmBilingualTextField label={`階段 ${index + 1} 階段標記`} path={['stages', index, 'phase']} zh={zh.phase} en={en.phase} issues={issues} onChange={(locale, value) => change(locale, 'phase', value)} />
              <EbmBilingualTextField label={`階段 ${index + 1} 名稱`} path={['stages', index, 'name']} zh={zh.name} en={en.name} issues={issues} onChange={(locale, value) => change(locale, 'name', value)} />
              <EbmBilingualTextField label={`階段 ${index + 1} 年期`} path={['stages', index, 'years']} zh={zh.years} en={en.years} issues={issues} onChange={(locale, value) => change(locale, 'years', value)} />
              <StageItemsEditor stageIndex={index} rows={rows} issues={issues} onChange={(nextRows) => update(index, nextRows)} />
            </div>
          );
        }}
      />
    </EditorSection>
  );
}
