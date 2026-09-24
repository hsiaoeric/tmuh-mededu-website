// @vitest-environment jsdom
import { cleanup, render, waitFor, type RenderResult } from '@testing-library/react';
import { createElement, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicSiteProvider } from '@/app/PublicSiteProvider';
import { ContentProvider } from '@/content/ContentProvider';
import type { PublishedContent, PublishedContentRepository } from '@/content/domain';
import { parseSupabaseConfiguration } from '@/content/env';
import committedSnapshot from '@/content/generated/cms-snapshot.json';
import { parsePublishedContentRows } from '@/content/parsers';
import { AnnouncementsPage } from './AnnouncementsPage';
import { DigitalMaterialsPage } from './DigitalMaterialsPage';
import { Glance } from './home/Glance';
import { Honors } from './home/Honors';
import { News } from './home/News';

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

vi.mock('@/motion/Counter', () => ({ Counter: ({ to }: { readonly to: number }) => <>{to}</> }));
vi.mock('@/motion/Reveal', () => ({
  Reveal: ({ children, className, style }: {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
  }) => <div className={className} style={style}>{children}</div>,
}));
vi.mock('@/motion/SplitLines', () => ({
  SplitLines: ({ as: element = 'span', children, className, style }: {
    readonly as?: ElementType;
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
  }) => createElement(element, { className, style }, children),
}));
vi.mock('@/motion/gsap', () => ({
  gsap: { context: () => ({ revert: () => undefined }) },
  prefersReducedMotion: () => true,
}));

const SNAPSHOT = parsePublishedContentRows(committedSnapshot);
const CONFIGURED = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: 'https://public-content.example',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_public_test_key',
});

function documentFor(kind: PublishedContent['kind']): PublishedContent {
  const document = SNAPSHOT.find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return document;
}

function renderPublic(children: ReactNode, remote: PublishedContent): RenderResult {
  const repository: PublishedContentRepository = {
    listPublished: async () => ({ content: [{ ...remote, version: remote.version + 1 }], failures: [] }),
  };
  return render(
    <MemoryRouter>
      <ContentProvider configuration={CONFIGURED} remoteRepository={repository}>
        <PublicSiteProvider>{children}</PublicSiteProvider>
      </ContentProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe('remote public collections', () => {
  it('updates news output independently', async () => {
    const document = documentFor('news');
    if (document.kind !== 'news') throw new TypeError('Expected news fixture');
    const remote = {
      ...document,
      payload: {
        ...document.payload,
        announcementBoardUrl: 'https://example.test/remote-board',
        zh: {
          ...document.payload.zh,
          department: document.payload.zh.department.map((item, index) => index === 0
            ? { ...item, title: '遠端公告標題' }
            : item),
        },
      },
    };
    const view = renderPublic(<AnnouncementsPage />, remote);
    expect(await view.findByText('遠端公告標題')).toBeTruthy();
    expect(view.getByRole('link', { name: /對外看板/u }).getAttribute('href')).toBe('https://example.test/remote-board');
    cleanup();

    const homeNews = renderPublic(<News />, remote);
    await waitFor(() => {
      expect(homeNews.getByRole('link', { name: /常用看板/u }).getAttribute('href'))
        .toBe('https://example.test/remote-board');
    });
  });

  it('updates activities output independently', async () => {
    const document = documentFor('activities');
    if (document.kind !== 'activities') throw new TypeError('Expected activities fixture');
    const zhActivity = document.payload.zh.holistic[0];
    const enActivity = document.payload.en.holistic[0];
    if (zhActivity === undefined || enActivity === undefined) throw new TypeError('Missing activity fixture');
    const remote = {
      ...document,
      payload: {
        ...document.payload,
        zh: { ...document.payload.zh, department: [{ ...zhActivity, id: 'remote-department', title: '遠端近期活動' }] },
        en: { ...document.payload.en, department: [{ ...enActivity, id: 'remote-department', title: 'Remote upcoming event' }] },
      },
    };
    const view = renderPublic(<AnnouncementsPage />, remote);
    expect(await view.findByRole('heading', { name: '遠端近期活動' })).toBeTruthy();
  });

  it('updates kpis output independently', async () => {
    const document = documentFor('kpis');
    if (document.kind !== 'kpis') throw new TypeError('Expected kpis fixture');
    const remote = {
      ...document,
      payload: {
        ...document.payload,
        zh: {
          items: document.payload.zh.items.map((item) => item.id === 'department_advisors'
            ? { ...item, label: '遠端教學部顧問' }
            : item),
        },
      },
    };
    const view = renderPublic(<Glance />, remote);
    expect(await view.findByRole('button', { name: /遠端教學部顧問/u })).toBeTruthy();
  });

  it('updates honors output independently', async () => {
    const document = documentFor('honors');
    if (document.kind !== 'honors') throw new TypeError('Expected honors fixture');
    const remote = {
      ...document,
      payload: { ...document.payload, zh: { ...document.payload.zh, title: '遠端品質榮譽' } },
    };
    const view = renderPublic(<Honors />, remote);
    expect(await view.findByRole('heading', { name: '遠端品質榮譽' })).toBeTruthy();
  });

  it('updates digital_materials output independently', async () => {
    const document = documentFor('digital_materials');
    if (document.kind !== 'digital_materials') throw new TypeError('Expected digital materials fixture');
    const remote = {
      ...document,
      payload: { ...document.payload, zh: { ...document.payload.zh, title: '遠端數位教材室' } },
    };
    const view = renderPublic(<DigitalMaterialsPage />, remote);
    expect(await view.findByText('遠端數位教材室')).toBeTruthy();
  });
});
