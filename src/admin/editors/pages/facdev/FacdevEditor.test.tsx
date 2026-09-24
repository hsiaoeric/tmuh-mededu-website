// @vitest-environment jsdom
import { cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  emittedPayload,
  facdevPayload,
  renderControlledFacdev,
} from './FacdevEditor.testHarness';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function inputForLabel(container: HTMLElement, labelText: string): HTMLInputElement {
  const label = Array.from(container.querySelectorAll('label')).find((candidate) => candidate.textContent === labelText);
  const input = label === undefined ? null : document.getElementById(label.htmlFor);
  if (!(input instanceof HTMLInputElement)) throw new TypeError(`Expected input: ${labelText}`);
  return input;
}

describe('FacdevEditor scalar and nested fields', () => {
  it('renders the current fixture and changes scalar copy without altering collections', async () => {
    // Given
    const original = facdevPayload();
    const { view, onEmission } = renderControlledFacdev(original);

    // When
    const aboutTitle = inputForLabel(view.container, '繁體中文關於標題');
    fireEvent.change(aboutTitle, { target: { value: '更新後的中心定位' } });

    // Then
    const changed = emittedPayload(onEmission);
    expect(view.container.querySelector('#facdev-editor-title')?.textContent).toBe('教師發展中心頁面');
    expect(changed.zh.aboutTitle).toBe('更新後的中心定位');
    expect(changed.zh.kpis).toEqual(original.zh.kpis);
    expect(changed.en).toEqual(original.en);
  });

  it('keeps invalid KPI numbers editable without exposing presentation controls', async () => {
    // Given
    const original = facdevPayload();
    const invalid = {
      ...original,
      zh: {
        ...original.zh,
        kpis: original.zh.kpis.map((kpi, index) => index === 0 ? { ...kpi, num: '-' } : kpi),
      },
    };
    const { view, onEmission } = renderControlledFacdev(invalid);
    const number = inputForLabel(view.container, '繁體中文 KPI 1 數值');

    // When
    fireEvent.change(number, { target: { value: '12.5' } });

    // Then
    const changed = emittedPayload(onEmission);
    expect(changed.zh.kpis[0]?.num).toBe(12.5);
    expect(view.queryByText('頁面色彩')).toBeNull();
    expect(view.queryByLabelText(/色碼|color|圖示鍵|icon key|延遲|delay/)).toBeNull();
  });

  it('changes one lead field while preserving every portrait and person property', async () => {
    // Given
    const original = facdevPayload();
    const { view, onEmission } = renderControlledFacdev(original);

    // When
    const email = inputForLabel(view.container, '繁體中文第 1 組負責人電子郵件');
    fireEvent.change(email, { target: { value: 'lead@example.org' } });

    // Then
    const changed = emittedPayload(onEmission);
    expect(changed.zh.groups[0]?.lead).toEqual({
      ...original.zh.groups[0]?.lead,
      email: 'lead@example.org',
    });
    expect(changed.en.groups).toEqual(original.en.groups);
  });
});
