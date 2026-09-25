import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSite } from '@/app/site';
import { useAdminProtectedAccess, useOptionalAdminAuth } from '@/admin/auth';
import { AdminButton, AdminIconButton } from '@/admin/AdminButton';
import { AdminAppShell, AdminPageHeader, AdminSaveStatus, type AdminSaveState } from '@/admin/AdminShell';
import { AdminWorkspaceDescription, isPageWorkspaceDescriptionKind } from '@/admin/AdminWorkspaceDescription';
import { AdminWorkspaceTitle } from '@/admin/AdminWorkspaceTitle';
import { InlineNotice, StatePanel, StatusBadge } from '@/admin/AdminFeedback';
import { ConfirmDialog } from '@/admin/AdminOverlays';
import { AdminIcon } from '@/admin/AdminIcon';
import { announceDocumentsChanged } from '@/admin/documentDraftStatus';
import { AdminPopover } from '@/admin/AdminPopover';
import { ChangedFieldNavigator } from '@/admin/ChangedFieldNavigator';
import { changedFieldIds } from '@/admin/documents/changedFields';
import { CMS_DOCUMENT_METADATA, formatAdminTimestamp, getAdminDocumentFailureCopy, getWorkspaceCapabilities, isWorkspaceDirty, pendingDocumentMutation, type DocumentMutation, type DocumentOperationState, type DocumentWorkspace } from '@/admin/documents';
import { assertNever } from '@/admin/documents/assertNever';
import { publicDocumentHref } from '@/admin/documents/publicLocation';
import { PublishChanges } from '@/admin/documents/PublishChanges';
import { RevisionHistoryDialog } from '@/admin/documents/RevisionHistory';
import { useAutosave } from '@/admin/documents/useAutosave';
import { useEditorHistory } from '@/admin/documents/useEditorHistory';
import type { Json } from '@/content/database.types';
import { isPreviewableKind } from '@/admin/preview/previewKinds';
import { Icon } from '@/ui/Icon';
import { DirtyNavigationGuard, type DocumentWorkspaceController } from '@/admin/workflows';
import type { CmsDocumentKind } from '@/content/contracts/kinds';
import { AdminWorkspaceEditorRegion, DocumentTechnicalDetails } from './AdminWorkspaceEditorRegion';

type AdminDocumentWorkspaceViewProps = {
  readonly kind: CmsDocumentKind;
  readonly controller: DocumentWorkspaceController;
  readonly workspace: DocumentWorkspace;
};

export function operationSaveState(operation: DocumentOperationState): AdminSaveState {
  switch (operation.status) {
    case 'saving':
    case 'publishing':
    case 'archiving':
    case 'recovering':
      return 'saving';
    case 'error':
    case 'conflict':
      return 'error';
    case 'idle':
    case 'saved':
      return 'ready';
    default:
      return assertNever(operation, 'document operation state');
  }
}

function saveStatusText(workspace: DocumentWorkspace, isZh: boolean): string {
  switch (workspace.operation.status) {
    case 'saving': return isZh ? '正在儲存變更' : 'Saving changes';
    case 'publishing': return isZh ? '正在發布內容' : 'Publishing content';
    case 'archiving': return isZh ? '正在封存內容' : 'Archiving content';
    case 'recovering': return isZh ? '正在重新載入最新版本' : 'Reloading the latest revision';
    case 'saved':
      switch (workspace.operation.operation) {
        case 'save': return isZh ? '草稿已儲存' : 'Draft saved';
        case 'publish': return isZh ? '內容已發布' : 'Content published';
        case 'archive': return isZh ? '內容已封存' : 'Content archived';
        default: return assertNever(workspace.operation.operation, 'completed document mutation');
      }
    case 'error': return isZh ? '內容作業失敗' : 'Content operation failed';
    case 'conflict': return isZh ? '偵測到版本衝突' : 'Version conflict detected';
    case 'idle': return isWorkspaceDirty(workspace)
      ? (isZh ? '尚有未儲存變更' : 'Unsaved changes')
      : (isZh ? '內容已同步' : 'Content synchronized');
  }
}

