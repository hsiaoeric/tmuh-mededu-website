import type {
  StructuredEditorCommitResult as GlobalEditorCommitResult,
  StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';
import { EditorCollection } from '../ui/EditorCollection';
import { EditorTextareaField } from '../ui/EditorFields';
import { addLine, moveLine, removeLine, updateLine } from './newsModel';
import { lineCopy } from './newsCopy';
import type { NewsLocale, NewsMutationResult, NewsPayload, NewsScope } from './newsTypes';

type NewsLinesEditorProps = {
  readonly payload: NewsPayload;
  readonly scope: NewsScope;
  readonly index: number;
  readonly locale: NewsLocale;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onChange: (result: NewsMutationResult) => GlobalEditorCommitResult;
};

export function NewsLinesEditor({ payload, scope, index, locale, issues, onChange }: NewsLinesEditorProps) {
  const row = payload[locale][scope][index];
  if (row === undefined) return null;
  const language = locale === 'zh' ? '繁體中文' : '英文';
  const location = { scope, index, locale } as const;
  return (
    <EditorCollection
      id={`${scope}-${index}-${locale}-lines`}
      title={`${language}內容行`}
      itemCount={row.lines.length}
      revisionKeys={[row.lines]}
      copy={lineCopy(locale, index + 1)}
      onAdd={() => onChange(addLine(payload, location))}
      onMove={(fromIndex, toIndex) => onChange(moveLine(payload, location, fromIndex, toIndex))}
      onRemove={(lineIndex) => onChange(removeLine(payload, location, lineIndex))}
      renderItem={(lineIndex) => (
        <EditorTextareaField
          path={[locale, scope, index, 'lines', lineIndex]}
          issues={issues}
          label={`${language}第 ${lineIndex + 1} 行`}
          rows={3}
          value={row.lines[lineIndex] ?? ''}
          onChange={(event) => onChange(updateLine(payload, { ...location, lineIndex }, event.currentTarget.value))}
        />
      )}
    />
  );
}
