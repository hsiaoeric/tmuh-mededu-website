import { describe, expect, it } from 'vitest';
import snapshot from '@/content/generated/cms-snapshot.json';
import { CMS_PAYLOAD_REGISTRY } from './registry';
import type { z } from 'zod';

type StrictCase = {
  readonly name: string;
  readonly contract: {
    readonly editableSchema: z.ZodType;
    readonly schema: z.ZodType;
    readonly publishedSchema: z.ZodType;
  };
  readonly value: unknown;
};

function sourcePayload(kind: 'facdev' | 'ebm' | 'holistic' | 'holistic_research'): unknown {
  const source = snapshot.find((candidate) => candidate.kind === kind);
  if (source === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return structuredClone(source.payload);
}

function strictCases(): readonly StrictCase[] {
  const facdev = CMS_PAYLOAD_REGISTRY.facdev.schema.parse(sourcePayload('facdev'));
  const facdevKpi = facdev.zh.kpis[0];
  const ebm = CMS_PAYLOAD_REGISTRY.ebm.schema.parse(sourcePayload('ebm'));
  const ebmKpi = ebm.zh.kpis[0];
  const holistic = CMS_PAYLOAD_REGISTRY.holistic.schema.parse(sourcePayload('holistic'));
  const holisticKpi = holistic.zh.kpis[0];
  const feature = holistic.zh.features[0];
  const flow = holistic.zh.aiEcosystem.flow[0];
  const symposium = holistic.zh.outcomes.symposiums[0];
  const research = CMS_PAYLOAD_REGISTRY.holistic_research.schema.parse(sourcePayload('holistic_research'));
  const year = research.zh.byYear[0];
  const stat = research.zh.clinicalStats[0];
  const paper = research.zh.papers[0];
  const enYear = research.en.byYear[0];
  const enStat = research.en.clinicalStats[0];
  const enPaper = research.en.papers[0];
  if (facdevKpi === undefined || ebmKpi === undefined
    || holisticKpi === undefined || feature === undefined || flow === undefined || symposium === undefined
    || year === undefined || stat === undefined || paper === undefined
    || enYear === undefined || enStat === undefined || enPaper === undefined) {
    throw new TypeError('Page fixtures must contain representative rows');
  }

  return [
    { name: 'facdev_invalid_kpi_num', contract: CMS_PAYLOAD_REGISTRY.facdev, value: { ...facdev, zh: { ...facdev.zh, kpis: [{ ...facdevKpi, num: '' }, ...facdev.zh.kpis.slice(1)] } } },
    { name: 'ebm_invalid_kpi_num', contract: CMS_PAYLOAD_REGISTRY.ebm, value: { ...ebm, zh: { ...ebm.zh, kpis: [{ ...ebmKpi, num: '' }, ...ebm.zh.kpis.slice(1)] } } },
    { name: 'holistic_invalid_kpi_num', contract: CMS_PAYLOAD_REGISTRY.holistic, value: { ...holistic, zh: { ...holistic.zh, kpis: [{ ...holisticKpi, num: '' }, ...holistic.zh.kpis.slice(1)] } } },
    { name: 'holistic_invalid_kpi_color', contract: CMS_PAYLOAD_REGISTRY.holistic, value: { ...holistic, zh: { ...holistic.zh, kpis: [{ ...holisticKpi, color: 'repair' }, ...holistic.zh.kpis.slice(1)] } } },
    { name: 'holistic_invalid_feature_delay', contract: CMS_PAYLOAD_REGISTRY.holistic, value: { ...holistic, zh: { ...holistic.zh, features: [{ ...feature, delay: '2e' }, ...holistic.zh.features.slice(1)] } } },
    { name: 'holistic_invalid_flow_color', contract: CMS_PAYLOAD_REGISTRY.holistic, value: { ...holistic, zh: { ...holistic.zh, aiEcosystem: { ...holistic.zh.aiEcosystem, flow: [{ ...flow, color: 'repair' }, ...holistic.zh.aiEcosystem.flow.slice(1)] } } } },
    { name: 'holistic_invalid_symposium_attendees', contract: CMS_PAYLOAD_REGISTRY.holistic, value: { ...holistic, zh: { ...holistic.zh, outcomes: { ...holistic.zh.outcomes, symposiums: [{ ...symposium, attendees: '1.' }, ...holistic.zh.outcomes.symposiums.slice(1)] } } } },
    { name: 'holistic_invalid_symposium_date', contract: CMS_PAYLOAD_REGISTRY.holistic, value: { ...holistic, zh: { ...holistic.zh, outcomes: { ...holistic.zh.outcomes, symposiums: [{ ...symposium, dates: 'repair-date' }, ...holistic.zh.outcomes.symposiums.slice(1)] } } } },
    { name: 'holistic_invalid_symposium_satisfaction', contract: CMS_PAYLOAD_REGISTRY.holistic, value: { ...holistic, zh: { ...holistic.zh, outcomes: { ...holistic.zh.outcomes, symposiums: [{ ...symposium, satisfaction: '' }, ...holistic.zh.outcomes.symposiums.slice(1)] } } } },
    { name: 'holistic_invalid_symposium_time', contract: CMS_PAYLOAD_REGISTRY.holistic, value: { ...holistic, zh: { ...holistic.zh, outcomes: { ...holistic.zh.outcomes, symposiums: [{ ...symposium, time: 'repair-time' }, ...holistic.zh.outcomes.symposiums.slice(1)] } } } },
    { name: 'holistic_invalid_symposium_year', contract: CMS_PAYLOAD_REGISTRY.holistic, value: { ...holistic, zh: { ...holistic.zh, outcomes: { ...holistic.zh.outcomes, symposiums: [{ ...symposium, year: '20x6' }, ...holistic.zh.outcomes.symposiums.slice(1)] } } } },
    { name: 'holistic_fractional_symposium_year', contract: CMS_PAYLOAD_REGISTRY.holistic, value: { ...holistic, zh: { ...holistic.zh, outcomes: { ...holistic.zh.outcomes, symposiums: [{ ...symposium, year: 2026.5 }, ...holistic.zh.outcomes.symposiums.slice(1)] } } } },
    { name: 'holistic_invalid_training_num', contract: CMS_PAYLOAD_REGISTRY.holistic, value: { ...holistic, zh: { ...holistic.zh, outcomes: { ...holistic.zh.outcomes, trainingParticipants: { ...holistic.zh.outcomes.trainingParticipants, num: '' } } } } },
    { name: 'research_invalid_by_year_clinical', contract: CMS_PAYLOAD_REGISTRY.holistic_research, value: { ...research, zh: { ...research.zh, byYear: [{ ...year, clinical: '8e' }, ...research.zh.byYear.slice(1)] }, en: { ...research.en, byYear: [{ ...enYear, clinical: '8e' }, ...research.en.byYear.slice(1)] } } },
    { name: 'research_invalid_by_year_edu', contract: CMS_PAYLOAD_REGISTRY.holistic_research, value: { ...research, zh: { ...research.zh, byYear: [{ ...year, edu: '' }, ...research.zh.byYear.slice(1)] }, en: { ...research.en, byYear: [{ ...enYear, edu: '' }, ...research.en.byYear.slice(1)] } } },
    { name: 'research_invalid_by_year_year', contract: CMS_PAYLOAD_REGISTRY.holistic_research, value: { ...research, zh: { ...research.zh, byYear: [{ ...year, year: '20x6' }, ...research.zh.byYear.slice(1)] }, en: { ...research.en, byYear: [{ ...enYear, year: '20x6' }, ...research.en.byYear.slice(1)] } } },
    { name: 'research_invalid_clinical_stat_num', contract: CMS_PAYLOAD_REGISTRY.holistic_research, value: { ...research, zh: { ...research.zh, clinicalStats: [{ ...stat, num: '1.' }, ...research.zh.clinicalStats.slice(1)] }, en: { ...research.en, clinicalStats: [{ ...enStat, num: '1.' }, ...research.en.clinicalStats.slice(1)] } } },
    { name: 'research_invalid_paper_month', contract: CMS_PAYLOAD_REGISTRY.holistic_research, value: { ...research, zh: { ...research.zh, papers: [{ ...paper, month: '13' }, ...research.zh.papers.slice(1)] }, en: { ...research.en, papers: [{ ...enPaper, month: '13' }, ...research.en.papers.slice(1)] } } },
    { name: 'research_invalid_paper_year', contract: CMS_PAYLOAD_REGISTRY.holistic_research, value: { ...research, zh: { ...research.zh, papers: [{ ...paper, year: '' }, ...research.zh.papers.slice(1)] }, en: { ...research.en, papers: [{ ...enPaper, year: '' }, ...research.en.papers.slice(1)] } } },
  ];
}

describe('page editor editable-only strict semantics', () => {
  it.each(strictCases())('keeps $name repairable but unpublishable', ({ contract, value }) => {
    expect(contract.editableSchema.safeParse(value).success).toBe(true);
    expect(contract.schema.safeParse(value).success).toBe(false);
    expect(contract.publishedSchema.safeParse(value).success).toBe(false);
  });
});

describe('holistic symposium required field and JSON number parity', () => {
  const holistic = CMS_PAYLOAD_REGISTRY.holistic.schema.parse(sourcePayload('holistic'));

  it.each([
    ['holistic_missing_symposium_dates', 'dates'],
    ['holistic_missing_symposium_time', 'time'],
    ['holistic_missing_symposium_year', 'year'],
  ] as const)('rejects %s without throwing', (_name, field) => {
    const value = structuredClone(holistic);
    const symposium = value.zh.outcomes.symposiums[0];
    if (symposium === undefined) throw new TypeError('Holistic fixture must contain a symposium');
    Reflect.deleteProperty(symposium, field);

    expect(CMS_PAYLOAD_REGISTRY.holistic.editableSchema.safeParse(value).success).toBe(false);
    expect(CMS_PAYLOAD_REGISTRY.holistic.publishedSchema.safeParse(value).success).toBe(false);
  });

  it('accepts holistic_integral_decimal_symposium_year', () => {
    const symposium = holistic.zh.outcomes.symposiums[0];
    if (symposium === undefined) throw new TypeError('Holistic fixture must contain a symposium');
    const value = {
      ...holistic,
      zh: {
        ...holistic.zh,
        outcomes: {
          ...holistic.zh.outcomes,
          symposiums: [
            { ...symposium, year: Number(`${symposium.year}.0`) },
            ...holistic.zh.outcomes.symposiums.slice(1),
          ],
        },
      },
    };

    expect(CMS_PAYLOAD_REGISTRY.holistic.publishedSchema.safeParse(value).success).toBe(true);
  });
});
