import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/content/database.types';
import type { SupabaseConfig } from '@/content/env';
import {
  DraftMediaReferenceSchema,
  MediaTypeSchema,
  buildDraftMediaReference,
  type DraftMediaReference,
} from '@/content/media';
import { getAdminSupabaseClient } from '@/content/supabaseClient';
import type {
  DraftDeleteResult,
  DraftMediaClient,
  DraftMediaFailure,
  DraftMediaOperations,
  DraftPreviewResult,
  DraftUploadResult,
  DraftUploadTransport,
} from './types';
import { hashFile, settleOperation } from './draftMediaOperation';
import { createXhrUploadTransport } from './xhrUploadTransport';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const SIGNED_PREVIEW_SECONDS = 300;
const SessionResultSchema = z.object({
  data: z.object({ session: z.object({ access_token: z.string().min(1) }).passthrough().nullable() }).passthrough(),
  error: z.unknown().nullable(),
}).passthrough();
const UserResultSchema = z.object({
  data: z.object({ user: z.object({ id: z.string() }).passthrough().nullable() }).passthrough(),
  error: z.unknown().nullable(),
}).passthrough();
const UploadSuccessSchema = z.object({ Key: z.string().min(1) }).passthrough();
const SignedUrlResultSchema = z.object({
  data: z.object({ signedUrl: z.url() }).passthrough().nullable(),
  error: z.unknown().nullable(),
}).passthrough();
const RemoveResultSchema = z.object({
  data: z.array(z.object({ name: z.string() }).passthrough()).nullable(),
  error: z.unknown().nullable(),
}).passthrough();

type DraftMediaClientOptions = {
  readonly projectUrl: string;
  readonly publishableKey: string;
  readonly operations: DraftMediaOperations;
  readonly transport: DraftUploadTransport;
  readonly now?: () => number;
};

type IdentityResult =
  | { readonly ok: true; readonly userId: string; readonly accessToken: string }
  | { readonly ok: false; readonly failure: DraftMediaFailure };

function isAborted(signal?: AbortSignal): boolean {
  return signal?.aborted === true;
}

function fileFailure(file: File): DraftMediaFailure | null {
  if (!MediaTypeSchema.safeParse(file.type).success) return { kind: 'invalid-file', reason: 'unsupported-type' };
  if (file.size === 0) return { kind: 'invalid-file', reason: 'empty' };
  if (file.size > MAX_FILE_BYTES) return { kind: 'invalid-file', reason: 'too-large' };
  return null;
}

async function identity(
  operations: DraftMediaOperations,
  signal?: AbortSignal,
): Promise<IdentityResult> {
  if (isAborted(signal)) return { ok: false, failure: { kind: 'aborted' } };
  const sessionOperation = await settleOperation(() => operations.getSession(), signal);
  if (!sessionOperation.ok) return sessionOperation;
  const userOperation = await settleOperation(() => operations.getUser(), signal);
  if (!userOperation.ok) return userOperation;
  const session = SessionResultSchema.safeParse(sessionOperation.value);
  const user = UserResultSchema.safeParse(userOperation.value);
    if (!session.success || !user.success) return { ok: false, failure: { kind: 'malformed-response' } };
    if (isAborted(signal)) return { ok: false, failure: { kind: 'aborted' } };
    if (session.data.error !== null || user.data.error !== null || session.data.data.session === null || user.data.data.user === null) {
      return { ok: false, failure: { kind: 'authentication-required' } };
    }
    return {
      ok: true,
      userId: user.data.data.user.id,
      accessToken: session.data.data.session.access_token,
    };
}

function ownerOf(reference: DraftMediaReference): string {
  return reference.path.slice(0, reference.path.indexOf('/'));
}

