// @vitest-environment jsdom
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import {
  compactHolisticResearchFixture,
  HolisticResearchEditorHarness,
  readHarnessPayload,
} from './HolisticResearchEditor.testHarness';

afterEach(cleanup);

describe('holistic_research controlled state', () => {
  it('preserves structural bilingual mismatch as exact raw recovery text', () => {
    // Given
    const fixture = compactHolisticResearchFixture();
    const mismatch = JSON.stringify({
      ...fixture,
      en: { ...fixture.en, papers: fixture.en.papers.slice(1) },
    }, null, 4);

    // When
    const view = render(<HolisticResearchEditorHarness initialText={mismatch} />);

    // Then
    expect(CMS_PAYLOAD_REGISTRY.holistic_research.stableKey).toBe('registry');
    const recovery = view.getByRole('textbox', { name: '全人研究原始 JSON' });
    if (!(recovery instanceof HTMLTextAreaElement)) throw new TypeError('Missing raw recovery textarea');
    expect(recovery.value).toBe(mismatch);
    expect(view.getByTestId('holistic-research-emissions').textContent).toBe('0');
    expect(view.getByText('雙語結構不一致，請修正原始 JSON')).toBeTruthy();
  });

  it('rejects stale paper and author removals without emission, focus, or live-region aftermath', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<HolisticResearchEditorHarness initial={compactHolisticResearchFixture()} />);

    // When
    await user.click(view.getByRole('button', { name: '刪除第 1 篇論文' }));
    await user.click(view.getByRole('button', { name: '外部同長修訂' }));
    await user.click(within(document.body).getByRole('button', { name: '確認刪除' }));
    await user.click(view.getByRole('button', { name: '刪除論文 1 的第 1 位作者' }));
    await user.click(view.getByRole('button', { name: '外部同長修訂' }));
    await user.click(within(document.body).getByRole('button', { name: '確認刪除' }));

    // Then
    const payload = readHarnessPayload(view.getByTestId('holistic-research-editor-text'));
    expect(CMS_PAYLOAD_REGISTRY.holistic_research.stableKey).toBe('registry');
    expect(payload.zh.papers).toHaveLength(2);
    expect(payload.zh.papers[0]?.authors).toHaveLength(1);
    expect(view.getByTestId('holistic-research-emissions').textContent).toBe('0');
    expect(view.queryByRole('dialog')).toBeNull();
    expect(view.container.querySelector('.admin-editor-reorder-announcer')?.textContent).toBe('');
  });

  it('accepts committed paper removal and ignores unchanged scalar input', async () => {
    // Given
    const user = userEvent.setup();
    const initial = compactHolisticResearchFixture();
    const view = render(<HolisticResearchEditorHarness initial={initial} />);
    const title = view.getByRole('textbox', { name: '繁體中文頁面標題' });

    // When
    fireEvent.change(title, { target: { value: initial.zh.title } });
    await user.click(view.getByRole('button', { name: '刪除第 1 篇論文' }));
    await user.click(within(document.body).getByRole('button', { name: '確認刪除' }));

    // Then
    const payload = readHarnessPayload(view.getByTestId('holistic-research-editor-text'));
    expect(CMS_PAYLOAD_REGISTRY.holistic_research.stableKey).toBe('registry');
    expect(payload.zh.papers[0]?.title).toBe(initial.zh.papers[1]?.title);
    expect(payload.en.papers[0]?.title).toBe(initial.en.papers[1]?.title);
    expect(view.getByTestId('holistic-research-emissions').textContent).toBe('1');
    expect(document.activeElement).toBe(view.getByRole('button', { name: '刪除第 1 篇論文' }));
  });
});
