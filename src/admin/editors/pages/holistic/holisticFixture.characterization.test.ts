import { describe, expect, it } from 'vitest';
import snapshot from '@/content/generated/cms-snapshot.json';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';

function fixture() {
  const source = snapshot.find((candidate) => candidate.kind === 'holistic');
  if (source === undefined) throw new TypeError('Missing holistic fixture');
  return CMS_PAYLOAD_REGISTRY.holistic.schema.parse(structuredClone(source.payload));
}

describe('holistic editor fixture characterization', () => {
  it('has paired positional collections in the authored display order', () => {
    // Given / When
    const payload = fixture();

    // Then
    expect({
      kpis: [payload.zh.kpis.length, payload.en.kpis.length],
      features: [payload.zh.features.length, payload.en.features.length],
      algee: [payload.zh.algee.length, payload.en.algee.length],
      flow: [payload.zh.aiEcosystem.flow.length, payload.en.aiEcosystem.flow.length],
      problems: [payload.zh.aiEcosystem.problems.length, payload.en.aiEcosystem.problems.length],
      symposiums: [payload.zh.outcomes.symposiums.length, payload.en.outcomes.symposiums.length],
    }).toEqual({
      kpis: [4, 4],
      features: [3, 3],
      algee: [5, 5],
      flow: [3, 3],
      problems: [3, 3],
      symposiums: [4, 4],
    });
    expect(payload.zh.kpis.map((row) => row.label)).toEqual([
      '113 學年種子教師',
      '全人種子教師（累計）',
      'MHFA 指導員／種子教師',
      '全院全人相關研究論文',
    ]);
  });

  it('keeps malformed authored symposium fields editable but not strict-valid', () => {
    // Given
    const payload = fixture();
    const symposium = payload.zh.outcomes.symposiums[0];
    if (symposium === undefined) throw new TypeError('Missing symposium fixture');
    const authored = {
      ...payload,
      zh: {
        ...payload.zh,
        outcomes: {
          ...payload.zh.outcomes,
          symposiums: [{
            ...symposium,
            attendees: '1.',
            dates: 'repair-date',
            satisfaction: '',
            time: '17:00–08:00',
            year: '202x',
          }, ...payload.zh.outcomes.symposiums.slice(1)],
        },
      },
    };

    // When / Then
    expect(CMS_PAYLOAD_REGISTRY.holistic.editableSchema.safeParse(authored).success).toBe(true);
    expect(CMS_PAYLOAD_REGISTRY.holistic.schema.safeParse(authored).success).toBe(false);
  });

  it('accepts absent optional symposium metrics and integral-decimal years', () => {
    // Given
    const payload = fixture();
    const symposium = payload.zh.outcomes.symposiums[3];
    if (symposium === undefined) throw new TypeError('Missing optional symposium fixture');

    // When / Then
    expect(symposium.attendees).toBeUndefined();
    expect(symposium.satisfaction).toBeUndefined();
    expect(CMS_PAYLOAD_REGISTRY.holistic.schema.safeParse({
      ...payload,
      zh: {
        ...payload.zh,
        outcomes: {
          ...payload.zh.outcomes,
          symposiums: [{ ...symposium, year: 2024.0 }, ...payload.zh.outcomes.symposiums.slice(1)],
        },
      },
    }).success).toBe(true);
  });
});
