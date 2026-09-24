import { describe, expect, it } from 'vitest';
import { buildSourceDocuments } from '../../../scripts/content/extract';
import { CMS_PAYLOAD_REGISTRY } from './registry';

const KPI_IDS = [
  'department_advisors',
  'teaching_attendings',
  'teaching_allied_health',
  'education_centers',
] as const;

const MEMBER_GROUP_IDS = KPI_IDS.slice(0, 3);

function source(kind: 'kpis' | 'people'): unknown {
  const document = buildSourceDocuments().find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} source document`);
  return document.payload;
}

function kpisPayload() {
  return CMS_PAYLOAD_REGISTRY.kpis.publishedSchema.parse(source('kpis'));
}

function peoplePayload() {
  return CMS_PAYLOAD_REGISTRY.people.publishedSchema.parse(source('people'));
}

describe('Glance CMS source contracts', () => {
  it('extracts canonical KPI identities and localized panel copy in fixed order', () => {
    // Given / When
    const payload = source('kpis');

    // Then
    expect(payload).toMatchObject({
      zh: { items: KPI_IDS.map((id) => ({ id, panelTitle: expect.any(String) })) },
      en: { items: KPI_IDS.map((id) => ({ id, panelTitle: expect.any(String) })) },
    });
  });

  it('extracts member groups for personnel KPIs and none for education centers', () => {
    // Given / When
    const payload = source('people');

    // Then
    expect(payload).toMatchObject({
      zh: { memberGroups: MEMBER_GROUP_IDS.map((id) => ({ id, people: expect.any(Array) })) },
      en: { memberGroups: MEMBER_GROUP_IDS.map((id) => ({ id, people: expect.any(Array) })) },
    });
    expect(JSON.stringify(payload)).not.toContain('"id":"education_centers","people"');
  });

  it('accepts the complete canonical KPI and people payloads directly', () => {
    // Given / When / Then
    expect(CMS_PAYLOAD_REGISTRY.kpis.publishedSchema.safeParse(kpisPayload()).success).toBe(true);
    expect(CMS_PAYLOAD_REGISTRY.people.publishedSchema.safeParse(peoplePayload()).success).toBe(true);
  });

  it('rejects missing, partial, and reordered KPI identities while allowing caption edits', () => {
    // Given
    const payload = kpisPayload();
    const first = payload.zh.items[0];
    const second = payload.zh.items[1];
    if (first === undefined || second === undefined) throw new TypeError('Missing KPI contract fixtures');
    const { id: removedId, ...withoutId } = first;
    const { panelTitle: removedPanelTitle, ...withoutPanelTitle } = first;

    // When / Then
    expect(removedId).toBe('department_advisors');
    expect(removedPanelTitle.length).toBeGreaterThan(0);
    expect(CMS_PAYLOAD_REGISTRY.kpis.publishedSchema.safeParse({
      ...payload,
      zh: { items: [withoutId, ...payload.zh.items.slice(1)] },
    }).success).toBe(false);
    expect(CMS_PAYLOAD_REGISTRY.kpis.publishedSchema.safeParse({
      ...payload,
      zh: { items: [withoutPanelTitle, ...payload.zh.items.slice(1)] },
    }).success).toBe(false);
    expect(CMS_PAYLOAD_REGISTRY.kpis.publishedSchema.safeParse({
      ...payload,
      zh: { items: [second, first, ...payload.zh.items.slice(2)] },
    }).success).toBe(false);
    expect(CMS_PAYLOAD_REGISTRY.kpis.publishedSchema.safeParse({
      ...payload,
      zh: { items: [{ ...first, en: 'Renamed caption' }, ...payload.zh.items.slice(1)] },
    }).success).toBe(true);
  });

  it('rejects missing, extra, reordered, non-canonical-role, and unpaired member groups', () => {
    // Given
    const payload = peoplePayload();
    const first = payload.zh.memberGroups[0];
    const second = payload.zh.memberGroups[1];
    const firstPerson = first?.people[0];
    if (first === undefined || second === undefined || firstPerson === undefined) {
      throw new TypeError('Missing people contract fixtures');
    }
    const { memberGroups: removedGroups, ...withoutGroups } = payload.zh;

    // When / Then
    expect(removedGroups).toHaveLength(3);
    expect(CMS_PAYLOAD_REGISTRY.people.publishedSchema.safeParse({ ...payload, zh: withoutGroups }).success).toBe(false);
    expect(CMS_PAYLOAD_REGISTRY.people.publishedSchema.safeParse({
      ...payload,
      zh: { ...payload.zh, memberGroups: [second, first, ...payload.zh.memberGroups.slice(2)] },
    }).success).toBe(false);
    expect(CMS_PAYLOAD_REGISTRY.people.publishedSchema.safeParse({
      ...payload,
      zh: { ...payload.zh, memberGroups: [...payload.zh.memberGroups, { id: 'education_centers', people: [] }] },
    }).success).toBe(false);
    expect(CMS_PAYLOAD_REGISTRY.people.publishedSchema.safeParse({
      ...payload,
      zh: { ...payload.zh, memberGroups: [{ ...first, people: [{ ...firstPerson, roleKey: 'unknown' }, ...first.people.slice(1)] }, ...payload.zh.memberGroups.slice(1)] },
    }).success).toBe(false);
    expect(CMS_PAYLOAD_REGISTRY.people.publishedSchema.safeParse({
      ...payload,
      en: { ...payload.en, memberGroups: payload.en.memberGroups.map((group, index) => index === 1 ? { ...group, people: group.people.slice(1) } : group) },
    }).success).toBe(false);
  });
});
