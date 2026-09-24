import { describe, expect, it } from 'vitest';
import { CmsDocumentIdSchema } from '@/content/contracts/primitives';
import { DraftMediaReferenceSchema } from '@/content/media';
import { createDraftMediaOwnershipScope } from './draftMediaOwnership';
import { draftMediaClaimsFor } from './draftMediaClaims';

const PEOPLE = CmsDocumentIdSchema.parse('11111111-1111-4111-8111-111111111111');
const FACDEV = CmsDocumentIdSchema.parse('22222222-2222-4222-8222-222222222222');
const C = DraftMediaReferenceSchema.parse({
  kind: 'draft',
  bucket: 'draft-media',
  path: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.png',
});
const D = DraftMediaReferenceSchema.parse({
  kind: 'draft',
  bucket: 'draft-media',
  path: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd.png',
});

describe('draft media document claims', () => {
  it('keeps exact ordered claims for multiple documents while deduplicating paths', () => {
    // Given
    const claims = draftMediaClaimsFor(createDraftMediaOwnershipScope());

    // When
    claims.updateEditor(PEOPLE, JSON.stringify({ first: C, duplicate: C, second: D }));
    claims.updateSaved(FACDEV, { portrait: C });

    // Then
    expect(claims.snapshot()).toEqual([
      { documentId: PEOPLE, editorPaths: [C.path, D.path], savedPaths: [], editorValid: true },
      { documentId: FACDEV, editorPaths: [], savedPaths: [C.path], editorValid: true },
    ]);
  });

  it('discards transient editor claims on navigation but retains authoritative saved claims', () => {
    // Given
    const claims = draftMediaClaimsFor(createDraftMediaOwnershipScope());
    claims.updateEditor(PEOPLE, JSON.stringify({ portrait: C }));
    claims.updateSaved(PEOPLE, { portrait: D });

    // When
    claims.discardEditor(PEOPLE);

    // Then
    expect(claims.guard(C)).toEqual({ referencedByEditor: false, referencedBySavedDraft: false });
    expect(claims.guard(D)).toEqual({ referencedByEditor: false, referencedBySavedDraft: true });
  });

  it('pessimistically blocks every path while any document editor is invalid', () => {
    // Given
    const claims = draftMediaClaimsFor(createDraftMediaOwnershipScope());

    // When
    claims.updateEditor(FACDEV, '{"portrait":');

    // Then
    expect(claims.guard(C).referencedByEditor).toBe(true);
  });

  it('isolates claims between authorization scopes', () => {
    // Given
    const first = draftMediaClaimsFor(createDraftMediaOwnershipScope());
    first.updateSaved(PEOPLE, { portrait: C });

    // When
    const second = draftMediaClaimsFor(createDraftMediaOwnershipScope());

    // Then
    expect(second.guard(C)).toEqual({ referencedByEditor: false, referencedBySavedDraft: false });
  });
});
