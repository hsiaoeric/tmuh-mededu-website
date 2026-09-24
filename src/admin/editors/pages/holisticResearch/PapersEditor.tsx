import { insertPaired, movePaired, nextCollectionId, removePaired, updatePaired } from '@/admin/editors/global/pairedCollections';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { PAPER_COPY } from './collectionCopy';
import { PaperFields } from './PaperFields';
import type { ResearchEditorPartProps, ResearchPaper } from './types';

const EMPTY_PAPER: ResearchPaper = {
  id: '',
  authors: [],
  byline: '',
  journal: '',
  month: '',
  title: '',
  year: '',
};

export function PapersEditor({ payload, issues, onPayloadChange }: ResearchEditorPartProps) {
  const value = { zh: payload.zh.papers, en: payload.en.papers };
  const operation = (result: ReturnType<typeof insertPaired<ResearchPaper>>) => {
    if (!result.ok) return { status: 'unchanged' as const };
    return onPayloadChange({
      zh: { ...payload.zh, papers: result.collection.zh },
      en: { ...payload.en, papers: result.collection.en },
    });
  };
  return (
    <EditorCollection id="holistic-research-papers" title="研究論文" description="論文與院內作者皆依明確編輯順序顯示，不會依年份或月份自動排序。" itemCount={value.zh.length} revisionKeys={[value.zh, value.en]} copy={PAPER_COPY}
      onAdd={() => {
        const id = nextCollectionId('new-research-paper', [...value.zh.map((row) => row.id), ...value.en.map((row) => row.id)]);
        return operation(insertPaired(value, { index: value.zh.length, rows: { zh: { ...EMPTY_PAPER, id }, en: { ...EMPTY_PAPER, id } } }));
      }}
      onMove={(fromIndex, toIndex) => operation(movePaired(value, { fromIndex, toIndex }))}
      onRemove={(index) => operation(removePaired(value, { index }))}
      renderItem={(index) => {
        const zh = value.zh[index];
        const en = value.en[index];
        if (zh === undefined || en === undefined) return null;
        return <PaperFields index={index} rows={{ zh, en }} issues={issues} onChange={(rows) => operation(updatePaired(value, { index, rows }))} />;
      }}
    />
  );
}
