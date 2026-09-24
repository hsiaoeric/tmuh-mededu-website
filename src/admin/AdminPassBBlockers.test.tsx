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

function renderEnglishShowcase() {
  localStorage.setItem('tmuh.lang', 'en');
  return render(<SiteProvider><MemoryRouter><AdminDesignSystemPage /></MemoryRouter></SiteProvider>);
}

describe('packet 21 Pass B blocker contracts', () => {
  it('provides accessible narrow-only alternatives while preserving normal English copy', () => {
    // Given / When
    const view = renderEnglishShowcase();
    const warning = view.container.querySelector('.admin-shell-notices .admin-notice:first-child strong');
    const heading = view.container.querySelector('.admin-page-header h1');

    // Then
    expect(warning?.querySelector('.admin-default-copy')?.textContent).toBe('Session expiring soon');
    expect(warning?.querySelector('.admin-narrow-copy')?.textContent).toBe('Session expiry');
    expect(heading?.querySelector('.admin-default-copy')?.textContent).toBe('Operational clarity with the character of TMUH Medical Education.');
    expect(heading?.querySelector('.admin-narrow-copy')?.textContent).toBe('Clear. Distinctly TMUH.');
  });

  it('groups what happened without changing the full States heading', () => {
    // Given / When
    const view = renderEnglishShowcase();
    const heading = view.container.querySelector('#states-title');
    const phrase = heading?.querySelector(':scope > .admin-mixed-phrase-group[lang="en"]');

    // Then
    expect(heading?.textContent).toBe('Every outcome explains what happened');
    expect(phrase?.textContent).toBe('what happened');
  });

  it('uses the requested concise English success toast copy', () => {
    // Given / When
    const view = renderEnglishShowcase();
    const toast = view.container.querySelector('.admin-toast[data-status="success"]');

    // Then
    expect(toast?.querySelector('strong')?.textContent).toBe('Draft saved');
    expect(toast?.querySelector('p')?.textContent).toBe('Saved at 14:32. Not yet published.');
  });

  it('renders the first media picker as a neutral actionable empty state', () => {
    // Given / When
    const view = renderEnglishShowcase();
    const picker = view.container.querySelector('.admin-media-grid .admin-media-picker:first-child');

    // Then
    expect(picker?.getAttribute('data-picker-state')).toBe('empty');
    expect(picker?.querySelector('.admin-media-feedback')).toBeNull();
    expect(picker?.querySelector('input[type="file"]')?.hasAttribute('disabled')).toBe(false);
  });

  it('keeps the admin skip link first and gives it a reserved shell slot', () => {
    // Given / When
    const view = renderEnglishShowcase();
    const shell = view.container.querySelector('.admin-shell');
    const slot = shell?.querySelector(':scope > .admin-skip-slot');
    const skipLink = slot?.querySelector('.skip-link');

    // Then
    expect(shell?.firstElementChild).toBe(slot);
    expect(skipLink?.textContent).toBe('Skip to admin content');
  });
});
