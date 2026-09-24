// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteProvider } from '@/app/site';
import { ContentProvider } from '@/content/ContentProvider';
import type { ContentSnapshotRepository, PublishedContent } from '@/content/domain';
import { parseSupabaseConfiguration } from '@/content/env';
import committedSnapshot from '@/content/generated/cms-snapshot.json';
import { parsePublishedContentRows } from '@/content/parsers';
import { departmentMemberKey, Glance } from './Glance';

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

const DISABLED = parseSupabaseConfiguration({});

function renamedSnapshot(): readonly PublishedContent[] {
  return parsePublishedContentRows(committedSnapshot).map((document) => {
    if (document.kind !== 'kpis' || document.stableKey !== 'department') return document;
    return {
      ...document,
      payload: {
        zh: {
          items: document.payload.zh.items.map((item) => item.id === 'teaching_attendings'
            ? { ...item, en: 'Renamed attending caption' }
            : item),
        },
        en: {
          items: document.payload.en.items.map((item) => item.id === 'teaching_attendings'
            ? { ...item, en: 'Renamed attending caption' }
            : item),
        },
      },
    };
  });
}

function renderGlance() {
  const snapshotRepository: ContentSnapshotRepository = { listPublished: renamedSnapshot };
  return render(
    <SiteProvider>
      <ContentProvider snapshotRepository={snapshotRepository} configuration={DISABLED}>
        <Glance />
      </ContentProvider>
    </SiteProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('Glance', () => {
  it('opens the matching member panel when its display caption changes', async () => {
    // Given
    const user = userEvent.setup();
    const view = renderGlance();

    // When
    await user.click(view.getByRole('button', { name: /Renamed attending caption/u }));

    // Then
    expect(view.getByText('教學型主治成員')).toBeTruthy();
    expect(view.getByText('邱欣怡')).toBeTruthy();
    expect(view.queryByText('王莉萱')).toBeNull();
  });

  it('renders identical advisor placeholders without duplicate React keys', async () => {
    // Given
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const view = renderGlance();

    // When
    await user.click(view.getByRole('button', { name: /Department Advisors/u }));

    // Then
    expect(view.getAllByText('待更新')).toHaveLength(3);
    expect(consoleError.mock.calls.flat().join(' ')).not.toContain('same key');
  });

  it('keeps unique semantic identities stable across reorder and disambiguates duplicates by occurrence', () => {
    // Given
    const people = parsePublishedContentRows(committedSnapshot).find((document) => document.kind === 'people');
    if (people === undefined) throw new TypeError('Missing people identity fixture');
    const advisor = people.payload.zh.memberGroups[0]?.people[0];
    const attending = people.payload.zh.memberGroups[1]?.people[0];
    if (advisor === undefined || attending === undefined) throw new TypeError('Missing Glance identity fixtures');

    // When
    const advisorFirst = departmentMemberKey(advisor, 0);
    const advisorSecond = departmentMemberKey(advisor, 1);
    const attendingBefore = departmentMemberKey(attending, 0);
    const attendingAfter = departmentMemberKey(attending, 0);

    // Then
    expect(advisorFirst).not.toBe(advisorSecond);
    expect(attendingBefore).toBe(attendingAfter);
  });
});
