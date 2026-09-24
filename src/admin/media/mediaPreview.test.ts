import { describe, expect, it } from 'vitest';
import { parseSupabaseConfiguration } from '@/content/env';
import {
  LocalMediaReferenceSchema,
  PublicMediaReferenceSchema,
} from '@/content/media';
import { resolveStoredMediaUrl } from './index';

const configuration = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: 'https://project.supabase.co/',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
});

if (configuration.kind !== 'configured') {
  throw new TypeError('Expected configured media fixture');
}

describe('stored media preview URLs', () => {
  it('uses the supplied Pages base for local media', () => {
    // Given
    const reference = LocalMediaReferenceSchema.parse({
      kind: 'local',
      path: 'assets/people/portrait.webp',
    });

    // When
    const result = resolveStoredMediaUrl({
      reference,
      configuration: configuration.config,
      baseUrl: '/tmuh-mededu-website/',
    });

    // Then
    expect(result).toBe('/tmuh-mededu-website/assets/people/portrait.webp');
  });

  it('builds public storage URLs independently from the Pages base', () => {
    // Given
    const digest = 'a'.repeat(64);
    const reference = PublicMediaReferenceSchema.parse({
      kind: 'public',
      bucket: 'public-media',
      path: `${digest}/${digest}.jpg`,
    });

    // When
    const result = resolveStoredMediaUrl({
      reference,
      configuration: configuration.config,
      baseUrl: '/tmuh-mededu-website/',
    });

    // Then
    expect(result).toBe(
      `https://project.supabase.co/storage/v1/object/public/public-media/${digest}/${digest}.jpg`,
    );
  });
});
