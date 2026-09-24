import { describe, expect, it } from 'vitest';
import {
  DraftMediaReferenceSchema,
  MediaReferenceSchema,
  PublicMediaReferenceSchema,
  buildDraftMediaReference,
  buildPublicMediaReference,
} from './references';

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const DIGEST = 'a'.repeat(64);

describe('canonical media references', () => {
  it('builds canonical draft and public paths from identity, digest, and media type', () => {
    // Given
    const input = { ownerId: OWNER, sha256: DIGEST, mediaType: 'image/jpeg' } as const;

    // When
    const draft = buildDraftMediaReference(input);
    const published = buildPublicMediaReference(input.sha256, input.mediaType);

    // Then
    expect(draft.path).toBe(`${OWNER}/${DIGEST}.jpg`);
    expect(published.path).toBe(`${DIGEST}/${DIGEST}.jpg`);
  });

  it.each([
    `${OWNER}/${DIGEST}.jpeg`,
    `${OWNER.toUpperCase()}/${DIGEST}.jpg`,
    `${OWNER}/${DIGEST.slice(1)}.jpg`,
    `${OWNER}/${DIGEST}.gif`,
    `${OWNER}/portrait.jpg`,
  ])('rejects noncanonical draft path %s', (path) => {
    expect(DraftMediaReferenceSchema.safeParse({ kind: 'draft', bucket: 'draft-media', path }).success).toBe(false);
  });

  it.each([
    `${DIGEST}/portrait.webp`,
    `${DIGEST}/${'b'.repeat(64)}.webp`,
    `${DIGEST.toUpperCase()}/${DIGEST}.png`,
    `${DIGEST}/${DIGEST}.jpeg`,
  ])('rejects noncanonical public path %s', (path) => {
    expect(PublicMediaReferenceSchema.safeParse({ kind: 'public', bucket: 'public-media', path }).success).toBe(false);
  });

  it('keeps safe local assets while rejecting traversal and absolute paths', () => {
    expect(MediaReferenceSchema.safeParse({ kind: 'local', path: 'assets/people/portrait.jpeg' }).success).toBe(true);
    expect(MediaReferenceSchema.safeParse({ kind: 'local', path: 'assets/../portrait.jpg' }).success).toBe(false);
    expect(MediaReferenceSchema.safeParse({ kind: 'local', path: '/assets/portrait.jpg' }).success).toBe(false);
  });
});
