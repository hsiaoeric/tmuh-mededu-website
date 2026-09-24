// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteProvider } from '@/app/site';
import { ShowcaseControls } from './showcase/ShowcaseControls';
import { ShowcaseData } from './showcase/ShowcaseData';
import { ShowcaseOverlays } from './showcase/ShowcaseOverlays';
import { ShowcaseStates } from './showcase/ShowcaseStates';

afterEach(cleanup);

describe('admin showcase state contracts', () => {
  it('renders valid and warning field states', () => {
    // Given
    const view = render(<SiteProvider><ShowcaseControls /></SiteProvider>);

    // When
    const validField = view.container.querySelector('[data-field-state="valid"]');
    const warningField = view.container.querySelector('[data-field-state="warning"]');

    // Then
    expect(validField).not.toBeNull();
    expect(warningField).not.toBeNull();
  });

  it('renders uploading and disabled media states', () => {
    // Given
    const view = render(<SiteProvider><ShowcaseOverlays /></SiteProvider>);

    // When
    const uploading = view.container.querySelector('[data-picker-state="uploading"]');
    const disabled = view.container.querySelector('[data-picker-state="disabled"]');

    // Then
    expect(uploading).not.toBeNull();
    expect(disabled).not.toBeNull();
  });

  it('moves focus to the English field from the recovery action', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<SiteProvider><ShowcaseControls /><ShowcaseStates /></SiteProvider>);

    // When
    await user.click(view.getByRole('button', { name: '前往英文欄位' }));

    // Then
    expect(document.activeElement?.id).toBe('admin-title-en');
  });

  it('updates recovery feedback deterministically', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<SiteProvider><ShowcaseStates /></SiteProvider>);

    // When
    await user.click(view.getByRole('button', { name: '再試一次' }));

    // Then
    expect(view.container.querySelector('[data-recovery-state="complete"]')).not.toBeNull();
  });

  it('announces retry success politely without moving focus to the announcement', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<SiteProvider><ShowcaseStates /></SiteProvider>);
    const announcer = view.container.querySelector('.admin-recovery-announcer');

    // When
    await user.click(view.getByRole('button', { name: '再試一次' }));

    // Then
    expect(announcer?.getAttribute('role')).toBe('status');
    expect(announcer?.getAttribute('aria-live')).toBe('polite');
    expect(announcer?.getAttribute('aria-atomic')).toBe('true');
    expect(announcer?.textContent).toBe('已重新連線，可繼續編輯。');
    expect(announcer?.contains(document.activeElement)).toBe(false);
  });

  it('replaces the reload error with a completed state', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<SiteProvider><ShowcaseStates /></SiteProvider>);

    // When
    await user.click(view.getByRole('button', { name: '重新載入' }));

    // Then
    expect(view.queryByRole('button', { name: '重新載入' })).toBeNull();
  });

  it('announces reload success politely without focusing the announcement', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<SiteProvider><ShowcaseStates /></SiteProvider>);
    const announcer = view.container.querySelector('.admin-reload-announcer');

    // When
    await user.click(view.getByRole('button', { name: '重新載入' }));

    // Then
    expect(announcer?.getAttribute('role')).toBe('status');
    expect(announcer?.getAttribute('aria-live')).toBe('polite');
    expect(announcer?.getAttribute('aria-atomic')).toBe('true');
    expect(announcer?.textContent).toBe('公告已重新載入，可繼續操作。');
    expect(announcer?.contains(document.activeElement)).toBe(false);
  });

  it('announces record-table reload success through a persistent polite region', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<SiteProvider><ShowcaseData /></SiteProvider>);
    const announcer = view.container.querySelector('.admin-table-reload-announcer');

    // When
    await user.click(view.getByRole('button', { name: '重新載入' }));

    // Then
    expect(announcer?.getAttribute('role')).toBe('status');
    expect(announcer?.getAttribute('aria-live')).toBe('polite');
    expect(announcer?.textContent).toBe('公告紀錄已重新載入，可繼續操作。');
    expect(announcer?.contains(document.activeElement)).toBe(false);
  });

  it('renders saving and error header state examples', () => {
    // Given
    const view = render(<SiteProvider><ShowcaseStates /></SiteProvider>);

    // When
    const saving = view.container.querySelector('[data-save-state="saving"]');
    const error = view.container.querySelector('[data-save-state="error"]');

    // Then
    expect(saving).not.toBeNull();
    expect(error).not.toBeNull();
  });

  it('sorts, selects, and paginates the table with native controls', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<SiteProvider><ShowcaseData /></SiteProvider>);

    // When
    await user.click(view.getByRole('button', { name: '依公告標題排序' }));
    await user.click(view.getByRole('checkbox', { name: '選取 NEWS-0086' }));
    await user.click(view.getByRole('button', { name: '下一頁' }));

    // Then
    expect(view.getByRole('button', { name: '依公告標題排序' }).closest('th')?.getAttribute('aria-sort')).toBe('ascending');
    expect(view.getByRole('row', { name: /NEWS-0086/ }).getAttribute('aria-selected')).toBe('true');
    expect(view.getByText('第 2 頁，共 12 頁').getAttribute('aria-current')).toBe('page');
  });

  it('renders the compact table treatment and short CJK label language scope', () => {
    // Given
    const view = render(<SiteProvider><ShowcaseData /></SiteProvider>);

    // When
    const compactTable = view.container.querySelector('.admin-table[data-density="compact"]');
    const category = view.getAllByText('教學活動').find((element) => element.matches('.admin-short-label'));

    // Then
    expect(compactTable).not.toBeNull();
    expect(category?.getAttribute('lang')).toBe('zh-Hant');
  });
});
