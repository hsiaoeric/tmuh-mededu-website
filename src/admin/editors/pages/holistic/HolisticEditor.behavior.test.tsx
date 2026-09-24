// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { fieldIdForStructuredEditorIssuePath as fieldIdForIssuePath } from '@/admin/editors/shared';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import {
  ControlledHolisticEditor,
  compactHolisticFixture,
  type HolisticPayload,
} from './HolisticEditor.testHarness';

afterEach(cleanup);

function payload(view: ReturnType<typeof render>): HolisticPayload {
  return CMS_PAYLOAD_REGISTRY.holistic.editableSchema.parse(
    JSON.parse(view.getByTestId('holistic-payload').textContent ?? '{}'),
  );
}

function collection(view: ReturnType<typeof render>, id: string): HTMLElement {
  const element = view.container.querySelector(`[data-editor-collection="${id}"]`);
  if (!(element instanceof HTMLElement)) throw new TypeError(`Missing ${id}`);
  return element;
}

function reversedRangePayload(locale: 'zh' | 'en', dates: string): HolisticPayload {
  const initial = compactHolisticFixture();
  const row = initial[locale].outcomes.symposiums[0];
  if (row === undefined) throw new TypeError(`Missing ${locale} symposium`);
  const outcomes = {
    ...initial[locale].outcomes,
    symposiums: [{ ...row, dates, time: '08:00–12:00 / 13:00–17:00' }],
  };
  return locale === 'zh'
    ? { ...initial, zh: { ...initial.zh, outcomes } }
    : { ...initial, en: { ...initial.en, outcomes } };
}

function dateField(locale: 'zh' | 'en'): HTMLInputElement {
  const field = document.getElementById(fieldIdForIssuePath([locale, 'outcomes', 'symposiums', 0, 'dates']));
  if (!(field instanceof HTMLInputElement)) throw new TypeError(`Missing ${locale} symposium date field`);
  return field;
}

describe('holistic editor controlled behavior', () => {
  it('renders every major section and preserves exact paired order through a move', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<ControlledHolisticEditor />);

    // When
    await user.click(within(collection(view, 'holistic-kpis')).getByRole('button', { name: '下移第 1 個 KPI' }));

    // Then
    expect(view.getByRole('heading', { name: '全人照護關鍵數據' })).toBeTruthy();
    expect(view.getByRole('heading', { name: '中心特色' })).toBeTruthy();
    expect(view.getByRole('heading', { name: 'ALGEE' })).toBeTruthy();
    expect(view.getByRole('heading', { name: 'AI 教學生態系' })).toBeTruthy();
    expect(view.getByRole('heading', { name: '培訓成果' })).toBeTruthy();
    expect(payload(view).zh.kpis.map((row) => row.label).slice(0, 2)).toEqual([
      '全人種子教師（累計）',
      '113 學年種子教師',
    ]);
    expect(payload(view).en.kpis.map((row) => row.label).slice(0, 2)).toEqual([
      'Holistic Seed Teachers (total)',
      'AY113 Seed Teachers',
    ]);
  });

  it('keeps malformed symposium fields editable and repairs them to strict-valid', () => {
    // Given
    const initial = compactHolisticFixture();
    const zh = initial.zh.outcomes.symposiums[0];
    if (zh === undefined) throw new TypeError('Missing symposium');
    const invalid: HolisticPayload = {
      ...initial,
      zh: {
        ...initial.zh,
        outcomes: {
          ...initial.zh.outcomes,
          symposiums: [{ ...zh, dates: 'repair', time: '17:00–08:00', year: '202x' }, ...initial.zh.outcomes.symposiums.slice(1)],
        },
      },
    };
    const view = render(<ControlledHolisticEditor initial={invalid} />);
    const dates = document.getElementById(fieldIdForIssuePath(['zh', 'outcomes', 'symposiums', 0, 'dates']));
    if (!(dates instanceof HTMLInputElement)) throw new TypeError('Missing symposium date field');

    // When
    fireEvent.change(dates, { target: { value: '2021/12/04（六）' } });
    const time = document.getElementById(fieldIdForIssuePath(['zh', 'outcomes', 'symposiums', 0, 'time']));
    if (!(time instanceof HTMLInputElement)) throw new TypeError('Missing symposium time field');
    fireEvent.change(time, { target: { value: '08:00–17:00' } });
    const year = document.getElementById(fieldIdForIssuePath(['zh', 'outcomes', 'symposiums', 0, 'year']));
    if (!(year instanceof HTMLInputElement)) throw new TypeError('Missing symposium year field');
    fireEvent.change(year, { target: { value: '2021.0' } });

    // Then
    const repaired = payload(view);
    expect(repaired.zh.outcomes.symposiums[0]).toMatchObject({
      dates: '2021/12/04（六）',
      time: '08:00–17:00',
      year: 2021,
    });
    expect(CMS_PAYLOAD_REGISTRY.holistic.schema.safeParse(repaired).success).toBe(true);
    expect(view.queryByRole('alert')).toBeNull();
  });

  it.each([
    ['zh', '2021/12/05（日）– 12/04（六）', '2021/12/04（六）– 12/05（日）'],
    ['en', 'Sun–Sat 2021/12/05–04', 'Sat–Sun 2021/12/04–05'],
  ] as const)('keeps a reversed %s multi-day range editable-invalid until repaired', (locale, reversed, repaired) => {
    // Given
    const view = render(<ControlledHolisticEditor initial={reversedRangePayload(locale, reversed)} />);
    const dates = dateField(locale);
    expect(dates.value).toBe(reversed);
    expect(dates.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(`${dates.id}-error`)?.textContent).toBeTruthy();
    expect(CMS_PAYLOAD_REGISTRY.holistic.schema.safeParse(payload(view)).success).toBe(false);

    // When
    fireEvent.change(dates, { target: { value: repaired } });

    // Then
    const repairedDates = dateField(locale);
    expect(repairedDates.value).toBe(repaired);
    expect(repairedDates.getAttribute('aria-invalid')).toBeNull();
    expect(document.getElementById(`${repairedDates.id}-error`)).toBeNull();
    expect(CMS_PAYLOAD_REGISTRY.holistic.schema.safeParse(payload(view)).success).toBe(true);
  });

  it('cancels a pending destructive action after an external revision', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<ControlledHolisticEditor />);
    await user.click(within(collection(view, 'holistic-kpis')).getByRole('button', { name: '刪除第 1 個 KPI' }));

    // When
    await user.click(view.getByRole('button', { name: '外部反轉 KPI' }));
    await user.click(view.getByRole('button', { name: '確認刪除 KPI' }));

    // Then
    await waitFor(() => expect(view.queryByRole('button', { name: '確認刪除 KPI' })).toBeNull());
    expect(payload(view).zh.kpis).toHaveLength(2);
    expect(payload(view).zh.kpis[0]?.label).toBe('全人種子教師（累計）');
  });
});
