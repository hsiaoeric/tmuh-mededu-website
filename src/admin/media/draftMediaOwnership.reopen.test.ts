import { describe, expect, it } from 'vitest';
import { DraftMediaReferenceSchema } from '@/content/media';
import {
  createDraftMediaOwnershipScope,
  draftMediaOwnershipFor,
} from './draftMediaOwnership';

const created = DraftMediaReferenceSchema.parse({
  kind: 'draft',
  bucket: 'draft-media',
  path: '11111111-1111-4111-8111-111111111111/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp',
});

const reused = DraftMediaReferenceSchema.parse({
  kind: 'draft',
  bucket: 'draft-media',
  path: '11111111-1111-4111-8111-111111111111/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.webp',
});

describe('draft media ownership provenance', () => {
  it('reopens a session-created reference after it is unlinked', () => {
    // Given
    const ownership = draftMediaOwnershipFor(createDraftMediaOwnershipScope());
    ownership.register({ ok: true, outcome: 'created', reference: created, sha256: 'a'.repeat(64) });
    ownership.resolve(created);

    // When
    ownership.reopen(created);

    // Then
    expect(ownership.snapshot()).toEqual([created]);
  });

  it('never opens cleanup ownership for a reused reference', () => {
    // Given
    const ownership = draftMediaOwnershipFor(createDraftMediaOwnershipScope());

    // When
    ownership.reopen(reused);

    // Then
    expect(ownership.snapshot()).toEqual([]);
  });
});
