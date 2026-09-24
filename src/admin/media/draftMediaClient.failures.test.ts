import { describe, expect, it, vi } from 'vitest';
import {
  createDraftMediaClient,
  type DraftMediaOperations,
  type DraftUploadTransport,
} from './draftMediaClient';

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PROJECT_URL = 'https://project.supabase.co';
const KEY = 'sb_publishable_test';

function file(): File {
  return new File([new Uint8Array([1])], 'image.png', { type: 'image/png' });
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

function client(operationOverrides: Partial<DraftMediaOperations> = {}, transport?: DraftUploadTransport) {
  return createDraftMediaClient({
    projectUrl: PROJECT_URL,
    publishableKey: KEY,
    operations: operations(operationOverrides),
    transport: transport ?? { upload: () => Promise.resolve({ status: 201, body: { Key: 'draft-media/object' } }) },
  });
}

describe('draft media client failure settlement', () => {
  it.each(['getSession', 'getUser'] as const)('maps a rejected %s operation to transport failure', async (operation) => {
    // Given
    const subject = client({ [operation]: () => Promise.reject(new TypeError('offline')) });

    // When
    const result = await subject.upload(file(), () => undefined);

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'transport-error' } });
  });

  it('maps a rejected upload transport to transport failure', async () => {
    // Given
    const subject = client({}, { upload: () => Promise.reject(new TypeError('offline')) });

    // When
    const result = await subject.upload(file(), () => undefined);

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'transport-error' } });
  });

  it('maps abort independently from generic transport failure', async () => {
    // Given
    const controller = new AbortController();
    const subject = client({}, { upload: () => Promise.reject(new TypeError('offline')) });

    // When
    const result = await subject.upload(file(), () => undefined, controller.signal);

    // Then
    expect(controller.signal.aborted).toBe(false);
    expect(result).toEqual({ ok: false, failure: { kind: 'transport-error' } });
  });

  it('maps AbortError to transport failure when the signal was not aborted', async () => {
    // Given
    const subject = client({}, {
      upload: () => Promise.reject(new DOMException('cancelled', 'AbortError')),
    });

    // When
    const result = await subject.upload(file(), () => undefined);

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'transport-error' } });
  });

  it('maps a rejected file read to transport failure', async () => {
    // Given
    const unreadable = file();
    Object.defineProperty(unreadable, 'arrayBuffer', {
      value: () => Promise.reject(new TypeError('file read failed')),
    });
    const subject = client();

    // When
    const result = await subject.upload(unreadable, () => undefined);

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'transport-error' } });
  });

  it('maps a rejected digest to transport failure', async () => {
    // Given
    vi.spyOn(crypto.subtle, 'digest').mockRejectedValueOnce(new TypeError('digest failed'));
    const subject = client();

    // When
    const result = await subject.upload(file(), () => undefined);

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'transport-error' } });
  });

  it('maps rejected signing and removal operations to transport failure', async () => {
    // Given
    const failed = () => Promise.reject(new TypeError('offline'));
    const subject = client({ createSignedUrl: failed, remove: failed });
    const uploaded = await subject.upload(file(), () => undefined);
    expect(uploaded.ok).toBe(true);
    if (!uploaded.ok) return;

    // When
    const results = await Promise.all([
      subject.createPreview(uploaded.reference),
      subject.delete(uploaded.reference, { referencedByEditor: false, referencedBySavedDraft: false }),
    ]);

    // Then
    expect(results).toEqual([
      { ok: false, failure: { kind: 'transport-error' } },
      { ok: false, failure: { kind: 'transport-error' } },
    ]);
  });

  it('maps a policy-filtered empty removal to a still-referenced failure', async () => {
    // Given
    const subject = client({ remove: () => Promise.resolve({ data: [], error: null }) });
    const uploaded = await subject.upload(file(), () => undefined);
    expect(uploaded.ok).toBe(true);
    if (!uploaded.ok) return;

    // When
    const result = await subject.delete(
      uploaded.reference,
      { referencedByEditor: false, referencedBySavedDraft: false },
    );

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'still-referenced' } });
  });

  it('rejects removal success unless it identifies the exact requested path', async () => {
    // Given
    const subject = client({
      remove: () => Promise.resolve({ data: [{ name: `${OWNER}/wrong.png` }], error: null }),
    });
    const uploaded = await subject.upload(file(), () => undefined);
    expect(uploaded.ok).toBe(true);
    if (!uploaded.ok) return;

    // When
    const result = await subject.delete(
      uploaded.reference,
      { referencedByEditor: false, referencedBySavedDraft: false },
    );

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'malformed-response' } });
  });
});
