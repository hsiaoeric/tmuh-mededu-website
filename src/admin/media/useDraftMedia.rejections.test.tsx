// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DraftMediaReferenceSchema } from '@/content/media';
import { createDraftMediaOwnershipScope } from './draftMediaOwnership';
import type { DraftMediaClient } from './types';
import { useDraftMedia } from './useDraftMedia';

const OLD = DraftMediaReferenceSchema.parse({
  kind: 'draft',
  bucket: 'draft-media',
  path: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png',
});
const CREATED = DraftMediaReferenceSchema.parse({
  kind: 'draft',
  bucket: 'draft-media',
  path: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png',
});

function clientWith(overrides: Partial<DraftMediaClient>): DraftMediaClient {
  return {
    upload: () => Promise.resolve({ ok: false, failure: { kind: 'transport-error' } }),
    createPreview: () => Promise.resolve({ ok: false, failure: { kind: 'transport-error' } }),
    delete: () => Promise.resolve({ ok: true }),
    ...overrides,
  };
}

describe('useDraftMedia rejected client promises', () => {
  it('settles a rejected upload in error without inventing unresolved provenance', async () => {
    // Given
    const client = clientWith({ upload: () => Promise.reject(new TypeError('protocol violation')) });
    const { result } = renderHook(() => useDraftMedia({
      client,
      ownershipScope: createDraftMediaOwnershipScope(),
      initialReference: OLD,
      initialPreviewUrl: 'blob:old',
    }));

    // When
    let replacement: Promise<void> = Promise.resolve();
    await act(async () => {
      replacement = result.current.replace(new File(['new'], 'new.png', { type: 'image/png' }));
      await expect(replacement).resolves.toBeUndefined();
    });

    // Then
    expect(result.current.state).toEqual(expect.objectContaining({
      status: 'error',
      reference: OLD,
      previewUrl: 'blob:old',
      failure: { kind: 'transport-error' },
      unresolvedReferences: [],
    }));
  });

  it('settles a rejected preview in error and retains only the created upload', async () => {
    // Given
    const client = clientWith({
      upload: () => Promise.resolve({
        ok: true,
        outcome: 'created',
        reference: CREATED,
        sha256: 'b'.repeat(64),
      }),
      createPreview: () => Promise.reject(new TypeError('protocol violation')),
    });
    const { result } = renderHook(() => useDraftMedia({
      client,
      ownershipScope: createDraftMediaOwnershipScope(),
      initialReference: OLD,
    }));

    // When
    let replacement: Promise<void> = Promise.resolve();
    await act(async () => {
      replacement = result.current.replace(new File(['new'], 'new.png', { type: 'image/png' }));
      await expect(replacement).resolves.toBeUndefined();
    });

    // Then
    expect(result.current.state).toEqual(expect.objectContaining({
      status: 'error',
      reference: OLD,
      failure: { kind: 'transport-error' },
      unresolvedReferences: [CREATED],
    }));
  });

  it('settles a rejected delete in error without removing the current reference', async () => {
    // Given
    const client = clientWith({ delete: () => Promise.reject(new TypeError('protocol violation')) });
    const { result } = renderHook(() => useDraftMedia({
      client,
      ownershipScope: createDraftMediaOwnershipScope(),
      initialReference: OLD,
    }));

    // When
    let deletion: Promise<void> = Promise.resolve();
    await act(async () => {
      deletion = result.current.deleteFromStorage({
        referencedByEditor: false,
        referencedBySavedDraft: false,
      });
      await expect(deletion).resolves.toBeUndefined();
    });

    // Then
    expect(result.current.state).toEqual(expect.objectContaining({
      status: 'error',
      reference: OLD,
      failure: { kind: 'transport-error' },
    }));
  });
});