function OperationNotice({
  mutationsAllowed,
  workspace,
  onRecoverConflict,
}: {
  readonly mutationsAllowed: boolean;
  readonly workspace: DocumentWorkspace;
  readonly onRecoverConflict: () => void;
}) {
  const { isZh } = useSite();
  if (workspace.operation.status === 'saved') {
    switch (workspace.operation.operation) {
      case 'save':
        return <InlineNotice status="success" title={isZh ? '草稿已儲存' : 'Draft saved'} lang={isZh ? 'zh-Hant' : 'en'}>{isZh ? '目前編輯器內容已寫入新的修訂版本。' : 'The current editor content was written to a new revision.'}</InlineNotice>;
      case 'publish':
        return <InlineNotice status="success" title={isZh ? '內容已發布' : 'Content published'} lang={isZh ? 'zh-Hant' : 'en'}>{isZh ? '目前修訂版本已成為公開網站使用的內容。' : 'The current revision is now used by the public site.'}</InlineNotice>;
      case 'archive':
        return <InlineNotice status="success" title={isZh ? '內容已封存' : 'Content archived'} lang={isZh ? 'zh-Hant' : 'en'}>{isZh ? '此修訂版本已封存，不再作為目前內容使用。' : 'This revision was archived and is no longer used as current content.'}</InlineNotice>;
      default:
        return assertNever(workspace.operation.operation, 'completed document mutation');
    }
  }
  if (workspace.operation.status === 'error' || workspace.operation.status === 'conflict') {
    const copy = getAdminDocumentFailureCopy(workspace.operation.failure, isZh);
    return <InlineNotice status={workspace.operation.status === 'conflict' ? 'warning' : 'error'} title={copy.title} lang={isZh ? 'zh-Hant' : 'en'} action={workspace.operation.status === 'conflict' ? <AdminButton variant="secondary" icon="refresh" disabled={!mutationsAllowed} onClick={onRecoverConflict}>{isZh ? '重新載入並保留編輯內容' : 'Reload latest and keep edits'}</AdminButton> : undefined}>{copy.description}</InlineNotice>;
  }
  return null;
}

