// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteProvider } from '@/app/site';
import { AdminDesignSystemPage } from '@/pages/AdminDesignSystemPage';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('admin narrow copy contracts', () => {
  it('uses concise semantic groups for narrow overlay and spinner descriptions', () => {
    // Given
    const view = render(<SiteProvider><MemoryRouter><AdminDesignSystemPage /></MemoryRouter></SiteProvider>);

    // When
    const overlayGroups = [...view.container.querySelectorAll('#overlays .admin-section-heading p .admin-phrase-group')];
    const spinnerGroups = [...view.container.querySelectorAll('#states .admin-section-heading p .admin-phrase-group')];

    // Then
    expect(overlayGroups.some((group) => group.textContent === '媒體缺漏時仍可操作。')).toBe(true);
    expect(spinnerGroups.some((group) => group.textContent === '不以空白畫面、')).toBe(true);
    expect(spinnerGroups.some((group) => group.textContent === '旋轉圖示取代內容。')).toBe(true);
    expect(spinnerGroups.some((group) => group.textContent?.startsWith('或'))).toBe(false);
  });
});
