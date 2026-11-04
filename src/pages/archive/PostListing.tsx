import { useMemo } from 'react';
import { postPath } from '@/app/routes';
import {
  ArchiveEmpty,
  ArchiveFilters,
  Pagination,
  PostCard,
  PostIndexRow,
  archiveYears,
  filterArchiveItems,
  ownerTone,
  paginate,
  useArchiveParams,
} from '@/ui/content';
import type { ArchiveCategory, ArchivePost } from './data';
import { pinnedFirst } from './data';

type HeadingTag = 'h2' | 'h3' | 'h4';

function useCategoryLabels(categories: readonly ArchiveCategory[]) {
  return useMemo(() => new Map(categories.map((category) => [category.id, category.label])), [categories]);
}

/** Posts as editorial index rows or cards, each linking to its canonical detail page. */
export function PostList({
  posts,
  categories,
  view = 'rows',
  headingAs = 'h3',
}: {
  readonly posts: readonly ArchivePost[];
  readonly categories: readonly ArchiveCategory[];
  readonly view?: 'rows' | 'cards';
  readonly headingAs?: HeadingTag;
}) {
  const labels = useCategoryLabels(categories);
  if (view === 'cards') {
    return (
      <ul className="archive-card-grid" role="list">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard
              post={post}
              to={postPath(post)}
              category={labels.get(post.categoryId) ?? null}
              tone={ownerTone(post.owner)}
              headingAs={headingAs}
            />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="archive-post-rows" role="list">
      {posts.map((post) => (
        <li key={post.id}>
          <PostIndexRow
            post={post}
            to={postPath(post)}
            category={labels.get(post.categoryId) ?? null}
            tone={ownerTone(post.owner)}
            headingAs={headingAs}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * A filterable, paginated post archive: category, year, and text filters in the URL, then one page
 * of results. Pinned posts lead. `listId` names the list heading that page changes scroll back to.
 */
export function PostListing({
  posts,
  categories,
  pageSize,
  view = 'rows',
  listId,
  label,
}: {
  readonly posts: readonly ArchivePost[];
  readonly categories: readonly ArchiveCategory[];
  readonly pageSize: number;
  readonly view?: 'rows' | 'cards';
  /** Id of the heading above the listing; pagination scrolls back to it. */
  readonly listId: string;
  /** Accessible name of the filter and pagination landmarks. */
  readonly label?: string;
}) {
  const params = useArchiveParams();
  const ordered = useMemo(() => pinnedFirst(posts), [posts]);
  const years = useMemo(() => archiveYears(posts), [posts]);
  // Filter by exactly what the controls show: a category or year the controls do not offer reads
  // as "all", as ArchiveFilters displays it.
  const filters = useMemo(() => ({
    ...params,
    category: categories.some((category) => category.id === params.category) ? params.category : null,
    year: params.year !== null && years.includes(params.year) ? params.year : null,
  }), [categories, params, years]);
  const filtered = useMemo(() => filterArchiveItems(ordered, filters), [filters, ordered]);
  const page = paginate(filtered, filters.page, pageSize);

  return (
    <div className="stack gap-4">
      <ArchiveFilters
        categories={categories}
        years={years}
        resultCount={filtered.length}
        label={label}
      />
      {filtered.length === 0 ? (
        <ArchiveEmpty />
      ) : (
        <PostList posts={page.items} categories={categories} view={view} />
      )}
      <Pagination pageCount={page.pageCount} scrollTargetId={listId} />
    </div>
  );
}
