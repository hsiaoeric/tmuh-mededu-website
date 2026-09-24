// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adaptPublishedContent, type PublicAdapterResult } from './adapters';
import { ContentProvider } from './ContentProvider';
import { CMS_PAYLOAD_REGISTRY } from './contracts/registry';
import type {
  ContentSnapshotRepository,
  PublishedContentBatch,
  PublishedContentRepository,
} from './domain';
import { parseSupabaseConfiguration } from './env';
import { PublicContentInvariantError } from './errors';
import committedSnapshot from './generated/cms-snapshot.json';
import { parsePublishedContentBatch } from './parsers';
import { committedSnapshotRepository } from './snapshotRepository';
import { usePublicContentDocument } from './usePublicContentDocument';
import type { Lang } from '@/i18n';

const DISABLED = parseSupabaseConfiguration({});
const CONFIGURED = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: 'https://media.example.supabase.co/',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
});
const PUBLIC_PORTRAIT = {
  kind: 'public',
  bucket: 'public-media',
  path: `${'a'.repeat(64)}/${'a'.repeat(64)}.webp`,
} as const;

function AllDocumentsProbe({ lang, values }: {
  readonly lang: Lang;
  readonly values: (readonly PublicAdapterResult[])[];
}) {
  values.push([
    usePublicContentDocument('site_copy', 'global', lang),
    usePublicContentDocument('centers', 'directory', lang),
    usePublicContentDocument('people', 'directory', lang),
    usePublicContentDocument('news', 'announcements', lang),
    usePublicContentDocument('activities', 'calendar', lang),
    usePublicContentDocument('kpis', 'department', lang),
    usePublicContentDocument('honors', 'department', lang),
    usePublicContentDocument('digital_materials', 'page', lang),
    usePublicContentDocument('facdev', 'page', lang),
    usePublicContentDocument('ebm', 'page', lang),
    usePublicContentDocument('holistic', 'page', lang),
    usePublicContentDocument('holistic_research', 'registry', lang),
  ]);
  return null;
}

function NewsProbe() {
  usePublicContentDocument('news', 'announcements', 'zh');
  return null;
}

function CentersProbe() {
  usePublicContentDocument('centers', 'directory', 'zh');
  return null;
}

function PeopleMediaProbe({ values }: { readonly values: string[] }) {
  const people = usePublicContentDocument('people', 'directory', 'zh');
  values.push(people.value.centerPeople[0]?.people[0]?.photoSrc ?? 'missing');
  return null;
}

function invariantFailure(children: ReactNode, snapshotRepository: ContentSnapshotRepository) {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    render(
      <ContentProvider snapshotRepository={snapshotRepository} configuration={DISABLED}>
        {children}
      </ContentProvider>,
    );
  } catch (error: unknown) {
    if (error instanceof PublicContentInvariantError) return error;
    throw error;
  }
  throw new TypeError('Expected public content invariant failure');
}

function publicPeopleBatch(): PublishedContentBatch {
  const row = committedSnapshot.find((candidate) => candidate.kind === 'people');
  if (row === undefined) throw new TypeError('Missing committed people fixture');
  const document = parsePublishedContentBatch([row]).content[0];
  if (document === undefined || document.kind !== 'people') {
    throw new TypeError('Invalid committed people fixture');
  }
  const replacePortrait = (locale: typeof document.payload.zh) => {
    const group = locale.centerPeople[0];
    const person = group?.people[0];
    if (group === undefined || person === undefined) throw new TypeError('Missing portrait fixture');
    return {
      ...locale,
      centerPeople: [
        { ...group, people: [{ ...person, portrait: PUBLIC_PORTRAIT }, ...group.people.slice(1)] },
        ...locale.centerPeople.slice(1),
      ],
    };
  };
  const payload = CMS_PAYLOAD_REGISTRY.people.publishedSchema.parse({
    zh: replacePortrait(document.payload.zh),
    en: replacePortrait(document.payload.en),
  });
  return {
    content: [{ ...document, version: document.version + 1, payload }],
    failures: [],
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('usePublicContentDocument', () => {
  it.each(['zh', 'en'] as const)('adapts every committed document in %s', (lang) => {
    // Given
    const values: (readonly PublicAdapterResult[])[] = [];

    // When
    render(
      <ContentProvider configuration={DISABLED}>
        <AllDocumentsProbe lang={lang} values={values} />
      </ContentProvider>,
    );

    // Then
    const current = values[values.length - 1];
    expect(current).toEqual(committedSnapshotRepository.listPublished().map((document) =>
      adaptPublishedContent(document, lang, {
        baseUrl: import.meta.env.BASE_URL,
        supabaseUrl: '',
      })));
  });

  it('throws one typed failure when a required document is missing', () => {
    // Given / When
    const failure = invariantFailure(<NewsProbe />, { listPublished: () => [] });

    // Then
    expect(failure.details).toEqual({
      reason: 'missing',
      expected: { kind: 'news', stableKey: 'announcements' },
    });
  });

  it('throws the same typed failure when a stable key resolves to another kind', () => {
    // Given
    const people = committedSnapshotRepository.listPublished().filter((document) => document.kind === 'people');

    // When
    const failure = invariantFailure(<CentersProbe />, { listPublished: () => people });

    // Then
    expect(failure.details).toEqual({
      reason: 'mismatched',
      expected: { kind: 'centers', stableKey: 'directory' },
      actual: { kind: 'people', stableKey: 'directory' },
    });
  });

  it('uses Vite local base paths and the configured public media project URL after replacement', async () => {
    // Given
    const values: string[] = [];
    const initialRepository: PublishedContentRepository = {
      listPublished: () => Promise.resolve({ content: [], failures: [] }),
    };
    const refreshedRepository: PublishedContentRepository = {
      listPublished: () => Promise.resolve(publicPeopleBatch()),
    };
    const tree = (remoteRepository: PublishedContentRepository) => (
      <ContentProvider remoteRepository={remoteRepository} configuration={CONFIGURED}>
        <PeopleMediaProbe values={values} />
      </ContentProvider>
    );
    const view = render(tree(initialRepository));
    expect(values[values.length - 1]).toBe(`${import.meta.env.BASE_URL}assets/ming-de-chen.jpg`);

    // When
    view.rerender(tree(refreshedRepository));

    // Then
    await waitFor(() => expect(values[values.length - 1]).toBe(
      `https://media.example.supabase.co/storage/v1/object/public/public-media/${PUBLIC_PORTRAIT.path}`,
    ));
  });

  it('exposes no public portrait URL when the Supabase project is disabled', () => {
    // Given
    const values: string[] = [];
    const snapshotRepository: ContentSnapshotRepository = {
      listPublished: () => publicPeopleBatch().content,
    };

    // When
    render(
      <ContentProvider snapshotRepository={snapshotRepository} configuration={DISABLED}>
        <PeopleMediaProbe values={values} />
      </ContentProvider>,
    );

    // Then
    expect(values[values.length - 1]).toBe('');
  });
});
