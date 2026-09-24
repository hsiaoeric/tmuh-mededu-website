import { describe, expect, it } from 'vitest';
import {
  CMS_DOCUMENT_KINDS,
  CMS_DOCUMENT_STABLE_KEYS,
  type PublishedContent,
} from '../../src/content/domain';
import { parsePublishedContentRows } from '../../src/content/parsers';
import { ContentBoundaryError } from '../../src/content/errors';
import { renderCheckpointSnapshot } from './checkpoint-render';
import {
  checkpointBatch,
  checkpointContent,
  requireContent,
} from './checkpoint.test-fixtures';

function changedContent(
  property: 'payload' | 'version' | 'stableKey',
  value: unknown,
): readonly PublishedContent[] {
  const content = structuredClone(checkpointContent());
  Object.defineProperty(requireContent(content, 0), property, { value });
  return content;
}

describe('renderCheckpointSnapshot', () => {
  it('renders byte-identically when remote rows arrive shuffled', () => {
    // Given
    const content = checkpointContent();
    const shuffled = [...content].reverse();

    // When
    const orderedBytes = renderCheckpointSnapshot(checkpointBatch(content));
    const shuffledBytes = renderCheckpointSnapshot(checkpointBatch(shuffled));

    // Then
    expect(shuffledBytes).toBe(orderedBytes);
  });

  it('preserves validated remote metadata and payload values', () => {
    // Given
    const content = [...checkpointContent()];
    const original = requireContent(content, 0);
    if (original.kind !== 'site_copy') throw new TypeError('Expected site_copy fixture first');
    const source = requireContent(parsePublishedContentRows([{
      document_id: '11111111-1111-4111-8111-111111111111',
      kind: original.kind,
      stable_key: original.stableKey,
      revision_id: '22222222-2222-4222-8222-222222222222',
      version: 37,
      payload: {
        ...original.payload,
        en: {
          ...original.payload.en,
          strings: {
            ...original.payload.en.strings,
            navAbout: 'Remote About',
          },
        },
      },
      published_at: '2026-09-08T03:04:05.000Z',
    }]), 0);
    content[0] = source;

    // When
    const rendered = renderCheckpointSnapshot(checkpointBatch(content));
    const parsed = parsePublishedContentRows(JSON.parse(rendered));
    const preserved = requireContent(parsed, 0);

    // Then
    expect(preserved).toEqual(source);
    expect(rendered).toContain('"document_id": "11111111-1111-4111-8111-111111111111"');
    expect(rendered).toContain('"published_at": "2026-09-08T03:04:05.000Z"');
    expect(rendered).toContain('"navAbout": "Remote About"');
  });

  it('accepts exactly the canonical 12-kind identity set', () => {
    // Given
    const expected = CMS_DOCUMENT_KINDS.map(
      (kind) => `${kind}:${CMS_DOCUMENT_STABLE_KEYS[kind]}`,
    );

    // When
    const rendered = renderCheckpointSnapshot(checkpointBatch());
    const parsed = parsePublishedContentRows(JSON.parse(rendered));

    // Then
    expect(parsed.map((content) => `${content.kind}:${content.stableKey}`)).toEqual(expected);
  });

  it('rejects every reported row failure', () => {
    // Given
    const invalid = { document_id: 'invalid' };
    const parsed = (() => {
      try {
        parsePublishedContentRows([invalid]);
      } catch (error: unknown) {
        if (error instanceof ContentBoundaryError) return error;
        throw error;
      }
      throw new TypeError('Expected malformed fixture to fail parsing');
    })();
    const batch = {
      content: checkpointContent(),
      failures: [{ index: 0, identity: null, reasons: ['invalid-row'], error: parsed }],
    } as const;

    // When
    const render = () => renderCheckpointSnapshot(batch);

    // Then
    expect(render).toThrow(/row failure/i);
  });

  it('rejects a missing identity and a count other than 12', () => {
    // Given
    const partial = checkpointContent().slice(1);

    // When
    const render = () => renderCheckpointSnapshot(checkpointBatch(partial));

    // Then
    expect(render).toThrow(/12.*omitted|required identity.*12/i);
  });

  it('rejects a duplicate identity even when the row count is 12', () => {
    // Given
    const content = [...checkpointContent()];
    content[1] = requireContent(content, 0);

    // When
    const render = () => renderCheckpointSnapshot(checkpointBatch(content));

    // Then
    expect(render).toThrow(/duplicate/i);
  });

  it('rejects an unexpected stable identity', () => {
    // Given
    const unexpected = changedContent('stableKey', 'unexpected');

    // When
    const render = () => renderCheckpointSnapshot(checkpointBatch(unexpected));

    // Then
    expect(render).toThrow(/unexpected/i);
  });

  it.each([
    ['payload', { invalid: true }],
    ['version', 0],
  ] as const)('rejects malformed %s values', (property, value) => {
    // Given
    const malformed = changedContent(property, value);

    // When
    const render = () => renderCheckpointSnapshot(checkpointBatch(malformed));

    // Then
    expect(render).toThrow(ContentBoundaryError);
  });
});
