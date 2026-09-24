import type { StructuredEditorCommit, StructuredEditorCommitResult, StructuredEditorIssueSummary } from '@/admin/editors/shared';
import { insertPaired, movePaired, removePaired, updatePaired, type PairedCollectionResult } from '@/admin/editors/global/pairedCollections';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { collectionCopy } from './collectionCopy';
import { EbmBilingualTextField } from './EbmFields';
import type { EbmPayload, LocaleKey, Mission } from './types';

const COPY = collectionCopy({ noun: '任務', add: '新增任務', empty: '尚無任務' });
const EMPTY_MISSION: Mission = { tag: '', title: '', desc: '' };

type MissionsEditorProps = {
  readonly payload: EbmPayload;
  readonly issues: readonly StructuredEditorIssueSummary[];
  readonly onChange: StructuredEditorCommit<EbmPayload>;
};

export function MissionsEditor({ payload, issues, onChange }: MissionsEditorProps) {
  const collection = { zh: payload.zh.missions, en: payload.en.missions };
  const commit = (result: PairedCollectionResult<Mission>): StructuredEditorCommitResult => {
    if (!result.ok) return { status: 'unchanged' };
    return onChange({ zh: { ...payload.zh, missions: result.collection.zh }, en: { ...payload.en, missions: result.collection.en } });
  };
  return (
    <EditorSection id="ebm-missions-section" title="核心任務" description="任務標記、標題與說明會保持繁體中文和英文成對排序。">
      <EditorCollection
        id="ebm-missions"
        title="任務列表"
        itemCount={collection.zh.length}
        revisionKeys={[collection.zh, collection.en]}
        copy={COPY}
        onAdd={() => commit(insertPaired(collection, { index: collection.zh.length, rows: { zh: EMPTY_MISSION, en: EMPTY_MISSION } }))}
        onMove={(fromIndex, toIndex) => commit(movePaired(collection, { fromIndex, toIndex }))}
        onRemove={(index) => commit(removePaired(collection, { index }))}
        renderItem={(index) => {
          const zh = collection.zh[index];
          const en = collection.en[index];
          if (zh === undefined || en === undefined) return null;
          const change = (locale: LocaleKey, field: keyof Mission, value: string) => commit(updatePaired(collection, { index, rows: { zh: locale === 'zh' ? { ...zh, [field]: value } : zh, en: locale === 'en' ? { ...en, [field]: value } : en } }));
          return (
            <div className="admin-stack">
              <EbmBilingualTextField label={`任務 ${index + 1} 標記`} path={['missions', index, 'tag']} zh={zh.tag} en={en.tag} issues={issues} onChange={(locale, value) => change(locale, 'tag', value)} />
              <EbmBilingualTextField label={`任務 ${index + 1} 標題`} path={['missions', index, 'title']} zh={zh.title} en={en.title} issues={issues} onChange={(locale, value) => change(locale, 'title', value)} />
              <EbmBilingualTextField label={`任務 ${index + 1} 說明`} path={['missions', index, 'desc']} zh={zh.desc} en={en.desc} multiline issues={issues} onChange={(locale, value) => change(locale, 'desc', value)} />
            </div>
          );
        }}
      />
    </EditorSection>
  );
}
