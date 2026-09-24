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
import { parsePublishedContentRows } from '@/content/parsers';
import { EbmPage } from './EbmPage';

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

vi.mock('@/motion/HorizontalScroll', () => ({
  HorizontalScroll: ({ children }: { readonly children: ReactNode }) => <div>{children}</div>,
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
          <EbmPage />
        </ContentProvider>
      </SiteProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('EbmPage baseline', () => {
  it('preserves the committed page hierarchy, stage/course order, contact, and member links', async () => {
    // Given / When
    const view = renderPage();

    // Then
    expect(view.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      '提升醫療品質的關鍵引擎',
      '實證為基，深耕二十餘載',
      '四大核心任務',
      'NHQA（現為 NCMEA）實證醫學競賽',
      '實證醫學研討會投稿',
      'EBQI 品質改善專案',
      '實證醫學教育培訓',
      '競賽輝煌成就',
      '文獻查證組',
      '臨床應用組',
      '知識轉譯組',
      '實證醫學推動歷程',
      '奠基階段',
      '擴展階段',
      '深化階段',
      '階梯式訓練體系',
      '系統性課程',
      '應用與實踐',
      '師資培育',
      '讓實證成為每一次臨床決策的基石',
    ]);
    expect(view.getByText('行政專員：江明憲')).toBeTruthy();
    expect(view.getAllByRole('link', { name: '個人學術檔案' }).map((link) => link.getAttribute('href'))).toEqual([
      'https://hub.tmu.edu.tw/zh/persons/hsiu-chen-lin/',
      'https://hub.tmu.edu.tw/zh/persons/sheng-feng-lin/',
    ]);
    await waitFor(() => expect(document.title).toBe('實證醫學中心 — 北醫附醫教學部'));
  });

  it('renders remote ebm copy independently', async () => {
    const document = documentFor('ebm');
    if (document.kind !== 'ebm') throw new TypeError('Expected ebm fixture');
    const remote = {
      ...document,
      payload: { ...document.payload, zh: { ...document.payload.zh, heroTitle: '遠端實證醫學標題' } },
    };
    const view = renderPage(remote);
    expect(await view.findByRole('heading', { name: '遠端實證醫學標題' })).toBeTruthy();
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
          centers: document.payload.zh.centers.map((center) => center.id === 'ebm'
            ? { ...center, name: '遠端實證醫學中心' }
            : center),
        },
      },
    };
    renderPage(remote);
    await waitFor(() => expect(globalThis.document.title).toBe('遠端實證醫學中心 — 北醫附醫教學部'));
  });

  it('renders remote center people independently', async () => {
    const document = documentFor('people');
    if (document.kind !== 'people') throw new TypeError('Expected people fixture');
    const replace = (locale: typeof document.payload.zh, name: string, alternateName: string) => ({
      ...locale,
      centerPeople: locale.centerPeople.map((group) => group.centerId === 'ebm'
        ? { ...group, people: group.people.map((person, index) => index === 0
          ? { ...person, name, alternateName }
          : person) }
        : group),
    });
    const remote = {
      ...document,
      payload: {
        zh: replace(document.payload.zh, '遠端實證中心成員', 'Remote EBM Member'),
        en: replace(document.payload.en, 'Remote EBM Member', '遠端實證中心成員'),
      },
    };
    const view = renderPage(remote);
    expect(await view.findByText('遠端實證中心成員')).toBeTruthy();
  });
});
