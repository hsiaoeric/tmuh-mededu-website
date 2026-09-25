import { useEffect, useId, useState, type RefObject } from 'react';
import { useSite } from '@/app/site';
import { useOptionalAdminAuth } from '@/admin/auth';
import { StatusBadge, type AdminStatus } from '@/admin/AdminFeedback';
import { AdminDialog } from '@/admin/AdminOverlays';
import type { CmsAdminRevision } from '@/admin/repository';
import type { Json } from '@/content/database.types';
import { formatAdminTimestamp } from './formatAdminTimestamp';
import { diffPayloads, formatChangePath, type PayloadChange } from './payloadDiff';
import { diffText } from './textDiff';
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
  /** Opens straight into the side-by-side view, comparing the editor with this extra version. */
  readonly compareWith?: CompareSource;
};

/** A version to compare that is not a saved revision, such as an autosaved edit. */
export type CompareSource = { readonly id: string; readonly label: string; readonly payload: Json };

/** Every revision of the document, newest first, each summarised against the one before it. */
export function RevisionHistoryDialog({ open, workspace, triggerRef, onClose, compareWith }: RevisionHistoryDialogProps) {
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

  const [view, setView] = useState<'timeline' | 'compare'>('timeline');
  useEffect(() => {
    if (open) setView(compareWith === undefined ? 'timeline' : 'compare');
  }, [compareWith, open]);
  const tabId = useId();
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
      <div className="admin-history-tabs" role="tablist" aria-label={isZh ? '檢視方式' : 'View'}>
        <button type="button" role="tab" id={`${tabId}-timeline`} aria-selected={view === 'timeline'} aria-controls={`${tabId}-panel`} onClick={() => setView('timeline')}>{isZh ? '時間軸' : 'Timeline'}</button>
        <button type="button" role="tab" id={`${tabId}-compare`} aria-selected={view === 'compare'} aria-controls={`${tabId}-panel`} onClick={() => setView('compare')}>{isZh ? '並排比較' : 'Side by side'}</button>
      </div>
      <div id={`${tabId}-panel`} role="tabpanel" aria-labelledby={`${tabId}-${view}`}>
      {view === 'compare' ? <RevisionCompare key={compareWith?.id ?? 'revisions'} workspace={workspace} revisions={revisions} statusLabel={statusLabel} extra={compareWith} /> : (
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
      )}
      </div>
    </AdminDialog>
  );
}

const COMPARE_LIMIT = 200;
const EDITING = 'editing';

function valueText(value: Json | undefined): string {
  if (value === undefined) return '';
  return typeof value === 'string' ? value : JSON.stringify(value, null, 1);
}

/** One side of a changed value, with the characters that differ from the other side marked. */
function DiffCell({ before, after, side }: { readonly before: string; readonly after: string; readonly side: 'before' | 'after' }) {
  const own = side === 'before' ? before : after;
  if (own === '') return <div className="admin-compare-cell" data-empty>—</div>;
  const other = side === 'before' ? after : before;
  if (other === '') return <div className="admin-compare-cell" data-side={side}>{side === 'before' ? <del>{own}</del> : <ins>{own}</ins>}</div>;
  return (
    <div className="admin-compare-cell" data-side={side}>
      {diffText(before, after).map((segment, index) => {
        if (segment.kind === 'same') return <span key={index}>{segment.text}</span>;
        if (segment.kind === 'removed') return side === 'before' ? <del key={index}>{segment.text}</del> : null;
        return side === 'after' ? <ins key={index}>{segment.text}</ins> : null;
      })}
    </div>
  );
}

/** Any two versions, or the unsaved editor text, compared field by field in two columns. */
function RevisionCompare({ workspace, revisions, statusLabel, extra }: {
  readonly workspace: DocumentWorkspace;
  readonly revisions: readonly CmsAdminRevision[];
  readonly statusLabel: (status: CmsAdminRevision['status']) => string;
  readonly extra?: CompareSource;
}) {
  const { isZh } = useSite();
  const editing = workspace.actionableRevision === null ? undefined : parseJson(workspace.editorText);
  const sources = [
    ...(extra === undefined ? [] : [extra]),
    ...(editing === undefined ? [] : [{ id: EDITING, label: isZh ? '目前編輯中（含未儲存）' : 'Editing now (incl. unsaved)', payload: editing }]),
    ...revisions.map((revision) => ({ id: revision.id as string, label: `${isZh ? '版本' : 'v'} ${revision.version} · ${statusLabel(revision.status)}`, payload: revision.payload })),
  ];
  const published = revisions.find((revision) => revision.status === 'published');
  const [newerId, setNewerId] = useState(sources[0]?.id ?? '');
  // Against an extra version (an autosave), the natural question is how it differs from the editor.
  const [olderId, setOlderId] = useState(extra !== undefined && editing !== undefined ? EDITING : (published?.id ?? sources[1]?.id ?? sources[0]?.id ?? ''));
  const older = sources.find((source) => source.id === olderId);
  const newer = sources.find((source) => source.id === newerId);
  const changes = older === undefined || newer === undefined ? [] : diffPayloads(older.payload, newer.payload);
  const picker = (label: string, value: string, onChange: (id: string) => void) => (
    <label className="admin-compare-pick">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {sources.map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}
      </select>
    </label>
  );
  return (
    <div className="admin-compare">
      <div className="admin-compare-head">
        {picker(isZh ? '比較基準' : 'From', olderId, setOlderId)}
        {picker(isZh ? '比較對象' : 'To', newerId, setNewerId)}
      </div>
      {changes.length === 0 ? <p className="admin-history-note">{isZh ? '兩個版本內容相同。' : 'The two versions are identical.'}</p> : (
        <>
          <p className="admin-history-note">{isZh ? `共 ${changes.length} 處不同` : `${changes.length} difference${changes.length === 1 ? '' : 's'}`}</p>
          <ol className="admin-compare-rows">
            {changes.slice(0, COMPARE_LIMIT).map((change) => {
              const before = valueText(change.kind === 'added' ? undefined : change.before);
              const after = valueText(change.kind === 'removed' ? undefined : change.after);
              return (
                <li key={change.path.join('/')}>
                  <span className="admin-publish-change-path">{formatChangePath(change.path, isZh)}</span>
                  <DiffCell before={before} after={after} side="before" />
                  <DiffCell before={before} after={after} side="after" />
                </li>
              );
            })}
          </ol>
          {changes.length > COMPARE_LIMIT ? <p className="admin-history-note">{isZh ? `還有 ${changes.length - COMPARE_LIMIT} 處未列出。` : `${changes.length - COMPARE_LIMIT} more not shown.`}</p> : null}
        </>
      )}
    </div>
  );
}
