import { describe, expect, it, vi } from 'vitest';
import {
  createPublicationClient,
  createSupabasePublicationOperations,
  type PublicationOperations,
} from './publicationClient';
import { DOCUMENT_ID, REVISION_ID, REVISION_ROW } from './testFixtures';

const INPUT = {
  documentId: DOCUMENT_ID,
  revisionId: REVISION_ID,
  expectedEditVersion: 2,
} as const;

function operations(result: Awaited<ReturnType<PublicationOperations['invoke']>>) {
  const invoke = vi.fn(() => Promise.resolve(result));
  return { adapter: { invoke } satisfies PublicationOperations, invoke };
}

describe('cms-publish publication client', () => {
  it('reads a non-2xx JSON body from the actual Supabase response field', async () => {
    // Given
    const response = new Response(JSON.stringify({ ok: false, error: { code: 'storage-failure', retryable: true } }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
    const functions = {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: new TypeError('non-2xx'), response })),
    };
    const adapter = createSupabasePublicationOperations(functions);

    // When
    const result = await adapter.invoke('cms-publish', { body: INPUT });

    // Then
    expect(result.errorBody).toEqual({ ok: false, error: { code: 'storage-failure', retryable: true } });
  });
  it('invokes the Edge Function with only canonical coordinates and the caller signal', async () => {
    // Given
    const edge = operations({
      data: {
        ok: true,
        revision: { ...REVISION_ROW, status: 'published' },
        media: { draftReferences: 1, objectsCreated: 1, objectsReused: 0 },
      },
      error: null,
      errorBody: null,
    });
    const client = createPublicationClient(edge.adapter);
    const signal = new AbortController().signal;

    // When
    const result = await client.publish(INPUT, signal);

    // Then
    expect(result).toEqual({ ok: true, value: expect.objectContaining({ status: 'published' }) });
    expect(edge.invoke).toHaveBeenCalledWith('cms-publish', { body: INPUT, signal });
  });

  it.each([
    ['authentication-required', false],
    ['draft-media-missing', false],
    ['storage-failure', true],
    ['deadline-exceeded', true],
    ['stale-edit-version', false],
  ] as const)('preserves Edge code %s and retryability', async (code, retryable) => {
    // Given
    const edge = operations({
      data: null,
      error: new TypeError('Edge function returned a non-2xx response'),
      errorBody: { ok: false, error: { code, retryable } },
    });
    const client = createPublicationClient(edge.adapter);

    // When
    const result = await client.publish(INPUT);

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'publication-error', code, retryable } });
  });

  it('rejects malformed success and failure response bodies', async () => {
    // Given
    const malformedSuccess = createPublicationClient(operations({ data: { ok: true }, error: null, errorBody: null }).adapter);
    const malformedFailure = createPublicationClient(operations({ data: null, error: new TypeError('HTTP'), errorBody: { error: 'bad' } }).adapter);

    // When
    const results = await Promise.all([
      malformedSuccess.publish(INPUT),
      malformedFailure.publish(INPUT),
    ]);

    // Then
    expect(results).toEqual([
      { ok: false, failure: { kind: 'malformed-payload' } },
      { ok: false, failure: { kind: 'malformed-payload' } },
    ]);
  });

  it('distinguishes caller abort from transport failure', async () => {
    // Given
    const controller = new AbortController();
    controller.abort();
    const aborted = createPublicationClient(operations({ data: null, error: new DOMException('Aborted', 'AbortError'), errorBody: null }).adapter);
    const failed = createPublicationClient(operations({ data: null, error: new TypeError('offline'), errorBody: null }).adapter);

    // When
    const results = await Promise.all([
      aborted.publish(INPUT, controller.signal),
      failed.publish(INPUT),
    ]);

    // Then
    expect(results).toEqual([
      { ok: false, failure: { kind: 'aborted' } },
      { ok: false, failure: expect.objectContaining({ kind: 'transport-error' }) },
    ]);
  });
});
