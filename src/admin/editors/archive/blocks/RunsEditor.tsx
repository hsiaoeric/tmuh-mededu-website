import { useState } from 'react';
import { AdminButton, AdminIconButton } from '@/admin/AdminButton';
import { AdminTextarea } from '@/admin/AdminFields';
import { fieldIdForStructuredEditorIssuePath } from '@/admin/editors/shared';
import type { ArchiveCommitResult, ArchiveIssues, JsonPath } from '../archiveTypes';
import { HrefField, issueFor, useIsZh } from '../fields';
import { withOptional } from '../localizedValue';
import { emptyRun, insertAt, moveItem, removeAt, replaceAt, type EditableRun } from './blockModel';

type RunsEditorProps = {
  /** JSON path of the runs array. */
  readonly path: JsonPath;
  /** Names the paragraph or list item the runs belong to, for accessible labels. */
  readonly label: string;
  readonly runs: readonly EditableRun[];
  readonly issues: ArchiveIssues;
  readonly lang: string;
  readonly onChange: (runs: readonly EditableRun[]) => ArchiveCommitResult;
};

function rowsFor(text: string): number {
  return Math.min(10, Math.max(2, text.split('\n').length, Math.ceil(text.length / 60)));
}

type RunFieldsProps = {
  readonly path: JsonPath;
  readonly label: string;
  readonly run: EditableRun;
  readonly index: number;
  readonly count: number;
  readonly issues: ArchiveIssues;
  readonly lang: string;
  readonly onChange: (run: EditableRun) => ArchiveCommitResult;
  readonly onMove: (to: number) => void;
  readonly onRemove: () => void;
};

function RunFields({ path, label, run, index, count, issues, lang, onChange, onMove, onRemove }: RunFieldsProps) {
  const isZh = useIsZh();
  const [linkOpen, setLinkOpen] = useState(run.href !== undefined);
  const showLink = linkOpen || run.href !== undefined;
  const position = index + 1;
  const runLabel = count > 1 ? (isZh ? `${label}，第 ${position} 段文字` : `${label}, text run ${position}`) : label;
  return (
    <div className="admin-archive-run" data-run-index={index} data-strong={run.strong === true || undefined} data-linked={run.href !== undefined || undefined}>
      <AdminTextarea
        id={fieldIdForStructuredEditorIssuePath([...path, index, 'text'])}
        label={count > 1 ? (isZh ? `文字 ${position}` : `Text ${position}`) : (isZh ? '文字' : 'Text')}
        aria-label={runLabel}
        error={issueFor([...path, index, 'text'], issues) ?? issueFor([...path, index], issues)}
        value={run.text}
        rows={rowsFor(run.text)}
        lang={lang}
        onChange={(event) => { onChange({ ...run, text: event.currentTarget.value }); }}
      />
      <div className="admin-archive-run-tools" role="group" aria-label={isZh ? `${runLabel}的格式` : `${runLabel} formatting`}>
        <AdminButton
          variant="quiet"
          aria-pressed={run.strong === true}
          aria-label={isZh ? `${runLabel}：粗體` : `${runLabel}: bold`}
          onClick={() => onChange(withOptional(run, 'strong', run.strong === true ? undefined : true))}
        >
          <strong>{isZh ? '粗體' : 'Bold'}</strong>
        </AdminButton>
        <AdminButton
          variant="quiet"
          aria-pressed={showLink}
          aria-label={isZh ? `${runLabel}：連結` : `${runLabel}: link`}
          onClick={() => {
            if (showLink) {
              setLinkOpen(false);
              if (run.href !== undefined) onChange(withOptional(run, 'href', undefined));
            } else {
              setLinkOpen(true);
            }
          }}
        >
          {isZh ? '連結' : 'Link'}
        </AdminButton>
        {count > 1 ? <>
          <AdminIconButton className="admin-editor-move-up" icon="arrowDown" data-run-action="move-up" label={isZh ? `上移${runLabel}` : `Move ${runLabel} up`} disabled={index === 0} onClick={() => onMove(index - 1)} />
          <AdminIconButton icon="arrowDown" data-run-action="move-down" label={isZh ? `下移${runLabel}` : `Move ${runLabel} down`} disabled={index === count - 1} onClick={() => onMove(index + 1)} />
          <AdminIconButton icon="trash" data-run-action="remove" label={isZh ? `刪除${runLabel}` : `Delete ${runLabel}`} onClick={onRemove} />
        </> : null}
      </div>
      {showLink ? (
        <HrefField
          path={[...path, index, 'href']}
          issues={issues}
          label={isZh ? '連結網址' : 'Link URL'}
          accessibleLabel={isZh ? `${runLabel}：連結網址` : `${runLabel}: link URL`}
          required={false}
          allowFile={false}
          value={run.href ?? ''}
          onChange={(href) => onChange(withOptional(run, 'href', href === '' ? undefined : href))}
        />
      ) : null}
    </div>
  );
}

/**
 * Inline text of a paragraph or list item. Most hold one run; a run can be bold or a link, and
 * splitting text into several runs lets part of a sentence link somewhere.
 */
export function RunsEditor({ path, label, runs, issues, lang, onChange }: RunsEditorProps) {
  const isZh = useIsZh();
  return (
    <div className="admin-archive-runs">
      {runs.map((run, index) => (
        <RunFields
          // Runs have no identity of their own; position is the only key there is.
          key={index}
          path={path}
          label={label}
          run={run}
          index={index}
          count={runs.length}
          issues={issues}
          lang={lang}
          onChange={(next) => onChange(replaceAt(runs, index, next))}
          onMove={(to) => onChange(moveItem(runs, index, to))}
          onRemove={() => onChange(removeAt(runs, index))}
        />
      ))}
      <div className="admin-archive-runs-add">
        <AdminButton variant="quiet" icon="plus" onClick={() => onChange(insertAt(runs, runs.length, emptyRun()))}>
          {isZh ? '新增文字片段' : 'Add text run'}
        </AdminButton>
        <span className="admin-field-message">{isZh ? '要讓句子中的一部分加粗或成為連結時，分成多段文字。' : 'Split text into runs to make part of a sentence bold or a link.'}</span>
      </div>
    </div>
  );
}
