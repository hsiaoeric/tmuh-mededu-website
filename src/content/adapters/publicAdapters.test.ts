import { describe, expect, it } from 'vitest';
import { buildSourceDocuments } from '../../../scripts/content/extract';
import { CMS_DOCUMENT_KINDS, CMS_DOCUMENT_STABLE_KEYS } from '@/content/contracts/kinds';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import type { CmsSourceDocument, PublishedCmsPayloadByKind } from '@/content/contracts/registry';
import { LocalMediaReferenceSchema } from '@/content/media/references';
import { committedSnapshotRepository } from '@/content/snapshotRepository';
import { resolvePerson } from '@/data/people';
import { buildHolisticResearch, HOLISTIC_EDU_PAPERS, HOLISTIC_PAPER_TOTAL, resolveAuthorName } from '@/data/holisticPapers';
import {
  ANN_URL,
  buildActivities,
  buildAnnouncementCategories,
  buildAnnouncements,
  latestUpdate,
} from '@/data/news';
import type { Lang } from '@/i18n';
import {
  adaptCmsPerson,
  adaptFacdevPage,
  adaptPeopleDirectory,
  adaptPublishedContent,
  PUBLIC_ADAPTER_STABLE_KEYS,
  resolvePublishedMediaUrl,
} from './index';

function expectedValue(document: CmsSourceDocument, lang: Lang): unknown {
  switch (document.kind) {
    case 'site_copy': return document.payload[lang];
    case 'centers': return document.payload[lang];
    case 'people': return document.payload[lang];
    case 'news': return {
      announcementBoardUrl: ANN_URL,
      department: buildAnnouncements(lang, 'dept'),
      holistic: buildAnnouncements(lang, 'holistic'),
      categories: {
        department: buildAnnouncementCategories(lang, 'dept'),
        holistic: buildAnnouncementCategories(lang, 'holistic'),
      },
      latestUpdate: latestUpdate(lang),
    };
    case 'activities': return {
      department: buildActivities(lang, 'dept'),
      holistic: buildActivities(lang, 'holistic'),
    };
    case 'kpis': return document.payload[lang];
    case 'honors': return document.payload[lang];
    case 'digital_materials': return document.payload[lang];
    case 'facdev': return document.payload[lang];
    case 'ebm': return document.payload[lang];
    case 'holistic': return document.payload[lang];
    case 'holistic_research': return {
      ...buildHolisticResearch(lang),
      total: HOLISTIC_PAPER_TOTAL,
      papers: HOLISTIC_EDU_PAPERS.map(({ id: _id, ...paper }) => ({
        ...paper,
        authors: paper.authors.map((author) => resolveAuthorName(author, lang)),
      })),
    };
    default: return document satisfies never;
  }
}

