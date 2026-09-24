// @vitest-environment jsdom
import { cleanup, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import {
  compactHolisticResearchFixture,
  HolisticResearchEditorHarness,
  readHarnessPayload,
} from './HolisticResearchEditor.testHarness';

afterEach(cleanup);

async function remove(user: ReturnType<typeof userEvent.setup>, button: HTMLElement): Promise<void> {
  await user.click(button);
  await user.click(within(document.body).getByRole('button', { name: '確認刪除' }));
}

describe('holistic_research paired collections', { timeout: 30_000 }, () => {
  it('adds, edits, moves, and removes yearly and clinical rows without sorting', async () => {
    // Given
    const user = userEvent.setup();
    const initial = compactHolisticResearchFixture();
    const view = render(<HolisticResearchEditorHarness initial={initial} />);

    // When
    await user.click(view.getByRole('button', { name: '新增年度統計' }));
    await user.type(view.getByRole('textbox', { name: '年度統計 3 共用年份' }), '2018');
    await user.click(view.getByRole('button', { name: '上移第 3 筆年度統計' }));
    await user.click(view.getByRole('button', { name: '新增臨床統計' }));
    await user.type(view.getByRole('textbox', { name: '繁體中文臨床統計 3 標籤' }), '新統計');
    await user.type(view.getByRole('textbox', { name: 'English clinical statistic 3 label' }), 'New stat');
    await user.click(view.getByRole('button', { name: '上移第 3 筆臨床統計' }));

    // Then
    let payload = readHarnessPayload(view.getByTestId('holistic-research-editor-text'));
    expect(CMS_PAYLOAD_REGISTRY.holistic_research.stableKey).toBe('registry');
    const expectedYears = [initial.zh.byYear[0]?.year, 2018, initial.zh.byYear[1]?.year];
    expect(payload.zh.byYear.map((row) => row.year)).toEqual(expectedYears);
    expect(payload.en.byYear.map((row) => row.year)).toEqual(expectedYears);
    expect(payload.zh.clinicalStats.map((row) => row.label)).toEqual([initial.zh.clinicalStats[0]?.label, '新統計', initial.zh.clinicalStats[1]?.label]);
    expect(payload.en.clinicalStats[1]?.label).toBe('New stat');
    await remove(user, view.getByRole('button', { name: '刪除第 2 筆年度統計' }));
    await remove(user, view.getByRole('button', { name: '刪除第 2 筆臨床統計' }));
    payload = readHarnessPayload(view.getByTestId('holistic-research-editor-text'));
    expect(payload.zh.byYear).toEqual(initial.zh.byYear);
    expect(payload.en.clinicalStats).toEqual(initial.en.clinicalStats);
    expect(payload.zh.byYear.map((row) => row.id)).toEqual(initial.zh.byYear.map((row) => row.id));
    expect(payload.en.clinicalStats.map((row) => row.id)).toEqual(initial.en.clinicalStats.map((row) => row.id));
  });

  it('keeps paired papers and nested authors atomic, ordered, and operable when empty', async () => {
    // Given
    const user = userEvent.setup();
    const fixture = compactHolisticResearchFixture();
    const empty = {
      zh: { ...fixture.zh, papers: [] },
      en: { ...fixture.en, papers: [] },
    };
    const view = render(<HolisticResearchEditorHarness initial={empty} />);

    // When
    await user.click(view.getByRole('button', { name: '新增論文' }));
    await user.type(view.getByRole('textbox', { name: '論文 1 共用標題' }), 'First paper');
    await user.click(view.getByRole('button', { name: '新增論文 1 作者' }));
    await user.type(view.getByRole('textbox', { name: '論文 1 作者 1（繁體中文）' }), '第一作者');
    await user.type(view.getByRole('textbox', { name: 'Paper 1 author 1 (English)' }), 'First Author');
    await user.click(view.getByRole('button', { name: '新增論文 1 作者' }));
    await user.type(view.getByRole('textbox', { name: '論文 1 作者 2（繁體中文）' }), '第二作者');
    await user.type(view.getByRole('textbox', { name: 'Paper 1 author 2 (English)' }), 'Second Author');
    await user.click(view.getByRole('button', { name: '上移論文 1 的第 2 位作者' }));

    // Then
    let payload = readHarnessPayload(view.getByTestId('holistic-research-editor-text'));
    expect(CMS_PAYLOAD_REGISTRY.holistic_research.stableKey).toBe('registry');
    expect(payload.zh.papers[0]?.authors).toEqual(['第二作者', '第一作者']);
    expect(payload.en.papers[0]?.authors).toEqual(['Second Author', 'First Author']);
    const authorCollection = view.container.querySelector('[data-editor-collection="holistic-research-paper-1-authors"]');
    if (!(authorCollection instanceof HTMLElement)) throw new TypeError('Missing nested author collection');
    expect(within(authorCollection).getByRole('status').textContent).toContain('2');
    await remove(user, view.getByRole('button', { name: '刪除論文 1 的第 1 位作者' }));
    await remove(user, view.getByRole('button', { name: '刪除論文 1 的第 1 位作者' }));
    payload = readHarnessPayload(view.getByTestId('holistic-research-editor-text'));
    expect(payload.zh.papers[0]?.authors).toEqual([]);
    expect(payload.en.papers[0]?.authors).toEqual([]);
    expect(view.getByRole('heading', { name: '論文 1 作者尚無作者' })).toBeTruthy();
  });
});
