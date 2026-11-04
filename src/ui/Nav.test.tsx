// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicSiteProvider } from '@/app/PublicSiteProvider';
import { EPORTFOLIO_URL } from '@/app/routes';
import { ContentProvider } from '@/content/ContentProvider';
import { Footer } from './Footer';
import { Nav } from './Nav';

const viewport = vi.hoisted(() => {
  const state = { narrow: false };
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: query === '(prefers-reduced-motion: reduce)' || (query === '(max-width: 780px)' && state.narrow),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    }),
  });
  return state;
});

const scroll = vi.hoisted(() => ({ locked: [] as boolean[] }));
vi.mock('@/motion/smoothScroll', () => ({
  scrollToId: () => undefined,
  scrollToTop: () => undefined,
  setScrollLocked: (locked: boolean) => scroll.locked.push(locked),
}));
vi.mock('@/motion/Reveal', () => ({
  Reveal: ({ children }: { readonly children: React.ReactNode }) => <div>{children}</div>,
}));

function renderAt(path: string, ui = <Nav />, lang: 'zh' | 'en' = 'zh') {
  localStorage.setItem('tmuh.lang', lang);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ContentProvider configuration={{ kind: 'disabled' }}>
        <PublicSiteProvider>{ui}</PublicSiteProvider>
      </ContentProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  viewport.narrow = false;
  scroll.locked = [];
});
afterEach(cleanup);

describe('desktop nav row', () => {
  it('lists the department, centers, announcements, trainees, honors and more, without home anchors', () => {
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: '主選單' });
    const top = within(nav);

    expect(top.getByRole('link', { name: '教學部' }).getAttribute('href')).toBe('/department');
    expect(top.getByRole('button', { name: '中心' }).getAttribute('aria-expanded')).toBe('false');
    expect(top.getByRole('link', { name: '公告' }).getAttribute('href')).toBe('/announcements');
    expect(top.getByRole('link', { name: '學員專區' }).getAttribute('href')).toBe('/trainees');
    expect(top.getByRole('link', { name: '榮譽榜' }).getAttribute('href')).toBe('/honors');
    expect(top.getByRole('button', { name: '更多' })).toBeTruthy();
    expect(top.queryByRole('button', { name: '關於' })).toBeNull();
    expect(top.queryByRole('button', { name: '組織架構' })).toBeNull();
    expect(top.queryByRole('link', { name: '數位教材室' })).toBeNull();
  });

  it('puts the digital materials room inside the centers menu', () => {
    renderAt('/');
    fireEvent.click(screen.getByRole('button', { name: '中心' }));
    const panel = document.getElementById(screen.getByRole('button', { name: '中心' }).getAttribute('aria-controls') ?? '');
    expect(panel).not.toBeNull();
    const links = within(panel as HTMLElement).getAllByRole('link');
    expect(links).toHaveLength(6);
    expect(links[5]?.getAttribute('href')).toBe('/digital-materials');
  });

  it('opens E-Portfolio from 更多 in a new tab with noopener', () => {
    renderAt('/');
    fireEvent.click(screen.getByRole('button', { name: '更多' }));
    const link = screen.getByRole('link', { name: /E-Portfolio/u });

    expect(link.getAttribute('href')).toBe(EPORTFOLIO_URL);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')?.split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
    expect(link.getAttribute('aria-label')).toContain('另開新分頁');
  });

  it('gathers the archives, resources and contact under 更多', () => {
    renderAt('/');
    fireEvent.click(screen.getByRole('button', { name: '更多' }));
    expect(screen.getByRole('link', { name: /活動花絮/u }).getAttribute('href')).toBe('/gallery');
    expect(screen.getByRole('link', { name: /影音看板/u }).getAttribute('href')).toBe('/videos');
    expect(screen.getByRole('link', { name: /相關資源/u }).getAttribute('href')).toBe('/resources');
    expect(screen.getByRole('button', { name: /聯絡/u })).toBeTruthy();
  });

  it.each([
    ['/department', '教學部', 'page'],
    ['/department/director-message', '教學部', 'true'],
    ['/announcements/185', '公告', 'true'],
    ['/trainees/pgy', '學員專區', 'true'],
    ['/honors', '榮譽榜', 'page'],
  ])('marks the current section on %s', (path, label, current) => {
    renderAt(path);
    const link = within(screen.getByRole('navigation', { name: '主選單' })).getByRole('link', { name: label });
    expect(link.getAttribute('data-active')).toBe('true');
    expect(link.getAttribute('aria-current')).toBe(current);
  });

  it.each([
    ['/centers/evidence-based-medicine', '中心'],
    ['/digital-materials', '中心'],
    ['/gallery/spring-2024', '更多'],
    ['/resources', '更多'],
  ])('lights the %s menu trigger', (path, trigger) => {
    renderAt(path);
    expect(screen.getByRole('button', { name: trigger }).getAttribute('data-active')).toBe('true');
  });

  it('does not light anything for the home page', () => {
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: '主選單' });
    expect(nav.querySelectorAll('.nav-link[data-active="true"]')).toHaveLength(0);
  });

  it('renders English labels', () => {
    renderAt('/', <Nav />, 'en');
    const nav = within(screen.getByRole('navigation', { name: 'Main menu' }));
    expect(nav.getByRole('link', { name: 'Department' })).toBeTruthy();
    expect(nav.getByRole('button', { name: 'Centers' })).toBeTruthy();
    expect(nav.getByRole('link', { name: 'Trainees' })).toBeTruthy();
    expect(nav.getByRole('button', { name: 'More' })).toBeTruthy();
  });
});

