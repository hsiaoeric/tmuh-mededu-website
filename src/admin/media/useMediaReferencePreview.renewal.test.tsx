// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseConfiguration } from '@/content/env';
import {
  DraftMediaReferenceSchema,
  LocalMediaReferenceSchema,
  PublicMediaReferenceSchema,
  type MediaReference,
} from '@/content/media';
import { AdminMediaRuntimeProvider, useMediaReferencePreview } from './index';
import type { DraftMediaClient, DraftPreviewResult } from './types';

const configuration = {
  kind: 'configured',
  config: {
    url: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
  },
} satisfies SupabaseConfiguration;

const reference = DraftMediaReferenceSchema.parse({
  kind: 'draft',
  bucket: 'draft-media',
  path: '11111111-1111-4111-8111-111111111111/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp',
});
const nextReference = DraftMediaReferenceSchema.parse({
  kind: 'draft',
  bucket: 'draft-media',
  path: '11111111-1111-4111-8111-111111111111/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.webp',
});

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

function clientWith(createPreview: DraftMediaClient['createPreview']): DraftMediaClient {
  return {
    upload: () => Promise.resolve({ ok: false, failure: { kind: 'transport-error' } }),
    createPreview,
    delete: () => Promise.resolve({ ok: true }),
  };
}

function wrapperFor(client: DraftMediaClient) {
  return function PreviewWrapper({ children }: { readonly children: ReactNode }) {
    return (
      <AdminMediaRuntimeProvider configuration={configuration} client={client}>
        {children}
      </AdminMediaRuntimeProvider>
    );
  };
}

async function settle(): Promise<void> {
  await act(async () => Promise.resolve());
}

