import { describe, expect, it } from 'vitest';
import snapshot from '@/content/generated/cms-snapshot.json';
import type { CmsDocumentKind } from './kinds';
import { CMS_PAYLOAD_REGISTRY } from './registry';
import type { z } from 'zod';

function sourcePayload(kind: CmsDocumentKind): unknown {
  const source = snapshot.find((candidate) => candidate.kind === kind);
  if (source === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return structuredClone(source.payload);
}

function expectParityRejection(
  contract: { readonly editableSchema: z.ZodType; readonly schema: z.ZodType; readonly publishedSchema: z.ZodType },
  cases: readonly (readonly [string, unknown])[],
): void {
  cases.forEach(([name, value]) => {
    expect(contract.editableSchema.safeParse(value).success, `${name}: editable`).toBe(false);
    expect(contract.schema.safeParse(value).success, `${name}: general`).toBe(false);
    expect(contract.publishedSchema.safeParse(value).success, `${name}: published`).toBe(false);
  });
}

describe('page editor bilingual positional parity', () => {
  it('rejects every facdev collection length mismatch', () => {
    const contract = CMS_PAYLOAD_REGISTRY.facdev;
    const payload = contract.schema.parse(sourcePayload('facdev'));
    const cases = [
      ['facdev_kpis_parity', { ...payload, en: { ...payload.en, kpis: payload.en.kpis.slice(1) } }],
      ['facdev_services_parity', { ...payload, en: { ...payload.en, services: payload.en.services.slice(1) } }],
      ['facdev_groups_parity', { ...payload, en: { ...payload.en, groups: payload.en.groups.slice(1) } }],
    ] as const;
    expectParityRejection(contract, cases);
  });

  it('rejects every EBM collection and nested course-row mismatch', () => {
    const contract = CMS_PAYLOAD_REGISTRY.ebm;
    const payload = contract.schema.parse(sourcePayload('ebm'));
    const courseGroup = payload.en.courseGroups[0];
    if (courseGroup === undefined) throw new TypeError('Missing EBM course group');
    const cases = [
      ['ebm_kpis_parity', { ...payload, en: { ...payload.en, kpis: payload.en.kpis.slice(1) } }],
      ['ebm_missions_parity', { ...payload, en: { ...payload.en, missions: payload.en.missions.slice(1) } }],
      ['ebm_awards_lit_parity', { ...payload, en: { ...payload.en, awardsLit: payload.en.awardsLit.slice(1) } }],
      ['ebm_awards_clin_parity', { ...payload, en: { ...payload.en, awardsClin: payload.en.awardsClin.slice(1) } }],
      ['ebm_awards_trans_parity', { ...payload, en: { ...payload.en, awardsTrans: payload.en.awardsTrans.slice(1) } }],
      ['ebm_stages_parity', { ...payload, en: { ...payload.en, stages: payload.en.stages.slice(1) } }],
      ['ebm_course_groups_parity', { ...payload, en: { ...payload.en, courseGroups: payload.en.courseGroups.slice(1) } }],
      ['ebm_course_rows_parity', {
        ...payload,
        en: {
          ...payload.en,
          courseGroups: [{ ...courseGroup, rows: courseGroup.rows.slice(1) }, ...payload.en.courseGroups.slice(1)],
        },
      }],
    ] as const;
    expectParityRejection(contract, cases);
  });

  it.each([
    ['ebm_stage_items_shorter_parity', (items: readonly string[]) => items.slice(1)],
    ['ebm_stage_items_longer_parity', (items: readonly string[]) => [...items, 'additional item']],
  ] as const)('rejects %s', (_name, mutateItems) => {
    const contract = CMS_PAYLOAD_REGISTRY.ebm;
    const payload = contract.schema.parse(sourcePayload('ebm'));
    const stage = payload.en.stages[0];
    if (stage === undefined) throw new TypeError('Missing EBM stage');
    const value = {
      ...payload,
      en: {
        ...payload.en,
        stages: [{ ...stage, items: mutateItems(stage.items) }, ...payload.en.stages.slice(1)],
      },
    };

    expectParityRejection(contract, [[_name, value]]);
  });

  it('rejects every holistic positional collection mismatch', () => {
    const contract = CMS_PAYLOAD_REGISTRY.holistic;
    const payload = contract.schema.parse(sourcePayload('holistic'));
    const cases = [
      ['holistic_kpis_parity', { ...payload, en: { ...payload.en, kpis: payload.en.kpis.slice(1) } }],
      ['holistic_features_parity', { ...payload, en: { ...payload.en, features: payload.en.features.slice(1) } }],
      ['holistic_algee_parity', { ...payload, en: { ...payload.en, algee: payload.en.algee.slice(1) } }],
      ['holistic_flow_parity', { ...payload, en: { ...payload.en, aiEcosystem: { ...payload.en.aiEcosystem, flow: payload.en.aiEcosystem.flow.slice(1) } } }],
      ['holistic_problems_parity', { ...payload, en: { ...payload.en, aiEcosystem: { ...payload.en.aiEcosystem, problems: payload.en.aiEcosystem.problems.slice(1) } } }],
      ['holistic_symposiums_parity', { ...payload, en: { ...payload.en, outcomes: { ...payload.en.outcomes, symposiums: payload.en.outcomes.symposiums.slice(1) } } }],
    ] as const;
    expectParityRejection(contract, cases);
  });

  it('rejects every holistic research collection and nested author mismatch', () => {
    const contract = CMS_PAYLOAD_REGISTRY.holistic_research;
    const payload = contract.schema.parse(sourcePayload('holistic_research'));
    const paper = payload.en.papers[0];
    if (paper === undefined) throw new TypeError('Missing research paper');
    const cases = [
      ['holistic_research_by_year_parity', { ...payload, en: { ...payload.en, byYear: payload.en.byYear.slice(1) } }],
      ['holistic_research_clinical_stats_parity', { ...payload, en: { ...payload.en, clinicalStats: payload.en.clinicalStats.slice(1) } }],
      ['holistic_research_papers_parity', { ...payload, en: { ...payload.en, papers: payload.en.papers.slice(1) } }],
      ['holistic_research_authors_parity', {
        ...payload,
        en: { ...payload.en, papers: [{ ...paper, authors: paper.authors.slice(1) }, ...payload.en.papers.slice(1)] },
      }],
    ] as const;
    expectParityRejection(contract, cases);
  });
});