describe('mobile sheet', () => {
  beforeEach(() => {
    viewport.narrow = true;
  });

  it('groups the sheet and locks the page scroll while it is open', () => {
    renderAt('/');
    expect(screen.queryByRole('navigation', { name: '主選單' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '選單' }));

    expect(scroll.locked[scroll.locked.length - 1]).toBe(true);
    const scroller = document.querySelector('.nav-sheet-scroller');
    expect(scroller?.hasAttribute('data-lenis-prevent')).toBe(true);

    const sheet = screen.getByRole('navigation', { name: '網站選單' });
    const groups = within(sheet).getAllByRole('group');
    expect(groups.map((group) => group.getAttribute('aria-labelledby') && document.getElementById(group.getAttribute('aria-labelledby') ?? '')?.textContent))
      .toEqual(['教學部', '中心', '公告與榮譽', '學員專區', '更多']);

    const [department, centers, news, trainees, more] = groups as [HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement];
    expect(within(department).getByRole('link').getAttribute('href')).toBe('/department');
    expect(within(centers).getAllByRole('link')).toHaveLength(6);
    expect(within(news).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/announcements', '/honors']);
    expect(within(trainees).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/trainees',
      '/trainees/residents',
      '/trainees/pgy',
      '/trainees/medical-students',
      '/trainees/allied-health-trainees',
      '/trainees/joint-training',
    ]);
    const eportfolio = within(more).getByRole('link', { name: /E-Portfolio/u });
    expect(eportfolio.getAttribute('target')).toBe('_blank');
    expect(eportfolio.getAttribute('rel')).toContain('noopener');

    fireEvent.click(screen.getByRole('button', { name: '選單' }));
    expect(screen.queryByRole('navigation', { name: '網站選單' })).toBeNull();
    expect(scroll.locked[scroll.locked.length - 1]).toBe(false);
  });
});

describe('footer', () => {
  it('links announcements, the five programs, resources and external systems', () => {
    renderAt('/', <Footer />);
    const column = (name: string) => within(screen.getByRole('navigation', { name }));

    expect(column('公告').getAllByRole('link')[0]?.getAttribute('href')).toBe('/announcements');
    expect(column('公告').getByRole('link', { name: '招募相關' }).getAttribute('href')).toBe('/announcements?category=recruitment');
    expect(column('學員專區').getAllByRole('link')).toHaveLength(6);
    expect(column('相關資源').getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/resources#links',
      '/resources#downloads',
      '/gallery',
      '/videos',
    ]);
    const eportfolio = column('外部系統').getByRole('link', { name: /E-Portfolio/u });
    expect(eportfolio.getAttribute('href')).toBe(EPORTFOLIO_URL);
    expect(eportfolio.getAttribute('target')).toBe('_blank');
    expect(eportfolio.getAttribute('rel')).toContain('noopener');
  });
});