describe('useMediaReferencePreview renewal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renews a draft preview thirty seconds before expiry', async () => {
    // Given
    const createPreview = vi.fn<DraftMediaClient['createPreview']>()
      .mockResolvedValueOnce({ ok: true, url: 'https://signed.example/old', expiresAt: 60_000 })
      .mockResolvedValueOnce({ ok: true, url: 'https://signed.example/new', expiresAt: 120_000 });
    const { result } = renderHook(() => useMediaReferencePreview(reference), {
      wrapper: wrapperFor(clientWith(createPreview)),
    });
    await settle();

    // When
    await act(async () => {
      vi.advanceTimersByTime(30_000);
      await Promise.resolve();
    });

    // Then
    expect(createPreview).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({
      status: 'ready',
      url: 'https://signed.example/new',
      expiresAt: 120_000,
    });
  });

  it('retains the usable URL while renewal is pending then swaps URL and expiry together', async () => {
    // Given
    const renewal = deferred<DraftPreviewResult>();
    const createPreview = vi.fn<DraftMediaClient['createPreview']>()
      .mockResolvedValueOnce({ ok: true, url: 'https://signed.example/old', expiresAt: 60_000 })
      .mockReturnValueOnce(renewal.promise);
    const { result } = renderHook(() => useMediaReferencePreview(reference), {
      wrapper: wrapperFor(clientWith(createPreview)),
    });
    await settle();

    // When
    act(() => vi.advanceTimersByTime(30_000));

    // Then
    expect(result.current).toEqual({
      status: 'ready',
      url: 'https://signed.example/old',
      expiresAt: 60_000,
    });

    // When
    await act(async () => {
      renewal.resolve({ ok: true, url: 'https://signed.example/new', expiresAt: 120_000 });
      await Promise.resolve();
    });

    // Then
    expect(result.current).toEqual({
      status: 'ready',
      url: 'https://signed.example/new',
      expiresAt: 120_000,
    });
  });

  it('settles a rejected renewal as a terminal error without another timer', async () => {
    // Given
    const createPreview = vi.fn<DraftMediaClient['createPreview']>()
      .mockResolvedValueOnce({ ok: true, url: 'https://signed.example/old', expiresAt: 60_000 })
      .mockRejectedValueOnce(new TypeError('protocol violation'));
    const { result } = renderHook(() => useMediaReferencePreview(reference), {
      wrapper: wrapperFor(clientWith(createPreview)),
    });
    await settle();

    // When
    await act(async () => {
      vi.advanceTimersByTime(30_000);
      await Promise.resolve();
    });

    // Then
    expect(result.current).toEqual({ status: 'error' });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(300_000);
    expect(createPreview).toHaveBeenCalledTimes(2);
  });

  it('clamps a near-expiry preview so renewal cannot spin at zero delay', async () => {
    // Given
    const createPreview = vi.fn<DraftMediaClient['createPreview']>(() => Promise.resolve({
      ok: true,
      url: 'https://signed.example/near-expiry',
      expiresAt: 100,
    }));
    renderHook(() => useMediaReferencePreview(reference), {
      wrapper: wrapperFor(clientWith(createPreview)),
    });
    await settle();

    // When
    vi.advanceTimersByTime(999);

    // Then
    expect(createPreview).toHaveBeenCalledTimes(1);

    // When
    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    // Then
    expect(createPreview).toHaveBeenCalledTimes(2);
  });

  it('aborts pending renewal and ignores its result when the path changes', async () => {
    // Given
    const staleRenewal = deferred<DraftPreviewResult>();
    let renewalSignal: AbortSignal | undefined;
    let firstPathCalls = 0;
    const createPreview = vi.fn<DraftMediaClient['createPreview']>((candidate, signal) => {
      if (candidate.path === nextReference.path) {
        return Promise.resolve({ ok: true, url: 'https://signed.example/next', expiresAt: 120_000 });
      }
      firstPathCalls += 1;
      if (firstPathCalls === 1) {
        return Promise.resolve({ ok: true, url: 'https://signed.example/old', expiresAt: 60_000 });
      }
      renewalSignal = signal;
      return staleRenewal.promise;
    });
    const { result, rerender } = renderHook(
      ({ mediaReference }: { readonly mediaReference: MediaReference }) => useMediaReferencePreview(mediaReference),
      { initialProps: { mediaReference: reference }, wrapper: wrapperFor(clientWith(createPreview)) },
    );
    await settle();
    act(() => vi.advanceTimersByTime(30_000));

    // When
    rerender({ mediaReference: nextReference });
    await settle();
    staleRenewal.resolve({ ok: true, url: 'https://signed.example/stale', expiresAt: 180_000 });
    await settle();

    // Then
    expect(renewalSignal?.aborted).toBe(true);
    expect(result.current).toEqual({
      status: 'ready',
      url: 'https://signed.example/next',
      expiresAt: 120_000,
    });
  });

  it('aborts pending renewal and clears timers on unmount', async () => {
    // Given
    const renewal = deferred<DraftPreviewResult>();
    let renewalSignal: AbortSignal | undefined;
    const createPreview = vi.fn<DraftMediaClient['createPreview']>()
      .mockResolvedValueOnce({ ok: true, url: 'https://signed.example/old', expiresAt: 60_000 })
      .mockImplementationOnce((_candidate, signal) => {
        renewalSignal = signal;
        return renewal.promise;
      });
    const { unmount } = renderHook(() => useMediaReferencePreview(reference), {
      wrapper: wrapperFor(clientWith(createPreview)),
    });
    await settle();
    act(() => vi.advanceTimersByTime(30_000));

    // When
    unmount();

    // Then
    expect(renewalSignal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('never schedules renewal for local or public references', async () => {
    // Given
    const localReference = LocalMediaReferenceSchema.parse({ kind: 'local', path: 'assets/portrait.webp' });
    const digest = 'c'.repeat(64);
    const publicReference = PublicMediaReferenceSchema.parse({
      kind: 'public',
      bucket: 'public-media',
      path: `${digest}/${digest}.webp`,
    });
    const initialProps: { readonly mediaReference: MediaReference } = {
      mediaReference: localReference,
    };
    const createPreview = vi.fn<DraftMediaClient['createPreview']>();
    const { rerender } = renderHook(
      ({ mediaReference }: { readonly mediaReference: MediaReference }) => useMediaReferencePreview(mediaReference),
      { initialProps, wrapper: wrapperFor(clientWith(createPreview)) },
    );
    await settle();

    // When
    rerender({ mediaReference: publicReference });
    await settle();

    // Then
    expect(createPreview).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
