// @vitest-environment jsdom
import { cleanup, render, waitFor, type RenderResult } from '@testing-library/react';
import { createElement, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';
import { PublicSiteProvider } from '@/app/PublicSiteProvider';
import type { SiteInline } from '@/app/site';
import { ContentProvider } from '@/content/ContentProvider';
import type { PublishedContent, PublishedContentRepository } from '@/content/domain';
import { parseSupabaseConfiguration } from '@/content/env';
import committedSnapshot from '@/content/generated/cms-snapshot.json';
import { parsePublishedContentRows } from '@/content/parsers';
import type { Lang } from '@/i18n';
import { Footer } from '@/ui/Footer';
import { GenericCenterPage } from './centers/GenericCenterPage';
import { HolisticPage } from './centers/HolisticPage';

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

vi.mock('@/pages/Home', () => ({ Home: () => <div>Home</div> }));
vi.mock('@/webgl/TissueField', () => ({ TissueField: () => null }));
vi.mock('@/motion/smoothScroll', () => ({
  scrollToId: () => undefined,
  scrollToTop: () => undefined,
  setScrollLocked: () => undefined,
  useSmoothScroll: () => undefined,
}));
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
vi.mock('@/motion/Parallax', () => ({
  Parallax: ({ children }: { readonly children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/motion/gsap', () => ({
  ScrollTrigger: { refresh: () => undefined },
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

function renderRemote(
  children: ReactNode,
  remote: PublishedContent,
  initialEntry = '/',
): RenderResult {
  const repository: PublishedContentRepository = {
    listPublished: async () => ({ content: [{ ...remote, version: remote.version + 1 }], failures: [] }),
  };
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ContentProvider configuration={CONFIGURED} remoteRepository={repository}>
        <PublicSiteProvider>{children}</PublicSiteProvider>
      </ContentProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const INLINE_CASES: readonly {
  readonly field: keyof SiteInline;
  readonly lang: Lang;
  readonly role: 'heading' | 'link';
  readonly value: string;
}[] = [
  { field: 'skipToContent', lang: 'zh', role: 'link', value: '遠端跳至內容' },
  { field: 'skipToContent', lang: 'en', role: 'link', value: 'Remote skip to content' },
  { field: 'holisticAdministrativeTeam', lang: 'zh', role: 'heading', value: '遠端行政團隊' },
  { field: 'holisticAdministrativeTeam', lang: 'en', role: 'heading', value: 'Remote administrative team' },
  { field: 'holisticResearchTeam', lang: 'zh', role: 'heading', value: '遠端研究團隊' },
  { field: 'holisticResearchTeam', lang: 'en', role: 'heading', value: 'Remote research team' },
  { field: 'holisticClosingTitle', lang: 'zh', role: 'heading', value: '遠端關懷結語' },
  { field: 'holisticClosingTitle', lang: 'en', role: 'heading', value: 'Remote closing statement' },
];

function siteCopyRemote(lang: Lang, field: keyof SiteInline, value: string): PublishedContent {
  const document = documentFor('site_copy');
  if (document.kind !== 'site_copy') throw new TypeError('Expected site_copy fixture');
  return {
    ...document,
    payload: {
      ...document.payload,
      [lang]: {
        ...document.payload[lang],
        inline: { ...document.payload[lang].inline, [field]: value },
      },
    },
  };
}

describe('remote public inline copy', () => {
  it.each(INLINE_CASES)('renders an independent $lang $field update in its public consumer', async ({ field, lang, role, value }) => {
    // Given
    if (lang === 'en') localStorage.setItem('tmuh.lang', 'en');
    const child = field === 'skipToContent' ? <App /> : <HolisticPage />;

    // When
    const view = renderRemote(child, siteCopyRemote(lang, field, value));

    // Then
    expect(await view.findByRole(role, { name: value }, { timeout: 10_000 })).toBeTruthy();
  }, 15_000);
});

describe('localized public center URLs', () => {
  it('uses the internal route when only an English URL exists for a Traditional Chinese visitor', async () => {
    // Given
    const document = documentFor('centers');
    if (document.kind !== 'centers') throw new TypeError('Expected centers fixture');
    const remote = {
      ...document,
      payload: {
        zh: {
          ...document.payload.zh,
          centers: document.payload.zh.centers.map((center) => center.id === 'clinical_skills'
            ? { ...center, externalUrl: undefined }
            : center),
        },
        en: {
          ...document.payload.en,
          centers: document.payload.en.centers.map((center) => center.id === 'clinical_skills'
            ? { ...center, externalUrl: 'https://example.test/english-only' }
            : center),
        },
      },
    };

    // When
    const view = renderRemote(<><GenericCenterPage id="clinical_skills" /><Footer /></>, remote);

    // Then
    await waitFor(() => {
      expect(view.queryByRole('link', { name: '前往官方網站' })).toBeNull();
      const centerLink = view.getByRole('link', { name: /臨床技能中心/ });
      expect(centerLink.getAttribute('href')).toBe('/centers/clinical-skills');
      expect(centerLink.textContent).not.toContain('↗');
    }, { timeout: 10_000 });
  }, 15_000);

  it('uses the internal route when only a Traditional Chinese URL exists for an English visitor', async () => {
    // Given
    localStorage.setItem('tmuh.lang', 'en');
    const document = documentFor('centers');
    if (document.kind !== 'centers') throw new TypeError('Expected centers fixture');
    const remote = {
      ...document,
      payload: {
        zh: {
          ...document.payload.zh,
          centers: document.payload.zh.centers.map((center) => center.id === 'clinical_skills'
            ? { ...center, externalUrl: 'https://example.test/chinese-only' }
            : center),
        },
        en: {
          ...document.payload.en,
          centers: document.payload.en.centers.map((center) => center.id === 'clinical_skills'
            ? { ...center, externalUrl: undefined }
            : center),
        },
      },
    };

    // When
    const view = renderRemote(<><GenericCenterPage id="clinical_skills" /><Footer /></>, remote);

    // Then
    await waitFor(() => {
      expect(view.queryByRole('link', { name: 'Visit the official site' })).toBeNull();
      const centerLink = view.getByRole('link', { name: /Center for Clinical Skills/ });
      expect(centerLink.getAttribute('href')).toBe('/centers/clinical-skills');
      expect(centerLink.textContent).not.toContain('↗');
    }, { timeout: 10_000 });
  }, 15_000);
});
