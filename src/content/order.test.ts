import { describe, expect, it } from 'vitest';
import committedSnapshot from './generated/cms-snapshot.json';
import { ContentVersionError } from './errors';
import { mergePublishedContent } from './order';
import { parsePublishedContentBatch, parsePublishedContentRows } from './parsers';

function row(kind: 'centers' | 'news', version: number) {
  const source = committedSnapshot.find((item) => item.kind === kind);
  if (source === undefined) throw new TypeError(`Missing committed ${kind} fixture`);
  return { ...structuredClone(source), version };
}

function snapshot(...rows: readonly ReturnType<typeof row>[]) {
  return parsePublishedContentRows(rows);
}

describe('mergePublishedContent', () => {
  it('accepts and orders a valid remote-only document with remote metadata', () => {
    // Given
    const local = snapshot(row('news', 1));
    const batch = parsePublishedContentBatch([row('centers', 2)]);

    // When
    const merged = mergePublishedContent(local, batch);

    // Then
    expect(merged.content.map((content) => content.kind)).toEqual(['centers', 'news']);
    expect(merged.documents[0]).toMatchObject({
      identity: { kind: 'centers', stableKey: 'directory' },
      outcome: 'remote',
      source: 'supabase',
      freshness: 'fresh',
    });
  });

  it('uses newer remote content in deterministic order', () => {
    // Given
    const local = snapshot(row('news', 1), row('centers', 1));
    const batch = parsePublishedContentBatch([row('news', 2)]);

    // When
    const merged = mergePublishedContent(local, batch);

    // Then
    expect(merged.content.map((content) => `${content.kind}:${content.version}`))
      .toEqual(['centers:1', 'news:2']);
    expect(merged.documents.map((document) => document.outcome))
      .toEqual(['missing-fallback', 'remote']);
  });

  it('retains the exact snapshot object when the remote version is equal', () => {
    // Given
    const local = snapshot(row('news', 2));
    const localNews = local[0];
    if (localNews === undefined) throw new TypeError('Missing local news fixture');
    const batch = parsePublishedContentBatch([row('news', 2)]);

    // When
    const merged = mergePublishedContent(local, batch);

    // Then
    expect(merged.content[0]).toBe(localNews);
    expect(merged.documents[0]).toMatchObject({ outcome: 'snapshot-current' });
  });

  it('retains snapshot content and reports a typed version error for older remote', () => {
    // Given
    const local = snapshot(row('news', 3));
    const batch = parsePublishedContentBatch([row('news', 2)]);

    // When
    const merged = mergePublishedContent(local, batch);

    // Then
    expect(merged.content[0]?.version).toBe(3);
    expect(merged.documents[0]).toMatchObject({
      outcome: 'older-fallback',
      error: expect.any(ContentVersionError),
    });
  });

  it('attaches an identifiable invalid row only to its snapshot while a sibling refreshes', () => {
    // Given
    const invalidNews = { ...row('news', 2), payload: { zh: {}, en: {} } };
    const local = snapshot(row('news', 1), row('centers', 1));
    const batch = parsePublishedContentBatch([invalidNews, row('centers', 2)]);

    // When
    const merged = mergePublishedContent(local, batch);

    // Then
    expect(merged.documents.map((document) => document.outcome))
      .toEqual(['remote', 'invalid-fallback']);
    expect(merged.unassignedFailures).toEqual([]);
  });

  it('keeps an unidentifiable failure aggregate-only', () => {
    // Given
    const { kind: removed, ...invalid } = row('news', 2);
    const local = snapshot(row('news', 1));
    const batch = parsePublishedContentBatch([invalid]);

    // When
    const merged = mergePublishedContent(local, batch);

    // Then
    expect(removed).toBe('news');
    expect(merged.documents[0]).toMatchObject({ outcome: 'missing-fallback' });
    expect(merged.unassignedFailures).toHaveLength(1);
  });

  it('attaches duplicate identity diagnostics to the affected snapshot', () => {
    // Given
    const duplicate = row('news', 2);
    const local = snapshot(row('news', 1));
    const batch = parsePublishedContentBatch([duplicate, duplicate]);

    // When
    const merged = mergePublishedContent(local, batch);

    // Then
    expect(merged.documents[0]).toMatchObject({ outcome: 'invalid-fallback' });
    expect(merged.unassignedFailures).toEqual([]);
  });

  it('marks an omitted snapshot document as missing without fabricating an error', () => {
    // Given
    const local = snapshot(row('news', 1));

    // When
    const merged = mergePublishedContent(local, parsePublishedContentBatch([]));

    // Then
    expect(merged.documents[0]).toEqual(expect.objectContaining({ outcome: 'missing-fallback' }));
    expect('error' in (merged.documents[0] ?? {})).toBe(false);
  });
});
