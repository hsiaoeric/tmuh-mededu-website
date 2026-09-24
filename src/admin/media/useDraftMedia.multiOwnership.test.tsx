// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DraftMediaReferenceSchema, type DraftMediaReference } from '@/content/media';
import type { DraftMediaClient, DraftUploadResult } from './types';
import { createDraftMediaOwnershipScope } from './draftMediaOwnership';
import { useDraftMedia } from './useDraftMedia';

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

function created(target: DraftMediaReference): DraftUploadResult {
  return { ok: true, outcome: 'created', reference: target, sha256: target.path.split('/')[1]?.slice(0, 64) ?? '' };
}

function reused(target: DraftMediaReference): DraftUploadResult {
  return { ok: true, outcome: 'reused', reference: target, sha256: target.path.split('/')[1]?.slice(0, 64) ?? '' };
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

const OLD = reference('a');
const C = reference('c');
const D = reference('d');
const E = reference('e');
const F = reference('f');

async function readyWithTwoUnresolved() {
  const first = deferred<DraftUploadResult>();
  const second = deferred<DraftUploadResult>();
  const third = deferred<DraftUploadResult>();
  const upload = vi.fn<DraftMediaClient['upload']>()
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise)
    .mockReturnValueOnce(third.promise);
  const preview = vi.fn<DraftMediaClient['createPreview']>(() => Promise.resolve({
    ok: true, url: 'https://signed.example/e', expiresAt: 301_000,
  }));
  const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
  const client: DraftMediaClient = { upload, createPreview: preview, delete: remove };
  const ownershipScope = createDraftMediaOwnershipScope();
  const hook = renderHook(() => useDraftMedia({
    client, ownershipScope, initialReference: OLD, initialPreviewUrl: 'blob:old', initialPreviewExpiresAt: 100,
  }));
  let firstReplacement = Promise.resolve();
  let secondReplacement = Promise.resolve();
  let thirdReplacement = Promise.resolve();
  act(() => {
    firstReplacement = hook.result.current.replace(new File(['c'], 'c.png', { type: 'image/png' }));
    secondReplacement = hook.result.current.replace(new File(['d'], 'd.png', { type: 'image/png' }));
  });
  first.resolve(created(C));
  await act(flushMicrotasks);
  act(() => {
    thirdReplacement = hook.result.current.replace(new File(['e'], 'e.png', { type: 'image/png' }));
  });
  second.resolve(created(D));
  await act(flushMicrotasks);
  third.resolve(created(E));
  await act(async () => {
    await Promise.all([firstReplacement, secondReplacement, thirdReplacement]);
  });
  return { ...hook, upload, preview, remove };
}

describe('useDraftMedia multi-reference ownership', () => {
  it('never grants cleanup ownership to a reused upload after preview failure', async () => {
    // Given
    const client: DraftMediaClient = {
      upload: () => Promise.resolve(reused(C)),
      createPreview: () => Promise.resolve({ ok: false, failure: { kind: 'transport-error' } }),
      delete: vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true })),
    };
    const ownershipScope = createDraftMediaOwnershipScope();
    const { result } = renderHook(() => useDraftMedia({ client, ownershipScope }));

    // When
    await act(() => result.current.replace(new File(['c'], 'c.png', { type: 'image/png' })));

    // Then
    expect(result.current.state.unresolvedReferences).toEqual([]);
    expect(client.delete).not.toHaveBeenCalled();
  });

  it('retains each stale created path when C and D are interrupted before E is adopted', async () => {
    // Given / When
    const { result, remove } = await readyWithTwoUnresolved();

    // Then
    expect(result.current.state).toEqual(expect.objectContaining({
      status: 'ready', reference: E, unresolvedReferences: [C, D, E],
    }));
    expect(remove).not.toHaveBeenCalled();
  });

  it('removes only the same path adopted by a later replacement', async () => {
    // Given
    const { result, upload } = await readyWithTwoUnresolved();
    upload.mockResolvedValueOnce(reused(C));

    // When
    await act(() => result.current.replace(new File(['c'], 'c-again.png', { type: 'image/png' })));

    // Then
    expect(result.current.state).toEqual(expect.objectContaining({
      status: 'ready', reference: C, unresolvedReferences: [C, D, E],
    }));
  });

  it('retains the exact created path after preview failure without scheduling cleanup', async () => {
    // Given
    const { result, upload, preview, remove } = await readyWithTwoUnresolved();
    upload.mockResolvedValueOnce(created(F));
    preview.mockResolvedValueOnce({ ok: false, failure: { kind: 'transport-error' } });
    let replacementSettled = false;
    act(() => {
      void result.current.replace(new File(['f'], 'f.png', { type: 'image/png' }))
        .then(() => { replacementSettled = true; });
    });
    await act(flushMicrotasks);
    // Then
    expect(replacementSettled).toBe(true);
    expect(remove).not.toHaveBeenCalled();
    expect(result.current.state.unresolvedReferences).toEqual([C, D, E, F]);
  });
});
