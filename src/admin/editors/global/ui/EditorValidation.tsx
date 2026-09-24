import type { MouseEvent } from 'react';
import { AdminButton } from '@/admin/AdminButton';
import { InlineNotice } from '@/admin/AdminFeedback';
import type { StructuredEditorIssueSummary as GlobalEditorIssueSummary } from '@/admin/editors/shared';

type EditorValidationProps = {
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly title: string;
  readonly firstInvalidLabel: string;
};

function focusField(fieldId: string): void {
  document.getElementById(fieldId)?.focus();
}

export function EditorValidation({ issues, title, firstInvalidLabel }: EditorValidationProps) {
  const firstIssue = issues[0];
  if (firstIssue === undefined) return null;
  const followIssueLink = (event: MouseEvent<HTMLAnchorElement>, fieldId: string) => {
    event.preventDefault();
    focusField(fieldId);
  };
  return (
    <div className="admin-editor-validation">
      <InlineNotice
        status="error"
        title={title}
        action={<AdminButton variant="quiet" onClick={() => focusField(firstIssue.fieldId)}>{firstInvalidLabel}</AdminButton>}
      >
        <span className="admin-editor-validation-list">
          {issues.map((summary, index) => (
            <a key={`${summary.fieldId}-${index}`} href={`#${summary.fieldId}`} onClick={(event) => followIssueLink(event, summary.fieldId)}>
              {summary.message}
            </a>
          ))}
        </span>
      </InlineNotice>
    </div>
  );
}
