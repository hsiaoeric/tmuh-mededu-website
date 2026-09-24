import { cleanup } from '@testing-library/react';
import { useEffect, type ReactElement, type ReactNode } from 'react';
import { SiteProvider } from '@/app/site';
import { AdminProtectedAccessProvider } from '@/admin/auth';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { CmsDocumentIdSchema, type CmsDocumentId } from '@/content/contracts/primitives';
import snapshot from '@/content/generated/cms-snapshot.json';
import type { SupabaseConfiguration } from '@/content/env';
import {
  DraftMediaReferenceSchema,
  type DraftMediaReference,
} from '@/content/media';
import type { Json } from '@/content/database.types';
import {
  AdminMediaOwnershipProvider,
  AdminMediaRuntimeProvider,
  AdminMediaWorkbench,
  deriveMediaWorkbench,
  useAdminMediaOwnershipScope,
} from './index';
import { draftMediaOwnershipFor } from './draftMediaOwnership';
import type { DraftMediaClient } from './types';

export const configuration = {
  kind: 'configured',
  config: {
    url: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
  },
} satisfies SupabaseConfiguration;

export const uploadedReference = DraftMediaReferenceSchema.parse({
  kind: 'draft',
  bucket: 'draft-media',
  path: '11111111-1111-4111-8111-111111111111/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp',
});

export const peopleDocumentId = CmsDocumentIdSchema.parse('22222222-2222-4222-8222-222222222222');

function fixturePayload(kind: 'people' | 'facdev'): unknown {
  const document = snapshot.find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return document.payload;
}

export function peopleEditorText(): string {
  return JSON.stringify(
    CMS_PAYLOAD_REGISTRY.people.schema.parse(fixturePayload('people')),
    null,
    2,
  );
}

function requireValue<Value>(value: Value | undefined): Value {
  if (value === undefined) throw new TypeError('Expected fixture value');
  return value;
}

export type Deferred<Value> = {
  readonly promise: Promise<Value>;
  readonly resolve: (value: Value) => void;
};

export function deferred<Value>(): Deferred<Value> {
  let resolvePromise: (value: Value) => void = () => undefined;
  const promise = new Promise<Value>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

export function clientWith(
  overrides: Partial<DraftMediaClient> = {},
): DraftMediaClient {
  return {
    upload: () => Promise.resolve({ ok: false, failure: { kind: 'transport-error' } }),
    createPreview: () => Promise.resolve({
      ok: true,
      url: 'https://signed.example/portrait',
      expiresAt: 300_000,
    }),
    delete: () => Promise.resolve({ ok: true }),
    ...overrides,
  };
}

export function RegisterCreatedReference({ reference }: { readonly reference: DraftMediaReference }) {
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

export type WorkbenchProps = {
  readonly documentId?: CmsDocumentId;
  readonly editorText: string;
  readonly savedDraftPayload: Json | null;
  readonly onEditorTextChange: (editorText: string) => void;
};

export function workbenchTree(
  props: WorkbenchProps,
  client: DraftMediaClient,
  setup?: ReactNode,
  mutationsAllowed = true,
): ReactElement {
  return (
    <SiteProvider>
      <AdminProtectedAccessProvider mutationsAllowed={mutationsAllowed}>
        <AdminMediaOwnershipProvider>
          <AdminMediaRuntimeProvider configuration={configuration} client={client}>
            {setup}
            <AdminMediaWorkbench
              kind="people"
              {...props}
              documentId={props.documentId ?? peopleDocumentId}
            />
          </AdminMediaRuntimeProvider>
        </AdminMediaOwnershipProvider>
      </AdminProtectedAccessProvider>
    </SiteProvider>
  );
}

export function firstSlot(editorText: string) {
  const workbench = deriveMediaWorkbench('people', editorText);
  if (workbench.status !== 'ready') throw new TypeError('Expected ready workbench');
  return requireValue(workbench.slots[0]);
}

export function resetWorkbenchTestState(): void {
  cleanup();
  localStorage.clear();
}
