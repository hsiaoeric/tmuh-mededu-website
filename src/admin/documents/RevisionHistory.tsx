import type { RefObject } from 'react';
import { useSite } from '@/app/site';
import { useOptionalAdminAuth } from '@/admin/auth';
import { StatusBadge, type AdminStatus } from '@/admin/AdminFeedback';
import { AdminDialog } from '@/admin/AdminOverlays';
import type { CmsAdminRevision } from '@/admin/repository';
import type { Json } from '@/content/database.types';
import { formatAdminTimestamp } from './formatAdminTimestamp';
import { diffPayloads, type PayloadChange } from './payloadDiff';
import { PayloadChangeList } from './PublishChanges';
import { isWorkspaceDirty } from './workspaceState';
import type { DocumentWorkspace } from './workspaceTypes';

const VISIBLE_CHANGES = 8;

const STATUS_BADGE: Readonly<Record<CmsAdminRevision['status'], AdminStatus>> = {
  draft: 'info',
  published: 'success',
  archived: 'disabled',
};

function parseJson(text: string): Json | undefined {
  try {
    return JSON.parse(text) as Json;
  } catch {
    return undefined;
  }
}

function ChangeSummary({ changes, isZh, open }: { readonly changes: readonly PayloadChange[]; readonly isZh: boolean; readonly open: boolean }) {
  if (changes.length === 0) return <p className="admin-history-note">{isZh ? '與前一版本內容相同。' : 'Same content as the previous version.'}</p>;
  return (
    <details className="admin-history-changes" open={open}>
      <summary>{isZh ? `變更 ${changes.length} 處` : `${changes.length} change${changes.length === 1 ? '' : 's'}`}</summary>
      <PayloadChangeList changes={changes} isZh={isZh} limit={VISIBLE_CHANGES} />
    </details>
  );
}

type RevisionHistoryDialogProps = {
  readonly open: boolean;
  readonly workspace: DocumentWorkspace;
  readonly triggerRef: RefObject<HTMLElement>;
  readonly onClose: () => void;
};

/** Every revision of the document, newest first, each summarised against the one before it. */
export function RevisionHistoryDialog({ open, workspace, triggerRef, onClose }: RevisionHistoryDialogProps) {
  const { isZh, lang } = useSite();
  const auth = useOptionalAdminAuth();
  const state = auth?.state;
  const currentUserId = state !== undefined && (state.status === 'authorized' || state.status === 'reauthorizing') ? state.user.id : null;
  const revisions = [...workspace.revisions].sort((left, right) => right.version - left.version);
  const actor = (id: string | null) => {
    if (id === null) return isZh ? '系統' : 'System';
    if (id === currentUserId) return isZh ? '你' : 'You';
    return isZh ? `編輯者 ${id.slice(0, 6)}` : `Editor ${id.slice(0, 6)}`;
  };
  const statusLabel = (status: CmsAdminRevision['status']) => {
    switch (status) {
      case 'draft': return isZh ? '草稿' : 'Draft';
      case 'published': return isZh ? '已發布' : 'Published';
      case 'archived': return isZh ? '已封存' : 'Archived';
    }
  };

  const dirty = workspace.actionableRevision !== null && isWorkspaceDirty(workspace);
  const baseline = dirty ? parseJson(workspace.baselineText) : undefined;
  const editing = dirty ? parseJson(workspace.editorText) : undefined;

  return (
    <AdminDialog
      open={open}
      triggerRef={triggerRef}
      title={isZh ? '編輯紀錄' : 'Edit history'}
      description={isZh
        ? '每個版本與前一版本相比的變更。發佈前多次儲存的草稿會合併在同一個版本中。'
        : 'What each version changed from the one before. Repeated draft saves before publishing update the same version.'}
      closeLabel={isZh ? '關閉編輯紀錄' : 'Close edit history'}
      onClose={onClose}
    >
      <ol className="admin-history">
        {dirty ? (
          <li className="admin-history-entry" data-unsaved>
            <header>
              <StatusBadge status="warning">{isZh ? '尚未儲存' : 'Unsaved'}</StatusBadge>
              <span>{isZh ? '目前編輯器中的變更' : 'Changes in the editor now'}</span>
            </header>
            {baseline === undefined || editing === undefined
              ? <p className="admin-history-note">{isZh ? '目前內容無法解析，修正後即可比較。' : 'The current content cannot be parsed; fix it to compare.'}</p>
              : <ChangeSummary changes={diffPayloads(baseline, editing)} isZh={isZh} open />}
          </li>
        ) : null}
        {revisions.map((revision, index) => {
          const previous = revisions[index + 1];
          const isCurrent = revision.id === workspace.actionableRevision?.id;
          return (
            <li key={revision.id} className="admin-history-entry" data-current={isCurrent || undefined}>
              <header>
                <StatusBadge status={STATUS_BADGE[revision.status]}>{`${statusLabel(revision.status)} · ${isZh ? '版本' : 'v'} ${revision.version}`}</StatusBadge>
                {isCurrent ? <span className="admin-history-current">{isZh ? '編輯中' : 'Editing'}</span> : null}
              </header>
              <dl className="admin-history-meta">
                <div><dt>{isZh ? '最後儲存' : 'Last saved'}</dt><dd>{formatAdminTimestamp(revision.updatedAt, lang)} · {actor(revision.updatedBy ?? revision.createdBy)}</dd></div>
                {revision.publishedAt === null ? null : <div><dt>{isZh ? '發布' : 'Published'}</dt><dd>{formatAdminTimestamp(revision.publishedAt, lang)} · {actor(revision.publishedBy)}</dd></div>}
                {revision.archivedAt === null ? null : <div><dt>{isZh ? '封存' : 'Archived'}</dt><dd>{formatAdminTimestamp(revision.archivedAt, lang)} · {actor(revision.archivedBy)}</dd></div>}
              </dl>
              {previous === undefined
                ? <p className="admin-history-note">{isZh ? '最早的版本。' : 'The earliest version.'}</p>
                : <ChangeSummary changes={diffPayloads(previous.payload, revision.payload)} isZh={isZh} open={index === 0 && !dirty} />}
            </li>
          );
        })}
      </ol>
    </AdminDialog>
  );
}
