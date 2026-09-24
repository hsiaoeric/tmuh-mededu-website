import { describe, expect, it } from 'vitest';
import snapshot from '@/content/generated/cms-snapshot.json';
import type { CmsDocumentKind } from './kinds';
import { CMS_PAYLOAD_REGISTRY } from './registry';
import type { z } from 'zod';

const PAGE_KINDS = [
  'digital_materials',
  'facdev',
  'ebm',
  'holistic',
  'holistic_research',
] as const satisfies readonly CmsDocumentKind[];

function sourcePayload(kind: (typeof PAGE_KINDS)[number]): unknown {
  const source = snapshot.find((candidate) => candidate.kind === kind);
  if (source === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return structuredClone(source.payload);
}

function expectEditableRepair(
  contract: { readonly editableSchema: z.ZodType; readonly schema: z.ZodType; readonly publishedSchema: z.ZodType },
  value: unknown,
): void {
  expect(contract.editableSchema.safeParse(value).success).toBe(true);
  expect(contract.schema.safeParse(value).success).toBe(false);
  expect(contract.publishedSchema.safeParse(value).success).toBe(false);
}

function expectEveryTierRejects(
  contract: { readonly editableSchema: z.ZodType; readonly schema: z.ZodType; readonly publishedSchema: z.ZodType },
  value: unknown,
): void {
  expect(contract.editableSchema.safeParse(value).success).toBe(false);
  expect(contract.schema.safeParse(value).success).toBe(false);
  expect(contract.publishedSchema.safeParse(value).success).toBe(false);
}

describe('page editor contract characterization', () => {
  it.each(PAGE_KINDS)('accepts the generated %s fixture at every contract tier', (kind) => {
    // Given
    const payload = sourcePayload(kind);
    const contract = CMS_PAYLOAD_REGISTRY[kind];

    // When
    const verdicts = [
      contract.editableSchema.safeParse(payload).success,
      contract.schema.safeParse(payload).success,
      contract.publishedSchema.safeParse(payload).success,
    ];

    // Then
    expect(verdicts).toEqual([true, true, true]);
  });
});

describe('page editor repair boundaries', () => {
  it('preserves invalid facdev KPI numerics only in the editable tier', () => {
    const contract = CMS_PAYLOAD_REGISTRY.facdev;
    const payload = contract.schema.parse(sourcePayload('facdev'));
    const kpi = payload.zh.kpis[0];
    if (kpi === undefined) throw new TypeError('Missing facdev row');
    const invalid = {
      ...payload,
      zh: {
        ...payload.zh,
        kpis: [{ ...kpi, num: '' }, ...payload.zh.kpis.slice(1)],
      },
    };
    expectEditableRepair(contract, invalid);
  });

  it('preserves invalid EBM KPI numerics only in the editable tier', () => {
    const contract = CMS_PAYLOAD_REGISTRY.ebm;
    const payload = contract.schema.parse(sourcePayload('ebm'));
    const kpi = payload.zh.kpis[0];
    if (kpi === undefined) throw new TypeError('Missing EBM row');
    const invalid = {
      ...payload,
      zh: {
        ...payload.zh,
        kpis: [{ ...kpi, num: '2.' }, ...payload.zh.kpis.slice(1)],
      },
    };
    expectEditableRepair(contract, invalid);
  });

  it('preserves invalid holistic date, time, year, numeric, and color drafts only in the editable tier', () => {
    const contract = CMS_PAYLOAD_REGISTRY.holistic;
    const payload = contract.schema.parse(sourcePayload('holistic'));
    const kpi = payload.zh.kpis[0];
    const feature = payload.zh.features[0];
    const flow = payload.zh.aiEcosystem.flow[0];
    const symposium = payload.zh.outcomes.symposiums[0];
    if (kpi === undefined || feature === undefined || flow === undefined || symposium === undefined) throw new TypeError('Missing holistic rows');
    const invalid = {
      ...payload,
      zh: {
        ...payload.zh,
        kpis: [{ ...kpi, num: '', color: 'repair-kpi' }, ...payload.zh.kpis.slice(1)],
        features: [{ ...feature, delay: '2e' }, ...payload.zh.features.slice(1)],
        aiEcosystem: { ...payload.zh.aiEcosystem, flow: [{ ...flow, color: 'repair-flow' }, ...payload.zh.aiEcosystem.flow.slice(1)] },
        outcomes: {
          ...payload.zh.outcomes,
          symposiums: [{ ...symposium, attendees: '1.', dates: 'repair-date', satisfaction: '', time: 'repair-time', year: '20x6' }, ...payload.zh.outcomes.symposiums.slice(1)],
          trainingParticipants: { ...payload.zh.outcomes.trainingParticipants, num: '' },
        },
      },
    };
    expectEditableRepair(contract, invalid);
  });

  it.each([
    ['holistic_invalid_symposium_date', { dates: '2026/02/30' }],
    ['holistic_invalid_symposium_time', { time: '10:00–09:00' }],
    ['holistic_invalid_symposium_year', { year: 2025 }],
  ])('preserves %s only for authored repair', (_name, change) => {
    const contract = CMS_PAYLOAD_REGISTRY.holistic;
    const payload = contract.schema.parse(sourcePayload('holistic'));
    const symposium = payload.zh.outcomes.symposiums[0];
    if (symposium === undefined) throw new TypeError('Missing holistic symposium');
    const invalid = {
      ...payload,
      zh: {
        ...payload.zh,
        outcomes: {
          ...payload.zh.outcomes,
          symposiums: [{ ...symposium, ...change }, ...payload.zh.outcomes.symposiums.slice(1)],
        },
      },
    };
    expectEditableRepair(contract, invalid);
  });

  it('preserves invalid holistic research year, month, and numeric drafts only in the editable tier', () => {
    const contract = CMS_PAYLOAD_REGISTRY.holistic_research;
    const payload = contract.schema.parse(sourcePayload('holistic_research'));
    const year = payload.zh.byYear[0];
    const stat = payload.zh.clinicalStats[0];
    const paper = payload.zh.papers[0];
    const enYear = payload.en.byYear[0];
    const enStat = payload.en.clinicalStats[0];
    const enPaper = payload.en.papers[0];
    if (year === undefined || stat === undefined || paper === undefined
      || enYear === undefined || enStat === undefined || enPaper === undefined) {
      throw new TypeError('Missing research rows');
    }
    const invalid = {
      ...payload,
      zh: {
        ...payload.zh,
        byYear: [{ ...year, clinical: '8e', edu: '', year: '20x6' }, ...payload.zh.byYear.slice(1)],
        clinicalStats: [{ ...stat, num: '1.' }, ...payload.zh.clinicalStats.slice(1)],
        papers: [{ ...paper, month: '13', year: '' }, ...payload.zh.papers.slice(1)],
      },
      en: {
        ...payload.en,
        byYear: [{ ...enYear, clinical: '8e', edu: '', year: '20x6' }, ...payload.en.byYear.slice(1)],
        clinicalStats: [{ ...enStat, num: '1.' }, ...payload.en.clinicalStats.slice(1)],
        papers: [{ ...enPaper, month: '13', year: '' }, ...payload.en.papers.slice(1)],
      },
    };
    expectEditableRepair(contract, invalid);
  });

  it.each(PAGE_KINDS)('rejects missing locales, unknown keys, and wrong shapes for %s', (kind) => {
    const contract = CMS_PAYLOAD_REGISTRY[kind];
    const payload = contract.schema.parse(sourcePayload(kind));
    const invalidValues = [
      { zh: payload.zh },
      { ...payload, unexpected: true },
      { ...payload, zh: [] },
    ];
    invalidValues.forEach((value) => expectEveryTierRejects(contract, value));
  });
});
