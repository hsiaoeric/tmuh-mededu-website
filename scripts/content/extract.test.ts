import { describe, expect, it } from 'vitest';
import { CMS_DOCUMENT_KINDS, CMS_DOCUMENT_STABLE_KEYS } from '../../src/content/domain';
import { PeoplePayloadSchema } from '../../src/content/contracts/people';
import { CMS_PAYLOAD_REGISTRY } from '../../src/content/contracts/registry';
import { CENTERS } from '../../src/data/centers';
import { buildDeptAwards } from '../../src/data/deptAwards';
import { buildEbm } from '../../src/data/ebm';
import { buildFacdev } from '../../src/data/facdev';
import { ALGEE, HOLISTIC_SEED } from '../../src/data/holistic';
import { deptKpis } from '../../src/data/kpis';
import { ANN_URL, buildActivityRecords, buildAnnouncementRecords } from '../../src/data/news';
import { HOLISTIC_EDU_PAPERS } from '../../src/data/holisticPapers';
import { buildArtifacts } from './artifacts';
import { buildSourceDocuments } from './extract';
import { toJsonObject } from './json';

describe('buildSourceDocuments', () => {
  it('validates all generated fixtures through general and published contracts', () => {
    // Given
    const documents = buildSourceDocuments();

    // When
    const results = documents.flatMap((document) => [
      CMS_PAYLOAD_REGISTRY[document.kind].schema.safeParse(document.payload).success,
      CMS_PAYLOAD_REGISTRY[document.kind].publishedSchema.safeParse(document.payload).success,
    ]);

    // Then
    expect(results.every(Boolean)).toBe(true);
  });

  it('adds local portrait references only for people with portrait slugs', () => {
    // Given
    const peopleDocument = buildSourceDocuments().find((document) => document.kind === 'people');
    expect(peopleDocument).toBeDefined();
    if (peopleDocument === undefined) return;
    const parsed = PeoplePayloadSchema.safeParse(peopleDocument.payload);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    // When
    const people = parsed.data.zh.centerPeople.flatMap((group) => group.people);

    // Then
    for (const person of people) {
      expect(person.portrait !== null).toBe(person.slug !== '');
    }
  });
  it('extracts every canonical CMS kind with unique bilingual content', () => {
    // Given
    const expectedKinds = [...CMS_DOCUMENT_KINDS];

    // When
    const documents = buildSourceDocuments();

    // Then
    expect(documents.map(({ kind }) => kind)).toEqual(expectedKinds);
    expect(new Set(documents.map(({ kind, stableKey }) => `${kind}/${stableKey}`)).size).toBe(12);
    for (const document of documents) {
      expect(document.stableKey).toBe(CMS_DOCUMENT_STABLE_KEYS[document.kind]);
      expect(Object.keys(document.payload.zh).length).toBeGreaterThan(0);
      expect(Object.keys(document.payload.en).length).toBeGreaterThan(0);
    }
  });

  it('preserves representative source records and counts', () => {
    // Given
    const expectedNews = toJsonObject({
      department: buildAnnouncementRecords('zh', 'dept'),
      holistic: buildAnnouncementRecords('zh', 'holistic'),
    });

    // When
    const documents = buildSourceDocuments();
    const byKind = new Map(documents.map((document) => [document.kind, document]));
    const siteCopy = CMS_PAYLOAD_REGISTRY.site_copy.schema.parse(byKind.get('site_copy')?.payload);
    const centers = CMS_PAYLOAD_REGISTRY.centers.schema.parse(byKind.get('centers')?.payload);
    const people = CMS_PAYLOAD_REGISTRY.people.schema.parse(byKind.get('people')?.payload);
    const news = CMS_PAYLOAD_REGISTRY.news.schema.parse(byKind.get('news')?.payload);
    const activities = CMS_PAYLOAD_REGISTRY.activities.schema.parse(byKind.get('activities')?.payload);
    const kpis = CMS_PAYLOAD_REGISTRY.kpis.schema.parse(byKind.get('kpis')?.payload);
    const honors = CMS_PAYLOAD_REGISTRY.honors.schema.parse(byKind.get('honors')?.payload);
    const digitalMaterials = CMS_PAYLOAD_REGISTRY.digital_materials.schema.parse(byKind.get('digital_materials')?.payload);
    const facdev = CMS_PAYLOAD_REGISTRY.facdev.schema.parse(byKind.get('facdev')?.payload);
    const ebm = CMS_PAYLOAD_REGISTRY.ebm.schema.parse(byKind.get('ebm')?.payload);
    const holistic = CMS_PAYLOAD_REGISTRY.holistic.schema.parse(byKind.get('holistic')?.payload);
    const research = CMS_PAYLOAD_REGISTRY.holistic_research.schema.parse(byKind.get('holistic_research')?.payload);

    // Then
    expect(siteCopy.zh).toHaveProperty('strings.brand1');
    expect(centers.zh.centers).toHaveLength(CENTERS.length);
    expect(people.zh.centerPeople).toHaveLength(CENTERS.length);
    expect(people.zh.holisticSeedTeachers).toHaveLength(HOLISTIC_SEED.length);
    expect(news.announcementBoardUrl).toBe(ANN_URL);
    expect(news.zh).toMatchObject(expectedNews);
    expect(activities.zh).toMatchObject({
      department: buildActivityRecords('zh', 'dept'),
      holistic: buildActivityRecords('zh', 'holistic'),
    });
    expect(kpis.zh.items).toHaveLength(deptKpis('zh').length);
    expect(honors.zh).toEqual(toJsonObject(buildDeptAwards('zh')));
    expect(digitalMaterials.zh).toHaveProperty('title');
    expect(facdev.zh.services).toHaveLength(buildFacdev('zh').services.length);
    expect(ebm.zh.missions).toHaveLength(buildEbm('zh').missions.length);
    expect(holistic.zh.algee).toHaveLength(ALGEE.length);
    expect(research.zh.papers).toHaveLength(HOLISTIC_EDU_PAPERS.length);
  });
});

