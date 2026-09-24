import { describe, expect, it } from 'vitest';
import snapshot from '../generated/cms-snapshot.json';
import { PublishedPersonSchema } from './common';
import { CentersPayloadSchema, PublishedCentersPayloadSchema } from './centers';
import { FacdevPayloadSchema } from './facdev';
import { NewsPayloadSchema } from './news';
import { PeoplePayloadSchema } from './people';

function center(id: string, branchIds: readonly string[], externalUrl?: string) {
  return {
    id, name: id, intro: '', contact: '', ext: '',
    ...(externalUrl === undefined ? {} : { externalUrl }),
    branches: branchIds.map((branchId) => ({
      id: branchId, name: branchId, description: '',
    })),
  };
}

describe('nested CMS validation', () => {
  it('rejects unknown published person roles at the shared person boundary', () => {
    // Given
    const row = snapshot.find((item) => item.kind === 'people');
    if (row === undefined) throw new TypeError('Missing people fixture');
    const payload = PeoplePayloadSchema.parse(row.payload);
    const person = payload.zh.centerPeople[0]?.people[0];
    if (person === undefined) throw new TypeError('Missing person fixture');

    // When
    const result = PublishedPersonSchema.safeParse({ ...person, roleKey: 'unknown-role' });

    // Then
    expect(result.success).toBe(false);
  });

  it('rejects reordered people identities and divergent shared person metadata', () => {
    // Given
    const row = snapshot.find((item) => item.kind === 'people');
    if (row === undefined) throw new TypeError('Missing people fixture');
    const payload = PeoplePayloadSchema.parse(row.payload);
    const englishGroup = payload.en.centerPeople[0];
    if (englishGroup === undefined || englishGroup.people.length < 2) {
      throw new TypeError('Incomplete center people fixture');
    }
    const reordered = {
      ...payload,
      en: {
        ...payload.en,
        centerPeople: [
          { ...englishGroup, people: [englishGroup.people[1], englishGroup.people[0], ...englishGroup.people.slice(2)] },
          ...payload.en.centerPeople.slice(1),
        ],
      },
    };
    const firstEnglish = englishGroup.people[0];
    if (firstEnglish === undefined) throw new TypeError('Missing English person fixture');
    const divergent = {
      ...payload,
      en: {
        ...payload.en,
        centerPeople: [
          { ...englishGroup, people: [{ ...firstEnglish, roleKey: 'advisor' }, ...englishGroup.people.slice(1)] },
          ...payload.en.centerPeople.slice(1),
        ],
      },
    };

    // When
    const results = [PeoplePayloadSchema.safeParse(reordered), PeoplePayloadSchema.safeParse(divergent)];

    // Then
    expect(results.every((result) => !result.success)).toBe(true);
  });

  it('rejects facdev leads with divergent locale identities', () => {
    // Given
    const row = snapshot.find((item) => item.kind === 'facdev');
    if (row === undefined) throw new TypeError('Missing facdev fixture');
    const payload = FacdevPayloadSchema.parse(row.payload);
    const group = payload.en.groups[0];
    if (group === undefined) throw new TypeError('Missing facdev group fixture');
    const divergent = {
      ...payload,
      en: {
        ...payload.en,
        groups: [{ ...group, lead: { ...group.lead, id: 'different-lead' } }, ...payload.en.groups.slice(1)],
      },
    };

    // When
    const result = FacdevPayloadSchema.safeParse(divergent);

    // Then
    expect(result.success).toBe(false);
  });

  it('reports duplicate center and branch IDs at their indexed ID fields', () => {
    // Given
    const locale = { centers: [center('same', ['branch', 'branch']), center('same', [])] };

    // When
    const result = CentersPayloadSchema.safeParse({ zh: locale, en: locale });

    // Then
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.map((issue) => issue.path)).toContainEqual(['zh', 'centers', 1, 'id']);
    expect(result.error.issues.map((issue) => issue.path)).toContainEqual([
      'zh', 'centers', 0, 'branches', 1, 'id',
    ]);
  });

  it('rejects unsafe nested URLs and malformed localized dates', () => {
    // Given
    const centers = { centers: [center('center', [], 'http://unsafe.example')] };
    const announcement = {
      id: 'news', publishedOn: '2026-02-30', category: 'department', pinned: false,
      tag: '', title: '', lines: [],
    };
    const news = {
      department: [announcement], holistic: [],
    };

    // When
    const results = [
      CentersPayloadSchema.safeParse({ zh: centers, en: centers }),
      NewsPayloadSchema.safeParse({ announcementBoardUrl: 'https://example.test', zh: news, en: news }),
    ];

    // Then
    expect(results.every((result) => !result.success)).toBe(true);
  });

  it('accepts canonical branch identities in different locale orders', () => {
    // Given
    const row = snapshot.find((item) => item.kind === 'centers');
    if (row === undefined) throw new TypeError('Missing centers fixture');
    const payload = PublishedCentersPayloadSchema.parse(row.payload);
    const first = payload.en.centers[0];
    if (first === undefined) throw new TypeError('Missing center fixture');
    const reordered = {
      ...payload,
      en: {
        centers: [{ ...first, branches: [...first.branches].reverse() }, ...payload.en.centers.slice(1)],
      },
    };

    // When
    const result = PublishedCentersPayloadSchema.safeParse(reordered);

    // Then
    expect(result.success).toBe(true);
  });

});
