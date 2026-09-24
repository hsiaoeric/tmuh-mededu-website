import { describe, expect, it } from 'vitest';
import {
  createDraftMediaClient,
  type DraftMediaOperations,
  type DraftUploadTransport,
} from './draftMediaClient';

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

type Deferred<Value> = {
  readonly promise: Promise<Value>;
  readonly resolve: (value: Value) => void;
};

function deferred<Value>(): Deferred<Value> {
  let resolvePromise: (value: Value) => void = () => undefined;
  const promise = new Promise<Value>((resolve) => { resolvePromise = resolve; });
  return { promise, resolve: resolvePromise };
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
    projectUrl: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
    operations: operations(operationOverrides),
    transport: transport ?? { upload: () => Promise.resolve({ status: 201, body: { Key: 'draft-media/object' } }) },
  });
}

function file(): File {
  return new File([new Uint8Array([1])], 'image.png', { type: 'image/png' });
}

describe('draft media client abort settlement', () => {
  it('settles as aborted while file hashing never settles', async () => {
    // Given
    const controller = new AbortController();
    const started = deferred<void>();
    const unreadable = file();
    Object.defineProperty(unreadable, 'arrayBuffer', {
      value: () => {
        started.resolve();
        return new Promise<never>(() => undefined);
      },
    });

    // When
    const pending = client().upload(unreadable, () => undefined, controller.signal);
    await started.promise;
    controller.abort();

    // Then
    await expect(pending).resolves.toEqual({ ok: false, failure: { kind: 'aborted' } });
  });

  it.each(['authentication', 'upload'] as const)('settles as aborted while %s never settles', async (stage) => {
    // Given
    const controller = new AbortController();
    const started = deferred<void>();
    const neverSettles = () => {
      started.resolve();
      return new Promise<never>(() => undefined);
    };
    const subject = stage === 'authentication'
      ? client({ getSession: neverSettles })
      : client({}, { upload: neverSettles });

    // When
    const pending = subject.upload(file(), () => undefined, controller.signal);
    await started.promise;
    controller.abort();

    // Then
    await expect(pending).resolves.toEqual({ ok: false, failure: { kind: 'aborted' } });
  });

  it.each(['preview', 'deletion'] as const)('settles %s as aborted and ignores late success', async (stage) => {
    // Given
    const controller = new AbortController();
    const operation = deferred<unknown>();
    const started = deferred<void>();
    const subject = client(stage === 'preview' ? {
      createSignedUrl: () => {
        started.resolve();
        return operation.promise;
      },
    } : {
      remove: () => {
        started.resolve();
        return operation.promise;
      },
    });
    const uploaded = await subject.upload(file(), () => undefined);
    expect(uploaded.ok).toBe(true);
    if (!uploaded.ok) return;

    // When
    const pending = stage === 'preview'
      ? subject.createPreview(uploaded.reference, controller.signal)
      : subject.delete(uploaded.reference, { referencedByEditor: false, referencedBySavedDraft: false }, controller.signal);
    await started.promise;
    controller.abort();
    operation.resolve(stage === 'preview'
      ? { data: { signedUrl: 'https://signed.example/late' }, error: null }
      : { data: [{ name: 'image.png' }], error: null });

    // Then
    await expect(pending).resolves.toEqual({ ok: false, failure: { kind: 'aborted' } });
  });
});
