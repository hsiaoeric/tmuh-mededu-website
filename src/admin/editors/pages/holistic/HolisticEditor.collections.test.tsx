// @vitest-environment jsdom
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { fieldIdForStructuredEditorIssuePath as fieldIdForIssuePath } from '@/admin/editors/shared';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import {
  ControlledHolisticEditor,
  holisticFixture,
  type HolisticPayload,
} from './HolisticEditor.testHarness';

afterEach(cleanup);

function output(view: ReturnType<typeof render>): HolisticPayload {
  return CMS_PAYLOAD_REGISTRY.holistic.editableSchema.parse(JSON.parse(view.getByTestId('holistic-payload').textContent ?? '{}'));
}

function list(view: ReturnType<typeof render>, id: string): HTMLElement {
  const element = view.container.querySelector(`[data-editor-collection="${id}"]`);
  if (!(element instanceof HTMLElement)) throw new TypeError(`Missing ${id}`);
  return element;
}

function twoRows(): HolisticPayload {
  const value = holisticFixture();
  return {
    zh: {
      ...value.zh,
      kpis: value.zh.kpis.slice(0, 2),
      features: value.zh.features.slice(0, 2),
      algee: value.zh.algee.slice(0, 2),
      aiEcosystem: { ...value.zh.aiEcosystem, flow: value.zh.aiEcosystem.flow.slice(0, 2), problems: value.zh.aiEcosystem.problems.slice(0, 2) },
      outcomes: { ...value.zh.outcomes, symposiums: value.zh.outcomes.symposiums.slice(0, 2) },
    },
    en: {
      ...value.en,
      kpis: value.en.kpis.slice(0, 2),
      features: value.en.features.slice(0, 2),
      algee: value.en.algee.slice(0, 2),
      aiEcosystem: { ...value.en.aiEcosystem, flow: value.en.aiEcosystem.flow.slice(0, 2), problems: value.en.aiEcosystem.problems.slice(0, 2) },
      outcomes: { ...value.en.outcomes, symposiums: value.en.outcomes.symposiums.slice(0, 2) },
    },
  };
}

const COLLECTIONS = [
  ['holistic-kpis', 'KPI'],
  ['holistic-features', '特色'],
  ['holistic-algee', 'ALGEE 步驟'],
  ['holistic-ai-flow', '流程節點'],
  ['holistic-ai-problems', '問題'],
  ['holistic-symposiums', '研討會'],
] as const;

