import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useSite } from '@/app/site';
import { useAdminProtectedAccess } from '@/admin/auth';
import { AdminMediaPicker } from '@/admin/AdminMedia';
import { ConfirmDialog } from '@/admin/AdminOverlays';
import type { MediaReference } from '@/content/media';
import type { MediaWorkbenchKind, PortraitSlot } from './mediaWorkbenchTypes';
import { useAdminMediaOwnershipScope } from './AdminMediaOwnershipProvider';
import { draftMediaOwnershipFor } from './draftMediaOwnership';
import { changePortraitReference } from './portraitUpdates';
import type { DraftMediaClient } from './types';
import { draftMediaFailureMessage } from './mediaFeedback';
import { useDraftMedia } from './useDraftMedia';
import { useMediaReferencePreview } from './useMediaReferencePreview';
import { usePortraitProposal } from './usePortraitProposal';

type AdminMediaPortraitFieldProps = {
  readonly kind: MediaWorkbenchKind;
  readonly editorText: string;
  readonly editorRevision: number;
  readonly onEditorTextChange: (editorText: string) => void;
  readonly slot: PortraitSlot;
  readonly client: DraftMediaClient;
};

type PendingUnlink = {
  readonly reference: MediaReference;
  readonly slot: PortraitSlot;
};

type PendingUpload = {
  readonly editorText: string;
  readonly editorRevision: number;
};