describe('buildArtifacts', () => {
  it('refuses incomplete or duplicate source documents before rendering', () => {
    // Given
    const documents = buildSourceDocuments();
    const incomplete = documents.slice(1);
    const first = documents[0];
    expect(first).toBeDefined();
    if (first === undefined) return;
    const duplicate = [...documents, first];
    const news = documents.find((document) => document.kind === 'news');
    expect(news).toBeDefined();
    if (news === undefined) return;
    const wrongStableKey = documents.map((document) =>
      document.kind === 'news' ? { ...document, stableKey: 'page' } : document,
    );
    const mismatchedPayload = documents.map((document) =>
      document.kind === 'news'
        ? { ...document, kind: 'centers', stableKey: 'directory', payload: news.payload }
        : document,
    );

    // When
    const buildIncomplete = () => buildArtifacts(incomplete);
    const buildDuplicate = () => buildArtifacts(duplicate);
    const buildWrongStableKey = () => buildArtifacts(wrongStableKey);
    const buildMismatchedPayload = () => buildArtifacts(mismatchedPayload);

    // Then
    expect(buildIncomplete).toThrow();
    expect(buildDuplicate).toThrow();
    expect(buildWrongStableKey).toThrow();
    expect(buildMismatchedPayload).toThrow();
  });

  it('renders byte-identical snapshot and published SQL on repeated runs', () => {
    // Given
    const first = buildArtifacts();

    // When
    const second = buildArtifacts();

    // Then
    expect(second).toEqual(first);
    expect(first.sql).toContain("'published'");
    expect(first.snapshot.match(/\"document_id\":/g)).toHaveLength(12);
  });
});

describe('toJsonObject', () => {
  it('omits undefined, functions, and React element-shaped values', () => {
    // Given
    const source = {
      kept: 'content',
      missing: undefined,
      callback: () => 'render-only',
      node: { $$typeof: Symbol.for('react.element'), type: 'span', props: {} },
    };

    // When
    const result = toJsonObject(source);

    // Then
    expect(result).toEqual({ kept: 'content' });
  });
});
