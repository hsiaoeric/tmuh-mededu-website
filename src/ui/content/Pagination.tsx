import { Link, useSearchParams } from 'react-router-dom';
import { scrollToId } from '@/motion/smoothScroll';
import { ARCHIVE_PARAMS, readArchiveParams } from './archiveParams';
import { useContentCopy } from './copy';
import { ContentIcon } from './icons';

interface PaginationProps {
  readonly pageCount: number;
  /** Accessible name of the navigation landmark; defaults to "Pagination". */
  readonly label?: string;
  /** Element id to bring into view after changing page, usually the list's heading. */
  readonly scrollTargetId?: string;
}

type Slot = number | 'gap-start' | 'gap-end';

/** First, last, and the current page's neighbours, with gaps in between. */
export function paginationSlots(page: number, pageCount: number): Slot[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const start = Math.max(2, Math.min(page - 1, pageCount - 4));
  const end = Math.min(pageCount - 1, Math.max(page + 1, 5));
  const slots: Slot[] = [1];
  if (start > 2) slots.push('gap-start');
  for (let n = start; n <= end; n += 1) slots.push(n);
  if (end < pageCount - 1) slots.push('gap-end');
  slots.push(pageCount);
  return slots;
}

/**
 * Page links held in the URL (`?page=`), keeping every other parameter. Page 1 drops the parameter
 * so the canonical first page has a clean URL. Renders nothing for a single page.
 */
export function Pagination({ pageCount, label, scrollTargetId }: PaginationProps) {
  const copy = useContentCopy();
  const [params] = useSearchParams();
  if (pageCount <= 1) return null;
  const page = Math.min(readArchiveParams(params).page, pageCount);

  const searchFor = (target: number) => {
    const next = new URLSearchParams(params);
    if (target <= 1) next.delete(ARCHIVE_PARAMS.page);
    else next.set(ARCHIVE_PARAMS.page, String(target));
    const search = next.toString();
    return search === '' ? '' : `?${search}`;
  };
  const onNavigate = () => {
    if (scrollTargetId !== undefined) scrollToId(scrollTargetId);
  };

  return (
    <nav className="pagination" aria-label={label ?? copy.pagination}>
      {page > 1 ? (
        <Link className="pagination-step" to={{ search: searchFor(page - 1) }} preventScrollReset onClick={onNavigate}>
          <ContentIcon name="chevronLeft" size={16} />
          <span>{copy.previousPage}</span>
        </Link>
      ) : (
        <span className="pagination-step" aria-hidden="true" data-disabled="true">
          <ContentIcon name="chevronLeft" size={16} />
          <span>{copy.previousPage}</span>
        </span>
      )}

      <ol className="pagination-pages">
        {paginationSlots(page, pageCount).map((slot) => (
          typeof slot === 'number' ? (
            <li key={slot}>
              <Link
                className="pagination-page mono"
                to={{ search: searchFor(slot) }}
                aria-current={slot === page ? 'page' : undefined}
                aria-label={copy.pageNumber(slot)}
                preventScrollReset
                onClick={onNavigate}
              >
                {slot}
              </Link>
            </li>
          ) : (
            <li key={slot} className="pagination-gap" aria-hidden="true">…</li>
          )
        ))}
      </ol>

      {page < pageCount ? (
        <Link className="pagination-step" to={{ search: searchFor(page + 1) }} preventScrollReset onClick={onNavigate}>
          <span>{copy.nextPage}</span>
          <ContentIcon name="chevronRight" size={16} />
        </Link>
      ) : (
        <span className="pagination-step" aria-hidden="true" data-disabled="true">
          <span>{copy.nextPage}</span>
          <ContentIcon name="chevronRight" size={16} />
        </span>
      )}
    </nav>
  );
}