describe('holistic paired collections', () => {
  it('renders an actionable empty state for every collection', () => {
    // Given
    const initial = twoRows();
    const empty: HolisticPayload = {
      zh: { ...initial.zh, kpis: [], features: [], algee: [], aiEcosystem: { ...initial.zh.aiEcosystem, flow: [], problems: [] }, outcomes: { ...initial.zh.outcomes, symposiums: [] } },
      en: { ...initial.en, kpis: [], features: [], algee: [], aiEcosystem: { ...initial.en.aiEcosystem, flow: [], problems: [] }, outcomes: { ...initial.en.outcomes, symposiums: [] } },
    };

    // When
    const view = render(<ControlledHolisticEditor initial={empty} />);

    // Then
    ['尚無KPI', '尚無中心特色', '尚無ALGEE 步驟', '尚無流程節點', '尚無問題', '尚無研討會'].forEach((name) => {
      expect(view.getByRole('heading', { name })).toBeTruthy();
    });
  });

  it('adds a bilingual row to every collection without implicit sorting', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<ControlledHolisticEditor initial={twoRows()} />);

    // When
    for (const [id, noun] of COLLECTIONS) await user.click(within(list(view, id)).getByRole('button', { name: `新增 ${noun}` }));

    // Then
    const next = output(view);
    expect([next.zh.kpis.length, next.zh.features.length, next.zh.algee.length, next.zh.aiEcosystem.flow.length, next.zh.aiEcosystem.problems.length, next.zh.outcomes.symposiums.length]).toEqual([3, 3, 3, 3, 3, 3]);
    expect([next.en.kpis.length, next.en.features.length, next.en.algee.length, next.en.aiEcosystem.flow.length, next.en.aiEcosystem.problems.length, next.en.outcomes.symposiums.length]).toEqual([3, 3, 3, 3, 3, 3]);
    expect(next.zh.outcomes.symposiums[2]?.year).toBe(2026);
  });

  it('moves every bilingual collection in exact authored order', async () => {
    // Given
    const user = userEvent.setup();
    const initial = twoRows();
    const view = render(<ControlledHolisticEditor initial={initial} />);

    // When
    for (const [id, noun] of COLLECTIONS) await user.click(within(list(view, id)).getByRole('button', { name: `下移第 1 個 ${noun}` }));

    // Then
    const next = output(view);
    expect(next.zh.kpis.map((row) => row.label)).toEqual([initial.zh.kpis[1]?.label, initial.zh.kpis[0]?.label]);
    expect(next.en.features.map((row) => row.title)).toEqual([initial.en.features[1]?.title, initial.en.features[0]?.title]);
    expect(next.zh.algee.map((row) => row.title)).toEqual([initial.zh.algee[1]?.title, initial.zh.algee[0]?.title]);
    expect(next.en.aiEcosystem.flow.map((row) => row.title)).toEqual([initial.en.aiEcosystem.flow[1]?.title, initial.en.aiEcosystem.flow[0]?.title]);
    expect(next.zh.aiEcosystem.problems).toEqual([initial.zh.aiEcosystem.problems[1], initial.zh.aiEcosystem.problems[0]]);
    expect(next.en.outcomes.symposiums.map((row) => row.title)).toEqual([initial.en.outcomes.symposiums[1]?.title, initial.en.outcomes.symposiums[0]?.title]);
  });

  it('removes the same position from both locales in every collection', async () => {
    // Given
    const user = userEvent.setup();
    const initial = twoRows();
    const view = render(<ControlledHolisticEditor initial={initial} />);

    // When
    for (const [id, noun] of COLLECTIONS) {
      await user.click(within(list(view, id)).getByRole('button', { name: `刪除第 1 個 ${noun}` }));
      await user.click(view.getByRole('button', { name: `確認刪除 ${noun}` }));
    }

    // Then
    const next = output(view);
    expect(next.zh.kpis[0]?.label).toBe(initial.zh.kpis[1]?.label);
    expect(next.en.features[0]?.title).toBe(initial.en.features[1]?.title);
    expect(next.zh.algee[0]?.title).toBe(initial.zh.algee[1]?.title);
    expect(next.en.aiEcosystem.flow[0]?.title).toBe(initial.en.aiEcosystem.flow[1]?.title);
    expect(next.zh.aiEcosystem.problems[0]).toBe(initial.zh.aiEcosystem.problems[1]);
    expect(next.en.outcomes.symposiums[0]?.title).toBe(initial.en.outcomes.symposiums[1]?.title);
  }, 15_000);

  it('updates each collection row while preserving its paired sibling', () => {
    // Given
    const view = render(<ControlledHolisticEditor initial={twoRows()} />);

    // When
    const changes = [
      [['zh', 'kpis', 0, 'label'], '新 KPI'],
      [['zh', 'features', 0, 'title'], '新特色'],
      [['zh', 'algee', 0, 'title'], '新步驟'],
      [['zh', 'aiEcosystem', 'flow', 0, 'title'], '新節點'],
      [['zh', 'aiEcosystem', 'problems', 0], '新問題'],
      [['zh', 'outcomes', 'symposiums', 0, 'title'], '新研討會'],
    ] as const;
    changes.forEach(([path, value]) => {
      const field = document.getElementById(fieldIdForIssuePath(path));
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) throw new TypeError(`Missing ${fieldIdForIssuePath(path)}`);
      fireEvent.change(field, { target: { value } });
    });

    // Then
    const next = output(view);
    expect([next.zh.kpis[0]?.label, next.zh.features[0]?.title, next.zh.algee[0]?.title, next.zh.aiEcosystem.flow[0]?.title, next.zh.aiEcosystem.problems[0], next.zh.outcomes.symposiums[0]?.title]).toEqual(['新 KPI', '新特色', '新步驟', '新節點', '新問題', '新研討會']);
    expect(next.en.kpis[0]?.label).toBe('AY113 Seed Teachers');
  });

  it.each(['unchanged', 'stale'] as const)('does not announce or mutate after a rejected %s operation', async (status) => {
    // Given
    const user = userEvent.setup();
    const view = render(<ControlledHolisticEditor initial={twoRows()} result={{ status }} />);
    const kpis = list(view, 'holistic-kpis');

    // When
    await user.click(within(kpis).getByRole('button', { name: '下移第 1 個 KPI' }));

    // Then
    expect(output(view).zh.kpis[0]?.label).toBe('113 學年種子教師');
    expect(kpis.querySelector('.admin-editor-reorder-announcer')?.textContent).toBe('');
  });
});
