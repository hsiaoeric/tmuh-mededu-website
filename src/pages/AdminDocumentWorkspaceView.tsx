import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '@/app/site';
import { useAdminProtectedAccess } from '@/admin/auth';
import { AdminButton } from '@/admin/AdminButton';
import { AdminAppShell, AdminPageHeader, AdminSaveStatus, AdminToolbar, type AdminSaveState } from '@/admin/AdminShell';
import { AdminWorkspaceDescription, isPageWorkspaceDescriptionKind } from '@/admin/AdminWorkspaceDescription';
import { AdminWorkspaceTitle } from '@/admin/AdminWorkspaceTitle';
import { InlineNotice, StatePanel, StatusBadge } from '@/admin/AdminFeedback';
import { ConfirmDialog } from '@/admin/AdminOverlays';
import { CMS_DOCUMENT_METADATA, getAdminDocumentFailureCopy, getWorkspaceCapabilities, isWorkspaceDirty, pendingDocumentMutation, type DocumentMutation, type DocumentOperationState, type DocumentWorkspace } from '@/admin/documents';
import { assertNever } from '@/admin/documents/assertNever';
import { DirtyNavigationGuard, type DocumentWorkspaceController } from '@/admin/workflows';
import type { CmsDocumentKind } from '@/content/contracts/kinds';
import { AdminWorkspaceEditorRegion } from './AdminWorkspaceEditorRegion';

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

function revisionStatusText(
  status: NonNullable<DocumentWorkspace['actionableRevision']>['status'],
  isZh: boolean,
): string {
  switch (status) {
    case 'draft': return isZh ? '草稿' : 'Draft';
    case 'published': return isZh ? '已發布' : 'Published';
    case 'archived': return isZh ? '已封存' : 'Archived';
    default: return assertNever(status, 'document revision status');
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
  const { isZh } = useSite();
  const { mutationsAllowed } = useAdminProtectedAccess();
  const metadata = CMS_DOCUMENT_METADATA[kind];
  const [confirmation, setConfirmation] = useState<Exclude<DocumentMutation, 'save'> | null>(null);
  const dashboardLinkRef = useRef<HTMLAnchorElement>(null);
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

  return (
    <AdminAppShell eyebrow={`ADMIN / ${kind.toUpperCase()}`} title={title} status={<AdminSaveStatus state={operationSaveState(workspace.operation)}>{saveStatusText(workspace, isZh)}</AdminSaveStatus>} showcaseNavigation={false}>
      <DirtyNavigationGuard dirty={hasActionableRevision && isWorkspaceDirty(workspace)} pendingOperation={pendingDocumentMutation(workspace.operation)} />
      <div className="admin-content-limiter admin-workspace-page">
        <AdminPageHeader
          eyebrow={`CONTENT / ${kind}`}
          title={title}
          description={description}
          descriptionLang={isZh ? 'zh-Hant' : 'en'}
          actions={<Link ref={dashboardLinkRef} className="admin-button" data-variant="secondary" to="/admin">{isZh ? '返回總覽' : 'Back to dashboard'}</Link>}
        />
        <AdminToolbar label={isZh ? '文件作業' : 'Document actions'}>
          {hasActionableRevision ? <>
            <StatusBadge status={publishedRevision === undefined ? 'warning' : 'success'}>{publishedRevision === undefined ? (isZh ? '尚未發布' : 'Unpublished') : (isZh ? '已發布' : 'Published')}</StatusBadge>
            <span>{isZh ? `版本 ${workspace.actionableRevision.version}` : `Version ${workspace.actionableRevision.version}`}</span>
            <span>{isZh ? `編輯權杖 ${workspace.expectedEditVersion}` : `Edit token ${workspace.expectedEditVersion}`}</span>
            <span>{revisionStatusText(workspace.actionableRevision.status, isZh)}</span>
          </> : <>
            <StatusBadge status="disabled">{referenceRevision === null ? (isZh ? '無目前修訂' : 'No current revision') : (isZh ? '已封存' : 'Archived')}</StatusBadge>
            {referenceRevision === null ? null : <span>{isZh ? `封存版本 ${referenceRevision.version}` : `Archived version ${referenceRevision.version}`}</span>}
            <span>{isZh ? '無目前修訂' : 'No current revision'}</span>
          </>}
          <span className="admin-toolbar-spacer" />
          {hasActionableRevision ? <>
            <AdminButton variant="secondary" loading={workspace.operation.status === 'archiving'} disabled={!mutationsAllowed || !capabilities.canArchive} onClick={(event) => { confirmationReturnFocusRef.current = event.currentTarget; setConfirmation('archive'); }}>{isZh ? '封存' : 'Archive'}</AdminButton>
            <AdminButton variant="secondary" loading={workspace.operation.status === 'publishing'} disabled={!mutationsAllowed || !capabilities.canPublish} onClick={(event) => { confirmationReturnFocusRef.current = event.currentTarget; setConfirmation('publish'); }}>{isZh ? '發佈' : 'Publish'}</AdminButton>
            <AdminButton loading={workspace.operation.status === 'saving'} disabled={!mutationsAllowed || !capabilities.canSave} onClick={() => void controller.save()}>{isZh ? '儲存草稿' : 'Save draft'}</AdminButton>
          </> : null}
        </AdminToolbar>
        <OperationNotice mutationsAllowed={mutationsAllowed} workspace={workspace} onRecoverConflict={() => void controller.recoverConflict()} />
        {hasActionableRevision ? (
          <AdminWorkspaceEditorRegion workspace={workspace} kind={kind} onChange={controller.setEditorText} />
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
        cancelLabel={isZh ? '取消' : 'Cancel'}
        closeLabel={isZh ? '關閉確認對話框' : 'Close confirmation dialog'}
        onConfirm={() => {
          const operation = confirmation;
          confirmationReturnFocusRef.current = dashboardLinkRef.current;
          setConfirmation(null);
          if (operation === 'publish') void controller.publish();
          if (operation === 'archive') void controller.archive();
        }}
        onClose={() => setConfirmation(null)}
      />
    </AdminAppShell>
  );
}
