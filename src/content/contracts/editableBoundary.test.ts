import { describe, expect, expectTypeOf, it } from 'vitest';
import snapshot from '@/content/generated/cms-snapshot.json';
import {
  CMS_PAYLOAD_REGISTRY,
  type CmsPayloadByKind,
  type EditableCmsPayloadByKind,
} from './registry';
import type { z } from 'zod';

function payload(kind: 'activities' | 'news' | 'kpis') {
  const source = snapshot.find((candidate) => candidate.kind === kind);
  if (source === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return structuredClone(source.payload);
}

function expectStructuralRejection(
  schemas: { readonly editableSchema: z.ZodType; readonly schema: z.ZodType },
  value: unknown,
): void {
  expect(schemas.editableSchema.safeParse(value).success).toBe(false);
  expect(schemas.schema.safeParse(value).success).toBe(false);
}

describe('editable payload contracts', () => {
  it('accepts semantic-invalid authored strings while strict contracts reject them', () => {
    const activities = CMS_PAYLOAD_REGISTRY.activities.schema.parse(payload('activities'));
    const first = activities.zh.holistic[0];
    if (first === undefined) throw new TypeError('Missing activity fixture');
    const invalid = {
      ...activities,
      zh: { ...activities.zh, holistic: [{ ...first, date: '', link: 'http://unsafe.test' }, ...activities.zh.holistic.slice(1)] },
      en: { ...activities.en, holistic: activities.en.holistic.map((row, index) => index === 0 ? { ...row, link: 'http://unsafe.test' } : row) },
    };

    expect(CMS_PAYLOAD_REGISTRY.activities.editableSchema.safeParse(invalid).success).toBe(true);
    expect(CMS_PAYLOAD_REGISTRY.activities.schema.safeParse(invalid).success).toBe(false);
    expect(CMS_PAYLOAD_REGISTRY.activities.publishedSchema.safeParse(invalid).success).toBe(false);
    expectTypeOf<EditableCmsPayloadByKind['activities']['zh']['department'][number]['date']>().toEqualTypeOf<string>();
  });

  it('accepts invalid news dates and KPI authored drafts only in the editable tier', () => {
    const news = CMS_PAYLOAD_REGISTRY.news.schema.parse(payload('news'));
    const announcement = news.zh.department[0];
    if (announcement === undefined) throw new TypeError('Missing news fixture');
    const invalidNews = {
      ...news,
      zh: { ...news.zh, department: [{ ...announcement, publishedOn: '' }, ...news.zh.department.slice(1)] },
      en: { ...news.en, department: news.en.department.map((row, index) => index === 0 ? { ...row, publishedOn: '' } : row) },
    };
    const kpis = CMS_PAYLOAD_REGISTRY.kpis.schema.parse(payload('kpis'));
    const item = kpis.zh.items[0];
    if (item === undefined) throw new TypeError('Missing KPI fixture');
    const invalidKpis = {
      ...kpis,
      zh: { items: [{ ...item, num: '', color: 'purple', delay: '1e' }, ...kpis.zh.items.slice(1)] },
    };

    expect(CMS_PAYLOAD_REGISTRY.news.editableSchema.safeParse(invalidNews).success).toBe(true);
    expect(CMS_PAYLOAD_REGISTRY.news.schema.safeParse(invalidNews).success).toBe(false);
    expect(CMS_PAYLOAD_REGISTRY.kpis.editableSchema.safeParse(invalidKpis).success).toBe(true);
    expect(CMS_PAYLOAD_REGISTRY.kpis.schema.safeParse(invalidKpis).success).toBe(false);
    expect(CMS_PAYLOAD_REGISTRY.kpis.publishedSchema.safeParse(invalidKpis).success).toBe(false);
    expectTypeOf<EditableCmsPayloadByKind['kpis']['zh']['items'][number]['num']>().toEqualTypeOf<string | number>();
    expectTypeOf<EditableCmsPayloadByKind['kpis']['zh']['items'][number]['delay']>().toEqualTypeOf<string | number>();
    expectTypeOf<CmsPayloadByKind['kpis']['zh']['items'][number]['num']>().toEqualTypeOf<number>();
    expectTypeOf<CmsPayloadByKind['kpis']['zh']['items'][number]['delay']>().toEqualTypeOf<number>();
  });

  it.each([
    ['wrong primitive', { zh: { department: 'bad' }, en: {} }],
    ['unknown key', { zh: { department: [], holistic: [], extra: true }, en: { department: [], holistic: [] } }],
  ])('rejects structurally unsafe activity payloads: %s', (_case, invalid) => {
    expect(CMS_PAYLOAD_REGISTRY.activities.editableSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects bilingual parity mismatch in editable and strict tiers', () => {
    const kpis = CMS_PAYLOAD_REGISTRY.kpis.schema.parse(payload('kpis'));
    const invalid = { ...kpis, en: { items: kpis.en.items.slice(1) } };

    expectStructuralRejection(CMS_PAYLOAD_REGISTRY.kpis, invalid);
  });

  it('rejects every positional people collection mismatch and malformed media', () => {
    const source = snapshot.find((candidate) => candidate.kind === 'people');
    if (source === undefined) throw new TypeError('Missing people fixture');
    const people = CMS_PAYLOAD_REGISTRY.people.schema.parse(structuredClone(source.payload));
    const group = people.en.centerPeople[0];
    const firstPerson = people.en.holisticInstructors[0];
    if (group === undefined || firstPerson === undefined) throw new TypeError('Missing people rows');
    const mismatches = [
      { ...people, en: { ...people.en, centerPeople: [{ ...group, people: group.people.slice(1) }, ...people.en.centerPeople.slice(1)] } },
      { ...people, en: { ...people.en, holisticInstructors: people.en.holisticInstructors.slice(1) } },
      { ...people, en: { ...people.en, holisticSeedTeachers: people.en.holisticSeedTeachers.slice(1) } },
      { ...people, en: { ...people.en, holisticAiTeam: people.en.holisticAiTeam.slice(1) } },
      { ...people, en: { ...people.en, holisticInstructors: [{ ...firstPerson, portrait: { kind: 'draft', bucket: 'wrong', path: 7 } }, ...people.en.holisticInstructors.slice(1)] } },
    ];

    mismatches.forEach((invalid) => expectStructuralRejection(CMS_PAYLOAD_REGISTRY.people, invalid));
  });

  it('rejects announcement, activity, and honors pairing mismatches', () => {
    const news = CMS_PAYLOAD_REGISTRY.news.schema.parse(payload('news'));
    const activities = CMS_PAYLOAD_REGISTRY.activities.schema.parse(payload('activities'));
    const honorsSource = snapshot.find((candidate) => candidate.kind === 'honors');
    if (honorsSource === undefined) throw new TypeError('Missing honors fixture');
    const honors = CMS_PAYLOAD_REGISTRY.honors.schema.parse(structuredClone(honorsSource.payload));
    const firstProject = honors.en.snqProjects[0];
    if (firstProject === undefined) throw new TypeError('Missing honors project');
    const mismatches = [
      [CMS_PAYLOAD_REGISTRY.news, { ...news, en: { ...news.en, department: news.en.department.slice(1) } }],
      [CMS_PAYLOAD_REGISTRY.news, { ...news, en: { ...news.en, holistic: news.en.holistic.slice(1) } }],
      [CMS_PAYLOAD_REGISTRY.activities, { ...activities, en: { ...activities.en, holistic: activities.en.holistic.slice(1) } }],
      [CMS_PAYLOAD_REGISTRY.honors, { ...honors, en: { ...honors.en, snqProjects: honors.en.snqProjects.slice(1) } }],
      [CMS_PAYLOAD_REGISTRY.honors, { ...honors, en: { ...honors.en, snqProjects: [{ ...firstProject, members: firstProject.members.slice(1) }, ...honors.en.snqProjects.slice(1)] } }],
      [CMS_PAYLOAD_REGISTRY.honors, { ...honors, en: { ...honors.en, snqYearCounts: honors.en.snqYearCounts.slice(1) } }],
      [CMS_PAYLOAD_REGISTRY.honors, { ...honors, en: { ...honors.en, nhqa: { ...honors.en.nhqa, leads: honors.en.nhqa.leads.slice(1) } } }],
      [CMS_PAYLOAD_REGISTRY.honors, { ...honors, en: { ...honors.en, nhqa: { ...honors.en.nhqa, keywords: honors.en.nhqa.keywords.slice(1) } } }],
    ] satisfies readonly (readonly [{ readonly editableSchema: z.ZodType; readonly schema: z.ZodType }, unknown])[];

    mismatches.forEach(([schemas, invalid]) => expectStructuralRejection(schemas, invalid));
  });
});
