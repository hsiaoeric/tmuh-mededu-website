// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { emitStructuredEditorText } from '@/admin/editors/shared';
import { SiteProvider } from '@/app/site';
import { HolisticResearchEditor } from './HolisticResearchEditor';
import {
  HolisticResearchEditorHarness,
  holisticResearchFixture,
} from './HolisticResearchEditor.testHarness';

afterEach(cleanup);

describe('holistic_research editor characterization', () => {
  it('renders the canonical registry fixture without an initial controlled emission', () => {
    // Given
    const fixture = holisticResearchFixture();
    const editorText = JSON.stringify(fixture, null, 2);
    const onEditorTextChange = vi.fn();

    // When
    const view = render(
      <SiteProvider>
        <HolisticResearchEditor
          editorText={editorText}
          onEditorTextChange={onEditorTextChange}
        />
      </SiteProvider>,
    );

    // Then
    expect(CMS_PAYLOAD_REGISTRY.holistic_research.stableKey).toBe('registry');
    expect(view.getByRole('heading', { name: '全人研究內容' })).toBeTruthy();
    expect(onEditorTextChange).not.toHaveBeenCalled();
    expect(JSON.parse(editorText)).toEqual(fixture);
  });

  it('emits the registry payload deterministically after a controlled edit', () => {
    // Given
    const fixture = holisticResearchFixture();
    const view = render(<HolisticResearchEditorHarness initial={fixture} />);
    const expected = {
      ...fixture,
      zh: { ...fixture.zh, title: '確定性登錄內容' },
    };

    // When
    fireEvent.change(view.getByRole('textbox', { name: '繁體中文頁面標題' }), {
      target: { value: expected.zh.title },
    });

    // Then
    expect(CMS_PAYLOAD_REGISTRY.holistic_research.stableKey).toBe('registry');
    expect(view.getByTestId('holistic-research-editor-text').textContent).toBe(
      emitStructuredEditorText('holistic_research', expected),
    );
    expect(view.getByTestId('holistic-research-emissions').textContent).toBe('1');
  });
});
