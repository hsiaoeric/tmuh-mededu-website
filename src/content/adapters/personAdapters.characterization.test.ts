import { describe, expect, it } from 'vitest';
import { buildSourceDocuments } from '../../../scripts/content/extract';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { buildFacdev } from '@/data/facdev';
import { resolvePerson } from '@/data/people';
import { adaptCmsPerson } from './people';

const MEDIA = { baseUrl: '/', supabaseUrl: 'https://example.supabase.co' } as const;

function sourcePayload(kind: 'people' | 'facdev'): unknown {
  const document = buildSourceDocuments().find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} source document`);
  return document.payload;
}

describe('legacy person presentation', () => {
  it('resolves a paired center person identically to the static source', () => {
    // Given
    const payload = CMS_PAYLOAD_REGISTRY.people.publishedSchema.parse(sourcePayload('people'));
    const zh = payload.zh.centerPeople[0]?.people[0];
    const en = payload.en.centerPeople[0]?.people[0];
    if (zh === undefined || en === undefined) throw new TypeError('Missing center person fixture');

    // When
    const resolved = resolvePerson(adaptCmsPerson(zh, en, 'zh', MEDIA), '#123456', 'zh');

    // Then
    expect(resolved).toMatchObject({
      fullname: '陳明德',
      sub: 'Ming-De Chen',
      role: '中心主任',
      photoSrc: '/assets/ming-de-chen.jpg',
      hasPhoto: true,
    });
  });

  it('resolves a paired facdev lead identically to the static page builder', () => {
    // Given
    const payload = CMS_PAYLOAD_REGISTRY.facdev.publishedSchema.parse(sourcePayload('facdev'));
    const zh = payload.zh.groups[0]?.lead;
    const en = payload.en.groups[0]?.lead;
    const legacy = buildFacdev('zh').groups[0]?.lead;
    if (zh === undefined || en === undefined || legacy === undefined) {
      throw new TypeError('Missing facdev lead fixture');
    }

    // When
    const adapted = resolvePerson(adaptCmsPerson(zh, en, 'en', MEDIA), '#123456', 'en');

    // Then
    expect(adapted).toEqual(resolvePerson(legacy, '#123456', 'en'));
  });
});
