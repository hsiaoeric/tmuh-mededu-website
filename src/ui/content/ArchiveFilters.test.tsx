// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ArchiveEmpty, ArchiveFilters } from './ArchiveFilters';
import { archiveYears, filterArchiveItems, paginate, readArchiveParams } from './archiveParams';
import { Pagination, paginationSlots } from './Pagination';
import { renderContent } from './testHarness';

vi.hoisted(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
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

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const CATEGORIES = [
  { id: 'recruitment', label: { text: '招募相關', lang: 'zh', fallback: false } },
  { id: 'faculty', label: { text: '教師相關專區', lang: 'zh', fallback: false } },
] as const;

function location() {
  return screen.getByTestId('location').textContent;
}

describe('ArchiveFilters', () => {
  it('labels every control and reflects the URL', () => {
    renderContent(
      <ArchiveFilters categories={CATEGORIES} years={['2024', '2023']} resultCount={4} />,
      { path: '/announcements?category=faculty&year=2023&q=%E8%AA%B2%E7%A8%8B' },
    );

    const form = screen.getByRole('search', { name: '篩選' });
    const group = within(form).getByRole('group', { name: '分類' });
    expect(within(group).getByRole('button', { name: '教師相關專區' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(group).getByRole('button', { name: '全部' }).getAttribute('aria-pressed')).toBe('false');
    expect((within(form).getByLabelText('年份') as HTMLSelectElement).value).toBe('2023');
    expect((within(form).getByLabelText('搜尋') as HTMLInputElement).value).toBe('課程');
    expect(within(form).getByRole('status').textContent).toBe('共 4 筆');
  });

  it('sets the category, resets the page, and keeps unrelated parameters', () => {
    renderContent(<ArchiveFilters categories={CATEGORIES} />, { path: '/announcements?owner=ebm&page=3' });

    fireEvent.click(screen.getByRole('button', { name: '招募相關' }));
    expect(location()).toBe('/announcements?owner=ebm&category=recruitment');

    fireEvent.click(screen.getByRole('button', { name: '全部' }));
    expect(location()).toBe('/announcements?owner=ebm');
  });

  it('writes the year and query to the URL and clears them together', () => {
    renderContent(<ArchiveFilters categories={CATEGORIES} years={['2024', '2023']} />, { path: '/announcements?page=2' });

    fireEvent.change(screen.getByLabelText('年份'), { target: { value: '2024' } });
    expect(location()).toBe('/announcements?year=2024');

    const query = screen.getByLabelText('搜尋');
    query.focus();
    fireEvent.change(query, { target: { value: '工作坊' } });
    expect(location()).toBe(`/announcements?year=2024&q=${encodeURIComponent('工作坊')}`);
    expect((query as HTMLInputElement).value).toBe('工作坊');

    fireEvent.click(screen.getByRole('button', { name: '清除篩選' }));
    expect(location()).toBe('/announcements');
    expect((query as HTMLInputElement).value).toBe('');
  });

  it('ignores a category or year the listing does not offer', () => {
    renderContent(<ArchiveFilters categories={CATEGORIES} years={['2024']} />, { path: '/x?category=nope&year=1999' });
    expect(screen.getByRole('button', { name: '全部' }).getAttribute('aria-pressed')).toBe('true');
    expect((screen.getByLabelText('年份') as HTMLSelectElement).value).toBe('');
    expect(screen.queryByRole('button', { name: '清除篩選' })).toBeNull();
  });

  it('labels the controls in English', () => {
    renderContent(<ArchiveFilters categories={CATEGORIES} years={['2024']} resultCount={1} />, { lang: 'en' });
    const form = screen.getByRole('search', { name: 'Filters' });
    expect(within(form).getByLabelText('Year')).toBeTruthy();
    expect(within(form).getByLabelText('Search')).toBeTruthy();
    expect(within(form).getByRole('status').textContent).toBe('1 result');
  });

  it('offers a way out of a filtered-empty list without dropping other parameters', () => {
    renderContent(<ArchiveEmpty />, { path: '/gallery?owner=ebm&q=zzz&page=2' });
    expect(screen.getByText('沒有符合條件的項目。')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '清除篩選' }));
    expect(location()).toBe('/gallery?owner=ebm');
  });
});

describe('Pagination', () => {
  it('links every page through the URL, marks the current one, and keeps filters', () => {
    renderContent(<Pagination pageCount={4} />, { path: '/announcements?category=faculty&page=2' });

    const nav = screen.getByRole('navigation', { name: '分頁' });
    const current = within(nav).getByRole('link', { name: '第 2 頁' });
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(within(nav).getByRole('link', { name: '第 3 頁' }).hasAttribute('aria-current')).toBe(false);
    expect(within(nav).getByRole('link', { name: '第 1 頁' }).getAttribute('href')).toBe('/announcements?category=faculty');
    expect(within(nav).getByRole('link', { name: '上一頁' }).getAttribute('href')).toBe('/announcements?category=faculty');
    expect(within(nav).getByRole('link', { name: '下一頁' }).getAttribute('href')).toBe('/announcements?category=faculty&page=3');

    fireEvent.click(within(nav).getByRole('link', { name: '第 4 頁' }));
    expect(location()).toBe('/announcements?category=faculty&page=4');
    expect(within(nav).getByRole('link', { name: '第 4 頁' }).getAttribute('aria-current')).toBe('page');
    expect(within(nav).queryByRole('link', { name: '下一頁' })).toBeNull();
  });

  it('clamps an out-of-range page and renders nothing for a single page', () => {
    const { unmount } = renderContent(<Pagination pageCount={3} />, { path: '/x?page=99' });
    expect(screen.getByRole('link', { name: '第 3 頁' }).getAttribute('aria-current')).toBe('page');
    unmount();

    renderContent(<Pagination pageCount={1} />, { path: '/x' });
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('keeps the basename on page links', () => {
    renderContent(<Pagination pageCount={2} label="公告分頁" />, { path: '/announcements', basename: '/tmuh-mededu-website' });
    expect(screen.getByRole('link', { name: '第 2 頁' }).getAttribute('href')).toBe('/tmuh-mededu-website/announcements?page=2');
  });

  it('windows long page ranges around the current page', () => {
    expect(paginationSlots(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginationSlots(1, 10)).toEqual([1, 2, 3, 4, 5, 'gap-end', 10]);
    expect(paginationSlots(5, 10)).toEqual([1, 'gap-start', 4, 5, 6, 'gap-end', 10]);
    expect(paginationSlots(10, 10)).toEqual([1, 'gap-start', 6, 7, 8, 9, 10]);
  });
});

describe('archive parameter helpers', () => {
  const items = [
    { categoryId: 'faculty', publishedOn: '2024-02-01', title: { text: 'Faculty workshop', lang: 'en', fallback: false }, summary: null },
    { categoryId: 'recruitment', publishedOn: '2023-07-09', title: { text: '招募臨床教師', lang: 'zh', fallback: true }, summary: { text: '即日起受理', lang: 'zh', fallback: true } },
    { categoryId: 'faculty', publishedOn: '2023-01-15', title: { text: '教師培育課程', lang: 'zh', fallback: true }, summary: null },
  ] as const;

  it('reads parameters defensively', () => {
    expect(readArchiveParams(new URLSearchParams('category=&year=20x4&page=-2'))).toEqual({ category: null, year: null, query: '', page: 1 });
    expect(readArchiveParams(new URLSearchParams('category=faculty&year=2024&q=a&page=3'))).toEqual({ category: 'faculty', year: '2024', query: 'a', page: 3 });
  });

  it('filters by category, year, and every query term, case-insensitively', () => {
    expect(filterArchiveItems(items, { category: 'faculty', year: null, query: '' })).toHaveLength(2);
    expect(filterArchiveItems(items, { category: null, year: '2023', query: '' })).toHaveLength(2);
    expect(filterArchiveItems(items, { category: null, year: null, query: 'WORKSHOP faculty' })).toEqual([items[0]]);
    expect(filterArchiveItems(items, { category: null, year: null, query: '受理' })).toEqual([items[1]]);
    expect(filterArchiveItems(items, { category: 'faculty', year: '2023', query: '課程' })).toEqual([items[2]]);
  });

  it('lists years newest first and paginates with clamping', () => {
    expect(archiveYears(items)).toEqual(['2024', '2023']);
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual({ items: [3, 4], page: 2, pageCount: 3 });
    expect(paginate([1, 2, 3], 9, 2)).toEqual({ items: [3], page: 2, pageCount: 2 });
    expect(paginate([], 1, 10)).toEqual({ items: [], page: 1, pageCount: 1 });
  });
});