export function AdminDocumentWorkspaceView({ kind, controller, workspace }: AdminDocumentWorkspaceViewProps) {
  const { isZh, lang } = useSite();
  const { mutationsAllowed } = useAdminProtectedAccess();
  const metadata = CMS_DOCUMENT_METADATA[kind];
  const [confirmation, setConfirmation] = useState<Exclude<DocumentMutation, 'save'> | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const openPreview = useCallback(() => setPreviewing(true), []);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [compareAutosave, setCompareAutosave] = useState(false);
  // Whichever button opened the history (status badges or the autosave notice) gets focus back.
  const historyTriggerRef = useRef<HTMLElement | null>(null);
  const auth = useOptionalAdminAuth();
  const authState = auth?.state;
  const userId = authState !== undefined && (authState.status === 'authorized' || authState.status === 'reauthorizing') ? authState.user.id : null;
  const autosave = useAutosave(workspace, userId);
  const autosavePayload = useMemo(() => {
    if (autosave.offer === null) return undefined;
    try {
      return JSON.parse(autosave.offer.editorText) as Json;
    } catch {
      return undefined;
    }
  }, [autosave.offer]);
  const previewable = isPreviewableKind(kind);
  const confirmationReturnFocusRef = useRef<HTMLElement | null>(null);
  const label = isZh ? metadata.label.zh : metadata.label.en;
  const description = isZh && isPageWorkspaceDescriptionKind(kind)
    ? <AdminWorkspaceDescription kind={kind} />
    : (isZh ? metadata.description.zh : metadata.description.en);
  const capabilities = getWorkspaceCapabilities(workspace);
  const publishedRevision = workspace.revisions.find((revision) => revision.status === 'published');
  const referenceRevision = workspace.referenceRevision;
  const hasActionableRevision = workspace.actionableRevision !== null;
  const title = <AdminWorkspaceTitle isZh={isZh} kind={kind} label={label} />;
  const canSave = mutationsAllowed && capabilities.canSave;
  const changedIds = useMemo(
    () => changedFieldIds(publishedRevision?.payload ?? null, workspace.editorText),
    [publishedRevision, workspace.editorText],
  );
  const history = useEditorHistory(workspace.editorText, controller.setEditorText, workspace.document.id);
  const historyRef = useRef(history);
  historyRef.current = history;
  const editable = mutationsAllowed && hasActionableRevision;

  // Undo outside a text field reaches document-wide history; inside one, the field's own undo runs.
  useEffect(() => {
    if (!editable) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      const redo = (key === 'z' && event.shiftKey) || (key === 'y' && !event.shiftKey);
      const undo = key === 'z' && !event.shiftKey;
      if (!undo && !redo) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'))) return;
      event.preventDefault();
      if (undo) historyRef.current.undo();
      else historyRef.current.redo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editable]);
  const saveRef = useRef(controller.save);
  saveRef.current = controller.save;

  const operationStatus = workspace.operation.status;
  useEffect(() => {
    if (operationStatus === 'saved') announceDocumentsChanged();
  }, [operationStatus]);

  useEffect(() => {
    if (!canSave) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 's' || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      event.preventDefault();
      void saveRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canSave]);

  return (
    <AdminAppShell eyebrow={`ADMIN / ${kind.toUpperCase()}`} title={title} status={null} showcaseNavigation={false}>
      <DirtyNavigationGuard dirty={hasActionableRevision && isWorkspaceDirty(workspace)} pendingOperation={pendingDocumentMutation(workspace.operation)} />
      <div className="admin-content-limiter admin-content-limiter-wide admin-workspace-page">
        <AdminPageHeader
          eyebrow={isZh ? '內容編輯' : 'CONTENT'}
          title={title}
          description={description}
          descriptionLang={isZh ? 'zh-Hant' : 'en'}
        />
        <div className="admin-action-bar" role="toolbar" aria-label={isZh ? '文件作業' : 'Document actions'}>
          <div className="admin-action-bar-status">
            <button type="button" className="admin-history-trigger" aria-haspopup="dialog" title={isZh ? '查看編輯紀錄' : 'View edit history'} onClick={(event) => { historyTriggerRef.current = event.currentTarget; setHistoryOpen(true); }}>
              {hasActionableRevision ? <>
                <StatusBadge status={publishedRevision === undefined ? 'warning' : 'success'}>{publishedRevision === undefined ? (isZh ? '尚未發布' : 'Unpublished') : (isZh ? '已發布' : 'Published')}</StatusBadge>
                {workspace.actionableRevision.status === 'draft' ? <StatusBadge status="info">{isZh ? `草稿 · 版本 ${workspace.actionableRevision.version}` : `Draft · version ${workspace.actionableRevision.version}`}</StatusBadge> : null}
              </> : <>
                <StatusBadge status="disabled">{referenceRevision === null ? (isZh ? '無目前修訂' : 'No current revision') : (isZh ? '已封存' : 'Archived')}</StatusBadge>
                {referenceRevision === null ? null : <span>{isZh ? `封存版本 ${referenceRevision.version}` : `Archived version ${referenceRevision.version}`}</span>}
              </>}
              <AdminIcon name="history" />
              <span className="sr-only">{isZh ? '（查看編輯紀錄）' : '(view edit history)'}</span>
            </button>
            <AdminSaveStatus state={operationSaveState(workspace.operation)}>{saveStatusText(workspace, isZh)}</AdminSaveStatus>
            <span className="admin-action-bar-meta">{isZh ? '更新於 ' : 'Updated '}<time dateTime={workspace.document.updatedAt}>{formatAdminTimestamp(workspace.document.updatedAt, lang)}</time></span>
          </div>
          <div className="admin-action-bar-actions">
            {hasActionableRevision ? <ChangedFieldNavigator count={changedIds.length} /> : null}
            {hasActionableRevision ? (
              <div className="admin-undo-group" role="group" aria-label={isZh ? '復原與重做' : 'Undo and redo'}>
                <AdminIconButton icon="undo" label={isZh ? '復原（Ctrl/⌘ + Z）' : 'Undo (Ctrl/⌘ + Z)'} aria-keyshortcuts="Control+Z Meta+Z" disabled={!editable || !history.canUndo} onClick={history.undo} />
                <AdminIconButton icon="redo" label={isZh ? '重做（Ctrl/⌘ + Shift + Z）' : 'Redo (Ctrl/⌘ + Shift + Z)'} aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y" disabled={!editable || !history.canRedo} onClick={history.redo} />
              </div>
            ) : null}
            {hasActionableRevision && previewable ? (
              <AdminButton variant="quiet" icon="image" aria-pressed={previewing} onClick={() => setPreviewing((current) => !current)}>
                {previewing ? (isZh ? '關閉預覽' : 'Close preview') : (isZh ? '預覽' : 'Preview')}
              </AdminButton>
            ) : null}
            {hasActionableRevision ? (
              <a className="admin-icon-button" href={publicDocumentHref(kind)} target="_blank" rel="noreferrer" aria-label={isZh ? '在網站上查看（開新分頁）' : 'View on site (new tab)'} title={isZh ? '在網站上查看' : 'View on site'}>
                <Icon name="arrowUpRight" />
              </a>
            ) : null}
            <AdminPopover icon="more" label={isZh ? '更多文件作業' : 'More document actions'}>
              {(close, trigger) => <>
                <DocumentTechnicalDetails workspace={workspace} kind={kind} />
                {hasActionableRevision ? (
                  <div className="admin-popover-danger">
                    <AdminButton variant="warning" icon="trash" loading={workspace.operation.status === 'archiving'} disabled={!mutationsAllowed || !capabilities.canArchive} onClick={() => { confirmationReturnFocusRef.current = trigger.current; close(); setConfirmation('archive'); }}>{isZh ? '封存' : 'Archive'}</AdminButton>
                    <p>{isZh ? '封存後此文件不再作為公開內容，請僅在確定要下架時使用。' : 'Archiving removes this document from the public site. Use it only to take content down.'}</p>
                  </div>
                ) : null}
              </>}
            </AdminPopover>
            {hasActionableRevision ? <>
              <span className="admin-action-bar-divider" aria-hidden="true" />
              <AdminButton variant="secondary" loading={workspace.operation.status === 'publishing'} disabled={!mutationsAllowed || !capabilities.canPublish} onClick={(event) => { confirmationReturnFocusRef.current = event.currentTarget; setConfirmation('publish'); }}>{isZh ? '發佈' : 'Publish'}</AdminButton>
              <AdminButton variant="primary" loading={workspace.operation.status === 'saving'} disabled={!canSave} aria-keyshortcuts="Control+S Meta+S" title={isZh ? '儲存草稿（Ctrl/⌘ + S）' : 'Save draft (Ctrl/⌘ + S)'} onClick={() => void controller.save()}>{isZh ? '儲存草稿' : 'Save draft'}</AdminButton>
            </> : null}
          </div>
        </div>
        <OperationNotice mutationsAllowed={mutationsAllowed} workspace={workspace} onRecoverConflict={() => void controller.recoverConflict()} />
        {autosave.offer === null ? null : (
          <InlineNotice
            status={autosave.stale ? 'warning' : 'info'}
            title={isZh ? `找到尚未儲存的編輯（${formatAdminTimestamp(autosave.offer.savedAt, lang)}）` : `Unsaved edits found (${formatAdminTimestamp(autosave.offer.savedAt, lang)})`}
            lang={isZh ? 'zh-Hant' : 'en'}
            action={<span className="admin-cluster">
              <AdminButton variant="primary" icon="refresh" onClick={() => { const text = autosave.accept(); if (text !== null) history.change(text); }}>{isZh ? '還原' : 'Restore'}</AdminButton>
              <AdminButton variant="secondary" onClick={(event) => { historyTriggerRef.current = event.currentTarget; setCompareAutosave(true); setHistoryOpen(true); }}>{isZh ? '比較' : 'Compare'}</AdminButton>
              <AdminButton variant="quiet" onClick={autosave.discard}>{isZh ? '捨棄' : 'Discard'}</AdminButton>
            </span>}
          >
            {autosave.stale
              ? (isZh ? '這些編輯根據較舊的草稿版本；還原後儲存時仍會檢查版本，不會覆蓋他人的變更。' : 'These edits were made on an older draft; saving after restoring still checks versions, so no one else’s changes are overwritten.')
              : (isZh ? '上次離開前的編輯保留在這個瀏覽器中，可還原後繼續。' : 'Edits from your last visit were kept in this browser; restore them to continue.')}
          </InlineNotice>
        )}
        {autosave.otherTab ? (
          <InlineNotice status="warning" title={isZh ? '這份文件正在另一個分頁中編輯' : 'This document is being edited in another tab'} lang={isZh ? 'zh-Hant' : 'en'}>
            {isZh ? '兩個分頁各自儲存時，較晚的一方會遇到版本衝突。建議只在一個分頁編輯。' : 'If both tabs save, the later one will hit a version conflict. Edit in one tab only.'}
          </InlineNotice>
        ) : null}
        {hasActionableRevision ? (
          <AdminWorkspaceEditorRegion workspace={workspace} kind={kind} onChange={history.change} previewing={previewable && previewing} changedIds={changedIds} onRequestPreview={previewable ? openPreview : undefined} />
        ) : (
          <section className="admin-surface">
            <StatePanel
              kind="disabled"
              title={referenceRevision === null
                ? (isZh ? '目前沒有可編輯的修訂版本' : 'No actionable revision exists')
                : (isZh ? '目前僅保留封存修訂版本' : 'Only archived revisions remain')}
              description={referenceRevision === null
                ? (isZh ? '此文件目前沒有可供編輯、發布或封存的修訂版本。' : 'This document has no revision available to edit, publish, or archive.')
                : (isZh
                  ? <>封存版本 {referenceRevision.version}（<code>{referenceRevision.id}</code>）仍安全保留作為內容參考；目前沒有可供編輯或發布的修訂版本。</>
                  : <>Archived version {referenceRevision.version} (<code>{referenceRevision.id}</code>) remains safely preserved as the content reference. No revision is currently available to edit or publish.</>)}
              descriptionLang={isZh ? 'zh-Hant' : 'en'}
            />
          </section>
        )}
      </div>
      <ConfirmDialog
        open={confirmation !== null}
        triggerRef={confirmationReturnFocusRef}
        warning={confirmation === 'archive'}
        title={confirmation === 'archive' ? (isZh ? '確認封存文件？' : 'Archive this document?') : (isZh ? '確認發布文件？' : 'Publish this document?')}
        description={confirmation === 'archive' ? (isZh ? '封存後，這份文件將不再作為目前內容使用。' : 'The document will no longer be used as current content after archival.') : (isZh ? '目前修訂版本將成為公開網站使用的內容。' : 'The current revision will become the content used by the public site.')}
        confirmLabel={confirmation === 'archive' ? (isZh ? '確認封存' : 'Archive') : (isZh ? '確認發佈' : 'Publish')}
        details={confirmation === 'publish' && workspace.actionableRevision !== null
          ? <PublishChanges published={publishedRevision?.payload ?? null} next={workspace.actionableRevision.payload} isZh={isZh} />
          : undefined}
        cancelLabel={isZh ? '取消' : 'Cancel'}
        closeLabel={isZh ? '關閉確認對話框' : 'Close confirmation dialog'}
        onConfirm={() => {
          const operation = confirmation;
          // The trigger may be disabled once the operation lands, so return focus to the stable page heading.
          confirmationReturnFocusRef.current = globalThis.document.querySelector<HTMLElement>('.admin-page-header h1');
          setConfirmation(null);
          if (operation === 'publish') void controller.publish();
          if (operation === 'archive') void controller.archive();
        }}
        onClose={() => setConfirmation(null)}
      />
      <RevisionHistoryDialog
        open={historyOpen}
        workspace={workspace}
        triggerRef={historyTriggerRef}
        compareWith={compareAutosave && autosavePayload !== undefined && autosave.offer !== null
          ? { id: 'autosave', label: isZh ? `瀏覽器暫存（${formatAdminTimestamp(autosave.offer.savedAt, lang)}）` : `Browser copy (${formatAdminTimestamp(autosave.offer.savedAt, lang)})`, payload: autosavePayload }
          : undefined}
        onClose={() => { setHistoryOpen(false); setCompareAutosave(false); }}
      />
    </AdminAppShell>
  );
}
