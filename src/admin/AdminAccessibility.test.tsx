// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteProvider } from '@/app/site';
import { AdminDesignSystemPage } from '@/pages/AdminDesignSystemPage';
import { AdminButton } from './AdminButton';
import { AdminMediaPicker } from './AdminMedia';
import { AdminDialog, AdminToast } from './AdminOverlays';
import { StatePanel } from './AdminFeedback';
import { ShowcaseOverlays } from './showcase/ShowcaseOverlays';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function AutomaticFocusDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open automatic dialog</button>
      <AdminDialog open={open} title="Automatic focus" description="Focus returns without an explicit ref." onClose={() => setOpen(false)}>
        <AdminButton onClick={() => setOpen(false)}>Close automatic dialog</AdminButton>
      </AdminDialog>
    </>
  );
}

describe('admin accessibility contracts', () => {
  it('keeps loading panels polite by default outside the login transition region', () => {
    // Given / When
    const view = render(
      <StatePanel kind="loading" title="Loading records" description="Please wait." />,
    );

    // Then
    expect(view.container.querySelector('[data-state="loading"]')?.getAttribute('aria-live')).toBe('polite');
  });

  it('preserves explicit trigger focus return and traps focus', async () => {
    // Given
    const user = userEvent.setup();
    const triggerRef = createRef<HTMLButtonElement>();
    const view = render(
      <>
        <button ref={triggerRef} type="button">Explicit trigger</button>
        <AdminDialog open title="Focus trap" description="Explicit refs remain supported." triggerRef={triggerRef} onClose={() => undefined}>
          <AdminButton>First action</AdminButton>
          <AdminButton>Last action</AdminButton>
        </AdminDialog>
      </>,
    );
    const firstAction = view.getByRole('button', { name: 'First action' });
    const lastAction = view.getByRole('button', { name: 'Last action' });
    firstAction.focus();

    // When
    await user.keyboard('{Shift>}{Tab}{/Shift}');

    // Then
    expect(document.activeElement).toBe(lastAction);
  });

  it('returns focus to the active trigger without an explicit ref', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<AutomaticFocusDialog />);
    const trigger = view.getByRole('button', { name: 'Open automatic dialog' });
    await user.click(trigger);

    // When
    await user.click(view.getByRole('button', { name: 'Close automatic dialog' }));

    // Then
    expect(document.activeElement).toBe(trigger);
  });

  it('returns focus to the media removal trigger', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<SiteProvider><ShowcaseOverlays /></SiteProvider>);
    const removeTrigger = view.getByRole('button', { name: '移除圖片' });
    await user.click(removeTrigger);

    // When
    await user.click(view.getByRole('button', { name: '保留媒體' }));

    // Then
    expect(document.activeElement).toBe(removeTrigger);
  });

  it('uses role-driven urgency for error toasts', () => {
    // Given
    const view = render(<AdminToast status="error" title="Upload failed" />);

    // When
    const toast = view.getByRole('alert');

    // Then
    expect(toast.hasAttribute('aria-live')).toBe(false);
  });

  it('uses a wrapping live feedback surface for sentence-length media feedback', () => {
    // Given
    const message = 'Upload failed. The current image remains available while you verify the file format and try again.';
    const view = render(<AdminMediaPicker label="Announcement image" description="Choose an image" feedback={{ status: 'error', message }} />);

    // When
    const feedback = view.getByRole('alert');

    // Then
    expect(feedback.classList.contains('admin-media-feedback')).toBe(true);
    expect(feedback.querySelector('.admin-status')).toBeNull();
  });

  it('marks narrow Traditional Chinese phrases as semantic language groups', () => {
    // Given
    const view = render(<SiteProvider><MemoryRouter><AdminDesignSystemPage /></MemoryRouter></SiteProvider>);
    const requiredGroups = [
      '.admin-shell-notices .admin-notice:first-child strong > .admin-phrase-group[lang="zh-Hant"]',
      '.admin-shell-notices .admin-notice:first-child p .admin-phrase-group[lang="zh-Hant"]',
      '.admin-shell-notices .admin-notice:last-child p .admin-phrase-group[lang="zh-Hant"]',
      '.admin-page-header h1 > .admin-phrase-group[lang="zh-Hant"]',
    ];

    // When
    const missingGroups = requiredGroups.filter((selector) => view.container.querySelector(selector) === null);

    // Then
    expect(missingGroups).toEqual([]);
  });

  it('uses reusable semantic phrase groups across Chinese copy surfaces', () => {
    // Given
    const view = render(<SiteProvider><MemoryRouter><AdminDesignSystemPage /></MemoryRouter></SiteProvider>);
    const groupedCopySurfaces = [
      '.admin-section-heading p > .admin-zh-copy[data-cjk-groups] > .admin-phrase-group[lang="zh-Hant"]',
      '.admin-notice p > .admin-zh-copy[data-cjk-groups] > .admin-phrase-group[lang="zh-Hant"]',
      '.admin-state-panel p > .admin-zh-copy[data-cjk-groups] > .admin-phrase-group[lang="zh-Hant"]',
      '.admin-toast p > .admin-zh-copy[data-cjk-groups] > .admin-phrase-group[lang="zh-Hant"]',
      '.admin-media-copy p > .admin-zh-copy[data-cjk-groups] > .admin-phrase-group[lang="zh-Hant"]',
    ];

    // When
    const missingSurfaces = groupedCopySurfaces.filter((selector) => view.container.querySelector(selector) === null);

    // Then
    expect(missingSurfaces).toEqual([]);
  });

  it('marks embedded Chinese record-title segments in the English table', () => {
    // Given
    localStorage.setItem('tmuh.lang', 'en');

    // When
    const view = render(<SiteProvider><MemoryRouter><AdminDesignSystemPage /></MemoryRouter></SiteProvider>);

    // Then
    expect(view.container.querySelector('.admin-table .admin-record-title .admin-phrase-group[lang="zh-Hant"]')).not.toBeNull();
    expect(view.container.querySelector('.admin-record-list .admin-record-title .admin-phrase-group[lang="zh-Hant"]')).not.toBeNull();
  });

  it('groups the media-guidance predicate with its teaching-activity object', () => {
    // Given
    const view = render(<SiteProvider><ShowcaseOverlays /></SiteProvider>);

    // When
    const groups = [...view.container.querySelectorAll('.admin-media-grid .admin-media-picker:first-child .admin-phrase-group')];

    // Then
    expect(groups.some((group) => group.textContent === '檔案需清楚呈現教學活動。')).toBe(true);
  });

  it('stacks bilingual title languages in reading order without a visible separator', () => {
    // Given
    const view = render(<SiteProvider><MemoryRouter><AdminDesignSystemPage /></MemoryRouter></SiteProvider>);

    // When
    const title = view.container.querySelector('.admin-record-view .admin-record-title');
    const primary = title?.querySelector('.admin-record-title-primary');
    const secondary = title?.querySelector('.admin-record-title-secondary');
    const bridge = secondary?.querySelector('.admin-mixed-phrase-group[lang="en"]');

    // Then
    expect(primary?.textContent).toBe('住院醫師臨床教學研討會');
    expect(primary?.getAttribute('lang')).toBe('zh-Hant');
    expect(secondary?.getAttribute('lang')).toBe('en');
    expect(title?.querySelector('.admin-record-title-separator')).toBeNull();
    expect(title?.textContent).not.toContain('/');
    expect(bridge?.textContent).toBe('Teaching Symposium');
    expect(title?.firstElementChild).toBe(primary);
    expect(primary?.nextElementSibling).toBe(secondary);
  });

  it('groups the English bilingual-editing phrase in the forms heading', () => {
    // Given
    localStorage.setItem('tmuh.lang', 'en');

    // When
    const view = render(<SiteProvider><MemoryRouter><AdminDesignSystemPage /></MemoryRouter></SiteProvider>);
    const title = view.container.querySelector('#forms-title');
    const phrase = title?.querySelector(':scope > .admin-mixed-phrase-group[lang="en"]');

    // Then
    expect(title?.textContent).toBe('Traditional Chinese-first bilingual editing');
    expect(phrase?.textContent).toBe('bilingual editing');
  });

  it('uses concise semantic groups for the narrow page title and mutation scope', () => {
    // Given
    const view = render(<SiteProvider><MemoryRouter><AdminDesignSystemPage /></MemoryRouter></SiteProvider>);

    // When
    const groups = [...view.container.querySelectorAll('.admin-page-header h1 > .admin-phrase-group')];
    const titleText = view.container.querySelector('.admin-page-header h1')?.textContent;
    const institutionAtom = groups[groups.length - 1]?.querySelector('.admin-phrase-atom');
    const descriptionGroups = [...view.container.querySelectorAll('.admin-page-header p .admin-phrase-group')];

    // Then
    expect(groups.map((group) => group.textContent)).toEqual(['內容清楚、', '可恢復，', '保有北醫感。']);
    expect(titleText).toBe('內容清楚、可恢復，保有北醫感。');
    expect(institutionAtom?.textContent).toBe('北醫感');
    expect(descriptionGroups.some((group) => group.textContent === '資料更新')).toBe(true);
    expect(descriptionGroups.some((group) => group.textContent === '或領域編輯。')).toBe(true);
    expect(descriptionGroups.some((group) => group.textContent === '或')).toBe(false);
  });

  it('keeps the media-toast device phrase together at mobile width', () => {
    // Given
    const view = render(<SiteProvider><ShowcaseOverlays /></SiteProvider>);

    // When
    const groups = [...view.container.querySelectorAll('.admin-toast[data-status="error"] .admin-phrase-group')];

    // Then
    expect(groups.some((group) => group.textContent === '檔案仍在你的裝置，')).toBe(true);
    expect(groups.some((group) => group.textContent === '你的裝置，')).toBe(false);
  });

  it('uses a concise English upload error title', () => {
    // Given
    localStorage.setItem('tmuh.lang', 'en');

    // When
    const view = render(<SiteProvider><ShowcaseOverlays /></SiteProvider>);
    const toastAlerts = view.getAllByRole('alert')
      .filter((alert) => alert.matches('.admin-toast[data-status="error"]'));
    const title = toastAlerts[0]?.querySelector('strong')?.textContent ?? '';

    // Then
    expect(toastAlerts).toHaveLength(1);
    expect(title).toBe('Upload failed');
    expect(title.split(/\s+/)).toHaveLength(2);
    expect(title).toMatch(/failed$/);
  });

  it('keeps the alternative connective with its following predicate', () => {
    // Given
    const view = render(<SiteProvider><MemoryRouter><AdminDesignSystemPage /></MemoryRouter></SiteProvider>);

    // When
    const groups = [...view.container.querySelectorAll('.admin-state-panel[data-state="filtered-empty"] .admin-phrase-group')];

    // Then
    expect(groups.some((group) => group.textContent === '或改用')).toBe(true);
  });
});
