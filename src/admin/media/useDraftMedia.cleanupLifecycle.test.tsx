// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DraftMediaReferenceSchema, type DraftMediaReference } from '@/content/media';
import { createDraftMediaClient } from './draftMediaClient';
import {
  createDraftMediaOwnershipScope,
  draftMediaOwnershipFor,
  resetDraftMediaOwnership,
} from './draftMediaOwnership';
import type {
  DraftDeleteResult,
  DraftMediaClient,
  DraftMediaOperations,
  DraftUploadResult,
  DraftUploadTransport,
} from './types';
import { useDraftMedia, type DraftMediaOptions } from './useDraftMedia';

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function reference(character: string): DraftMediaReference {
  return DraftMediaReferenceSchema.parse({
    kind: 'draft', bucket: 'draft-media',
    path: `${OWNER}/${character.repeat(64)}.png`,
  });
}

type Deferred<Value> = {
  readonly promise: Promise<Value>;
  readonly resolve: (value: Value) => void;
};

function deferred<Value>(): Deferred<Value> {
  let resolvePromise: (value: Value) => void = () => undefined;
  const promise = new Promise<Value>((resolve) => { resolvePromise = resolve; });
  return { promise, resolve: resolvePromise };
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

const OLD = reference('a');
const C = reference('c');
const F = reference('f');

function clientWith(overrides: Partial<DraftMediaClient>): DraftMediaClient {
  return {
    upload: () => Promise.resolve({ ok: false, failure: { kind: 'transport-error' } }),
    createPreview: () => Promise.resolve({ ok: false, failure: { kind: 'transport-error' } }),
    delete: () => Promise.resolve({ ok: true }),
    ...overrides,
  };
}

function renderDraftMediaHook(
  options: Omit<DraftMediaOptions, 'ownershipScope'>,
  ownershipScope = createDraftMediaOwnershipScope(),
) {
  return renderHook(() => useDraftMedia({ ...options, ownershipScope }));
}

describe('useDraftMedia cleanup lifecycle', () => {
  it('completes an upload after the React StrictMode setup cleanup rehearsal', async () => {
    // Given
    const client = clientWith({
      upload: () => Promise.resolve({ ok: true, outcome: 'created', reference: F, sha256: 'f'.repeat(64) }),
      createPreview: () => Promise.resolve({ ok: true, url: 'https://signed.example/f', expiresAt: 301_000 }),
    });
    const ownershipScope = createDraftMediaOwnershipScope();
    const { result } = renderHook(() => useDraftMedia({ client, ownershipScope }), { wrapper: StrictMode });

    // When
    await act(() => result.current.replace(new File(['f'], 'f.png', { type: 'image/png' })));

    // Then
    expect(result.current.state).toEqual(expect.objectContaining({ status: 'ready', reference: F, previewUrl: 'https://signed.example/f' }));
  });

  it('keeps a late retired-scope continuation invisible to a new authorization scope', async () => {
    // Given
    const upload = deferred<DraftUploadResult>();
    const persistentClient = clientWith({ upload: () => upload.promise });
    const retiredScope = createDraftMediaOwnershipScope();
    const activeScope = createDraftMediaOwnershipScope();
    const first = renderHook(() => useDraftMedia({
      client: persistentClient,
      ownershipScope: retiredScope,
    }));
    let replacement = Promise.resolve();
    act(() => {
      replacement = first.result.current.replace(
        new File(['f'], 'f.png', { type: 'image/png' }),
      );
    });
    first.unmount();
    resetDraftMediaOwnership(retiredScope);
    const second = renderHook(() => useDraftMedia({
      client: persistentClient,
      ownershipScope: activeScope,
    }));

    // When
    upload.resolve({
      ok: true,
      outcome: 'created',
      reference: F,
      sha256: 'f'.repeat(64),
    });
    await act(() => replacement);

    // Then
    expect(draftMediaOwnershipFor(retiredScope).snapshot()).toEqual([F]);
    expect(second.result.current.state.unresolvedReferences).toEqual([]);
    expect(draftMediaOwnershipFor(activeScope).snapshot()).toEqual([]);
  });

  it('shares retained ownership with concurrently mounted hooks using the same client', async () => {
    // Given
    const deletion = deferred<DraftDeleteResult>();
    const client = clientWith({
      upload: () => Promise.resolve({ ok: true, outcome: 'created', reference: F, sha256: 'f'.repeat(64) }),
      delete: () => deletion.promise,
    });
    const ownershipScope = createDraftMediaOwnershipScope();
    const first = renderDraftMediaHook({ client }, ownershipScope);
    const second = renderDraftMediaHook({ client }, ownershipScope);

    // When
    await act(() => first.result.current.replace(new File(['f'], 'f.png', { type: 'image/png' })));

    // Then
    expect(first.result.current.state.unresolvedReferences).toEqual([F]);
    expect(second.result.current.state.unresolvedReferences).toEqual([F]);
  });

  it('retains a real client created upload when unmounted before the hook continuation', async () => {
    // Given
    const transportResponse = deferred<{ readonly status: number; readonly body: unknown }>();
    const transportStarted = deferred<void>();
    const realClientResult = deferred<DraftUploadResult>();
    const resumeHook = deferred<void>();
    const remove = vi.fn<DraftMediaOperations['remove']>(() => (
      Promise.resolve({ data: [{ name: 'image.png' }], error: null })
    ));
    const operations: DraftMediaOperations = {
      getSession: () => Promise.resolve({ data: { session: { access_token: 'admin-jwt' } }, error: null }),
      getUser: () => Promise.resolve({ data: { user: { id: OWNER } }, error: null }),
      createSignedUrl: () => Promise.resolve({ data: { signedUrl: 'https://signed.example/image' }, error: null }),
      remove,
    };
    const transport: DraftUploadTransport = {
      upload: () => {
        transportStarted.resolve();
        return transportResponse.promise;
      },
    };
    const client = createDraftMediaClient({
      projectUrl: 'https://project.supabase.co',
      publishableKey: 'sb_publishable_test',
      operations,
      transport,
    });
    const realUpload = client.upload.bind(client);
    vi.spyOn(client, 'upload').mockImplementation(async (...arguments_) => {
      const uploaded = await realUpload(...arguments_);
      realClientResult.resolve(uploaded);
      await resumeHook.promise;
      return uploaded;
    });
    const ownershipScope = createDraftMediaOwnershipScope();
    const first = renderDraftMediaHook({ client }, ownershipScope);
    const file = new File(['created'], 'created.png', { type: 'image/png' });
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.resolve(new TextEncoder().encode('created').buffer),
    });
    let replacement = Promise.resolve();
    act(() => {
      replacement = first.result.current.replace(file);
    });
    await transportStarted.promise;
    transportResponse.resolve({ status: 201, body: { Key: 'draft-media/object' } });
    const uploaded = await realClientResult.promise;
    expect(uploaded.ok).toBe(true);
    if (!uploaded.ok) return;
    expect(uploaded.outcome).toBe('created');

    // When
    first.unmount();
    resumeHook.resolve();
    await act(() => replacement);
    const remounted = renderDraftMediaHook({ client }, ownershipScope);

    // Then
    expect(remove).not.toHaveBeenCalled();
    expect(remounted.result.current.state.unresolvedReferences).toEqual([uploaded.reference]);
  });

  it('settles a stale caller and retains ownership without a cleanup task waiting on the newer upload', async () => {
    // Given
    const first = deferred<DraftUploadResult>();
    const second = deferred<DraftUploadResult>();
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
    let newerSignal: AbortSignal | undefined;
    const upload = vi.fn<DraftMediaClient['upload']>()
      .mockReturnValueOnce(first.promise)
      .mockImplementationOnce((_file, _progress, signal) => {
        newerSignal = signal;
        return second.promise;
      });
    const { result } = renderDraftMediaHook({
      client: clientWith({ upload, delete: remove }), initialReference: OLD,
    });
    let firstSettled = false;
    act(() => {
      void result.current.replace(new File(['c'], 'c.png', { type: 'image/png' }))
        .then(() => { firstSettled = true; });
      void result.current.replace(new File(['pending'], 'pending.png', { type: 'image/png' }));
    });

    // When
    first.resolve({ ok: true, outcome: 'created', reference: C, sha256: 'c'.repeat(64) });
    await act(flushMicrotasks);

    // Then
    expect(firstSettled).toBe(true);
    expect(remove).not.toHaveBeenCalled();
    expect(result.current.state.unresolvedReferences).toEqual([C]);
    act(() => result.current.unlink());
    expect(newerSignal?.aborted).toBe(true);
    expect(result.current.state.unresolvedReferences).toEqual([C]);
  });

  it('starts no cleanup on a new begin and preserves its exact unresolved path', async () => {
    // Given
    const deletion = deferred<DraftDeleteResult>();
    const pendingUpload = deferred<DraftUploadResult>();
    let cleanupSignal: AbortSignal | undefined;
    const upload = vi.fn<DraftMediaClient['upload']>()
      .mockResolvedValueOnce({ ok: true, outcome: 'created', reference: F, sha256: 'f'.repeat(64) })
      .mockReturnValueOnce(pendingUpload.promise);
    const client = clientWith({
      upload,
      delete: (_reference, _guard, signal) => {
        cleanupSignal = signal;
        return deletion.promise;
      },
    });
    const { result } = renderDraftMediaHook({ client, initialReference: OLD, initialPreviewUrl: 'blob:old' });
    await act(() => result.current.replace(new File(['f'], 'f.png', { type: 'image/png' })));

    // When
    act(() => {
      void result.current.replace(new File(['pending'], 'pending.png', { type: 'image/png' }));
    });
    deletion.resolve({ ok: false, failure: { kind: 'aborted' } });
    await act(flushMicrotasks);

    // Then
    expect(cleanupSignal).toBeUndefined();
    expect(result.current.state).toEqual(expect.objectContaining({
      status: 'uploading', reference: OLD, previewUrl: 'blob:old',
      progress: { loaded: 0, total: 7 }, failure: null, unresolvedReferences: [F],
    }));
  });

  it('starts no cleanup on unlink or unmount and retains ownership state', async () => {
    // Given
    const unlinkDeletion = deferred<DraftDeleteResult>();
    const unmountDeletion = deferred<DraftDeleteResult>();
    const signals: (AbortSignal | undefined)[] = [];
    const client = clientWith({
      upload: () => Promise.resolve({ ok: true, outcome: 'created', reference: F, sha256: 'f'.repeat(64) }),
      delete: (_reference, _guard, signal) => {
        signals.push(signal);
        return signals.length === 1 ? unlinkDeletion.promise : unmountDeletion.promise;
      },
    });
    const ownershipScope = createDraftMediaOwnershipScope();
    const first = renderDraftMediaHook({ client, initialReference: OLD }, ownershipScope);
    await act(() => first.result.current.replace(new File(['f'], 'f.png', { type: 'image/png' })));

    // When
    act(() => first.result.current.unlink());
    const afterUnlink = first.result.current.state;
    const second = renderDraftMediaHook({ client, initialReference: OLD }, ownershipScope);
    await act(() => second.result.current.replace(new File(['f'], 'f.png', { type: 'image/png' })));
    second.unmount();

    // Then
    expect(signals).toEqual([]);
    expect(afterUnlink).toEqual(expect.objectContaining({
      status: 'idle', reference: null, unresolvedReferences: [F],
    }));
  });
});
