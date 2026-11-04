import { useEffect, useId, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { LocalizedPick } from '@/content/adapters/archive';
import { Icon } from '@/ui/Icon';
import { ARCHIVE_PARAMS, readArchiveParams } from './archiveParams';
import { useContentCopy } from './copy';
import { LocalizedText } from './Localized';

export interface ArchiveFilterCategory {
  readonly id: string;
  readonly label: LocalizedPick;
}

interface ArchiveFiltersProps {
  /** Category choices; omit or pass an empty list to hide the category group. */
  readonly categories?: readonly ArchiveFilterCategory[];
  /** Year choices, newest first (see `archiveYears`); omit or pass an empty list to hide. */
  readonly years?: readonly string[];
  /** Show the text query field. Defaults to true. */
  readonly search?: boolean;
  /** Number of items after filtering, announced politely as filters change. */
  readonly resultCount?: number;
  /** Accessible name of the search landmark; defaults to "Filters". */
  readonly label?: string;
}

type ParamUpdate = Partial<Record<'category' | 'year' | 'query', string | null>>;

/**
 * Category, year, and text filters held in the URL (`?category=&year=&q=`), so a filtered view can
 * be bookmarked, shared, and restored with Back. Any change returns to the first page. Choosing a
 * category or year adds a history entry; typing replaces the current one.
 */
export function ArchiveFilters({ categories = [], years = [], search = true, resultCount, label }: ArchiveFiltersProps) {
  const copy = useContentCopy();
  const id = useId();
  const [params, setParams] = useSearchParams();
  const state = readArchiveParams(params);
  const [draft, setDraft] = useState(state.query);
  const inputRef = useRef<HTMLInputElement>(null);

  // Follow the URL when it changes from outside (Back, a link), but never while the visitor is
  // typing, when the URL is merely catching up with keystrokes already shown.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setDraft(state.query);
  }, [state.query]);

  const update = (changes: ParamUpdate, replace: boolean) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(changes) as [keyof ParamUpdate, string | null][]) {
        const name = ARCHIVE_PARAMS[key];
        if (value === null || value === '') next.delete(name);
        else next.set(name, value);
      }
      next.delete(ARCHIVE_PARAMS.page);
      return next;
    }, { replace, preventScrollReset: true });
  };

  const activeCategory = categories.some((category) => category.id === state.category) ? state.category : null;
  const activeYear = state.year !== null && years.includes(state.year) ? state.year : null;
  const filtered = activeCategory !== null || activeYear !== null || state.query.trim() !== '';

  return (
    <form
      className="archive-filters"
      role="search"
      aria-label={label ?? copy.filters}
      onSubmit={(event) => event.preventDefault()}
    >
      {categories.length > 0 && (
        <div className="archive-filter-group" role="group" aria-labelledby={`${id}-category`}>
          <span className="archive-filter-label" id={`${id}-category`}>{copy.category}</span>
          <div className="row gap-1 wrap">
            <button
              type="button"
              className="pill"
              aria-pressed={activeCategory === null}
              onClick={() => update({ category: null }, false)}
            >
              {copy.all}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="pill"
                aria-pressed={activeCategory === category.id}
                onClick={() => update({ category: category.id }, false)}
              >
                <LocalizedText value={category.label} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="archive-filter-fields">
        {years.length > 0 && (
          <div className="archive-field">
            <label className="archive-filter-label" htmlFor={`${id}-year`}>{copy.year}</label>
            <select
              id={`${id}-year`}
              className="archive-control"
              value={activeYear ?? ''}
              onChange={(event) => update({ year: event.target.value }, false)}
            >
              <option value="">{copy.allYears}</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        )}

        {search && (
          <div className="archive-field archive-field-grow">
            <label className="archive-filter-label" htmlFor={`${id}-query`}>{copy.search}</label>
            <span className="archive-search">
              <Icon name="search" size={16} className="archive-search-icon" />
              <input
                ref={inputRef}
                id={`${id}-query`}
                className="archive-control"
                type="search"
                value={draft}
                placeholder={copy.searchHint}
                autoComplete="off"
                onChange={(event) => {
                  setDraft(event.target.value);
                  update({ query: event.target.value }, true);
                }}
              />
            </span>
          </div>
        )}

        {filtered && (
          <button
            type="button"
            className="tlink archive-clear"
            onClick={() => {
              setDraft('');
              update({ category: null, year: null, query: null }, false);
            }}
          >
            <Icon name="close" />
            {copy.clearFilters}
          </button>
        )}
      </div>

      {resultCount !== undefined && (
        <p className="archive-count mono" role="status">
          {copy.results(resultCount)}
        </p>
      )}
    </form>
  );
}

/** The filtered-empty state for an archive list, with a way back to everything. */
export function ArchiveEmpty({ message }: { readonly message?: string }) {
  const copy = useContentCopy();
  const [, setParams] = useSearchParams();
  return (
    <div className="archive-empty">
      <p className="prose">{message ?? copy.noResults}</p>
      <button
        type="button"
        className="tlink"
        onClick={() => setParams((previous) => {
          const next = new URLSearchParams(previous);
          Object.values(ARCHIVE_PARAMS).forEach((name) => next.delete(name));
          return next;
        }, { preventScrollReset: true })}
      >
        {copy.clearFilters}
      </button>
    </div>
  );
}
