// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseStructuredEditorText as parseGlobalEditorText } from '@/admin/editors/shared';
import { SiteProvider } from '@/app/site';
import { GlobalDocumentEditor } from './GlobalDocumentEditor';
import {
  fixtureText,
  renderEditor,
  STRUCTURED_HEADINGS,
  workspace,
} from './GlobalDocumentEditor.testHarness';
import { GLOBAL_EDITOR_KINDS } from './types';

function strictInvalidSiteCopyText(): string {
  const parsed = parseGlobalEditorText('site_copy', fixtureText('site_copy'));
  if (parsed.status !== 'valid') throw new TypeError('Invalid site-copy fixture');
  return JSON.stringify({ ...parsed.payload, unexpected: true });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('GlobalDocumentEditor', () => {
  it.each(GLOBAL_EDITOR_KINDS)('dispatches %s to its structured editor without emitting', (kind) => {
    // Given / When
    const { onChange, view } = renderEditor(kind, workspace(kind));

    // Then
    expect(view.getByRole('heading', { name: STRUCTURED_HEADINGS[kind] })).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('preserves exact text and emits nothing while switching advanced mode', async () => {
    // Given
    const user = userEvent.setup();
    const exactText = JSON.stringify(JSON.parse(fixtureText('site_copy')));
    const { onChange, view } = renderEditor('site_copy', workspace('site_copy', exactText));

    // When
    await user.click(view.getByRole('button', { name: '進階 JSON' }));

    // Then
    expect(view.getByRole('textbox', { name: '雙語 JSON 內容' })).toHaveProperty('value', exactText);
    expect(onChange).toHaveBeenCalledTimes(0);

    // When
    await user.click(view.getByRole('button', { name: '結構化編輯' }));

    // Then
    expect(view.getByRole('heading', { name: STRUCTURED_HEADINGS.site_copy })).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('starts the next document kind in structured mode', async () => {
    // Given
    const user = userEvent.setup();
    const onChange = vi.fn();
    const view = render(
      <SiteProvider>
        <GlobalDocumentEditor kind="site_copy" workspace={workspace('site_copy')} onChange={onChange} />
      </SiteProvider>,
    );
    await user.click(view.getByRole('button', { name: '進階 JSON' }));

    // When
    view.rerender(
      <SiteProvider>
        <GlobalDocumentEditor kind="kpis" workspace={workspace('kpis')} onChange={onChange} />
      </SiteProvider>,
    );

    // Then
    expect(view.getByRole('heading', { name: STRUCTURED_HEADINGS.kpis })).toBeTruthy();
    expect(view.queryByRole('textbox', { name: '雙語 JSON 內容' })).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it.each([
    ['malformed JSON', '{\n  "zh":'],
    ['invalid root', '[]'],
    ['missing locale structure', '{"zh":{},"en":{}}'],
    ['strict invalid payload', strictInvalidSiteCopyText()],
  ])('forces exact-text recovery for %s', (_case, exactText) => {
    // Given / When
    const { onChange, view } = renderEditor('site_copy', workspace('site_copy', exactText));

    // Then
    expect(view.getByRole('textbox', { name: '雙語 JSON 內容' })).toHaveProperty('value', exactText);
    expect(view.getByText('無法開啟結構化編輯器')).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('shows localized recovery issues without exposing generic framework text in Traditional Chinese', () => {
    const exactText = '{"zh":{},"en":{}}';

    const { view } = renderEditor('site_copy', workspace('site_copy', exactText));

    expect(view.getAllByText('此欄位為必填，請輸入內容。').length).toBeGreaterThan(0);
    expect(view.queryByText(/Invalid input/)).toBeNull();
    expect(view.getByRole('textbox', { name: '雙語 JSON 內容' })).toHaveProperty('value', exactText);
  });

  it('shows useful specific recovery issues in English mode', () => {
    localStorage.setItem('tmuh.lang', 'en');
    const exactText = '{"zh":{},"en":{}}';

    const { view } = renderEditor('site_copy', workspace('site_copy', exactText));

    expect(view.getAllByText('This field is required.').length).toBeGreaterThan(0);
    expect(view.queryByText(/Invalid input/)).toBeNull();
    expect(view.getByRole('textbox', { name: 'Bilingual JSON content' })).toHaveProperty('value', exactText);
  });

  it('returns to structured mode after recovery text is manually corrected', () => {
    // Given
    const onChange = vi.fn();
    const current = workspace('site_copy', '{bad');
    const view = render(
      <SiteProvider>
        <GlobalDocumentEditor kind="site_copy" workspace={current} onChange={onChange} />
      </SiteProvider>,
    );
    const corrected = fixtureText('site_copy');

    // When
    fireEvent.change(view.getByRole('textbox', { name: '雙語 JSON 內容' }), {
      target: { value: corrected },
    });
    view.rerender(
      <SiteProvider>
        <GlobalDocumentEditor
          kind="site_copy"
          workspace={{ ...current, editorText: corrected }}
          onChange={onChange}
        />
      </SiteProvider>,
    );

    // Then
    expect(view.getByRole('heading', { name: STRUCTURED_HEADINGS.site_copy })).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(corrected);
  });
});
