// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ElementType, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteProvider } from '@/app/site';
import { ContentProvider } from '@/content/ContentProvider';
import type { PublishedContent, PublishedContentRepository } from '@/content/domain';
import { parseSupabaseConfiguration } from '@/content/env';
import committedSnapshot from '@/content/generated/cms-snapshot.json';
import { buildPublicMediaReference } from '@/content/media/references';
import { parsePublishedContentRows } from '@/content/parsers';
import { FacdevPage } from './FacdevPage';

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

vi.mock('@/motion/Counter', () => ({
  Counter: ({ to }: { readonly to: number }) => <>{to}</>,
}));

vi.mock('@/motion/Reveal', () => ({
  Reveal: ({ children, className }: { readonly children: ReactNode; readonly className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/motion/SplitLines', () => ({
  SplitLines: ({ as: Tag = 'div', children, className }: {
    readonly as?: ElementType;
    readonly children: ReactNode;
    readonly className?: string;
  }) => <Tag className={className}>{children}</Tag>,
}));

vi.mock('@/motion/Parallax', () => ({
  Parallax: ({ children }: { readonly children: ReactNode }) => <div>{children}</div>,
}));

const DISABLED = parseSupabaseConfiguration({});
const CONFIGURED = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: 'https://public-content.example',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
});
const SNAPSHOT = parsePublishedContentRows(committedSnapshot);

function documentFor(kind: PublishedContent['kind']): PublishedContent {
  const document = SNAPSHOT.find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return document;
}

function repository(document: PublishedContent): PublishedContentRepository {
  return { listPublished: async () => ({ content: [{ ...document, version: document.version + 1 }], failures: [] }) };
}

function renderPage(remote?: PublishedContent) {
  return render(
    <MemoryRouter>
      <SiteProvider>
        <ContentProvider
          configuration={remote === undefined ? DISABLED : CONFIGURED}
          remoteRepository={remote === undefined ? undefined : repository(remote)}
        >
          <FacdevPage />
        </ContentProvider>
      </SiteProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('FacdevPage baseline', () => {
  it('preserves the committed page hierarchy, ordering, contact, and portrait paths', async () => {
    // Given / When
    const view = renderPage();

    // Then
    expect(view.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      '成就每一位卓越的臨床教師',
      '以教師發展，成就醫學教育',
      '四大核心業務',
      '全院臨床教師發展與培訓',
      '教職新聘與升等業務',
      '教學讀書會與獎項評選',
      '教師發展委員會',
      '六大教學培育小組',
      '最新公告',
      '近期活動',
      '好的教師，是醫學教育最深的根基',
    ]);
    expect(view.getAllByText('負責人')).toHaveLength(6);
    expect(view.getByText('行政專員：陳均茹')).toBeTruthy();
    expect([...view.container.querySelectorAll('img')].map((image) => image.getAttribute('src'))).toEqual([
      '/assets/ming-de-chen.jpg',
      '/assets/shumei-chen.jpg',
      '/assets/hsin-yi-chiu.jpg',
      '/assets/jeng-cheng-wu.jpg',
      '/assets/chien-yu-chen.jpg',
      '/assets/jen-chieh-wu.jpg',
      '/assets/hsiu-chen-lin.jpg',
      '/assets/faith-ruofan-liao.jpg',
    ]);
    await waitFor(() => expect(document.title).toBe('教師發展中心 — 北醫附醫教學部'));
  });

  it('renders remote facdev copy and lead media independently', async () => {
    const document = documentFor('facdev');
    if (document.kind !== 'facdev') throw new TypeError('Expected facdev fixture');
    const publicPortrait = buildPublicMediaReference('a'.repeat(64), 'image/jpeg');
    const remote = {
      ...document,
      payload: {
        ...document.payload,
        zh: {
          ...document.payload.zh,
          heroTitle: '遠端教師發展標題',
          groups: document.payload.zh.groups.map((group, index) => index === 0
            ? { ...group, lead: { ...group.lead, name: '遠端培育負責人', alternateName: 'Remote Faculty Lead', portrait: publicPortrait } }
            : group),
        },
        en: {
          ...document.payload.en,
          groups: document.payload.en.groups.map((group, index) => index === 0
            ? { ...group, lead: { ...group.lead, name: 'Remote Faculty Lead', alternateName: '遠端培育負責人', portrait: publicPortrait } }
            : group),
        },
      },
    };
    const view = renderPage(remote);
    expect(await view.findByRole('heading', { name: '遠端教師發展標題' })).toBeTruthy();
    expect(await view.findByText('遠端培育負責人')).toBeTruthy();
    await waitFor(() => expect(
      view.container.querySelector(`img[src="https://public-content.example/storage/v1/object/public/public-media/${publicPortrait.path}"]`),
    ).toBeTruthy());
  });

  it('renders remote center title independently', async () => {
    const document = documentFor('centers');
    if (document.kind !== 'centers') throw new TypeError('Expected centers fixture');
    const remote = {
      ...document,
      payload: {
        ...document.payload,
        zh: {
          ...document.payload.zh,
          centers: document.payload.zh.centers.map((center) => center.id === 'faculty_dev'
            ? { ...center, name: '遠端教師發展中心' }
            : center),
        },
      },
    };
    renderPage(remote);
    await waitFor(() => expect(globalThis.document.title).toBe('遠端教師發展中心 — 北醫附醫教學部'));
  });

  it('renders remote center people and media independently', async () => {
    const document = documentFor('people');
    if (document.kind !== 'people') throw new TypeError('Expected people fixture');
    const publicPortrait = buildPublicMediaReference('b'.repeat(64), 'image/jpeg');
    const replace = (locale: typeof document.payload.zh, name: string, alternateName: string) => ({
      ...locale,
      centerPeople: locale.centerPeople.map((group) => group.centerId === 'faculty_dev'
        ? { ...group, people: group.people.map((person, index) => index === 0
          ? { ...person, name, alternateName, portrait: publicPortrait }
          : person) }
        : group),
    });
    const remote = {
      ...document,
      payload: {
        zh: replace(document.payload.zh, '遠端中心成員', 'Remote Center Member'),
        en: replace(document.payload.en, 'Remote Center Member', '遠端中心成員'),
      },
    };
    const view = renderPage(remote);
    expect(await view.findByText('遠端中心成員')).toBeTruthy();
  });
});
