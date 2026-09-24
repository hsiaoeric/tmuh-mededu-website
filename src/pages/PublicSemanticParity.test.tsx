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
import snapshot from '@/content/generated/cms-snapshot.json';
import { parsePublishedContentRows } from '@/content/parsers';
import { Nav } from '@/ui/Nav';
import { Home } from './Home';
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

function OrganisationProbe() {
  const { lang } = useSite();
  return <Organisation centers={usePublicCenters(lang)} />;
}

function CentersProbe() {
  const { lang } = useSite();
  return <output data-testid="centers">{JSON.stringify(usePublicCenters(lang))}</output>;
}

const PUBLISHED = parsePublishedContentRows(snapshot);

function remoteCenters(): PublishedContent {
  const document = PUBLISHED.find((candidate) => candidate.kind === 'centers');
  if (document === undefined || document.kind !== 'centers') throw new TypeError('Missing centers fixture');
  const payload = structuredClone(document.payload);
  const reorder = (locale: typeof payload.zh): typeof payload.zh => ({
    ...locale,
    centers: [...locale.centers].reverse().map((center) => {
      if (center.id !== 'faculty_dev') return center;
      const branches = [...center.branches].reverse().map((branch) => {
        const next = { ...branch };
        if (branch.id === 'about') Reflect.set(next, 'pageSection', 'remote-anchor');
        return next;
      });
      const next = { ...center, branches };
      Reflect.set(next, 'color', '#000001');
      return next;
    }),
  });
  return {
    ...document,
    payload: { zh: reorder(payload.zh), en: reorder(payload.en) },
    version: document.version + 1,
  };
}

function remoteRepository(document: PublishedContent): PublishedContentRepository {
  return { listPublished: async () => ({ content: [document], failures: [] }) };
}

function renderPublic(children: ReactNode): RenderResult {
  return render(
    <MemoryRouter>
      <ContentProvider configuration={{ kind: 'disabled' }}>
        <PublicSiteProvider>{children}</PublicSiteProvider>
      </ContentProvider>
    </MemoryRouter>,
  );
}

function renderRemote(children: ReactNode, document: PublishedContent): RenderResult {
  return render(
    <MemoryRouter>
      <ContentProvider
        configuration={{ kind: 'configured', config: { url: 'https://example.supabase.co', publishableKey: 'test' } }}
        remoteRepository={remoteRepository(document)}
      >
        <PublicSiteProvider>{children}</PublicSiteProvider>
      </ContentProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe('public semantic parity', () => {
  it('mounts only the navigation and organization controls for the active viewport', () => {
    // Given / When
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    const desktopNav = renderPublic(<Nav />);

    // Then
    expect(desktopNav.getByRole('navigation', { name: '主選單' })).toBeTruthy();
    expect(desktopNav.queryByRole('button', { name: '選單' })).toBeNull();
    cleanup();

    // Given / When
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    const mobileNav = renderPublic(<Nav />);

    // Then
    expect(mobileNav.queryByRole('navigation', { name: '主選單' })).toBeNull();
    expect(mobileNav.getByRole('button', { name: '選單' })).toBeTruthy();
    cleanup();

    // When
    const mobileOrganisation = renderPublic(<OrganisationProbe />);

    // Then
    expect(mobileOrganisation.container.querySelector('.org-svg-wrap')).toBeNull();
    expect(mobileOrganisation.container.querySelectorAll('.org-list-row')).toHaveLength(6);
  });

  it('retains baseline Home ticker order with CMS-backed center labels', () => {
    // Given / When
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 });
    const home = renderPublic(<Home />);
    const firstTrack = home.container.querySelector('.marquee-track');

    // Then
    expect(Array.from(firstTrack?.querySelectorAll('.marquee-item') ?? [], (item) => item.textContent)).toEqual([
      '教師發展中心◦',
      '臨床技能中心◦',
      '實證醫學中心◦',
      '全人照護教育中心◦',
      '醫學教育研究中心◦',
      '行政團隊◦',
    ]);
  });

  it('composes center ordering, colors, and branch presentation from local registries', async () => {
    // Given / When
    const view = renderRemote(<CentersProbe />, remoteCenters());
    const output = await view.findByTestId('centers');
    const centers = JSON.parse(output.textContent ?? '[]');

    // Then
    expect(centers.map((center: { readonly id: string }) => center.id)).toEqual([
      'admin', 'faculty_dev', 'clinical_skills', 'ebm', 'holistic', 'med_edu_research',
    ]);
    const faculty = centers.find((center: { readonly id: string }) => center.id === 'faculty_dev');
    expect(faculty.color).toBe('#A87A6B');
    expect(faculty.branches.map((branch: { readonly id: string }) => branch.id)).toEqual(['about', 'services', 'contact']);
    expect(faculty.branches[0].pageSection).toBe('fd-about');
  });
});
