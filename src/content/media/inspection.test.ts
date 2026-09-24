import { describe, expect, it } from 'vitest';
import { inspectPayloadMedia } from './inspection';

const OWNER = '11111111-1111-4111-8111-111111111111';
const DIGEST = 'a'.repeat(64);
const DRAFT = {
  kind: 'draft',
  bucket: 'draft-media',
  path: `${OWNER}/${DIGEST}.webp`,
} as const;

describe('payload media inspection', () => {
  it('finds strict media references recursively and deduplicates equal references', () => {
    // Given
    const payload = {
      arbitrary: [DRAFT, { nested: DRAFT }],
      local: { kind: 'local', path: 'assets/portrait.jpg' },
    };

    // When
    const result = inspectPayloadMedia(payload);

    // Then
    expect(result.references).toHaveLength(2);
    expect(result.draftReferences).toEqual([DRAFT]);
    expect(result.malformedDraftLike).toEqual([]);
  });

  it('flags malformed draft-like objects without interpreting domain field names', () => {
    // Given
    const malformedByKind = { kind: 'draft', path: `${OWNER}/portrait.jpg` };
    const malformedByBucket = { bucket: 'draft-media', path: `${OWNER}/${DIGEST}.png` };

    // When
    const result = inspectPayloadMedia({ first: malformedByKind, anything: [malformedByBucket] });

    // Then
    expect(result.draftReferences).toEqual([]);
    expect(result.malformedDraftLike).toEqual([malformedByKind, malformedByBucket]);
  });
});