function sourcePayload(kind: 'people'): PublishedCmsPayloadByKind['people'] {
  const document = buildSourceDocuments().find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} source document`);
  return CMS_PAYLOAD_REGISTRY.people.publishedSchema.parse(document.payload);
}

describe('public CMS adapter registry', () => {
  it.each(['zh', 'en'] as const)('matches every legacy public projection in %s', (lang) => {
    // Given
    const legacyDocuments = buildSourceDocuments();
    const publishedDocuments = committedSnapshotRepository.listPublished();

    // When
    const adapted = publishedDocuments.map((document) => adaptPublishedContent(document, lang, {
      baseUrl: '/',
      supabaseUrl: 'https://example.supabase.co',
    }));

    // Then
    expect(adapted).toHaveLength(12);
    adapted.forEach((result) => {
      const legacy = legacyDocuments.find((document) => document.kind === result.kind);
      if (legacy === undefined) throw new TypeError(`Missing legacy ${result.kind} document`);
      expect(result.stableKey).toBe(CMS_DOCUMENT_STABLE_KEYS[result.kind]);
      if (result.kind === 'people' || result.kind === 'facdev') return;
      expect(result.value, `${result.kind}:${lang}`).toEqual(expectedValue(legacy, lang));
    });
  });

  it('covers all 12 kinds with their stable keys', () => {
    // Given / When
    const entries = Object.entries(PUBLIC_ADAPTER_STABLE_KEYS);

    // Then
    expect(entries).toHaveLength(12);
    expect(Object.keys(PUBLIC_ADAPTER_STABLE_KEYS)).toEqual(CMS_DOCUMENT_KINDS);
    expect(PUBLIC_ADAPTER_STABLE_KEYS).toEqual(CMS_DOCUMENT_STABLE_KEYS);
  });
});

describe('public person and media adapters', () => {
  it.each(['zh', 'en'] as const)('preserves the legacy resolved person model in %s', (lang) => {
    // Given
    const payload = sourcePayload('people');
    const zh = payload.zh.centerPeople[0]?.people[0];
    const en = payload.en.centerPeople[0]?.people[0];
    if (zh === undefined || en === undefined) throw new TypeError('Missing paired person fixture');

    // When
    const person = adaptCmsPerson(zh, en, lang, {
      baseUrl: '/',
      supabaseUrl: 'https://example.supabase.co',
    });

    // Then
    expect(person.identity).toBe(zh.id);
    expect(resolvePerson(person, '#123456', lang)).toMatchObject({
      fullname: lang === 'zh' ? zh.name : en.name,
      sub: lang === 'zh' ? en.name : zh.name,
      role: lang === 'zh' ? '中心主任' : 'Director',
      dept: (lang === 'zh' ? zh.department : en.department).split('<br>').join('\n'),
      photoSrc: '/assets/ming-de-chen.jpg',
      accent: '#123456',
      hasPhoto: true,
    });
  });

  it('resolves local and immutable public media without changing their paths', () => {
    // Given
    const digest = 'a'.repeat(64);
    const local = LocalMediaReferenceSchema.parse({ kind: 'local', path: 'assets/person.jpg' });
    const withRemotePortrait = (locale: PublishedCmsPayloadByKind['people']['zh']) => ({
      ...locale,
      centerPeople: locale.centerPeople.map((group, groupIndex) => ({
        ...group,
        people: group.people.map((person, personIndex) => groupIndex === 0 && personIndex === 0
          ? { ...person, portrait: { kind: 'public', bucket: 'public-media', path: `${digest}/${digest}.webp` } }
          : person),
      })),
    });
    const original = sourcePayload('people');
    const remote = CMS_PAYLOAD_REGISTRY.people.publishedSchema.parse({
      ...original,
      zh: withRemotePortrait(original.zh),
      en: withRemotePortrait(original.en),
    }).zh.centerPeople[0]?.people[0]?.portrait;
    if (remote == null) throw new TypeError('Missing public media fixture');

    // When / Then
    expect(resolvePublishedMediaUrl(local, { baseUrl: '/tmuh/', supabaseUrl: 'https://example.supabase.co/' }))
      .toBe('/tmuh/assets/person.jpg');
    expect(resolvePublishedMediaUrl(remote, { baseUrl: '/', supabaseUrl: 'https://example.supabase.co/' }))
      .toBe(`https://example.supabase.co/storage/v1/object/public/public-media/${digest}/${digest}.webp`);
  });

  it('converts every people collection to consumer-ready paired people', () => {
    // Given
    const payload = sourcePayload('people');

    // When
    const value = adaptPeopleDirectory(payload, 'zh', {
      baseUrl: '/',
      supabaseUrl: 'https://example.supabase.co',
    });

    // Then
    const people = [
      ...value.centerPeople.flatMap((group) => group.people),
      ...value.holisticInstructors,
      ...value.holisticSeedTeachers,
      ...value.holisticAiTeam,
      ...value.memberGroups.flatMap((group) => group.people),
    ];
    expect(people.length).toBeGreaterThan(0);
    expect(people.every((person) => 'zh' in person && 'en' in person && 'role' in person)).toBe(true);
  });

  it('converts facdev leads to consumer-ready paired people', () => {
    // Given
    const document = buildSourceDocuments().find((candidate) => candidate.kind === 'facdev');
    if (document === undefined) throw new TypeError('Missing facdev source document');
    const payload = CMS_PAYLOAD_REGISTRY.facdev.publishedSchema.parse(document.payload);

    // When
    const value = adaptFacdevPage(payload, 'en', {
      baseUrl: '/',
      supabaseUrl: 'https://example.supabase.co',
    });

    // Then
    expect(value.groups.every((group) => 'zh' in group.lead && 'en' in group.lead)).toBe(true);
    const firstGroup = value.groups[0];
    if (firstGroup === undefined) throw new TypeError('Missing adapted facdev group');
    expect(resolvePerson(firstGroup.lead, '#A87A6B', 'en').fullname).toBe('Hsin-Yi Chiu');
  });

  it('keeps explicit published portrait removal from falling back to a slug asset', () => {
    // Given
    const payload = sourcePayload('people');
    const zh = payload.zh.centerPeople[0]?.people[0];
    const en = payload.en.centerPeople[0]?.people[0];
    if (zh === undefined || en === undefined) throw new TypeError('Missing paired person fixture');
    const zhGroup = payload.zh.centerPeople[0];
    const enGroup = payload.en.centerPeople[0];
    if (zhGroup === undefined || enGroup === undefined) throw new TypeError('Missing center group fixture');
    const withoutPortrait = CMS_PAYLOAD_REGISTRY.people.publishedSchema.parse({
      ...payload,
      zh: {
        ...payload.zh,
        centerPeople: [
          { ...zhGroup, people: [{ ...zh, portrait: null }, ...zhGroup.people.slice(1)] },
          ...payload.zh.centerPeople.slice(1),
        ],
      },
      en: {
        ...payload.en,
        centerPeople: [
          { ...enGroup, people: [{ ...en, portrait: null }, ...enGroup.people.slice(1)] },
          ...payload.en.centerPeople.slice(1),
        ],
      },
    });
    const removedZh = withoutPortrait.zh.centerPeople[0]?.people[0];
    const removedEn = withoutPortrait.en.centerPeople[0]?.people[0];
    if (removedZh === undefined || removedEn === undefined) throw new TypeError('Missing removed portrait fixture');

    // When
    const resolved = resolvePerson(adaptCmsPerson(removedZh, removedEn, 'zh', {
      baseUrl: '/',
      supabaseUrl: 'https://example.supabase.co',
    }), '#123456', 'zh');

    // Then
    expect(resolved.photoSrc).toBe('');
    expect(resolved.hasPhoto).toBe(false);
  });

  it('selects the active locale portrait and keeps asymmetric removal isolated', () => {
    // Given
    const payload = sourcePayload('people');
    const zhGroup = payload.zh.centerPeople[0];
    const enGroup = payload.en.centerPeople[0];
    const zhPerson = zhGroup?.people[0];
    const enPerson = enGroup?.people[0];
    if (zhGroup === undefined || enGroup === undefined || zhPerson === undefined || enPerson === undefined) {
      throw new TypeError('Missing paired portrait fixture');
    }
    const localized = CMS_PAYLOAD_REGISTRY.people.publishedSchema.parse({
      ...payload,
      zh: { ...payload.zh, centerPeople: [{ ...zhGroup, people: [{ ...zhPerson, portrait: null }, ...zhGroup.people.slice(1)] }, ...payload.zh.centerPeople.slice(1)] },
      en: { ...payload.en, centerPeople: [{ ...enGroup, people: [{ ...enPerson, portrait: { kind: 'local', path: 'assets/english-only.jpg' } }, ...enGroup.people.slice(1)] }, ...payload.en.centerPeople.slice(1)] },
    });
    const removedZh = localized.zh.centerPeople[0]?.people[0];
    const retainedEn = localized.en.centerPeople[0]?.people[0];
    if (removedZh === undefined || retainedEn === undefined) throw new TypeError('Missing localized portrait fixture');

    // When
    const zh = resolvePerson(adaptCmsPerson(removedZh, retainedEn, 'zh', {
      baseUrl: '/', supabaseUrl: 'https://example.supabase.co',
    }), '#123456', 'zh');
    const en = resolvePerson(adaptCmsPerson(removedZh, retainedEn, 'en', {
      baseUrl: '/', supabaseUrl: 'https://example.supabase.co',
    }), '#123456', 'en');

    // Then
    expect(zh.photoSrc).toBe('');
    expect(zh.hasPhoto).toBe(false);
    expect(en.photoSrc).toBe('/assets/english-only.jpg');
    expect(en.hasPhoto).toBe(true);
  });
});