export function createDraftMediaClient(options: DraftMediaClientOptions): DraftMediaClient {
  const now = options.now ?? Date.now;
  return {
    async upload(file, onProgress, providedSignal): Promise<DraftUploadResult> {
      const invalid = fileFailure(file);
      if (invalid !== null) return { ok: false, failure: invalid };
      const signal = providedSignal ?? new AbortController().signal;
      if (signal.aborted) return { ok: false, failure: { kind: 'aborted' } };
      const parsedType = MediaTypeSchema.parse(file.type);
      const hashed = await hashFile(file, signal);
      if (!hashed.ok) return hashed;
      const digest = hashed.value;
      const authenticated = await identity(options.operations, signal);
      if (!authenticated.ok) return authenticated;
      const reference = buildDraftMediaReference({ ownerId: authenticated.userId, sha256: digest, mediaType: parsedType });
      const uploaded = await settleOperation(() => options.transport.upload({
        url: `${options.projectUrl}/storage/v1/object/draft-media/${reference.path.split('/').map(encodeURIComponent).join('/')}`,
        headers: {
          apikey: options.publishableKey,
          Authorization: `Bearer ${authenticated.accessToken}`,
          'content-type': parsedType,
          'x-upsert': 'false',
        },
        file,
        signal,
        onProgress,
      }), signal);
      if (!uploaded.ok) return uploaded;
      const response = uploaded.value;
      if (signal.aborted || response.status === 0) return { ok: false, failure: { kind: 'aborted' } };
      if (response.status === 409) return { ok: true, outcome: 'reused', reference, sha256: digest };
      if (response.status < 200 || response.status >= 300) {
        return { ok: false, failure: { kind: response.status < 0 ? 'transport-error' : 'storage-failure' } };
      }
      if (!UploadSuccessSchema.safeParse(response.body).success) {
        return { ok: false, failure: { kind: 'malformed-response' } };
      }
      return { ok: true, outcome: 'created', reference, sha256: digest };
    },
    async createPreview(reference, signal): Promise<DraftPreviewResult> {
      const parsedReference = DraftMediaReferenceSchema.safeParse(reference);
      if (!parsedReference.success) return { ok: false, failure: { kind: 'malformed-response' } };
      const authenticated = await identity(options.operations, signal);
      if (!authenticated.ok) return authenticated;
      if (ownerOf(parsedReference.data) !== authenticated.userId) return { ok: false, failure: { kind: 'owner-mismatch' } };
      const signed = await settleOperation(
        () => options.operations.createSignedUrl(parsedReference.data.path, SIGNED_PREVIEW_SECONDS),
        signal,
      );
      if (!signed.ok) return signed;
      const response = SignedUrlResultSchema.safeParse(signed.value);
      if (!response.success) return { ok: false, failure: { kind: 'malformed-response' } };
      if (response.data.error !== null || response.data.data === null) return { ok: false, failure: { kind: 'storage-failure' } };
      return { ok: true, url: response.data.data.signedUrl, expiresAt: now() + SIGNED_PREVIEW_SECONDS * 1_000 };
    },
    async delete(reference, guard, signal): Promise<DraftDeleteResult> {
      if (guard.referencedByEditor || guard.referencedBySavedDraft) return { ok: false, failure: { kind: 'still-referenced' } };
      const parsedReference = DraftMediaReferenceSchema.safeParse(reference);
      if (!parsedReference.success) return { ok: false, failure: { kind: 'malformed-response' } };
      const authenticated = await identity(options.operations, signal);
      if (!authenticated.ok) return authenticated;
      if (ownerOf(parsedReference.data) !== authenticated.userId) return { ok: false, failure: { kind: 'owner-mismatch' } };
      const removed = await settleOperation(() => options.operations.remove([parsedReference.data.path]), signal);
      if (!removed.ok) return removed;
      const response = RemoveResultSchema.safeParse(removed.value);
      if (!response.success) return { ok: false, failure: { kind: 'malformed-response' } };
      if (response.data.error !== null) return { ok: false, failure: { kind: 'storage-failure' } };
      if (response.data.data === null) return { ok: false, failure: { kind: 'malformed-response' } };
      if (response.data.data.length === 0) return { ok: false, failure: { kind: 'still-referenced' } };
      return response.data.data.length === 1 && response.data.data[0]?.name === parsedReference.data.path
        ? { ok: true }
        : { ok: false, failure: { kind: 'malformed-response' } };
    },
  };
}

export function createSupabaseDraftMediaOperations(
  client: SupabaseClient<Database>,
): DraftMediaOperations {
  return {
    getSession: () => client.auth.getSession(),
    getUser: () => client.auth.getUser(),
    createSignedUrl: (path, expiresIn) => client.storage.from('draft-media').createSignedUrl(path, expiresIn),
    remove: (paths) => client.storage.from('draft-media').remove([...paths]),
  };
}

export async function loadBrowserDraftMediaClient(
  config: SupabaseConfig,
): Promise<DraftMediaClient> {
  const client = await getAdminSupabaseClient(config);
  return createDraftMediaClient({
    projectUrl: config.url,
    publishableKey: config.publishableKey,
    operations: createSupabaseDraftMediaOperations(client),
    transport: createXhrUploadTransport(),
  });
}

export type {
  DraftDeleteGuard,
  DraftDeleteResult,
  DraftMediaClient,
  DraftMediaFailure,
  DraftMediaOperations,
  DraftPreviewResult,
  DraftUploadResult,
  DraftUploadRequest,
  DraftUploadTransport,
  UploadProgress,
} from './types';
