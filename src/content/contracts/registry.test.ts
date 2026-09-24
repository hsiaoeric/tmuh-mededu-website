import { describe, expect, expectTypeOf, it } from 'vitest';
import snapshot from '../generated/cms-snapshot.json';
import type { PublishedContent } from '../domain';
import { CMS_DOCUMENT_KINDS } from './kinds';
import {
  CMS_PAYLOAD_REGISTRY,
  type CmsPayloadByKind,
  type PublishedCmsPayloadByKind,
} from './registry';

function firstNewsPublicationDate(content: PublishedContent): string | undefined {
  if (content.kind === 'news') return content.payload.zh.department[0]?.publishedOn;
  return undefined;
}

describe('CMS payload registry fixtures', () => {
  it('preserves literal registry metadata and concrete payload types', () => {
    // Given
    const newsContract = CMS_PAYLOAD_REGISTRY.news;

    // When
    const stableKey = newsContract.stableKey;

    // Then
    expect(stableKey).toBe('announcements');
    expectTypeOf(stableKey).toEqualTypeOf<'announcements'>();
    expectTypeOf<CmsPayloadByKind['news']['zh']['department'][number]['publishedOn']>().toEqualTypeOf<string>();
    expectTypeOf(firstNewsPublicationDate).returns.toEqualTypeOf<string | undefined>();
  });

  it('derives published people and facdev portraits without the draft variant', () => {
    // Given
    type PublishedPeoplePortrait = NonNullable<
      PublishedCmsPayloadByKind['people']['zh']['centerPeople'][number]['people'][number]['portrait']
    >;
    type PublishedFacdevPortrait = NonNullable<
      PublishedCmsPayloadByKind['facdev']['zh']['groups'][number]['lead']['portrait']
    >;

    // When
    type PeopleDraft = Extract<PublishedPeoplePortrait, { readonly kind: 'draft' }>;
    type FacdevDraft = Extract<PublishedFacdevPortrait, { readonly kind: 'draft' }>;

    // Then
    expectTypeOf<PublishedPeoplePortrait['kind']>().toEqualTypeOf<'local' | 'public'>();
    expectTypeOf<PublishedFacdevPortrait['kind']>().toEqualTypeOf<'local' | 'public'>();
    expectTypeOf<PeopleDraft>().toEqualTypeOf<never>();
    expectTypeOf<FacdevDraft>().toEqualTypeOf<never>();
  });

  it('parses every current serialized kind without loss', () => {
    // Given
    const rows = new Map(snapshot.map((row) => [row.kind, row]));

    for (const kind of CMS_DOCUMENT_KINDS) {
      const row = rows.get(kind);
      expect(row).toBeDefined();
      if (row === undefined) continue;

      // When
      const result = CMS_PAYLOAD_REGISTRY[kind].schema.safeParse(row.payload);

      // Then
      expect(result.success, kind).toBe(true);
      if (result.success) expect(result.data).toEqual(row.payload);
    }
  });

  it('rejects missing locales and unknown fields at every object boundary', () => {
    // Given
    const news = snapshot.find((row) => row.kind === 'news');
    expect(news).toBeDefined();
    if (news === undefined) return;
    const missingLocale = { zh: news.payload.zh };
    const unknownTopLevel = { ...news.payload, extra: true };
    const unknownNested = {
      ...news.payload,
      zh: { ...news.payload.zh, extra: true },
    };

    // When
    const results = [missingLocale, unknownTopLevel, unknownNested].map((payload) =>
      CMS_PAYLOAD_REGISTRY.news.schema.safeParse(payload),
    );

    // Then
    expect(results.map((result) => result.success)).toEqual([false, false, false]);
  });
});
