// @vitest-environment jsdom
import { cleanup, fireEvent, render, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
import { buildPublicMediaReference } from '@/content/media';
import { parsePublishedContentRows } from '@/content/parsers';
import { Footer } from '@/ui/Footer';
import { Nav } from '@/ui/Nav';
import { AnnouncementsPage } from './AnnouncementsPage';
import { GenericCenterPage } from './centers/GenericCenterPage';
import { DigitalMaterialsPage } from './DigitalMaterialsPage';
import { Glance } from './home/Glance';
import { Hero } from './home/Hero';
import { Honors } from './home/Honors';
import { News } from './home/News';
import { Organisation } from './home/Organisation';

vi.hoisted(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: query === '(prefers-reduced-motion: reduce)'
        || (query === '(max-width: 780px)' && window.innerWidth <= 780),
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

function SiteCopyProbe() {
  const { t } = useSite();
  return <output>{t.heroTitle1}</output>;
}

function OrganisationProbe() {
  const { lang } = useSite();
  return <Organisation centers={usePublicCenters(lang)} />;
}

function remoteRepository(document: PublishedContent): PublishedContentRepository {
  return {
    listPublished: async () => ({ content: [{ ...document, version: document.version + 1 }], failures: [] }),
  };
}

function documentFor(kind: PublishedContent['kind']): PublishedContent {
  const document = SNAPSHOT.find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return document;
}

function renderPublic(children: ReactNode, remote?: PublishedContent): RenderResult {
  return render(
    <MemoryRouter>
      <ContentProvider configuration={CONFIGURED} remoteRepository={remote === undefined ? undefined : remoteRepository(remote)}>
        <PublicSiteProvider>{children}</PublicSiteProvider>
      </ContentProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
});
afterEach(() => cleanup());

describe('committed public characterizations', () => {
  it('retains the baseline shell and route copy', () => {
    const site = renderPublic(<SiteCopyProbe />);
    expect(site.getByText('卓越醫學教育')).toBeTruthy();
    cleanup();

    const announcements = renderPublic(<AnnouncementsPage />);
    expect(announcements.getByRole('heading', { name: '公告' })).toBeTruthy();
    expect(announcements.getByRole('link', { name: /對外看板/u }).getAttribute('href'))
      .toContain('script.google.com');
    cleanup();

    const homeNews = renderPublic(<News />);
    expect(homeNews.getByRole('link', { name: /常用看板/u }).getAttribute('href'))
      .toContain('script.google.com');
    cleanup();

    const digital = renderPublic(<DigitalMaterialsPage />);
    expect(digital.getByText('本頁內容仍在彙整中，完成後將於此發布。')).toBeTruthy();
  });

  it('retains baseline centers, kpis, people, news, and honors output', async () => {
    const user = userEvent.setup();
    const hero = renderPublic(<Hero />);
    expect(hero.getByRole('link', { name: /臨床技能中心/u })).toBeTruthy();
    cleanup();

    const glance = renderPublic(<Glance />);
    expect(glance.getByRole('button', { name: /教學型主治/u })).toBeTruthy();
    await user.click(glance.getByRole('button', { name: /教學型主治/u }));
    expect(glance.getByText('邱欣怡')).toBeTruthy();
    cleanup();

    const honors = renderPublic(<Honors />);
    expect(honors.getByRole('heading', { name: '品質榮譽' })).toBeTruthy();
  });
});

describe('remote public documents', () => {
  it('updates site_copy output independently', async () => {
    const document = documentFor('site_copy');
    if (document.kind !== 'site_copy') throw new TypeError('Expected site_copy fixture');
    const remote = {
      ...document,
      payload: {
        ...document.payload,
        zh: { ...document.payload.zh, strings: { ...document.payload.zh.strings, heroTitle1: '遠端全站文案' } },
      },
    };
    const view = renderPublic(<SiteCopyProbe />, remote);
    expect(await view.findByText('遠端全站文案')).toBeTruthy();
  });

  it('updates centers output independently', async () => {
    const document = documentFor('centers');
    if (document.kind !== 'centers') throw new TypeError('Expected centers fixture');
    const remote = {
      ...document,
      payload: {
        ...document.payload,
        zh: {
          ...document.payload.zh,
          centers: document.payload.zh.centers.map((center) => center.id === 'clinical_skills'
            ? {
                ...center,
                name: '遠端臨床技能中心',
                externalUrl: 'https://example.test/remote-clinical-skills',
                branches: center.branches.map((branch, index) => index === 0
                  ? { ...branch, description: '遠端中心面向' }
                  : branch),
              }
            : center),
        },
      },
    };
    const view = renderPublic(<Hero />, remote);
    expect(await view.findByRole('link', { name: /遠端臨床技能中心/u })).toBeTruthy();
    cleanup();

    const nav = renderPublic(<Nav />, remote);
    fireEvent.click(nav.getByRole('button', { name: '五大中心' }));
    expect((await nav.findAllByText('遠端臨床技能中心')).length).toBeGreaterThan(0);
    cleanup();

    const footer = renderPublic(<Footer />, remote);
    expect((await footer.findByRole('link', { name: /遠端臨床技能中心/u })).getAttribute('href'))
      .toBe('https://example.test/remote-clinical-skills');
    cleanup();

    const organisation = renderPublic(<OrganisationProbe />, remote);
    expect((await organisation.findAllByText('遠端臨床技能中心')).length).toBeGreaterThan(0);
    cleanup();

    const generic = renderPublic(<GenericCenterPage id="clinical_skills" />, remote);
    expect(await generic.findByText('遠端中心面向')).toBeTruthy();
    expect(generic.getByRole('link', { name: /前往官方網站/u }).getAttribute('href'))
      .toBe('https://example.test/remote-clinical-skills');
  });

  it('updates people output through adapter-resolved media independently', async () => {
    const document = documentFor('people');
    if (document.kind !== 'people') throw new TypeError('Expected people fixture');
    const digest = 'a'.repeat(64);
    const publicPortrait = buildPublicMediaReference(digest, 'image/webp');
    const replacePortrait = (locale: typeof document.payload.zh) => ({
      ...locale,
      memberGroups: locale.memberGroups.map((group) => group.id === 'teaching_attendings'
        ? {
            ...group,
            people: group.people.map((person, index) => index === 0
              ? { ...person, portrait: publicPortrait }
              : person),
          }
        : group),
    });
    const remote = {
      ...document,
      payload: { ...document.payload, zh: replacePortrait(document.payload.zh), en: replacePortrait(document.payload.en) },
    };
    const view = renderPublic(<Glance />, remote);
    await userEvent.setup().click(view.getByRole('button', { name: /教學型主治/u }));
    const portrait = await view.findByRole('img', { name: '邱欣怡' });
    expect(portrait.getAttribute('src')).toBe(
      `https://public-content.example/storage/v1/object/public/public-media/${digest}/${digest}.webp`,
    );
  });

});
