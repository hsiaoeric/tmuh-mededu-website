// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DraftMediaReferenceSchema, type DraftMediaReference } from '@/content/media';
import type {
  DraftDeleteGuard,
  DraftDeleteResult,
  DraftMediaClient,
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
  const promise = new Promise<Value>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

function fakeClient(overrides: Partial<DraftMediaClient> = {}): DraftMediaClient {
  return {
    upload: () => Promise.resolve({ ok: false, failure: { kind: 'transport-error' } }),
    createPreview: () => Promise.resolve({ ok: false, failure: { kind: 'transport-error' } }),
    delete: () => Promise.resolve({ ok: true }),
    ...overrides,
  };
}

function renderDraftMediaHook(options: Omit<DraftMediaOptions, 'ownershipScope'>) {
  const ownershipScope = createDraftMediaOwnershipScope();
  return renderHook(() => useDraftMedia({ ...options, ownershipScope }));
}

const OLD = reference('a');
const NEXT = reference('b');

describe('useDraftMedia', () => {
  it('preserves the prior asset and preview when replacement upload fails', async () => {
    // Given
    const client = fakeClient();
    const { result } = renderDraftMediaHook({ client, initialReference: OLD, initialPreviewUrl: 'blob:old' });

    // When
    await act(() => result.current.replace(new File(['new'], 'new.png', { type: 'image/png' })));

    // Then
    expect(result.current.state).toEqual(expect.objectContaining({
      status: 'error', reference: OLD, previewUrl: 'blob:old',
    }));
  });

  it('preserves the prior asset and retains created ownership when replacement preview fails', async () => {
    // Given
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
    const client = fakeClient({
      upload: () => Promise.resolve({ ok: true, outcome: 'created', reference: NEXT, sha256: 'b'.repeat(64) }),
      delete: remove,
    });
    const { result } = renderDraftMediaHook({ client, initialReference: OLD, initialPreviewUrl: 'blob:old' });

    // When
    await act(() => result.current.replace(new File(['new'], 'new.png', { type: 'image/png' })));

    // Then
    expect(result.current.state).toEqual(expect.objectContaining({
      status: 'error', reference: OLD, previewUrl: 'blob:old', unresolvedReferences: [NEXT],
    }));
    expect(remove).not.toHaveBeenCalled();
  });

  it('never removes a reused upload when preview signing fails', async () => {
    // Given
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
    const client = fakeClient({
      upload: () => Promise.resolve({ ok: true, outcome: 'reused', reference: NEXT, sha256: 'b'.repeat(64) }),
      delete: remove,
    });
    const { result } = renderDraftMediaHook({ client, initialReference: OLD });

    // When
    await act(() => result.current.replace(new File(['new'], 'new.png', { type: 'image/png' })));

    // Then
    expect(remove).not.toHaveBeenCalled();
  });

  it('retains the created reference as actionable metadata when compensation fails', async () => {
    // Given
    const client = fakeClient({
      upload: () => Promise.resolve({ ok: true, outcome: 'created', reference: NEXT, sha256: 'b'.repeat(64) }),
      delete: () => Promise.resolve({ ok: false, failure: { kind: 'storage-failure' } }),
    });
    const { result } = renderDraftMediaHook({ client, initialReference: OLD, initialPreviewUrl: 'blob:old' });

    // When
    await act(() => result.current.replace(new File(['new'], 'new.png', { type: 'image/png' })));

    // Then
    expect(result.current.state).toEqual(expect.objectContaining({
      status: 'error',
      reference: OLD,
      previewUrl: 'blob:old',
      unresolvedReferences: [NEXT],
    }));
  });

  it('retains a stale created upload while a newer replacement could adopt it', async () => {
    // Given
    const first = deferred<DraftUploadResult>();
    const second = deferred<DraftUploadResult>();
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
    const client = fakeClient({
      upload: vi.fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
      createPreview: () => Promise.resolve({ ok: true, url: 'https://signed.example/new', expiresAt: 301_000 }),
      delete: remove,
    });
    const { result } = renderDraftMediaHook({ client, initialReference: OLD });
    let firstReplacement: Promise<void> = Promise.resolve();
    let secondReplacement: Promise<void> = Promise.resolve();
    act(() => {
      firstReplacement = result.current.replace(new File(['first'], 'first.png', { type: 'image/png' }));
      secondReplacement = result.current.replace(new File(['second'], 'second.png', { type: 'image/png' }));
    });

    // When
    first.resolve({ ok: true, outcome: 'created', reference: reference('c'), sha256: 'c'.repeat(64) });
    second.resolve({ ok: true, outcome: 'created', reference: NEXT, sha256: 'b'.repeat(64) });
    await act(async () => { await Promise.all([firstReplacement, secondReplacement]); });

    // Then
    expect(remove).not.toHaveBeenCalled();
    expect(result.current.state.reference).toBe(NEXT);
    expect(result.current.state.unresolvedReferences).toEqual([reference('c'), NEXT]);
  });

  it('does not compensate a stale object adopted by the newer replacement', async () => {
    // Given
    const first = deferred<DraftUploadResult>();
    const second = deferred<DraftUploadResult>();
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
    const upload = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const client = fakeClient({
      upload,
      createPreview: () => Promise.resolve({ ok: true, url: 'https://signed.example/new', expiresAt: 301_000 }),
      delete: remove,
    });
    const { result } = renderDraftMediaHook({ client, initialReference: OLD });
    let firstReplacement: Promise<void> = Promise.resolve();
    let secondReplacement: Promise<void> = Promise.resolve();
    act(() => {
      firstReplacement = result.current.replace(new File(['same'], 'same.png', { type: 'image/png' }));
      secondReplacement = result.current.replace(new File(['same'], 'same.png', { type: 'image/png' }));
    });

    // When
    first.resolve({ ok: true, outcome: 'created', reference: NEXT, sha256: 'b'.repeat(64) });
    second.resolve({ ok: true, outcome: 'reused', reference: NEXT, sha256: 'b'.repeat(64) });
    await act(async () => { await Promise.all([firstReplacement, secondReplacement]); });

    // Then
    expect(result.current.state.reference).toBe(NEXT);
    expect(remove).not.toHaveBeenCalled();
  });

  it('retains created ownership when upload completes after unlink', async () => {
    // Given
    const upload = deferred<DraftUploadResult>();
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
    const client = fakeClient({ upload: () => upload.promise, delete: remove });
    const { result } = renderDraftMediaHook({ client });
    let replacement: Promise<void> = Promise.resolve();
    act(() => { replacement = result.current.replace(new File(['new'], 'new.png', { type: 'image/png' })); });

    // When
    act(() => result.current.unlink());
    upload.resolve({ ok: true, outcome: 'created', reference: NEXT, sha256: 'b'.repeat(64) });
    await act(async () => { await replacement; });

    // Then
    expect(remove).not.toHaveBeenCalled();
    expect(result.current.state.reference).toBeNull();
    expect(result.current.state.unresolvedReferences).toEqual([NEXT]);
  });

  it('ignores a stale upload after a newer replacement completes', async () => {
    // Given
    const first = deferred<DraftUploadResult>();
    const second = deferred<DraftUploadResult>();
    const upload = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const client = fakeClient({
      upload,
      createPreview: () => Promise.resolve({ ok: true, url: 'https://signed.example/new', expiresAt: 301_000 }),
    });
    const { result } = renderDraftMediaHook({ client, initialReference: OLD, initialPreviewUrl: 'blob:old' });

    // When
    let firstPromise: Promise<void> = Promise.resolve();
    let secondPromise: Promise<void> = Promise.resolve();
    act(() => {
      firstPromise = result.current.replace(new File(['first'], 'first.png', { type: 'image/png' }));
      secondPromise = result.current.replace(new File(['second'], 'second.png', { type: 'image/png' }));
    });
    await act(async () => {
      second.resolve({ ok: true, outcome: 'created', reference: NEXT, sha256: 'b'.repeat(64) });
      await secondPromise;
    });
    await act(async () => {
      first.resolve({ ok: true, outcome: 'created', reference: reference('c'), sha256: 'c'.repeat(64) });
      await firstPromise;
    });

    // Then
    expect(result.current.state).toEqual(expect.objectContaining({
      status: 'ready', reference: NEXT, previewUrl: 'https://signed.example/new',
    }));
  });

  it('aborts the active request on unmount without starting cleanup after lifecycle end', async () => {
    // Given
    const pending = deferred<DraftUploadResult>();
    let operationSignal: AbortSignal | undefined;
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
    const client = fakeClient({
      upload: (_file, _progress, signal) => {
        operationSignal = signal;
        return pending.promise;
      },
      delete: remove,
    });
    const { result, unmount } = renderDraftMediaHook({ client });
    let replacement: Promise<void> = Promise.resolve();
    act(() => {
      replacement = result.current.replace(new File(['new'], 'new.png', { type: 'image/png' }));
    });

    // When
    unmount();
    pending.resolve({ ok: true, outcome: 'created', reference: NEXT, sha256: 'b'.repeat(64) });
    await replacement;

    // Then
    expect(operationSignal?.aborted).toBe(true);
    expect(remove).not.toHaveBeenCalled();
  });

  it('separates unlink from guarded storage deletion', async () => {
    // Given
    const deletion = deferred<DraftDeleteResult>();
    const remove = vi.fn((_reference: DraftMediaReference, _guard: DraftDeleteGuard) => deletion.promise);
    const client = fakeClient({ delete: remove });
    const { result } = renderDraftMediaHook({ client, initialReference: OLD, initialPreviewUrl: 'blob:old' });

    // When
    act(() => result.current.unlink());

    // Then
    expect(remove).not.toHaveBeenCalled();
    expect(result.current.state.reference).toBeNull();
  });

  it('keeps the asset on guarded-delete failure and unlinks it after successful deletion', async () => {
    // Given
    const outcomes: readonly DraftDeleteResult[] = [
      { ok: false, failure: { kind: 'still-referenced' } },
      { ok: true },
    ];
    let index = 0;
    const client = fakeClient({ delete: () => Promise.resolve(outcomes[index++] ?? { ok: true }) });
    const { result } = renderDraftMediaHook({ client, initialReference: OLD, initialPreviewUrl: 'blob:old' });
    const guard = { referencedByEditor: false, referencedBySavedDraft: false };

    // When
    await act(() => result.current.deleteFromStorage(guard));
    const afterFailure = result.current.state;
    await act(() => result.current.deleteFromStorage(guard));

    // Then
    expect(afterFailure.reference).toBe(OLD);
    expect(result.current.state.reference).toBeNull();
  });
});
