import { describe, expect, it, vi } from 'vitest';
import {
  createDraftMediaClient,
  type DraftMediaOperations,
  type DraftUploadRequest,
  type DraftUploadTransport,
} from './draftMediaClient';

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PROJECT_URL = 'https://project.supabase.co';
const KEY = 'sb_publishable_test';

function file(bytes: readonly number[], type = 'image/png', name = 'image.png'): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

function operations(overrides: Partial<DraftMediaOperations> = {}): DraftMediaOperations {
  return {
    getSession: () => Promise.resolve({ data: { session: { access_token: 'admin-jwt' } }, error: null }),
    getUser: () => Promise.resolve({ data: { user: { id: OWNER } }, error: null }),
    createSignedUrl: () => Promise.resolve({ data: { signedUrl: 'https://signed.example/image' }, error: null }),
    remove: () => Promise.resolve({ data: [{ name: 'image.png' }], error: null }),
    ...overrides,
  };
}

function transport(response: { readonly status: number; readonly body: unknown }) {
  const requests: DraftUploadRequest[] = [];
  const adapter: DraftUploadTransport = {
    upload: (request) => {
      requests.push(request);
      request.onProgress({ loaded: request.file.size, total: request.file.size });
      return Promise.resolve(response);
    },
  };
  return { adapter, requests };
}

describe('draft media client', () => {
  it.each([
    { candidate: file([], 'image/png'), reason: 'empty' },
    { candidate: file([1], 'image/gif', 'image.gif'), reason: 'unsupported-type' },
    { candidate: new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }), reason: 'too-large' },
  ])('rejects $reason files before authentication or transport', async ({ candidate, reason }) => {
    // Given
    const getSession = vi.fn(operations().getSession);
    const upload = vi.fn<DraftUploadTransport['upload']>();
    const client = createDraftMediaClient({
      projectUrl: PROJECT_URL,
      publishableKey: KEY,
      operations: operations({ getSession }),
      transport: { upload },
    });

    // When
    const result = await client.upload(candidate, () => undefined);

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'invalid-file', reason } });
    expect(getSession).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it('hashes bytes and uploads to the encoded draft bucket path with admin headers and progress', async () => {
    // Given
    const upload = transport({ status: 201, body: { Key: 'draft-media/canonical-object' } });
    const progress = vi.fn();
    const client = createDraftMediaClient({
      projectUrl: PROJECT_URL,
      publishableKey: KEY,
      operations: operations(),
      transport: upload.adapter,
    });

    // When
    const result = await client.upload(file([1, 2, 3]), progress);

    // Then
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const request = upload.requests[0];
    expect(request).toBeDefined();
    if (request === undefined) return;
    expect(request.url).toBe(`${PROJECT_URL}/storage/v1/object/draft-media/${OWNER}/${result.sha256}.png`);
    expect(request.headers).toEqual({
      apikey: KEY,
      Authorization: 'Bearer admin-jwt',
      'content-type': 'image/png',
      'x-upsert': 'false',
    });
    expect(progress).toHaveBeenCalledWith({ loaded: 3, total: 3 });
    expect(result.reference.path).toBe(`${OWNER}/${result.sha256}.png`);
    expect(result.outcome).toBe('created');
  });

  it('returns an explicit reused outcome for a duplicate canonical upload', async () => {
    // Given
    const duplicate = transport({ status: 409, body: { code: 'Duplicate' } });
    const client = createDraftMediaClient({ projectUrl: PROJECT_URL, publishableKey: KEY, operations: operations(), transport: duplicate.adapter });

    // When
    const result = await client.upload(file([1, 2, 3], 'image/jpeg', 'image.jpeg'), () => undefined);

    // Then
    expect(result).toEqual(expect.objectContaining({ ok: true, outcome: 'reused' }));
    if (result.ok) expect(result.reference.path.endsWith('.jpg')).toBe(true);
  });

  it('rejects successful storage responses that do not identify the uploaded object', async () => {
    const malformed = transport({ status: 201, body: { unexpected: true } });
    const client = createDraftMediaClient({ projectUrl: PROJECT_URL, publishableKey: KEY, operations: operations(), transport: malformed.adapter });

    const result = await client.upload(file([1]), () => undefined);

    expect(result).toEqual({ ok: false, failure: { kind: 'malformed-response' } });
  });

  it('creates a five-minute signed preview and computes its expiration without persisting it', async () => {
    // Given
    const createSignedUrl = vi.fn(operations().createSignedUrl);
    const client = createDraftMediaClient({
      projectUrl: PROJECT_URL,
      publishableKey: KEY,
      operations: operations({ createSignedUrl }),
      transport: transport({ status: 201, body: { Key: 'unused' } }).adapter,
      now: () => 1_000,
    });
    const uploaded = await client.upload(file([1]), () => undefined);
    expect(uploaded.ok).toBe(true);
    if (!uploaded.ok) return;

    // When
    const result = await client.createPreview(uploaded.reference);

    // Then
    expect(createSignedUrl).toHaveBeenCalledWith(uploaded.reference.path, 300);
    expect(result).toEqual({ ok: true, url: 'https://signed.example/image', expiresAt: 301_000 });
  });

  it('enforces owner and reference guards before removing a canonical draft', async () => {
    // Given
    const remove = vi.fn((paths: readonly string[]) => Promise.resolve({
      data: paths.map((name) => ({ name })),
      error: null,
    }));
    const client = createDraftMediaClient({ projectUrl: PROJECT_URL, publishableKey: KEY, operations: operations({ remove }), transport: transport({ status: 201, body: { Key: 'unused' } }).adapter });
    const uploaded = await client.upload(file([1]), () => undefined);
    expect(uploaded.ok).toBe(true);
    if (!uploaded.ok) return;

    // When
    const referenced = await client.delete(uploaded.reference, { referencedByEditor: true, referencedBySavedDraft: false });
    const removed = await client.delete(uploaded.reference, { referencedByEditor: false, referencedBySavedDraft: false });

    // Then
    expect(referenced).toEqual({ ok: false, failure: { kind: 'still-referenced' } });
    expect(removed).toEqual({ ok: true });
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith([uploaded.reference.path]);
  });
});
