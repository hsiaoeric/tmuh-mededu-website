import type { MouseEvent } from 'react';
import { AdminButton } from '@/admin/AdminButton';
import { InlineNotice } from '@/admin/AdminFeedback';
import { revealAndFocus } from '@/admin/editors/global/ui/EditorDensity';
import { jumpToEditorElement } from '@/admin/editorOutline';
import { fieldIdForStructuredEditorIssuePath } from '@/admin/editors/shared';
import type { ArchiveIssues, JsonPath } from './archiveTypes';
import { useIsZh } from './fields';

const MAX_LISTED = 12;
const MAX_FRAMES = 20;

/**
 * Focuses the field for an issue once it is rendered. Fields of a closed archive row do not exist
 * until `openPath` opens the row, so this waits a few frames for them to appear.
 */
export function focusIssueField(fieldId: string, path: JsonPath, openPath: (path: JsonPath) => void): void {
  const existing = document.getElementById(fieldId);
  if (existing !== null) {
    if (existing.closest('.admin-main') === null) revealAndFocus(existing);
    else jumpToEditorElement(existing);
    return;
  }
  openPath(path);
  let frames = 0;
  const attempt = () => {
    const element = document.getElementById(fieldId);
    if (element !== null) {
      // Inside the workspace this scrolls the field below the sticky action bar; on its own the
      // editor has no scroll container, so focusing is enough.
      if (element.closest('.admin-main') === null) revealAndFocus(element);
      else jumpToEditorElement(element);
      return;
    }
    frames += 1;
    if (frames < MAX_FRAMES) {
      window.requestAnimationFrame(attempt);
      return;
    }
    // An issue on a whole object (such as a duplicate id list) has no field of its own; go to the
    // nearest enclosing one that has.
    for (let length = path.length - 1; length > 0; length -= 1) {
      const enclosing = document.getElementById(fieldIdForStructuredEditorIssuePath(path.slice(0, length)));
      if (enclosing !== null) {
        focusIssueField(enclosing.id, path.slice(0, length), () => undefined);
        return;
      }
    }
  };
  window.requestAnimationFrame(attempt);
}

type ArchiveValidationProps = {
  readonly issues: ArchiveIssues;
  /** Opens whatever row holds `path` so its field renders. */
  readonly openPath: (path: JsonPath) => void;
};

/** The archive twin of `EditorValidation`: its links also open the collapsed row an issue is in. */
export function ArchiveValidation({ issues, openPath }: ArchiveValidationProps) {
  const isZh = useIsZh();
  const first = issues[0];
  if (first === undefined) return null;
  const follow = (event: MouseEvent<HTMLAnchorElement>, fieldId: string, path: JsonPath) => {
    event.preventDefault();
    focusIssueField(fieldId, path, openPath);
  };
  const listed = issues.slice(0, MAX_LISTED);
  return (
    <div className="admin-editor-validation">
      <InlineNotice
        status="error"
        title={isZh ? `有 ${issues.length} 個欄位需要修正` : `${issues.length} field${issues.length === 1 ? '' : 's'} need attention`}
        action={<AdminButton variant="quiet" onClick={() => focusIssueField(first.fieldId, first.issue.path, openPath)}>{isZh ? '前往第一個問題' : 'Go to the first issue'}</AdminButton>}
      >
        <span className="admin-editor-validation-list">
          {listed.map((summary, index) => (
            <a key={`${summary.fieldId}-${index}`} href={`#${summary.fieldId}`} onClick={(event) => follow(event, summary.fieldId, summary.issue.path)}>
              {summary.message}
            </a>
          ))}
          {issues.length > listed.length ? <span>{isZh ? `還有 ${issues.length - listed.length} 個問題。` : `${issues.length - listed.length} more.`}</span> : null}
        </span>
      </InlineNotice>
    </div>
  );
}
