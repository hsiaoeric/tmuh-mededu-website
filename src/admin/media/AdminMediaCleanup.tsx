import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useSite } from '@/app/site';
import { useAdminProtectedAccess } from '@/admin/auth';
import { AdminButton } from '@/admin/AdminButton';
import { InlineNotice } from '@/admin/AdminFeedback';
import { ConfirmDialog } from '@/admin/AdminOverlays';
import type { Json } from '@/content/database.types';
import type { DraftMediaReference } from '@/content/media';
import { useAdminMediaOwnershipScope } from './AdminMediaOwnershipProvider';
import { deriveDraftDeleteGuard } from './deletionGuard';
import { draftMediaClaimsFor } from './draftMediaClaims';
import { draftMediaOwnershipFor } from './draftMediaOwnership';
import { settleResultOperation } from './draftMediaOperation';
import type { DraftMediaClient } from './types';
import type { DraftMediaFailure } from './types';
import { draftMediaFailureMessage } from './mediaFeedback';

type AdminMediaCleanupProps = {
  readonly editorText: string;
  readonly savedDraftPayload: Json | null;
  readonly client: DraftMediaClient;
};

type CleanupReferenceProps = AdminMediaCleanupProps & {
  readonly reference: DraftMediaReference;
  readonly onOperationStart: () => void;
  readonly onDeleted: (reference: DraftMediaReference) => void;
};

type CleanupStatus = 'idle' | 'removing';

function CleanupReference({
  reference,
  editorText,
  savedDraftPayload,
  client,
  onOperationStart,
  onDeleted,
}: CleanupReferenceProps): ReactElement {
  const { isZh } = useSite();
  const { mutationsAllowed } = useAdminProtectedAccess();
  const ownershipScope = useAdminMediaOwnershipScope();
  const ownership = draftMediaOwnershipFor(ownershipScope);
  const claims = draftMediaClaimsFor(ownershipScope);
  const [status, setStatus] = useState<CleanupStatus>('idle');
  const [failure, setFailure] = useState<DraftMediaFailure | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DraftMediaReference | null>(null);
  const activeRef = useRef<AbortController | null>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const removing = status === 'removing';
  const failureMessage = failure === null
    ? null
    : draftMediaFailureMessage(failure, 'cleanup', isZh ? 'zh' : 'en');
  useEffect(() => () => {
    activeRef.current?.abort();
    activeRef.current = null;
  }, []);
  const guard = deriveDraftDeleteGuard({ claims, editorText, savedDraftPayload, reference });
  const referenced = guard.referencedByEditor || guard.referencedBySavedDraft;
  const referenceCopy = guard.referencedByEditor && guard.referencedBySavedDraft
    ? (isZh ? '仍被目前編輯內容與已儲存草稿引用' : 'Still referenced by the editor and saved draft')
    : guard.referencedByEditor
      ? (isZh ? '仍被目前編輯內容引用' : 'Still referenced by the editor')
      : guard.referencedBySavedDraft
        ? (isZh ? '仍被已儲存草稿引用' : 'Still referenced by the saved draft')
        : (isZh ? '未被目前內容引用，可安全刪除' : 'Not referenced and safe to delete');

  return (
    <li className="admin-media-cleanup-item">
      <div><code className="admin-break">{reference.path}</code><p>{referenceCopy}</p></div>
      <AdminButton
        ref={deleteTriggerRef}
        variant="warning"
        disabled={!mutationsAllowed || referenced || removing}
        loading={removing}
        onClick={() => {
          if (!mutationsAllowed) return;
          setPendingDelete(reference);
        }}
      >
        {failureMessage === null
          ? (isZh ? '刪除未使用的上傳' : 'Delete unused upload')
          : (isZh ? '重試刪除' : 'Retry deletion')}
      </AdminButton>
      {failureMessage === null ? null : (
        <InlineNotice status="error" title={failureMessage} />
      )}
      <ConfirmDialog
        open={pendingDelete !== null}
        warning
        dismissible={!removing}
        confirming={removing}
        title={isZh ? '永久刪除這個上傳？' : 'Permanently delete this upload?'}
        description={isZh
          ? '這會從 Storage 永久刪除檔案，且無法復原。'
          : 'This permanently deletes the file from Storage and cannot be undone.'}
        body={isZh
          ? `確認要永久刪除 ${pendingDelete?.path ?? ''}？`
          : `Confirm permanently deleting ${pendingDelete?.path ?? ''}?`}
        closeLabel={isZh ? '關閉對話框' : 'Close dialog'}
        cancelLabel={isZh ? '保留檔案' : 'Keep file'}
        confirmLabel={isZh ? '永久刪除' : 'Permanently delete'}
        triggerRef={deleteTriggerRef}
        onClose={() => {
          if (!removing) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete === null || activeRef.current !== null) return;
          if (!mutationsAllowed || pendingDelete.path !== reference.path) {
            setPendingDelete(null);
            return;
          }
          const latestGuard = deriveDraftDeleteGuard({
            claims, editorText, savedDraftPayload, reference: pendingDelete,
          });
          if (latestGuard.referencedByEditor || latestGuard.referencedBySavedDraft) {
            setPendingDelete(null);
            return;
          }
          const controller = new AbortController();
          activeRef.current = controller;
          onOperationStart();
          setFailure(null);
          setStatus('removing');
          void settleResultOperation(
            () => client.delete(pendingDelete, latestGuard, controller.signal),
            controller.signal,
          ).then((result) => {
            if (controller.signal.aborted || activeRef.current !== controller) return;
            activeRef.current = null;
            setStatus('idle');
            setPendingDelete(null);
            if (result.ok) {
              onDeleted(pendingDelete);
              ownership.forget(pendingDelete);
              return;
            }
            if (result.failure.kind !== 'aborted') setFailure(result.failure);
          });
        }}
      />
    </li>
  );
}

export function AdminMediaCleanup({
  editorText,
  savedDraftPayload,
  client,
}: AdminMediaCleanupProps): ReactElement | null {
  const { isZh } = useSite();
  const ownershipScope = useAdminMediaOwnershipScope();
  const ownership = draftMediaOwnershipFor(ownershipScope);
  const claims = draftMediaClaimsFor(ownershipScope);
  const [unresolved, setUnresolved] = useState(ownership.snapshot());
  const [deletedReference, setDeletedReference] = useState<DraftMediaReference | null>(null);
  const [, setClaimsRevision] = useState(0);

  useEffect(() => {
    setUnresolved(ownership.snapshot());
    return ownership.subscribe(setUnresolved);
  }, [ownership]);

  useEffect(() => claims.subscribe(() => {
    setClaimsRevision((revision) => revision + 1);
  }), [claims]);

  if (unresolved.length === 0 && deletedReference === null) return null;

  return (
    <section className="admin-media-cleanup" aria-labelledby="admin-media-cleanup-title">
      <h3 id="admin-media-cleanup-title">{isZh ? '待清理上傳' : 'Uploads awaiting cleanup'}</h3>
      {deletedReference === null ? null : (
        <InlineNotice
          status="success"
          title={isZh ? '未使用的上傳已永久刪除。' : 'Unused upload permanently deleted.'}
        >
          <code className="admin-break">{deletedReference.path}</code>
        </InlineNotice>
      )}
      <ul>
        {unresolved.map((reference) => (
          <CleanupReference
            key={reference.path}
            reference={reference}
            editorText={editorText}
            savedDraftPayload={savedDraftPayload}
            client={client}
            onOperationStart={() => setDeletedReference(null)}
            onDeleted={setDeletedReference}
          />
        ))}
      </ul>
    </section>
  );
}
