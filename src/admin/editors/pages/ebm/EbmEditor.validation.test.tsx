// @vitest-environment jsdom
import { cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { renderEbmEditor } from './EbmEditor.testHarness';
import { compactEbmFixture } from './EbmEditor.testFixture';

afterEach(cleanup);

const STAGE_ITEM_MISMATCHES = [
  {
    label: 'shorter',
    adjust: (items: readonly string[]) => items.slice(1),
  },
  {
    label: 'longer',
    adjust: (items: readonly string[]) => [...items, 'Authored extra stage item'],
  },
] as const;

describe('EBM authored draft validation and recovery', () => {
  it('keeps invalid numbers structured without exposing presentation controls', () => {
    // Given
    const initial = compactEbmFixture();
    const firstKpi = initial.zh.kpis[0];
    if (firstKpi === undefined) throw new TypeError('Missing KPI fixture');
    const authored = {
      ...initial,
      zh: {
        ...initial.zh,
        kpis: [{ ...firstKpi, num: '2x' }, ...initial.zh.kpis.slice(1)],
      },
    };
    const view = renderEbmEditor({ initial: authored });

    // When
    expect(view.getByTestId('ebm-structured-editor')).toBeInstanceOf(HTMLElement);
    expect(view.getByLabelText('KPI 1 數值（繁體中文）').getAttribute('aria-invalid')).toBe('true');
    fireEvent.change(view.getByLabelText('KPI 1 數值（繁體中文）'), { target: { value: '20' } });

    // Then
    const editorText = view.getByTestId('ebm-editor-text').textContent ?? '';
    expect(CMS_PAYLOAD_REGISTRY.ebm.schema.safeParse(JSON.parse(editorText)).success).toBe(true);
    expect(JSON.stringify(JSON.parse(editorText), null, 2)).toBe(editorText);
    expect(view.queryByLabelText(/色碼|圖示|延遲|color|icon|delay/i)).toBeNull();
  });

  it('preserves exact raw text when bilingual structure is mismatched', () => {
    // Given
    const payload = compactEbmFixture();
    const mismatch = { ...payload, en: { ...payload.en, courseGroups: payload.en.courseGroups.slice(1) } };
    const raw = `  ${JSON.stringify(mismatch)}\n`;

    // When
    const view = renderEbmEditor({ editorText: raw });

    // Then
    expect(view.queryByTestId('ebm-structured-editor')).toBeNull();
    expect(view.getByText('無法開啟結構化編輯器')).toBeInstanceOf(HTMLElement);
    const textarea = view.getByLabelText('雙語 JSON 內容');
    if (!(textarea instanceof HTMLTextAreaElement)) throw new TypeError('Missing JSON textarea');
    expect(textarea.value).toBe(raw);
    expect(view.getByTestId('ebm-editor-text').textContent).toBe(raw);
  });

  it.each(STAGE_ITEM_MISMATCHES)(
    'forces exact raw recovery when English stage items are $label, then restores structured mode after correction',
    ({ adjust }) => {
      // Given
      const payload = compactEbmFixture();
      const mismatch = {
        ...payload,
        en: {
          ...payload.en,
          stages: payload.en.stages.map((stage, index) => index === 0
            ? { ...stage, items: adjust(stage.items) }
            : stage),
        },
      };
      const raw = `  ${JSON.stringify(mismatch)}\n`;
      expect(CMS_PAYLOAD_REGISTRY.ebm.editableSchema.safeParse(mismatch).success).toBe(false);

      // When
      const view = renderEbmEditor({ editorText: raw });

      // Then
      expect(view.queryByTestId('ebm-structured-editor')).toBeNull();
      expect(view.container.querySelector('[data-editor-collection="ebm-stage-0-items"]')).toBeNull();
      const textarea = view.getByLabelText('雙語 JSON 內容');
      if (!(textarea instanceof HTMLTextAreaElement)) throw new TypeError('Missing JSON textarea');
      expect(textarea.value).toBe(raw);
      expect(view.getByTestId('ebm-editor-text').textContent).toBe(raw);

      fireEvent.change(textarea, { target: { value: JSON.stringify(payload, null, 2) } });
      expect(view.getByTestId('ebm-structured-editor')).toBeInstanceOf(HTMLElement);
      expect(view.container.querySelector('[data-editor-collection="ebm-stage-0-items"]')).toBeInstanceOf(HTMLElement);
      expect(view.queryByLabelText('雙語 JSON 內容')).toBeNull();
    },
  );
});
