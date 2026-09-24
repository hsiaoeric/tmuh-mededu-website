import type { StructuredEditorCommit, StructuredEditorCommitResult, StructuredEditorIssueSummary } from '@/admin/editors/shared';
import { insertPaired, movePaired, removePaired, updatePaired, type PairedCollection, type PairedCollectionResult } from '@/admin/editors/global/pairedCollections';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { collectionCopy } from './collectionCopy';
import { EbmBilingualTextField } from './EbmFields';
import type { Award, EbmPayload, LocaleKey } from './types';

type AwardKey = 'awardsLit' | 'awardsClin' | 'awardsTrans';
const TRACKS = [
  ['awardsLit', 'lit', '文獻查證組'],
  ['awardsClin', 'clin', '臨床應用組'],
  ['awardsTrans', 'trans', '知識轉譯組'],
] as const satisfies readonly (readonly [AwardKey, string, string])[];
const EMPTY_AWARD: Award = { sess: '', award: '' };

type AwardsEditorProps = {
  readonly payload: EbmPayload;
  readonly issues: readonly StructuredEditorIssueSummary[];
  readonly onChange: StructuredEditorCommit<EbmPayload>;
};

function withNote(row: Award, note: string): Award {
  return note === ''
    ? { sess: row.sess, award: row.award }
    : { ...row, note };
}

export function AwardsEditor({ payload, issues, onChange }: AwardsEditorProps) {
  const commit = (key: AwardKey, result: PairedCollectionResult<Award>): StructuredEditorCommitResult => {
    if (!result.ok) return { status: 'unchanged' };
    return onChange({ zh: { ...payload.zh, [key]: result.collection.zh }, en: { ...payload.en, [key]: result.collection.en } });
  };
  const track = (key: AwardKey, id: string, label: string) => {
    const collection: PairedCollection<Award> = { zh: payload.zh[key], en: payload.en[key] };
    return (
      <EditorCollection
        key={key}
        id={`ebm-awards-${id}`}
        title={label}
        itemCount={collection.zh.length}
        revisionKeys={[collection.zh, collection.en]}
        copy={collectionCopy({ noun: `${label}獎項`, add: `新增${label}獎項`, empty: `${label}尚無獎項` })}
        onAdd={() => commit(key, insertPaired(collection, { index: collection.zh.length, rows: { zh: EMPTY_AWARD, en: EMPTY_AWARD } }))}
        onMove={(fromIndex, toIndex) => commit(key, movePaired(collection, { fromIndex, toIndex }))}
        onRemove={(index) => commit(key, removePaired(collection, { index }))}
        renderItem={(index) => {
          const zh = collection.zh[index];
          const en = collection.en[index];
          if (zh === undefined || en === undefined) return null;
          const change = (locale: LocaleKey, field: 'sess' | 'award' | 'note', value: string) => commit(key, updatePaired(collection, { index, rows: { zh: locale === 'zh' ? (field === 'note' ? withNote(zh, value) : { ...zh, [field]: value }) : zh, en: locale === 'en' ? (field === 'note' ? withNote(en, value) : { ...en, [field]: value }) : en } }));
          return (
            <div className="admin-stack">
              <EbmBilingualTextField label={`${label} ${index + 1} 屆別`} path={[key, index, 'sess']} zh={zh.sess} en={en.sess} issues={issues} onChange={(locale, value) => change(locale, 'sess', value)} />
              <EbmBilingualTextField label={`${label} ${index + 1} 獎項`} path={[key, index, 'award']} zh={zh.award} en={en.award} issues={issues} onChange={(locale, value) => change(locale, 'award', value)} />
              <EbmBilingualTextField label={`${label} ${index + 1} 備註`} path={[key, index, 'note']} zh={zh.note ?? ''} en={en.note ?? ''} multiline issues={issues} onChange={(locale, value) => change(locale, 'note', value)} />
            </div>
          );
        }}
      />
    );
  };
  return <EditorSection id="ebm-awards-section" title="競賽獎項" description="三個獎項組別各自保持雙語配對；清空備註會移除選填欄位。">{TRACKS.map(([key, id, label]) => track(key, id, label))}</EditorSection>;
}
