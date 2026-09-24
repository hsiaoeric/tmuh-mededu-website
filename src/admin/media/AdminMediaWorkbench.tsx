import { useLayoutEffect, useRef, type ReactElement } from 'react';
import { useSite } from '@/app/site';
import { InlineNotice } from '@/admin/AdminFeedback';
import type { Json } from '@/content/database.types';
import type { CmsDocumentId } from '@/content/contracts/primitives';
import { useAdminMediaOwnershipScope } from './AdminMediaOwnershipProvider';
import { useAdminMediaRuntime } from './AdminMediaRuntimeProvider';
import { draftMediaOwnershipFor } from './draftMediaOwnership';
import { AdminMediaCleanup } from './AdminMediaCleanup';
import { AdminMediaPortraitField } from './AdminMediaPortraitField';
import { deriveMediaWorkbench } from './mediaWorkbenchModel';
import type { MediaWorkbenchKind, PortraitSlot } from './mediaWorkbenchTypes';
import type { DraftMediaClient } from './types';
import { draftMediaClaimsFor } from './draftMediaClaims';

type AdminMediaWorkbenchProps = {
  readonly kind: MediaWorkbenchKind;
  readonly documentId: CmsDocumentId;
  readonly editorText: string;
  readonly savedDraftPayload: Json | null;
  readonly onEditorTextChange: (editorText: string) => void;
};

function useDocumentClaims(props: AdminMediaWorkbenchProps): void {
  const ownershipScope = useAdminMediaOwnershipScope();
  const claims = draftMediaClaimsFor(ownershipScope);
  const ownership = draftMediaOwnershipFor(ownershipScope);
  const synchronizeOwnership = (): void => {
    ownership.synchronize((reference) => {
      const guard = claims.guard(reference);
      return guard.referencedByEditor || guard.referencedBySavedDraft;
    });
  };

  useLayoutEffect(() => {
    claims.updateEditor(props.documentId, props.editorText);
    synchronizeOwnership();
  }, [claims, ownership, props.documentId, props.editorText]);

  useLayoutEffect(() => {
    claims.updateSaved(props.documentId, props.savedDraftPayload);
    synchronizeOwnership();
  }, [claims, ownership, props.documentId, props.savedDraftPayload]);

  useLayoutEffect(() => () => {
    claims.discardEditor(props.documentId);
    synchronizeOwnership();
  }, [claims, ownership, props.documentId]);
}

function ReadyWorkbench(props: AdminMediaWorkbenchProps & {
  readonly slots: readonly PortraitSlot[];
  readonly client: DraftMediaClient;
  readonly editorRevision: number;
}): ReactElement {
  return (
    <>
      <div className="admin-media-slot-grid">
        {props.slots.map((slot) => (
          <AdminMediaPortraitField
            key={slot.key}
            kind={props.kind}
            editorText={props.editorText}
            editorRevision={props.editorRevision}
            onEditorTextChange={props.onEditorTextChange}
            slot={slot}
            client={props.client}
          />
        ))}
      </div>
      <AdminMediaCleanup
        editorText={props.editorText}
        savedDraftPayload={props.savedDraftPayload}
        client={props.client}
      />
    </>
  );
}

export function AdminMediaWorkbench(props: AdminMediaWorkbenchProps): ReactElement {
  useDocumentClaims(props);
  const { isZh } = useSite();
  const runtime = useAdminMediaRuntime();
  const workbench = deriveMediaWorkbench(props.kind, props.editorText);
  const canonicalEditorRef = useRef({ editorText: props.editorText, revision: 0 });
  if (canonicalEditorRef.current.editorText !== props.editorText) {
    canonicalEditorRef.current = {
      editorText: props.editorText,
      revision: canonicalEditorRef.current.revision + 1,
    };
  }

  return (
    <section className="admin-surface admin-media-workbench" aria-labelledby="admin-media-workbench-title">
      <header>
        <h2 id="admin-media-workbench-title">{isZh ? '視覺媒體工作區' : 'Visual media workbench'}</h2>
        <p>{isZh ? '直接管理雙語內容中的人物照片連結。' : 'Manage portrait links in bilingual content directly.'}</p>
      </header>
      {workbench.status === 'invalid' ? (
        <InlineNotice status="warning" title={isZh ? '請先修正 JSON' : 'Fix the JSON first'}>
          {isZh ? '內容無法解析或不符合此文件格式；所有媒體變更已停用。' : 'The content is invalid for this document; all media changes are disabled.'}
        </InlineNotice>
      ) : runtime.status !== 'ready' ? (
        <InlineNotice status={runtime.status === 'loading' ? 'info' : 'warning'} title={isZh ? '媒體服務尚未就緒' : 'Media service unavailable'}>
          {isZh ? '目前無法上傳或變更照片。' : 'Portrait uploads and changes are currently unavailable.'}
        </InlineNotice>
      ) : workbench.status === 'ready' ? (
        <ReadyWorkbench
          {...props}
          slots={workbench.slots}
          client={runtime.client}
          editorRevision={canonicalEditorRef.current.revision}
        />
      ) : (
        <InlineNotice status="warning" title={isZh ? '此文件不支援媒體工作區' : 'Media workbench unsupported'} />
      )}
    </section>
  );
}
