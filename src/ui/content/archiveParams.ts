import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { LocalizedPick } from '@/content/adapters/archive';

/** The URL search parameters an archive listing reads: `?category=&year=&q=&page=`. */
export const ARCHIVE_PARAMS = {
  category: 'category',
  year: 'year',
  query: 'q',
  page: 'page',
} as const;

export interface ArchiveFilterState {
  readonly category: string | null;
  /** Four-digit year, or null for every year. */
  readonly year: string | null;
  readonly query: string;
  /** 1-based; anything unparsable reads as 1. */
  readonly page: number;
}

function nonEmpty(value: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

export function readArchiveParams(params: URLSearchParams): ArchiveFilterState {
  const year = nonEmpty(params.get(ARCHIVE_PARAMS.year));
  const page = Number.parseInt(params.get(ARCHIVE_PARAMS.page) ?? '', 10);
  return {
    category: nonEmpty(params.get(ARCHIVE_PARAMS.category)),
    year: year !== null && /^\d{4}$/.test(year) ? year : null,
    query: params.get(ARCHIVE_PARAMS.query) ?? '',
    page: Number.isFinite(page) && page >= 1 ? page : 1,
  };
}

/** The current archive filters, read from the URL. */
export function useArchiveParams(): ArchiveFilterState {
  const [params] = useSearchParams();
  return useMemo(() => readArchiveParams(params), [params]);
}

/** What `filterArchiveItems` reads from each item; adapted posts satisfy it. */
export interface FilterableArchiveItem {
  readonly categoryId?: string;
  readonly publishedOn?: string | null;
  readonly date?: string | null;
  readonly title: LocalizedPick;
  readonly summary?: LocalizedPick | null;
}

function normalize(text: string): string {
  return text.normalize('NFKC').toLocaleLowerCase();
}

/** Category, year, and every whitespace-separated query term (title or summary) must match. */
export function filterArchiveItems<T extends FilterableArchiveItem>(
  items: readonly T[],
  filters: Pick<ArchiveFilterState, 'category' | 'year' | 'query'>,
): T[] {
  const terms = normalize(filters.query).split(/\s+/).filter((term) => term.length > 0);
  return items.filter((item) => {
    if (filters.category !== null && item.categoryId !== filters.category) return false;
    const date = item.publishedOn ?? item.date ?? '';
    if (filters.year !== null && !date.startsWith(`${filters.year}-`)) return false;
    if (terms.length === 0) return true;
    const haystack = normalize(`${item.title.text}\n${item.summary?.text ?? ''}`);
    return terms.every((term) => haystack.includes(term));
  });
}

/** Distinct years present in the items, newest first, for the year filter. */
export function archiveYears(items: readonly { readonly publishedOn?: string | null; readonly date?: string | null }[]): string[] {
  const years = new Set<string>();
  for (const item of items) {
    const match = /^(\d{4})-/.exec(item.publishedOn ?? item.date ?? '');
    if (match !== null) years.add(match[1]);
  }
  return [...years].sort((left, right) => right.localeCompare(left));
}

export interface ArchivePage<T> {
  readonly items: T[];
  /** The page actually shown, clamped to `1..pageCount`. */
  readonly page: number;
  readonly pageCount: number;
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number): ArchivePage<T> {
  const size = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, Math.floor(page)), pageCount);
  return { items: items.slice((current - 1) * size, current * size), page: current, pageCount };
}
