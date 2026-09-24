// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteProvider } from '@/app/site';
import { ContentProvider } from '@/content/ContentProvider';
import type { PublishedContent, PublishedContentRepository } from '@/content/domain';
import { parseSupabaseConfiguration } from '@/content/env';
import committedSnapshot from '@/content/generated/cms-snapshot.json';
import { parsePublishedContentRows } from '@/content/parsers';
import { HolisticPage } from './HolisticPage';

vi.hoisted(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: true, media: query, onchange: null,
      addListener: () => undefined, removeListener: () => undefined,
      addEventListener: () => undefined, removeEventListener: () => undefined,
      dispatchEvent: () => true,
    }),
  });
});

vi.mock('@/motion/Reveal', () => ({
  Reveal: ({ children, className }: { readonly children: ReactNode; readonly className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));
vi.mock('@/motion/SplitLines', () => ({
  SplitLines: ({ children, className }: { readonly children: ReactNode; readonly className?: string }) => (
    <h2 className={className}>{children}</h2>
  ),
}));
vi.mock('@/motion/Counter', () => ({ Counter: ({ to }: { readonly to: number }) => <>{to}</> }));
vi.mock('@/motion/HorizontalScroll', () => ({
  HorizontalScroll: ({ children, head }: { readonly children: ReactNode; readonly head?: ReactNode }) => (
    <div>{head}{children}</div>
  ),
}));
vi.mock('@/motion/Parallax', () => ({ Parallax: ({ children }: { readonly children: ReactNode }) => <>{children}</> }));

const CONFIGURED = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
});
const SNAPSHOT = parsePublishedContentRows(committedSnapshot);
const MUTATION = 'CMS 獨立更新';
type MigratedKind = 'holistic' | 'holistic_research' | 'people' | 'centers' | 'news' | 'activities';

function requiredDocument<K extends MigratedKind>(kind: K): PublishedContent {
  const document = SNAPSHOT.find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return document;
}

function mutateDocument(kind: MigratedKind): PublishedContent {
  switch (kind) {
    case 'holistic': {
      const document = requiredDocument(kind);
      if (document.kind !== kind) throw new TypeError('Invalid holistic fixture');
      const first = document.payload.zh.features[0];
      if (first === undefined) throw new TypeError('Missing holistic feature fixture');
      return { ...document, version: 2, payload: {
        ...document.payload,
        zh: { ...document.payload.zh, features: [{ ...first, title: MUTATION }, ...document.payload.zh.features.slice(1)] },
      } };
    }
    case 'holistic_research': {
      const document = requiredDocument(kind);
      if (document.kind !== kind) throw new TypeError('Invalid research fixture');
      const first = document.payload.zh.byYear[0];
      if (first === undefined) throw new TypeError('Missing research year fixture');
      return { ...document, version: 2, payload: {
        ...document.payload,
        zh: { ...document.payload.zh, byYear: [{ ...first, edu: Number(first.edu) + 1 }, ...document.payload.zh.byYear.slice(1)] },
      } };
    }
    case 'people': {
      const document = requiredDocument(kind);
      if (document.kind !== kind) throw new TypeError('Invalid people fixture');
      return { ...document, version: 2, payload: { ...document.payload, zh: {
        ...document.payload.zh,
        centerPeople: document.payload.zh.centerPeople.map((group) => group.centerId === 'holistic'
          ? { ...group, people: group.people.map((person, index) => index === 0 ? { ...person, role: MUTATION } : person) }
          : group),
      } } };
    }
    case 'centers': {
      const document = requiredDocument(kind);
      if (document.kind !== kind) throw new TypeError('Invalid centers fixture');
      return { ...document, version: 2, payload: { ...document.payload, zh: {
        centers: document.payload.zh.centers.map((center) => center.id === 'holistic'
          ? { ...center, name: MUTATION }
          : center),
      } } };
    }
    case 'news': {
      const document = requiredDocument(kind);
      if (document.kind !== kind) throw new TypeError('Invalid news fixture');
      const first = document.payload.zh.holistic[0];
      if (first === undefined) throw new TypeError('Missing news fixture');
      return { ...document, version: 2, payload: { ...document.payload, zh: {
        ...document.payload.zh,
        holistic: [{ ...first, title: MUTATION }, ...document.payload.zh.holistic.slice(1)],
      } } };
    }
    case 'activities': {
      const document = requiredDocument(kind);
      if (document.kind !== kind) throw new TypeError('Invalid activities fixture');
      const first = document.payload.zh.holistic[0];
      if (first === undefined) throw new TypeError('Missing activity fixture');
      return { ...document, version: 2, payload: { ...document.payload, zh: {
        ...document.payload.zh,
        holistic: [{ ...first, title: MUTATION }, ...document.payload.zh.holistic.slice(1)],
      } } };
    }
  }
}

async function renderRemote(remoteRepository: PublishedContentRepository) {
  const view = render(
    <MemoryRouter><SiteProvider><ContentProvider remoteRepository={remoteRepository} configuration={CONFIGURED}>
      <HolisticPage />
    </ContentProvider></SiteProvider></MemoryRouter>,
  );
  await act(async () => {
    await Promise.resolve();
  });
  return view;
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('HolisticPage CMS documents', () => {
  it('settles an immediately available remote update before the render helper returns', async () => {
    // Given
    const document = mutateDocument('holistic');
    const repository: PublishedContentRepository = {
      listPublished: () => Promise.resolve({ content: [document], failures: [] }),
    };

    // When
    const view = await renderRemote(repository);

    // Then
    expect(view.getByText(MUTATION)).toBeTruthy();
  });

  it.each([
    ['holistic', '全院全人相關研究'],
    ['holistic_research', '種子教師培育'],
    ['people', '停下來，是最負責任的事'],
    ['centers', '廖若帆'],
    ['news', '停下來，是最負責任的事'],
    ['activities', '歐洲虛擬醫院跨域交流'],
  ] as const)('renders an independent %s update while sibling documents use snapshots', async (kind, fallbackText) => {
    // Given
    const document = mutateDocument(kind);
    const repository: PublishedContentRepository = {
      listPublished: () => Promise.resolve({ content: [document], failures: [] }),
    };

    // When
    const view = await renderRemote(repository);

    // Then
    if (kind === 'holistic_research') {
      expect(view.getAllByText('95').length).toBeGreaterThan(0);
    } else if (kind === 'centers') {
      expect(window.document.title.startsWith(MUTATION)).toBe(true);
    } else {
      expect(view.getByText(MUTATION)).toBeTruthy();
    }
    expect(view.getAllByText(fallbackText).length).toBeGreaterThan(0);
  });

  it('keeps the committed snapshot visible when the remote request fails', async () => {
    // Given
    const repository: PublishedContentRepository = {
      listPublished: () => Promise.reject(new TypeError('offline')),
    };

    // When
    const view = await renderRemote(repository);

    // Then
    expect(view.getByText('種子教師培育')).toBeTruthy();
    expect(view.getByText('歐洲虛擬醫院跨域交流')).toBeTruthy();
    expect(view.getByText('停下來，是最負責任的事')).toBeTruthy();
  });
});
