import { describe, expect, it } from 'vitest';
import { buildSourceDocuments } from '../../../scripts/content/extract';
import { CMS_DOCUMENT_KINDS } from '@/content/contracts/kinds';
import { committedSnapshotRepository } from '@/content/snapshotRepository';

describe('legacy public content builders', () => {
  it('produce the committed bilingual payload for every CMS document kind', () => {
    // Given
    const legacyDocuments = buildSourceDocuments();
    const committedDocuments = committedSnapshotRepository.listPublished();

    // When
    const parity = CMS_DOCUMENT_KINDS.map((kind) => ({
      kind,
      legacy: legacyDocuments.find((document) => document.kind === kind)?.payload,
      committed: committedDocuments.find((document) => document.kind === kind)?.payload,
    }));

    // Then
    expect(parity).toHaveLength(12);
    parity.forEach(({ kind, legacy, committed }) => {
      expect(legacy, `${kind}: legacy payload`).toBeDefined();
      expect(committed, `${kind}: committed payload`).toBeDefined();
      expect(legacy, `${kind}: committed snapshot parity`).toEqual(committed);
    });
  });
});
