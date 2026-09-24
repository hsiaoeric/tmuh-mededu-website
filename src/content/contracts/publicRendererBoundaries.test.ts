import { describe, expect, it } from 'vitest';
import snapshot from '@/content/generated/cms-snapshot.json';
import { ContentBoundaryError } from '@/content/errors';
import { parsePublishedContentRows } from '@/content/parsers';
import { CMS_PAYLOAD_REGISTRY } from './registry';

function sourcePayload(kind: 'centers' | 'people' | 'holistic'): unknown {
  const document = snapshot.find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return structuredClone(document.payload);
}

function centersPayload() {
  return CMS_PAYLOAD_REGISTRY.centers.schema.parse(sourcePayload('centers'));
}

function peoplePayload() {
  return CMS_PAYLOAD_REGISTRY.people.publishedSchema.parse(sourcePayload('people'));
}

function holisticPayload() {
  return CMS_PAYLOAD_REGISTRY.holistic.schema.parse(sourcePayload('holistic'));
}

function publishedParse(kind: 'centers' | 'people' | 'holistic', payload: unknown): () => unknown {
  const document = snapshot.find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return () => parsePublishedContentRows([{ ...document, payload }]);
}

describe('public renderer published boundaries', () => {
  it.each([
    ['missing center', (payload: ReturnType<typeof centersPayload>) => ({
      zh: { centers: payload.zh.centers.slice(1) },
      en: { centers: payload.en.centers.slice(1) },
    })],
    ['renamed center', (payload: ReturnType<typeof centersPayload>) => ({
      zh: { centers: payload.zh.centers.map((center, index) => index === 0 ? { ...center, id: 'renamed' } : center) },
      en: { centers: payload.en.centers.map((center, index) => index === 0 ? { ...center, id: 'renamed' } : center) },
    })],
    ['extra center', (payload: ReturnType<typeof centersPayload>) => ({
      zh: { centers: [...payload.zh.centers, { ...payload.zh.centers[0], id: 'extra' }] },
      en: { centers: [...payload.en.centers, { ...payload.en.centers[0], id: 'extra' }] },
    })],
    ['duplicate center', (payload: ReturnType<typeof centersPayload>) => ({
      zh: { centers: payload.zh.centers.map((center, index) => index === 1 ? { ...center, id: payload.zh.centers[0]?.id } : center) },
      en: { centers: payload.en.centers.map((center, index) => index === 1 ? { ...center, id: payload.en.centers[0]?.id } : center) },
    })],
    ['bilingual center identity mismatch', (payload: ReturnType<typeof centersPayload>) => ({
      ...payload,
      en: { centers: payload.en.centers.map((center, index) => index === 0 ? { ...center, id: 'renamed' } : center) },
    })],
  ])('rejects %s', (_caseName, change) => {
    // Given
    const invalid = change(centersPayload());

    // When / Then
    expect(publishedParse('centers', invalid)).toThrow(ContentBoundaryError);
  });

  it.each([
    ['missing branch', (branches: ReturnType<typeof centersPayload>['zh']['centers'][number]['branches']) => branches.slice(1)],
    ['renamed branch', (branches: ReturnType<typeof centersPayload>['zh']['centers'][number]['branches']) => branches.map((branch, index) => index === 0 ? { ...branch, id: 'renamed' } : branch)],
    ['extra branch', (branches: ReturnType<typeof centersPayload>['zh']['centers'][number]['branches']) => [...branches, { ...branches[0], id: 'extra' }]],
    ['duplicate branch', (branches: ReturnType<typeof centersPayload>['zh']['centers'][number]['branches']) => branches.map((branch, index) => index === 1 ? { ...branch, id: branches[0]?.id } : branch)],
  ])('rejects %s', (_caseName, change) => {
    // Given
    const payload = centersPayload();
    const invalid = {
      zh: { centers: payload.zh.centers.map((center, index) => index === 0 ? { ...center, branches: change(center.branches) } : center) },
      en: { centers: payload.en.centers.map((center, index) => index === 0 ? { ...center, branches: change(center.branches) } : center) },
    };

    // When / Then
    expect(publishedParse('centers', invalid)).toThrow(ContentBoundaryError);
  });

  it('accepts canonical centers and branches in a different payload order', () => {
    // Given
    const payload = centersPayload();
    const reordered = {
      zh: { centers: [...payload.zh.centers].reverse().map((center) => ({ ...center, branches: [...center.branches].reverse() })) },
      en: { centers: [...payload.en.centers].reverse().map((center) => ({ ...center, branches: [...center.branches].reverse() })) },
    };

    // When / Then
    expect(publishedParse('centers', reordered)).not.toThrow();
  });

  it.each([
    ['missing group', (groups: ReturnType<typeof peoplePayload>['zh']['centerPeople']) => groups.slice(1)],
    ['renamed group', (groups: ReturnType<typeof peoplePayload>['zh']['centerPeople']) => groups.map((group, index) => index === 0 ? { ...group, centerId: 'renamed' } : group)],
    ['extra group', (groups: ReturnType<typeof peoplePayload>['zh']['centerPeople']) => [...groups, { ...groups[0], centerId: 'extra' }]],
    ['duplicate group', (groups: ReturnType<typeof peoplePayload>['zh']['centerPeople']) => groups.map((group, index) => index === 1 ? { ...group, centerId: groups[0]?.centerId } : group)],
  ])('rejects people center %s', (_caseName, change) => {
    // Given
    const payload = peoplePayload();
    const invalid = {
      ...payload,
      zh: { ...payload.zh, centerPeople: change(payload.zh.centerPeople) },
      en: { ...payload.en, centerPeople: change(payload.en.centerPeople) },
    };

    // When / Then
    expect(publishedParse('people', invalid)).toThrow(ContentBoundaryError);
  });

  it('accepts canonical people center groups in a different payload order', () => {
    // Given
    const payload = peoplePayload();
    const reordered = {
      ...payload,
      zh: { ...payload.zh, centerPeople: [...payload.zh.centerPeople].reverse() },
      en: { ...payload.en, centerPeople: [...payload.en.centerPeople].reverse() },
    };

    // When / Then
    expect(publishedParse('people', reordered)).not.toThrow();
  });

  it('rejects arbitrary holistic feature icons only at strict boundaries', () => {
    // Given
    const payload = holisticPayload();
    const invalid = {
      ...payload,
      zh: { ...payload.zh, features: payload.zh.features.map((feature, index) => index === 0 ? { ...feature, iconId: 'arbitrary' } : feature) },
    };

    // When / Then
    expect(CMS_PAYLOAD_REGISTRY.holistic.editableSchema.safeParse(invalid).success).toBe(true);
    expect(CMS_PAYLOAD_REGISTRY.holistic.schema.safeParse(invalid).success).toBe(false);
    expect(publishedParse('holistic', invalid)).toThrow(ContentBoundaryError);
  });

  it('requires at least one ALGEE step only at strict boundaries', () => {
    // Given
    const payload = holisticPayload();
    const invalid = {
      ...payload,
      zh: { ...payload.zh, algee: [] },
      en: { ...payload.en, algee: [] },
    };

    // When / Then
    expect(CMS_PAYLOAD_REGISTRY.holistic.editableSchema.safeParse(invalid).success).toBe(true);
    expect(CMS_PAYLOAD_REGISTRY.holistic.schema.safeParse(invalid).success).toBe(false);
    expect(publishedParse('holistic', invalid)).toThrow(ContentBoundaryError);
  });
});
