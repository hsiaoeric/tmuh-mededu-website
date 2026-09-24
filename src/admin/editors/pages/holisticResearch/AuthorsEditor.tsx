import { insertPaired, movePaired, removePaired, updatePaired } from '@/admin/editors/global/pairedCollections';
import { EditorBilingualFields, EditorTextField } from '@/admin/editors/global/ui/EditorFields';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { authorCopy } from './collectionCopy';
import type { ResearchIssues, ResearchPaper, ResearchCommitResult } from './types';

type AuthorsEditorProps = {
  readonly paperIndex: number;
  readonly rows: { readonly zh: ResearchPaper; readonly en: ResearchPaper };
  readonly issues: ResearchIssues;
  readonly onChange: (rows: { readonly zh: ResearchPaper; readonly en: ResearchPaper }) => ResearchCommitResult;
};

export function AuthorsEditor({ paperIndex, rows, issues, onChange }: AuthorsEditorProps) {
  const value = { zh: rows.zh.authors, en: rows.en.authors };
  const operation = (result: ReturnType<typeof insertPaired<string>>) => {
    if (!result.ok) return { status: 'unchanged' as const };
    return onChange({
      zh: { ...rows.zh, authors: result.collection.zh },
      en: { ...rows.en, authors: result.collection.en },
    });
  };
  const update = (index: number, locale: 'zh' | 'en', text: string) => {
    const zh = value.zh[index];
    const en = value.en[index];
    if (zh === undefined || en === undefined) return { status: 'unchanged' as const };
    return operation(updatePaired(value, { index, rows: locale === 'zh' ? { zh: text, en } : { zh, en: text } }));
  };
  const paperPosition = paperIndex + 1;
  return (
    <EditorCollection id={`holistic-research-paper-${paperPosition}-authors`} title={`論文 ${paperPosition} 作者`} itemCount={value.zh.length} revisionKeys={[value.zh, value.en]} copy={authorCopy(paperPosition)}
      onAdd={() => operation(insertPaired(value, { index: value.zh.length, rows: { zh: '', en: '' } }))}
      onMove={(fromIndex, toIndex) => operation(movePaired(value, { fromIndex, toIndex }))}
      onRemove={(index) => operation(removePaired(value, { index }))}
      renderItem={(index) => {
        const zh = value.zh[index];
        const en = value.en[index];
        if (zh === undefined || en === undefined) return null;
        return (
          <EditorBilingualFields
            label={`論文 ${paperPosition} 作者 ${index + 1}`}
            zh={<EditorTextField label={`論文 ${paperPosition} 作者 ${index + 1}（繁體中文）`} path={['zh', 'papers', paperIndex, 'authors', index]} issues={issues} value={zh} onChange={(event) => update(index, 'zh', event.currentTarget.value)} />}
            en={<EditorTextField label={`Paper ${paperPosition} author ${index + 1} (English)`} path={['en', 'papers', paperIndex, 'authors', index]} issues={issues} value={en} onChange={(event) => update(index, 'en', event.currentTarget.value)} />}
          />
        );
      }}
    />
  );
}