export function AdminMediaPortraitField({
  kind,
  editorText,
  editorRevision,
  onEditorTextChange,
  slot,
  client,
}: AdminMediaPortraitFieldProps): ReactElement {
  const { isZh } = useSite();
  const { mutationsAllowed } = useAdminProtectedAccess();
  const ownershipScope = useAdminMediaOwnershipScope();
  const ownership = draftMediaOwnershipFor(ownershipScope);
  const preview = useMediaReferencePreview(slot.reference);
  const unlinkTriggerRef = useRef<HTMLButtonElement>(null);
  const unlinkingRef = useRef(false);
  const [pendingUnlink, setPendingUnlink] = useState<PendingUnlink | null>(null);
  const pendingUpload = useRef<PendingUpload | null>(null);
  const handledReferencePath = useRef<string | null>(null);
  const media = useDraftMedia({
    client,
    ownershipScope,
    initialReference: slot.reference?.kind === 'draft' ? slot.reference : undefined,
    initialPreviewUrl: preview.status === 'ready' ? preview.url : undefined,
    initialPreviewExpiresAt: preview.status === 'ready'
      ? preview.expiresAt ?? undefined
      : undefined,
  });
  const proposal = usePortraitProposal({
    editorText,
    editorRevision,
    slot,
    ownership,
    discardAdoption: media.unlink,
  });

  useEffect(() => {
    const uploaded = media.state.reference;
    if (
      pendingUpload.current === null
      || media.state.status !== 'ready'
      || uploaded === null
      || handledReferencePath.current === uploaded.path
    ) return;

    handledReferencePath.current = uploaded.path;
    const source = pendingUpload.current;
    pendingUpload.current = null;
    if (editorRevision !== source.editorRevision || editorText !== source.editorText) {
      ownership.reopen(uploaded);
      media.unlink();
      return;
    }
    const changed = changePortraitReference({
      kind,
      editorText,
      slot,
      reference: uploaded,
    });
    if (!changed.ok) {
      ownership.reopen(uploaded);
      media.unlink();
      return;
    }
    proposal.propose({
      kind: 'adopt',
      proposedEditorText: changed.editorText,
      reference: uploaded,
      startingRevision: source.editorRevision,
    });
    onEditorTextChange(changed.editorText);
  }, [editorRevision, editorText, kind, media, onEditorTextChange, ownership, proposal, slot]);

  const busy = media.state.status === 'uploading' || media.state.status === 'signing';
  const adoptedReference = media.state.reference !== null
    && media.state.reference.path === slot.reference?.path;
  const adoptingUpload = pendingUpload.current !== null && media.state.status === 'ready';
  const mediaOwnsDisplay = adoptingUpload || adoptedReference;
  const persistedPreviewUrl = preview.status === 'ready' ? preview.url : undefined;
  const currentPreviewUrl = adoptedReference
    ? persistedPreviewUrl ?? media.state.previewUrl ?? undefined
    : mediaOwnsDisplay
      ? media.state.previewUrl ?? persistedPreviewUrl
      : persistedPreviewUrl;
  const currentReference = mediaOwnsDisplay ? media.state.reference ?? slot.reference : slot.reference;
  const language = isZh ? 'zh' : 'en';
  const slotLanguage = slot.locale === 'zh' ? 'zh-Hant' : 'en';
  const failureMessage = media.state.failure === null || media.state.failureOperation === null
    ? null
    : draftMediaFailureMessage(media.state.failure, media.state.failureOperation, language);
  const previewFailureMessage = currentReference !== null && preview.status === 'error'
    ? (isZh
      ? '已連結照片的預覽目前無法使用。請稍後再試；照片連結未變更。'
      : 'The linked portrait preview is unavailable. Try again later; the link is unchanged.')
    : null;
  const successMessage = proposal.outcome === 'adopted'
    ? (isZh ? '照片已連結至此欄位。' : 'Portrait linked to this field.')
    : proposal.outcome === 'unlinked'
      ? (isZh ? '已取消照片連結。' : 'Portrait unlinked.')
      : null;
  const feedback = failureMessage !== null
    ? { status: 'error' as const, message: failureMessage }
    : previewFailureMessage !== null
      ? { status: 'error' as const, message: previewFailureMessage }
      : successMessage !== null
        ? { status: 'success' as const, message: successMessage }
        : undefined;
  const closeUnlink = (): void => {
    unlinkingRef.current = false;
    setPendingUnlink(null);
  };
  const confirmUnlink = (): void => {
    if (pendingUnlink === null || unlinkingRef.current) return;
    unlinkingRef.current = true;
    if (
      !mutationsAllowed
      || currentReference === null
      || currentReference.path !== pendingUnlink.reference.path
      || slot.key !== pendingUnlink.slot.key
      || slot.slotKind !== pendingUnlink.slot.slotKind
      || slot.personName !== pendingUnlink.slot.personName
    ) {
      closeUnlink();
      return;
    }
    const changed = changePortraitReference({ kind, editorText, slot, reference: null });
    if (!changed.ok) {
      closeUnlink();
      return;
    }
    proposal.propose({
      kind: 'unlink',
      proposedEditorText: changed.editorText,
      reference: currentReference,
      startingRevision: editorRevision,
    });
    media.unlink();
    onEditorTextChange(changed.editorText);
    closeUnlink();
  };

  return (
    <div className="admin-media-slot" data-slot-key={slot.key}>
      <AdminMediaPicker
        label={slot.personName}
        labelLang={slotLanguage}
        description={`${slot.locale === 'zh' ? '中文' : 'English'} / ${slot.contextLabel}`}
        descriptionLang={slotLanguage}
        fileName={currentReference?.path}
        previewUrl={currentPreviewUrl}
        altText={slot.personName}
        uploading={busy}
        disabled={!mutationsAllowed}
        progress={media.state.progress ?? undefined}
        feedback={feedback}
        removeTriggerRef={unlinkTriggerRef}
        onSelect={(file) => {
          if (!mutationsAllowed) return;
          proposal.clearOutcome();
          pendingUpload.current = { editorText, editorRevision };
          handledReferencePath.current = null;
          void media.replace(file);
        }}
        onRemove={currentReference === null ? undefined : () => {
          if (!mutationsAllowed) return;
          proposal.clearOutcome();
          unlinkingRef.current = false;
          setPendingUnlink({
            reference: currentReference,
            slot,
          });
        }}
        labels={{
          empty: isZh ? '尚未連結照片' : 'No portrait linked',
          guidance: isZh ? '人物照片的替代文字使用姓名。' : 'The person’s name is used as portrait alt text.',
          uploading: isZh ? '正在上傳並建立預覽' : 'Uploading and preparing preview',
          choose: isZh ? '選擇照片' : 'Choose portrait',
          replace: isZh ? '更換照片' : 'Replace portrait',
          remove: isZh ? '取消連結' : 'Unlink',
          previewUnavailable: isZh ? '照片預覽無法使用' : 'Portrait preview unavailable',
        }}
      />
      <ConfirmDialog
        open={pendingUnlink !== null}
        warning
        title={isZh ? '取消連結這張照片？' : 'Unlink this portrait?'}
        description={isZh
          ? '這只會更新目前的 JSON 草稿，不會刪除 Storage 中的檔案。'
          : 'This only updates the current JSON draft and does not delete the Storage object.'}
        body={isZh
          ? `確認要取消連結 ${pendingUnlink?.reference.path ?? ''}？`
          : `Confirm unlinking ${pendingUnlink?.reference.path ?? ''}?`}
        closeLabel={isZh ? '關閉對話框' : 'Close dialog'}
        cancelLabel={isZh ? '保留連結' : 'Keep linked'}
        confirmLabel={isZh ? '確認取消連結' : 'Unlink portrait'}
        triggerRef={unlinkTriggerRef}
        onClose={closeUnlink}
        onConfirm={confirmUnlink}
      />
    </div>
  );
}
