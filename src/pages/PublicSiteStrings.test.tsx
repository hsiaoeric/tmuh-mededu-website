// @vitest-environment jsdom
import { cleanup, render, type RenderResult } from '@testing-library/react';
import { createElement, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicSiteProvider } from '@/app/PublicSiteProvider';
import { usePublicCenters } from '@/app/publicCenters';
import { useSite } from '@/app/site';
import { ContentProvider } from '@/content/ContentProvider';
import type { PublishedContent, PublishedContentRepository } from '@/content/domain';
import { parseSupabaseConfiguration } from '@/content/env';
import committedSnapshot from '@/content/generated/cms-snapshot.json';
import { parsePublishedContentRows } from '@/content/parsers';
import type { Lang, Strings } from '@/i18n';
import { Footer } from '@/ui/Footer';
import { Nav } from '@/ui/Nav';
import { PageHero } from '@/ui/PageParts';
import { Contact } from './home/Contact';
import { Organisation } from './home/Organisation';

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

vi.mock('@/motion/smoothScroll', () => ({
  scrollToId: () => undefined,
  setScrollLocked: () => undefined,
}));
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
vi.mock('@/motion/Parallax', () => ({
  Parallax: ({ children }: { readonly children: ReactNode }) => <div>{children}</div>,
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

function siteStringRemote(lang: Lang, field: keyof Strings, value: string): PublishedContent {
  const document = documentFor('site_copy');
  if (document.kind !== 'site_copy') throw new TypeError('Expected site_copy fixture');
  return {
    ...document,
    payload: {
      ...document.payload,
      [lang]: {
        ...document.payload[lang],
        strings: { ...document.payload[lang].strings, [field]: value },
      },
    },
  };
}

function renderRemote(children: ReactNode, remote: PublishedContent): RenderResult {
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

function OrganisationProbe() {
  const { lang } = useSite();
  return <Organisation centers={usePublicCenters(lang)} />;
}

type PublicStringConsumer = 'nav' | 'footer' | 'page-hero' | 'organisation' | 'contact';

const PUBLIC_STRING_CONSUMERS: Readonly<Record<PublicStringConsumer, ReactNode>> = {
  nav: <Nav />,
  footer: <Footer />,
  'page-hero': <PageHero eyebrow="Test" title="Test" tag="Test" tone="#4f8c7d" icon="heart" scrollTo="test" />,
  organisation: <OrganisationProbe />,
  contact: <Contact />,
};

const STRING_CASES: readonly {
  readonly field: keyof Strings;
  readonly lang: Lang;
  readonly consumer: PublicStringConsumer;
  readonly value: string;
  readonly renderedValue?: string;
}[] = [
  { field: 'brand1', lang: 'zh', consumer: 'nav', value: '遠端醫院品牌' },
  { field: 'brand1', lang: 'en', consumer: 'nav', value: 'Remote hospital brand' },
  { field: 'brand2', lang: 'zh', consumer: 'nav', value: '遠端教學部品牌' },
  { field: 'langBtn', lang: 'zh', consumer: 'nav', value: '語言切換' },
  { field: 'navAbout', lang: 'zh', consumer: 'nav', value: '遠端關於導覽' },
  { field: 'navAbout', lang: 'zh', consumer: 'footer', value: '遠端頁尾關於' },
  { field: 'navOrg', lang: 'zh', consumer: 'nav', value: '遠端組織導覽' },
  { field: 'navOrg', lang: 'zh', consumer: 'footer', value: '遠端頁尾組織' },
  { field: 'navNews', lang: 'zh', consumer: 'nav', value: '遠端公告導覽' },
  { field: 'navNews', lang: 'zh', consumer: 'footer', value: '遠端頁尾公告' },
  { field: 'navContact', lang: 'zh', consumer: 'nav', value: '遠端聯絡導覽' },
  { field: 'navContact', lang: 'zh', consumer: 'footer', value: '遠端頁尾聯絡' },
  { field: 'footAddr', lang: 'zh', consumer: 'footer', value: '遠端頁尾地址' },
  { field: 'footAddr', lang: 'en', consumer: 'footer', value: 'Remote footer address' },
  { field: 'footAddr', lang: 'zh', consumer: 'contact', value: '遠端聯絡地址', renderedValue: '遠端聯絡地址（第一醫療大樓七樓）' },
  { field: 'footAddr', lang: 'en', consumer: 'contact', value: 'Remote contact address', renderedValue: 'Remote contact address (7F, Medical Building I)' },
  { field: 'footTel', lang: 'zh', consumer: 'footer', value: '遠端頁尾電話' },
  { field: 'footNote', lang: 'zh', consumer: 'footer', value: '遠端頁尾說明' },
  { field: 'footNote', lang: 'en', consumer: 'footer', value: 'Remote footer note' },
  { field: 'backDept', lang: 'zh', consumer: 'page-hero', value: '遠端返回教學部' },
  { field: 'orgDesc', lang: 'zh', consumer: 'organisation', value: '遠端組織架構說明' },
  { field: 'members', lang: 'zh', consumer: 'organisation', value: '遠端團隊成員' },
];

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('remote public site strings', () => {
  it.each(STRING_CASES)('renders an independent $lang $field update in the $consumer consumer', async ({ field, lang, consumer, value, renderedValue }) => {
    // Given
    if (lang === 'en') localStorage.setItem('tmuh.lang', 'en');
    const remote = siteStringRemote(lang, field, value);

    // When
    const view = renderRemote(PUBLIC_STRING_CONSUMERS[consumer], remote);

    // Then
    const rendered = renderedValue === undefined
      ? await view.findByText(value, {}, { timeout: 10_000 })
      : await view.findByText((_content, element) => (
        element?.tagName === 'P' && element.textContent?.includes(renderedValue) === true
      ), {}, { timeout: 10_000 });
    expect(rendered).toBeTruthy();
  }, 15_000);
});
