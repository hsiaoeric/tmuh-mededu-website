// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SiteProvider } from '@/app/site';
import { AdminPlaceholderPage } from './AdminPlaceholderPage';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AdminPlaceholderPage copy contract', () => {
  it('keeps the complete Chinese placeholder copy and protected phrases in both surfaces', () => {
    // Given / When
    const view = render(
      <SiteProvider>
        <MemoryRouter>
          <AdminPlaceholderPage kind="news" />
        </MemoryRouter>
      </SiteProvider>,
    );
    const descriptions = [
      view.container.querySelector('.admin-page-header p'),
      view.container.querySelector('.admin-state-panel p'),
    ];
    const expected = '此為刻意保留的路由位置。完整工作區將於後續里程碑提供，目前不包含儲存、發布、編輯器或資料庫操作。';

    // Then
    expect(descriptions.map((description) => description?.textContent)).toEqual([expected, expected]);
    for (const description of descriptions) {
      expect(description?.querySelector('.admin-zh-copy[data-cjk-groups]')).not.toBeNull();
      const groups = [...(description?.querySelectorAll('.admin-phrase-group[lang="zh-Hant"]') ?? [])]
        .map((group) => group.textContent);
      expect(groups).toContain('完整工作區');
      expect(groups).toContain('目前不包含');
      expect(groups).toContain('編輯器');
    }
    expect(view.queryByRole('form')).toBeNull();
    expect(view.queryByRole('button', { name: /儲存|發布|編輯/ })).toBeNull();
  });

  it('keeps the English placeholder description as plain language-tagged text', () => {
    // Given
    localStorage.setItem('tmuh.lang', 'en');

    // When
    const view = render(
      <SiteProvider>
        <MemoryRouter>
          <AdminPlaceholderPage kind="news" />
        </MemoryRouter>
      </SiteProvider>,
    );
    const descriptions = view.container.querySelectorAll(
      '.admin-page-header p, .admin-state-panel p',
    );

    // Then
    expect(descriptions).toHaveLength(2);
    expect([...descriptions].every((description) => description.getAttribute('lang') === 'en')).toBe(true);
    expect(view.container.querySelector('.admin-zh-copy')).toBeNull();
  });
});
