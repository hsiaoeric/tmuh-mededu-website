// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DraftMediaReferenceSchema } from '@/content/media';
import type { SupabaseConfiguration } from '@/content/env';
import type { DraftMediaClient } from './types';
import {
  AdminMediaRuntimeProvider,
  useMediaReferencePreview,
} from './index';

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

function clientWith(
  createPreview: DraftMediaClient['createPreview'],
): DraftMediaClient {
  return {
    upload: () => Promise.resolve({ ok: false, failure: { kind: 'transport-error' } }),
    createPreview,
    delete: () => Promise.resolve({ ok: true }),
  };
}

describe('useMediaReferencePreview', () => {
  it('signs an existing draft reference through the protected runtime', async () => {
    // Given
    const createPreview = vi.fn<DraftMediaClient['createPreview']>(() => Promise.resolve({
      ok: true,
      url: 'https://signed.example/portrait',
      expiresAt: 300_000,
    }));
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <AdminMediaRuntimeProvider configuration={configuration} client={clientWith(createPreview)}>
        {children}
      </AdminMediaRuntimeProvider>
    );

    // When
    const { result } = renderHook(() => useMediaReferencePreview(reference), { wrapper });
    await act(async () => Promise.resolve());

    // Then
    expect(result.current).toEqual({
      status: 'ready',
      url: 'https://signed.example/portrait',
      expiresAt: 300_000,
    });
    expect(createPreview).toHaveBeenCalledWith(reference, expect.any(AbortSignal));
  });

  it('reports a draft preview failure without inventing a URL', async () => {
    // Given
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <AdminMediaRuntimeProvider
        configuration={configuration}
        client={clientWith(() => Promise.resolve({ ok: false, failure: { kind: 'storage-failure' } }))}
      >
        {children}
      </AdminMediaRuntimeProvider>
    );

    // When
    const { result } = renderHook(() => useMediaReferencePreview(reference), { wrapper });
    await act(async () => Promise.resolve());

    // Then
    expect(result.current).toEqual({ status: 'error' });
  });

  it('settles a rejected draft preview in a terminal error state', async () => {
    // Given
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <AdminMediaRuntimeProvider
        configuration={configuration}
        client={clientWith(() => Promise.reject(new TypeError('protocol violation')))}
      >
        {children}
      </AdminMediaRuntimeProvider>
    );

    // When
    const { result } = renderHook(() => useMediaReferencePreview(reference), { wrapper });
    await act(async () => Promise.resolve());

    // Then
    expect(result.current).toEqual({ status: 'error' });
  });

  it('consumes a late preview rejection after unmount without changing state', async () => {
    // Given
    let rejectPreview: (reason?: unknown) => void = () => undefined;
    let operationSignal: AbortSignal | undefined;
    const preview = new Promise<never>((_resolve, reject) => {
      rejectPreview = reject;
    });
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <AdminMediaRuntimeProvider
        configuration={configuration}
        client={clientWith((_reference, signal) => {
          operationSignal = signal;
          return preview;
        })}
      >
        {children}
      </AdminMediaRuntimeProvider>
    );
    const { unmount } = renderHook(() => useMediaReferencePreview(reference), { wrapper });

    // When
    unmount();
    rejectPreview(new TypeError('late protocol violation'));
    await act(async () => Promise.resolve());

    // Then
    expect(operationSignal?.aborted).toBe(true);
  });
});
