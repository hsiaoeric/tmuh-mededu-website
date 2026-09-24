import { useEffect, type ReactElement, type ReactNode } from 'react';
import { SiteProvider } from '@/app/site';
import { AdminProtectedAccessProvider } from '@/admin/auth';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { CmsDocumentIdSchema, type CmsDocumentId } from '@/content/contracts/primitives';
import snapshot from '@/content/generated/cms-snapshot.json';
import type { Json } from '@/content/database.types';
import type { DraftMediaReference } from '@/content/media';
import { AdminMediaOwnershipProvider } from './AdminMediaOwnershipProvider';
import { AdminMediaRuntimeProvider } from './AdminMediaRuntimeProvider';
import { AdminMediaWorkbench } from './AdminMediaWorkbench';
import { useAdminMediaOwnershipScope } from './AdminMediaOwnershipProvider';
import { draftMediaOwnershipFor } from './draftMediaOwnership';
import { deriveMediaWorkbench } from './mediaWorkbenchModel';
import type { DraftMediaClient } from './types';
import { configuration } from './AdminMediaWorkbench.testHarness';

export const facdevDocumentId = CmsDocumentIdSchema.parse('33333333-3333-4333-8333-333333333333');
export const secondFacdevDocumentId = CmsDocumentIdSchema.parse('44444444-4444-4444-8444-444444444444');

export function facdevEditorText(): string {
  const source = snapshot.find((candidate) => candidate.kind === 'facdev');
  if (source === undefined) throw new TypeError('Missing facdev fixture');
  return `${JSON.stringify(CMS_PAYLOAD_REGISTRY.facdev.schema.parse(source.payload), null, 2)}\n`;
}

export function firstFacdevSlot(editorText: string) {
  const workbench = deriveMediaWorkbench('facdev', editorText);
  if (workbench.status !== 'ready') throw new TypeError('Expected facdev media workbench');
  const slot = workbench.slots[0];
  if (slot === undefined || slot.slotKind !== 'facdev-lead') throw new TypeError('Expected facdev lead slot');
  return slot;
}

export function RegisterFacdevReference({ reference }: { readonly reference: DraftMediaReference }) {
  const scope = useAdminMediaOwnershipScope();
  useEffect(() => {
    draftMediaOwnershipFor(scope).register({
      ok: true,
      outcome: 'created',
      reference,
      sha256: reference.path.split('/')[1]?.slice(0, 64) ?? '',
    });
  }, [reference, scope]);
  return null;
}

export type FacdevWorkbenchProps = {
  readonly documentId?: CmsDocumentId;
  readonly editorText: string;
  readonly savedDraftPayload: Json | null;
  readonly onEditorTextChange: (editorText: string) => void;
};

export function facdevWorkbenchTree(props: FacdevWorkbenchProps, client: DraftMediaClient, setup?: ReactNode): ReactElement {
  return <SiteProvider>
    <AdminProtectedAccessProvider mutationsAllowed>
      <AdminMediaOwnershipProvider>
        <AdminMediaRuntimeProvider configuration={configuration} client={client}>
          {setup}
          <AdminMediaWorkbench kind="facdev" documentId={props.documentId ?? facdevDocumentId} editorText={props.editorText} savedDraftPayload={props.savedDraftPayload} onEditorTextChange={props.onEditorTextChange} />
        </AdminMediaRuntimeProvider>
      </AdminMediaOwnershipProvider>
    </AdminProtectedAccessProvider>
  </SiteProvider>;
}
