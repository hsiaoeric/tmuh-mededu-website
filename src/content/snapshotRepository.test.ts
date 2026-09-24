import { describe, expect, it } from 'vitest';
import { CMS_DOCUMENT_KINDS } from './domain';
import { committedSnapshotRepository } from './snapshotRepository';

describe('committedSnapshotRepository', () => {
  it('serves the generated published snapshot in canonical kind order', () => {
    // Given
    const expectedKinds = [...CMS_DOCUMENT_KINDS];

    // When
    const content = committedSnapshotRepository.listPublished();

    // Then
    expect(content.map(({ kind }) => kind)).toEqual(expectedKinds);
    expect(content.every(({ version }) => version === 1)).toBe(true);
  });
});
