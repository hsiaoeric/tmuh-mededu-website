import { describe, expect, it } from 'vitest';
import committedSnapshot from './generated/cms-snapshot.json';
import { ContentBoundaryError } from './errors';
import { parsePublishedContentBatch, parsePublishedContentRows } from './parsers';

function fixture(kind: 'centers' | 'news') {
  const row = committedSnapshot.find((candidate) => candidate.kind === kind);
  if (row === undefined) throw new TypeError(`Missing committed ${kind} fixture`);
  return structuredClone(row);
}

describe('parsePublishedContentRows', () => {
  it('rejects a malformed bilingual payload', () => {
    // Given
    const row = {
      document_id: '11111111-1111-4111-8111-111111111111',
      kind: 'news',
      stable_key: 'announcements',
      revision_id: '22222222-2222-4222-8222-222222222222',
      version: 1,
      payload: { zh: { title: '公告' }, en: [] },
      published_at: '2026-08-14T00:00:00Z',
    };

    // When
    const parse = () => parsePublishedContentRows([row]);

    // Then
    expect(parse).toThrow(ContentBoundaryError);
  });
});

describe('parsePublishedContentBatch', () => {
  it('accepts valid siblings while retaining an identifiable malformed row failure', () => {
    // Given
    const invalid = fixture('news');
    const input = [fixture('centers'), { ...invalid, payload: { zh: {}, en: {} } }];

    // When
    const batch = parsePublishedContentBatch(input);

    // Then
    expect(batch.content.map((content) => content.kind)).toEqual(['centers']);
    expect(batch.failures).toMatchObject([{
      index: 1,
      identity: { kind: 'news', stableKey: 'announcements' },
      error: { name: 'ContentBoundaryError' },
    }]);
    expect(batch.failures[0]?.error).toBeInstanceOf(ContentBoundaryError);
    expect(batch.failures[0]?.error.validationError.issues.length).toBeGreaterThan(0);
  });

  it('retains canonical identity when document_id is missing', () => {
    // Given
    const { document_id: removed, ...invalid } = fixture('news');

    // When
    const batch = parsePublishedContentBatch([invalid]);

    // Then
    expect(removed).toEqual(expect.any(String));
    expect(batch.failures).toMatchObject([{
      index: 0,
      identity: { kind: 'news', stableKey: 'announcements' },
    }]);
  });

  it('does not guess identity when kind is missing', () => {
    // Given
    const { kind: removed, ...invalid } = fixture('news');

    // When
    const batch = parsePublishedContentBatch([invalid]);

    // Then
    expect(removed).toBe('news');
    expect(batch.failures).toMatchObject([{ index: 0, identity: null }]);
  });

  it('rejects every participant in exact duplicate rows with combined reasons', () => {
    // Given
    const duplicate = fixture('news');

    // When
    const batch = parsePublishedContentBatch([duplicate, duplicate]);

    // Then
    expect(batch.content).toEqual([]);
    expect(batch.failures).toHaveLength(2);
    expect(batch.failures.map((failure) => failure.index)).toEqual([0, 1]);
    expect(batch.failures.map((failure) => failure.reasons)).toEqual([
      ['duplicate-identity', 'duplicate-document-id', 'duplicate-revision-id'],
      ['duplicate-identity', 'duplicate-document-id', 'duplicate-revision-id'],
    ]);
    expect(batch.failures.every((failure) => failure.error instanceof ContentBoundaryError)).toBe(true);
    expect(batch.failures.every((failure) => failure.error.validationError.issues.length > 0)).toBe(true);
  });

  it('detects a duplicate valid revision independently of an invalid document ID', () => {
    // Given
    const centers = fixture('centers');
    const malformed = {
      ...fixture('news'),
      document_id: 'invalid',
      revision_id: centers.revision_id,
    };

    // When
    const batch = parsePublishedContentBatch([malformed, centers]);

    // Then
    expect(batch.content).toEqual([]);
    expect(batch.failures.map((failure) => failure.reasons)).toEqual([
      ['invalid-row', 'duplicate-revision-id'],
      ['duplicate-revision-id'],
    ]);
  });

  it('throws a request-level boundary error for non-array input', () => {
    // Given / When
    const parse = () => parsePublishedContentBatch({});

    // Then
    expect(parse).toThrow(ContentBoundaryError);
  });

  it('keeps complete parsing atomic for duplicate rows', () => {
    // Given
    const duplicate = fixture('news');

    // When
    const parse = () => parsePublishedContentRows([duplicate, duplicate]);

    // Then
    expect(parse).toThrow(ContentBoundaryError);
  });
});
