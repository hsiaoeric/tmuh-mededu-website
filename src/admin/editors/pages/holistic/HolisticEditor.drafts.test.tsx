// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { fieldIdForStructuredEditorIssuePath as fieldIdForIssuePath } from '@/admin/editors/shared';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { ControlledHolisticEditor, compactHolisticFixture, type HolisticPayload } from './HolisticEditor.testHarness';

afterEach(cleanup);

function output(view: ReturnType<typeof render>): HolisticPayload {
  return CMS_PAYLOAD_REGISTRY.holistic.editableSchema.parse(JSON.parse(view.getByTestId('holistic-payload').textContent ?? '{}'));
}

function change(path: readonly PropertyKey[], value: string): void {
  const field = document.getElementById(fieldIdForIssuePath(path));
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) throw new TypeError(`Missing ${fieldIdForIssuePath(path)}`);
  fireEvent.change(field, { target: { value } });
}

describe('holistic authored drafts', () => {
  it('preserves invalid numeric and color text without sibling coercion', () => {
    // Given
    const view = render(<ControlledHolisticEditor />);

    // When
    change(['zh', 'kpis', 0, 'num'], '1e');
    change(['zh', 'kpis', 0, 'color'], '#12zz99');
    change(['zh', 'features', 0, 'delay'], '-');
    change(['zh', 'aiEcosystem', 'flow', 0, 'color'], 'jade');
    change(['zh', 'outcomes', 'trainingParticipants', 'num'], '2.');

    // Then
    const next = output(view);
    expect(next.zh.kpis[0]).toMatchObject({ num: '1e', color: '#12zz99' });
    expect(next.zh.features[0]?.delay).toBe('-');
    expect(next.zh.aiEcosystem.flow[0]?.color).toBe('jade');
    expect(next.zh.outcomes.trainingParticipants.num).toBe('2.');
    expect(next.en).toEqual(compactHolisticFixture().en);
    expect(CMS_PAYLOAD_REGISTRY.holistic.schema.safeParse(next).success).toBe(false);
  });

  it('sets and clears optional symposium metrics without coercing absence', () => {
    // Given
    const initial = compactHolisticFixture();
    const firstZh = initial.zh.outcomes.symposiums[0];
    const firstEn = initial.en.outcomes.symposiums[0];
    if (firstZh === undefined || firstEn === undefined) throw new TypeError('Missing symposium fixture');
    const absent: HolisticPayload = {
      ...initial,
      zh: { ...initial.zh, outcomes: { ...initial.zh.outcomes, symposiums: [{ dates: firstZh.dates, edition: firstZh.edition, time: firstZh.time, title: firstZh.title, year: firstZh.year }] } },
      en: { ...initial.en, outcomes: { ...initial.en.outcomes, symposiums: [{ dates: firstEn.dates, edition: firstEn.edition, time: firstEn.time, title: firstEn.title, year: firstEn.year }] } },
    };
    const view = render(<ControlledHolisticEditor initial={absent} />);

    // When
    change(['zh', 'outcomes', 'symposiums', 0, 'attendees'], '0');
    change(['zh', 'outcomes', 'symposiums', 0, 'satisfaction'], '4.75');

    // Then
    expect(output(view).zh.outcomes.symposiums[0]).toMatchObject({ attendees: 0, satisfaction: 4.75 });

    // When
    change(['zh', 'outcomes', 'symposiums', 0, 'attendees'], '');
    change(['zh', 'outcomes', 'symposiums', 0, 'satisfaction'], '');

    // Then
    const cleared = output(view).zh.outcomes.symposiums[0];
    expect(cleared).not.toHaveProperty('attendees');
    expect(cleared).not.toHaveProperty('satisfaction');
  });
});
