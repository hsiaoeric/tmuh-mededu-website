// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DraftMediaReferenceSchema, type DraftMediaReference } from '@/content/media';
import type {
  DraftDeleteResult,
  DraftMediaClient,
  DraftPreviewResult,
  DraftUploadResult,
} from './types';
import { createDraftMediaOwnershipScope } from './draftMediaOwnership';
import { useDraftMedia, type DraftMediaOptions } from './useDraftMedia';

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function reference(character: string): DraftMediaReference {
  return DraftMediaReferenceSchema.parse({
    kind: 'draft',
    bucket: 'draft-media',
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

function fakeClient(overrides: Partial<DraftMediaClient>): DraftMediaClient {
  return {
    upload: () => Promise.resolve({ ok: false, failure: { kind: 'transport-error' } }),
    createPreview: () => Promise.resolve({ ok: false, failure: { kind: 'transport-error' } }),
    delete: () => Promise.resolve({ ok: true }),
    ...overrides,
  };
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function renderDraftMediaHook(options: Omit<DraftMediaOptions, 'ownershipScope'>) {
  const ownershipScope = createDraftMediaOwnershipScope();
  return renderHook(() => useDraftMedia({ ...options, ownershipScope }));
}

const OLD = reference('a');
const NEXT = reference('b');

describe('useDraftMedia ownership settlement', () => {
  it('settles a stale created replacement while the newer upload remains pending', async () => {
    // Given
    const first = deferred<DraftUploadResult>();
    const second = deferred<DraftUploadResult>();
    const client = fakeClient({
      upload: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise),
    });
    const { result, unmount } = renderDraftMediaHook({ client, initialReference: OLD });
    let firstSettled = false;
    let firstReplacement = Promise.resolve();
    act(() => {
      firstReplacement = result.current.replace(new File(['first'], 'first.png', { type: 'image/png' }));
      void firstReplacement.then(() => { firstSettled = true; });
      void result.current.replace(new File(['second'], 'second.png', { type: 'image/png' }));
    });

    // When
    await act(async () => {
      first.resolve({ ok: true, outcome: 'created', reference: NEXT, sha256: 'b'.repeat(64) });
      await first.promise;
      await flushMicrotasks();
    });

    // Then
    expect(firstSettled).toBe(true);
    expect(result.current.state).toEqual(expect.objectContaining({
      status: 'uploading',
      reference: OLD,
      unresolvedReferences: [NEXT],
    }));
    unmount();
  });

  it('retains created ownership after preview failure without automatic deletion', async () => {
    // Given
    const deletion = deferred<DraftDeleteResult>();
    const remove = vi.fn<DraftMediaClient['delete']>(() => deletion.promise);
    const client = fakeClient({
      upload: () => Promise.resolve({ ok: true, outcome: 'created', reference: NEXT, sha256: 'b'.repeat(64) }),
      delete: remove,
    });
    const { result, unmount } = renderDraftMediaHook({ client, initialReference: OLD });
    let replacementSettled = false;

    // When
    act(() => {
      void result.current.replace(new File(['new'], 'new.png', { type: 'image/png' }))
        .then(() => { replacementSettled = true; });
    });
    await act(flushMicrotasks);

    // Then
    expect(remove).not.toHaveBeenCalled();
    expect(replacementSettled).toBe(true);
    expect(result.current.state.unresolvedReferences).toEqual([NEXT]);
    act(() => result.current.unlink());
    expect(replacementSettled).toBe(true);
    expect(result.current.state.unresolvedReferences).toEqual([NEXT]);
    unmount();
    await flushMicrotasks();
    expect(replacementSettled).toBe(true);
  });

  it('does not compensate a path claimed by a newer in-flight replacement', async () => {
    // Given
    const first = deferred<DraftUploadResult>();
    const second = deferred<DraftUploadResult>();
    const preview = deferred<DraftPreviewResult>();
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
    const client = fakeClient({
      upload: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise),
      createPreview: () => preview.promise,
      delete: remove,
    });
    const { result, unmount } = renderDraftMediaHook({ client, initialReference: OLD });
    act(() => {
      void result.current.replace(new File(['first'], 'first.png', { type: 'image/png' }));
      void result.current.replace(new File(['second'], 'second.png', { type: 'image/png' }));
    });

    // When
    second.resolve({ ok: true, outcome: 'reused', reference: NEXT, sha256: 'b'.repeat(64) });
    await act(flushMicrotasks);
    first.resolve({ ok: true, outcome: 'created', reference: NEXT, sha256: 'b'.repeat(64) });
    await act(async () => {
      await first.promise;
      await flushMicrotasks();
    });

    // Then
    expect(remove).not.toHaveBeenCalled();
    unmount();
  });

  it('never starts automatic deletion before a reused replacement adopts the created path', async () => {
    // Given
    const deletion = deferred<DraftDeleteResult>();
    let cleanupSignal: AbortSignal | undefined;
    const client = fakeClient({
      upload: vi.fn()
        .mockResolvedValueOnce({ ok: true, outcome: 'created', reference: NEXT, sha256: 'b'.repeat(64) })
        .mockResolvedValueOnce({ ok: true, outcome: 'reused', reference: NEXT, sha256: 'b'.repeat(64) }),
      createPreview: vi.fn()
        .mockResolvedValueOnce({ ok: false, failure: { kind: 'transport-error' } })
        .mockResolvedValueOnce({ ok: true, url: 'https://signed.example/new', expiresAt: 301_000 }),
      delete: (_reference, _guard, signal) => {
        cleanupSignal = signal;
        return deletion.promise;
      },
    });
    const { result } = renderDraftMediaHook({ client, initialReference: OLD });
    let firstReplacement = Promise.resolve();
    act(() => {
      firstReplacement = result.current.replace(new File(['first'], 'first.png', { type: 'image/png' }));
    });
    await act(flushMicrotasks);

    // When
    await act(() => result.current.replace(new File(['second'], 'second.png', { type: 'image/png' })));
    deletion.resolve({ ok: true });
    await act(async () => {
      await firstReplacement;
      await flushMicrotasks();
    });

    // Then
    expect(cleanupSignal).toBeUndefined();
    expect(result.current.state).toEqual(expect.objectContaining({
      status: 'ready', reference: NEXT, unresolvedReferences: [NEXT],
    }));
  });

  it('retains orphan metadata after unlink when aborted cleanup completes late', async () => {
    // Given
    const deletion = deferred<DraftDeleteResult>();
    const client = fakeClient({
      upload: () => Promise.resolve({ ok: true, outcome: 'created', reference: NEXT, sha256: 'b'.repeat(64) }),
      delete: () => deletion.promise,
    });
    const { result } = renderDraftMediaHook({ client, initialReference: OLD });
    let replacementSettled = false;
    act(() => {
      void result.current.replace(new File(['new'], 'new.png', { type: 'image/png' }))
        .then(() => { replacementSettled = true; });
    });
    await act(flushMicrotasks);

    // When
    act(() => result.current.unlink());
    deletion.resolve({ ok: false, failure: { kind: 'aborted' } });
    await act(flushMicrotasks);

    // Then
    expect(replacementSettled).toBe(true);
    expect(result.current.state).toEqual(expect.objectContaining({
      status: 'idle', reference: null, unresolvedReferences: [NEXT],
    }));
  });

  it('preserves an unrelated orphan while deleting the current reference', async () => {
    // Given
    const remove = vi.fn<DraftMediaClient['delete']>().mockResolvedValue({ ok: true });
    const client = fakeClient({
      upload: () => Promise.resolve({ ok: true, outcome: 'created', reference: NEXT, sha256: 'b'.repeat(64) }),
      delete: remove,
    });
    const { result } = renderDraftMediaHook({ client, initialReference: OLD });
    await act(() => result.current.replace(new File(['new'], 'new.png', { type: 'image/png' })));
    await act(flushMicrotasks);

    // When
    await act(() => result.current.deleteFromStorage({
      referencedByEditor: false,
      referencedBySavedDraft: false,
    }));

    // Then
    expect(result.current.state).toEqual(expect.objectContaining({
      status: 'idle', reference: null, unresolvedReferences: [NEXT],
    }));
  });
});
