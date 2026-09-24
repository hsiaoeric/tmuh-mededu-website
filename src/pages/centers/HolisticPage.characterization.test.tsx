// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteProvider } from '@/app/site';
import { ContentProvider } from '@/content/ContentProvider';
import { parseSupabaseConfiguration } from '@/content/env';
import { HolisticPage } from './HolisticPage';

vi.hoisted(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    }),
  });
});

vi.mock('@/motion/Reveal', () => ({
  Reveal: ({ children, className }: { readonly children: ReactNode; readonly className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/motion/SplitLines', () => ({
  SplitLines: ({ children, className }: { readonly children: ReactNode; readonly className?: string }) => (
    <h2 className={className}>{children}</h2>
  ),
}));

vi.mock('@/motion/Counter', () => ({
  Counter: ({ to }: { readonly to: number }) => <>{to}</>,
}));

vi.mock('@/motion/HorizontalScroll', () => ({
  HorizontalScroll: ({ children, head }: { readonly children: ReactNode; readonly head?: ReactNode }) => (
    <div>{head}{children}</div>
  ),
}));

vi.mock('@/motion/Parallax', () => ({
  Parallax: ({ children }: { readonly children: ReactNode }) => <>{children}</>,
}));

const DISABLED = parseSupabaseConfiguration({});

function renderPage() {
  return render(
    <MemoryRouter>
      <SiteProvider>
        <ContentProvider configuration={DISABLED}>
          <HolisticPage />
        </ContentProvider>
      </SiteProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

describe('HolisticPage snapshot characterization', () => {
  it('preserves sections, totals, people, and bulletin content', () => {
    // Given / When
    const view = renderPage();

    // Then
    expect(view.getAllByText('94').length).toBeGreaterThan(0);
    expect(view.getByText('停下來，是最負責任的事')).toBeTruthy();
    expect(view.getByRole('link', { name: 'TMS 5416' }).getAttribute('href'))
      .toBe('https://tms2.tmu.edu.tw/epf/dashboard/creditStatistics/courseRecords/5416');
    expect(view.getByText('歐洲虛擬醫院跨域交流')).toBeTruthy();
    expect(view.getAllByText('廖若帆').length).toBeGreaterThan(0);
    expect(view.container.querySelector('img[src="/assets/faith-ruofan-liao.jpg"]')).not.toBeNull();
    expect([...view.container.querySelectorAll('.portrait-initials')].map((node) => node.textContent))
      .toContain('DG');
    expect([
      'h-about', 'h-news', 'symposia', 'h-members', 'h-research-team',
      'ai', 'mhfa', 'training', 'h-intl', 'research',
    ].every((id) => view.container.querySelector(`section#${id}`) !== null)).toBe(true);
  });

  it('preserves canonical symposium and research year links', () => {
    // Given / When
    const view = renderPage();

    // Then
    const links = [...view.container.querySelectorAll<HTMLAnchorElement>('a[href*="/centers/holistic-care/"]')]
      .map((link) => link.getAttribute('href'));
    expect(links.filter((href) => href?.includes('/symposia/'))).toEqual([
      '/centers/holistic-care/symposia/2021',
      '/centers/holistic-care/symposia/2022',
      '/centers/holistic-care/symposia/2023',
      '/centers/holistic-care/symposia/2024',
    ]);
    expect(links.filter((href) => href?.includes('/research/'))).toEqual([
      '/centers/holistic-care/research/2025',
      '/centers/holistic-care/research/2024',
      '/centers/holistic-care/research/2023',
      '/centers/holistic-care/research/2022',
      '/centers/holistic-care/research/2021',
    ]);
  });
});
