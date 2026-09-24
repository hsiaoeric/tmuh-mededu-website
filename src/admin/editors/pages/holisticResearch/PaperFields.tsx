import { EditorTextField } from '@/admin/editors/global/ui/EditorFields';
import { ResearchNumberField } from './ResearchFields';
import { AuthorsEditor } from './AuthorsEditor';
import type { ResearchCommitResult, ResearchIssues, ResearchPaper } from './types';

type PaperRows = { readonly zh: ResearchPaper; readonly en: ResearchPaper };
type PaperFieldsProps = {
  readonly index: number;
  readonly rows: PaperRows;
  readonly issues: ResearchIssues;
  readonly onChange: (rows: PaperRows) => ResearchCommitResult;
};

type TextKey = 'title' | 'journal' | 'byline';

export function PaperFields({ index, rows, issues, onChange }: PaperFieldsProps) {
  const changeShared = <K extends TextKey | 'year' | 'month'>(key: K, value: ResearchPaper[K]) => (
    onChange({ zh: { ...rows.zh, [key]: value }, en: { ...rows.en, [key]: value } })
  );
  const fields = () => {
    const prefix = `論文 ${index + 1}`;
    const textField = (key: TextKey, label: string) => (
      <EditorTextField label={`${prefix} 共用${label}`} path={['zh', 'papers', index, key]} issues={issues} value={rows.zh[key]} onChange={(event) => changeShared(key, event.currentTarget.value)} />
    );
    return (
      <div className="admin-field-grid">
        {textField('title', '標題')}
        {textField('journal', '期刊')}
        {textField('byline', '作者列')}
        <ResearchNumberField label={`${prefix} 共用出版年份`} path={['zh', 'papers', index, 'year']} issues={issues} value={rows.zh.year} onChange={(year) => changeShared('year', year)} />
        <ResearchNumberField label={`${prefix} 共用出版月份`} path={['zh', 'papers', index, 'month']} issues={issues} value={rows.zh.month} onChange={(month) => changeShared('month', month)} />
      </div>
    );
  };
  return (
    <div className="admin-stack">
      {fields()}
      <AuthorsEditor paperIndex={index} rows={rows} issues={issues} onChange={onChange} />
    </div>
  );
}
