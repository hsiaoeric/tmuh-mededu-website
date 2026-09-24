import { describe, expect, it, vi } from 'vitest';
import committedSnapshot from './generated/cms-snapshot.json';
import { ContentBoundaryError, ContentRepositoryError } from './errors';
import { createSupabaseContentRepositoryFromRequest } from './supabaseRepository';

function row(kind: 'centers' | 'news') {
  const source = committedSnapshot.find((candidate) => candidate.kind === kind);
  if (source === undefined) throw new TypeError(`Missing committed ${kind} fixture`);
  return structuredClone(source);
}

describe('createSupabaseContentRepositoryFromRequest', () => {
  it('returns accepted content and row diagnostics from a mixed response', async () => {
    // Given
    const invalid = { ...row('news'), payload: { zh: {}, en: {} } };
    const repository = createSupabaseContentRepositoryFromRequest(() =>
      Promise.resolve({ data: [invalid, row('centers')], error: null }),
    );

    // When
    const batch = await repository.listPublished(new AbortController().signal);

    // Then
    expect(batch.content.map((content) => content.kind)).toEqual(['centers']);
    expect(batch.failures).toMatchObject([{
      identity: { kind: 'news', stableKey: 'announcements' },
    }]);
  });

  it('keeps a missing-kind row unidentifiable', async () => {
    // Given
    const { kind: removed, ...invalid } = row('news');
    const repository = createSupabaseContentRepositoryFromRequest(() =>
      Promise.resolve({ data: [invalid], error: null }),
    );

    // When
    const batch = await repository.listPublished(new AbortController().signal);

    // Then
    expect(removed).toBe('news');
    expect(batch.failures).toMatchObject([{ identity: null }]);
  });

  it('rejects RPC errors as repository errors', async () => {
    // Given
    const repository = createSupabaseContentRepositoryFromRequest(() =>
      Promise.resolve({ data: null, error: { code: '42501', message: 'denied' } }),
    );

    // When
    const request = repository.listPublished(new AbortController().signal);

    // Then
    await expect(request).rejects.toEqual(expect.objectContaining({
      name: 'ContentRepositoryError',
      code: '42501',
    } satisfies Partial<ContentRepositoryError>));
  });

  it('rejects non-array responses as request-level boundary errors', async () => {
    // Given
    const repository = createSupabaseContentRepositoryFromRequest(() =>
      Promise.resolve({ data: {}, error: null }),
    );

    // When
    const request = repository.listPublished(new AbortController().signal);

    // Then
    await expect(request).rejects.toBeInstanceOf(ContentBoundaryError);
  });

  it('forwards the exact abort signal to the request', async () => {
    // Given
    const request = vi.fn((_signal: AbortSignal) => Promise.resolve({ data: [], error: null }));
    const repository = createSupabaseContentRepositoryFromRequest(request);
    const signal = new AbortController().signal;

    // When
    await repository.listPublished(signal);

    // Then
    expect(request).toHaveBeenCalledWith(signal);
  });
});
