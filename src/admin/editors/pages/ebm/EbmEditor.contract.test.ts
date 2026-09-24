import { describe, expect, it } from 'vitest';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { compactEbmFixture } from './EbmEditor.testFixture';

describe('EBM editable contract characterization', () => {
  it('accepts authored number drafts while the published contract rejects them', () => {
    // Given
    const payload = compactEbmFixture();
    const firstKpi = payload.zh.kpis[0];
    if (firstKpi === undefined) throw new TypeError('Missing KPI fixture');
    const authored = {
      ...payload,
      zh: {
        ...payload.zh,
        kpis: [{ ...firstKpi, num: '2x' }, ...payload.zh.kpis.slice(1)],
      },
    };

    // When
    const editable = CMS_PAYLOAD_REGISTRY.ebm.editableSchema.safeParse(authored);
    const published = CMS_PAYLOAD_REGISTRY.ebm.schema.safeParse(authored);

    // Then
    expect(editable.success).toBe(true);
    expect(published.success).toBe(false);
  });

  it('rejects every top-level and nested bilingual length mismatch', () => {
    // Given
    const payload = compactEbmFixture();
    const mismatches = [
      { ...payload, en: { ...payload.en, kpis: payload.en.kpis.slice(1) } },
      { ...payload, en: { ...payload.en, missions: payload.en.missions.slice(1) } },
      { ...payload, en: { ...payload.en, awardsLit: payload.en.awardsLit.slice(1) } },
      { ...payload, en: { ...payload.en, awardsClin: payload.en.awardsClin.slice(1) } },
      { ...payload, en: { ...payload.en, awardsTrans: payload.en.awardsTrans.slice(1) } },
      { ...payload, en: { ...payload.en, stages: payload.en.stages.slice(1) } },
      {
        ...payload,
        en: {
          ...payload.en,
          stages: payload.en.stages.map((stage, index) => index === 0
            ? { ...stage, items: stage.items.slice(1) }
            : stage),
        },
      },
      {
        ...payload,
        en: {
          ...payload.en,
          stages: payload.en.stages.map((stage, index) => index === 0
            ? { ...stage, items: [...stage.items, 'Authored extra stage item'] }
            : stage),
        },
      },
      { ...payload, en: { ...payload.en, courseGroups: payload.en.courseGroups.slice(1) } },
      {
        ...payload,
        en: {
          ...payload.en,
          courseGroups: payload.en.courseGroups.map((group, index) => index === 0
            ? { ...group, rows: group.rows.slice(1) }
            : group),
        },
      },
    ];

    // When
    const verdicts = mismatches.map((candidate) => (
      CMS_PAYLOAD_REGISTRY.ebm.editableSchema.safeParse(candidate).success
    ));

    // Then
    expect(verdicts).toEqual([false, false, false, false, false, false, false, false, false, false]);
  });
});
