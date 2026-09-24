// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import {
  compactHolisticResearchFixture,
  HolisticResearchEditorHarness,
  readHarnessPayload,
} from './HolisticResearchEditor.testHarness';

afterEach(cleanup);

function change(view: ReturnType<typeof render>, name: string, value: string): void {
  fireEvent.change(view.getByRole('textbox', { name }), { target: { value } });
}

describe('holistic_research scalar and numeric fields', () => {
  it('repairs yearly values and paper dates without losing their structured fields', () => {
    // Given
    const initial = compactHolisticResearchFixture();
    const view = render(<HolisticResearchEditorHarness initial={initial} />);

    // When
    change(view, '年度統計 1 共用年份', '20x6');
    change(view, '論文 1 共用出版月份', '13');

    // Then
    expect(CMS_PAYLOAD_REGISTRY.holistic_research.stableKey).toBe('registry');
    expect(view.getAllByRole('alert').length).toBeGreaterThanOrEqual(2);
    let payload = readHarnessPayload(view.getByTestId('holistic-research-editor-text'));
    expect(payload.zh.byYear[0]?.year).toBe('20x6');
    expect(payload.en.papers[0]?.month).toBe(13);
    expect(CMS_PAYLOAD_REGISTRY.holistic_research.schema.safeParse(payload).success).toBe(false);

    change(view, '年度統計 1 共用年份', String(initial.zh.byYear[0]?.year ?? ''));
    change(view, '論文 1 共用出版月份', '12');
    payload = readHarnessPayload(view.getByTestId('holistic-research-editor-text'));
    expect(CMS_PAYLOAD_REGISTRY.holistic_research.schema.safeParse(payload).success).toBe(true);
  });

  it('edits copy and paper fields independently while preserving all siblings', () => {
    // Given
    const initial = compactHolisticResearchFixture();
    const view = render(<HolisticResearchEditorHarness initial={initial} />);

    // When
    change(view, '繁體中文頁面標題', '全人研究新標題');
    change(view, '論文 1 共用期刊', 'Journal of Repair');
    change(view, '論文 1 共用作者列', '作者列修訂');

    // Then
    const payload = readHarnessPayload(view.getByTestId('holistic-research-editor-text'));
    expect(CMS_PAYLOAD_REGISTRY.holistic_research.stableKey).toBe('registry');
    expect(payload.zh.title).toBe('全人研究新標題');
    expect(payload.en.papers[0]?.journal).toBe('Journal of Repair');
    expect(payload.zh.papers[0]?.byline).toBe('作者列修訂');
    expect(payload.en.papers[0]?.byline).toBe('作者列修訂');
    expect(payload.zh.papers.slice(1)).toEqual(initial.zh.papers.slice(1));
    expect(payload.zh.papers.map((paper) => paper.id)).toEqual(initial.zh.papers.map((paper) => paper.id));
    expect(payload.en.papers.map((paper) => paper.id)).toEqual(initial.en.papers.map((paper) => paper.id));
    expect(payload.en.papers[0]).toMatchObject({
      authors: initial.en.papers[0]?.authors,
      byline: '作者列修訂',
      title: initial.en.papers[0]?.title,
    });
    expect(payload.zh.byYear).toEqual(initial.zh.byYear);
    expect(payload.en.clinicalStats).toEqual(initial.en.clinicalStats);
  });
});
