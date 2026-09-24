// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteProvider } from '@/app/site';
import { ContentProvider } from '@/content/ContentProvider';
import type { PublishedContent, PublishedContentRepository } from '@/content/domain';
import { parseSupabaseConfiguration } from '@/content/env';
import committedSnapshot from '@/content/generated/cms-snapshot.json';
import { parsePublishedContentRows } from '@/content/parsers';
import { HolisticDetail } from './Detail';

vi.mock('@/motion/Reveal', () => ({
  Reveal: ({ children, className }: { readonly children: ReactNode; readonly className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/motion/SplitLines', () => ({
  SplitLines: ({ children, className }: { readonly children: ReactNode; readonly className?: string }) => (
    <h1 className={className}>{children}</h1>
  ),
}));

const CONFIGURED = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
});
const SNAPSHOT = parsePublishedContentRows(committedSnapshot);
const MUTATION = 'CMS 詳情更新';

function requiredDocument(kind: 'holistic' | 'holistic_research'): PublishedContent {
  const document = SNAPSHOT.find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return document;
}

function renderRemote(path: string, remoteDocument: PublishedContent) {
  const repository: PublishedContentRepository = {
    listPublished: () => Promise.resolve({ content: [remoteDocument], failures: [] }),
  };
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SiteProvider>
        <ContentProvider remoteRepository={repository} configuration={CONFIGURED}>
          <Routes>
            <Route path="/centers/holistic-care/:kind/:year" element={<HolisticDetail />} />
          </Routes>
        </ContentProvider>
      </SiteProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('HolisticDetail CMS documents', () => {
  it('renders a remote symposium update', async () => {
    // Given
    const document = requiredDocument('holistic');
    if (document.kind !== 'holistic') throw new TypeError('Invalid holistic fixture');
    const symposium = document.payload.zh.outcomes.symposiums[0];
    if (symposium === undefined) throw new TypeError('Missing symposium fixture');
    const remoteDocument: PublishedContent = {
      ...document,
      version: 2,
      payload: {
        ...document.payload,
        zh: {
          ...document.payload.zh,
          outcomes: {
            ...document.payload.zh.outcomes,
            symposiums: [{ ...symposium, title: MUTATION }, ...document.payload.zh.outcomes.symposiums.slice(1)],
          },
        },
      },
    };

    // When
    const view = renderRemote(`/centers/holistic-care/symposia/${symposium.year}`, remoteDocument);

    // Then
    await waitFor(() => expect(view.getByRole('heading', { level: 1 }).textContent).toBe(MUTATION));
  });

  it('renders a remote research paper update', async () => {
    // Given
    const document = requiredDocument('holistic_research');
    if (document.kind !== 'holistic_research') throw new TypeError('Invalid research fixture');
    const paper = document.payload.zh.papers[0];
    if (paper === undefined) throw new TypeError('Missing research paper fixture');
    const remoteDocument: PublishedContent = {
      ...document,
      version: 2,
      payload: {
        ...document.payload,
        zh: {
          ...document.payload.zh,
          papers: [{ ...paper, title: MUTATION }, ...document.payload.zh.papers.slice(1)],
        },
      },
    };

    // When
    const view = renderRemote(`/centers/holistic-care/research/${paper.year}`, remoteDocument);

    // Then
    await waitFor(() => expect(view.getByText(MUTATION)).toBeTruthy());
  });
});
