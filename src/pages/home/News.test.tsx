// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicSiteProvider } from '@/app/PublicSiteProvider';
import { ContentProvider } from '@/content/ContentProvider';
import type { PublishedContent, PublishedContentRepository } from '@/content/domain';
import { parseSupabaseConfiguration } from '@/content/env';
import committedSnapshot from '@/content/generated/cms-snapshot.json';
import { parsePublishedContentRows } from '@/content/parsers';
import { latestAnnouncements } from './latestAnnouncements';
import { News } from './News';

vi.hoisted(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: query === '(prefers-reduced-motion: reduce)',
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
  Reveal: ({ children }: { readonly children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/motion/SplitLines', () => ({
  SplitLines: ({ children }: { readonly children: ReactNode }) => <span>{children}</span>,
}));

const SNAPSHOT = parsePublishedContentRows(committedSnapshot);
const CONFIGURED = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: 'https://public-content.example',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_public_test_key',
});

type Channel = 'news' | 'honors' | 'center';

function post(id: string, publishedOn: string, pinned: boolean, channel: Channel = 'news') {
  return {
    id,
    channel,
    categoryId: channel === 'news' ? 'recruitment' : channel === 'honors' ? 'competitions-awards' : 'center-events',
    owner: channel === 'center' ? 'ebm' : 'department',
    publishedOn,
    pinned,
    title: { zh: `公告 ${id}` },
    body: { zh: [] },
    attachments: [],
  };
}

function remotePosts(posts: readonly ReturnType<typeof post>[]): PublishedContent {
  const document = SNAPSHOT.find((candidate) => candidate.kind === 'posts');
  if (document === undefined || document.kind !== 'posts') throw new TypeError('Missing posts fixture');
  return {
    ...document,
    version: document.version + 1,
    payload: { ...document.payload, posts } as typeof document.payload,
  };
}

function renderNews(remote?: PublishedContent) {
  const repository: PublishedContentRepository | undefined = remote === undefined
    ? undefined
    : { listPublished: async () => ({ content: [remote], failures: [] }) };
  return render(
    <MemoryRouter>
      <ContentProvider configuration={remote === undefined ? { kind: 'disabled' } : CONFIGURED} remoteRepository={repository}>
        <PublicSiteProvider><News /></PublicSiteProvider>
      </ContentProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('latestAnnouncements', () => {
  it('keeps only the announcements channel, pinned first, then newest first', () => {
    const posts = [
      post('1', '2024-01-01', false),
      post('2', '2024-06-01', false),
      post('3', '2023-01-01', true),
      post('4', '2025-01-01', false, 'honors'),
      post('5', '2025-02-01', false, 'center'),
      post('6', '2024-03-01', true),
    ];
    expect(latestAnnouncements(posts, 6).map((item) => item.id)).toEqual(['6', '3', '2', '1']);
    expect(latestAnnouncements(posts, 2).map((item) => item.id)).toEqual(['6', '3']);
  });
});

describe('home latest announcements list', () => {
  it('stays out of the page while the archive has no announcements', () => {
    renderNews();
    expect(screen.queryByRole('region', { name: '近期公告' })).toBeNull();
    expect(screen.queryByRole('link', { name: /全部公告/u })).toBeNull();
  });

  it('lists the newest six posts, pinned first, linking to their detail pages', async () => {
    const posts = [
      post('101', '2024-01-01', false),
      post('102', '2024-02-01', false),
      post('103', '2024-03-01', false),
      post('104', '2024-04-01', false),
      post('105', '2024-05-01', false),
      post('106', '2024-06-01', false),
      post('107', '2024-07-01', false),
      post('108', '2020-01-01', true),
      post('109', '2025-01-01', false, 'honors'),
    ];
    renderNews(remotePosts(posts));

    const region = await screen.findByRole('region', { name: '近期公告' }, { timeout: 5000 });
    const links = within(region).getAllByRole('link');
    const rows = links.filter((link) => link.classList.contains('post-stretched-link'));
    expect(rows.map((link) => link.textContent)).toEqual([
      '公告 108', '公告 107', '公告 106', '公告 105', '公告 104', '公告 103',
    ]);
    expect(rows[0]?.getAttribute('href')).toBe('/announcements/108');
    expect(within(region).getByRole('link', { name: /全部公告/u }).getAttribute('href')).toBe('/announcements');
  });
});
