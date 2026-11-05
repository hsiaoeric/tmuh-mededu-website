import {
  CENTER_OWNER_IDS,
  POST_CATEGORY_CHANNELS,
  PROGRAM_IDS,
  type PostCategoryId,
} from '@/content/contracts/archiveIds';
import type { EditablePost, EditablePostCategory, EditablePostsPayload } from '../archiveTypes';
import { newPostId } from '../ids';
import { withOptional } from '../localizedValue';
import { replaceAt } from '../blocks/blockModel';

export type PostFilters = {
  readonly query: string;
  readonly channel: string;
  readonly categoryId: string;
  readonly year: string;
};

export const ALL = 'all';
export const NO_FILTERS: PostFilters = { query: '', channel: ALL, categoryId: ALL, year: ALL };

export function sortedCategories(categories: readonly EditablePostCategory[], channel?: string): readonly EditablePostCategory[] {
  return [...categories]
    .filter((category) => channel === undefined || category.channel === channel)
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
}

function canonicalChannel(categoryId: string): string | undefined {
  return (POST_CATEGORY_CHANNELS as Readonly<Record<string, string>>)[categoryId];
}

/** Years that have posts, newest first, for the year filter. */
export function postYears(posts: readonly EditablePost[]): readonly string[] {
  return [...new Set(posts.map((post) => post.publishedOn.slice(0, 4)).filter((year) => /^\d{4}$/u.test(year)))].sort().reverse();
}

function searchable(post: EditablePost): string {
  return [post.id, post.title.zh, post.title.en ?? '', post.summary?.zh ?? '', post.summary?.en ?? ''].join('\n').toLocaleLowerCase();
}

export function matchesFilters(post: EditablePost, filters: PostFilters): boolean {
  if (filters.channel !== ALL && post.channel !== filters.channel) return false;
  if (filters.categoryId !== ALL && post.categoryId !== filters.categoryId) return false;
  if (filters.year !== ALL && !post.publishedOn.startsWith(filters.year)) return false;
  const needle = filters.query.trim().toLocaleLowerCase();
  return needle === '' || searchable(post).includes(needle);
}

const NUMERIC_ID = /^\d+$/u;

/** Newest first; posts on the same day keep a stable order by id (numeric ids numerically). */
export function comparePostsNewestFirst(left: EditablePost, right: EditablePost): number {
  if (left.publishedOn !== right.publishedOn) return left.publishedOn < right.publishedOn ? 1 : -1;
  if (NUMERIC_ID.test(left.id) && NUMERIC_ID.test(right.id)) return Number(right.id) - Number(left.id);
  return right.id.localeCompare(left.id);
}

/** Payload indexes of the posts that pass the filters, newest first. */
export function filteredPostIndexes(posts: readonly EditablePost[], filters: PostFilters): readonly number[] {
  return posts
    .map((post, index) => ({ post, index }))
    .filter(({ post }) => matchesFilters(post, filters))
    .sort((left, right) => comparePostsNewestFirst(left.post, right.post))
    .map(({ index }) => index);
}

/**
 * A new, empty post dated today. It goes at the end of the array, so adding one never shifts the
 * index paths of existing posts (and with them their changed-field markers).
 */
export function createPost(payload: EditablePostsPayload, options: { readonly today: string; readonly channel?: string; readonly categoryId?: string }): EditablePost {
  const channel = options.channel ?? (options.categoryId === undefined ? undefined : canonicalChannel(options.categoryId)) ?? 'news';
  const category = options.categoryId !== undefined && canonicalChannel(options.categoryId) === channel
    ? options.categoryId
    : sortedCategories(payload.categories, channel)[0]?.id ?? '';
  return {
    id: newPostId(options.today, payload.posts.map((post) => post.id)),
    channel,
    categoryId: category,
    owner: channel === 'center' ? CENTER_OWNER_IDS[0] : 'department',
    publishedOn: options.today,
    pinned: false,
    title: { zh: '' },
    body: { zh: [] },
    attachments: [],
  };
}

/**
 * Moving a post to another channel keeps it valid: it takes that channel's first category, and a
 * center article cannot belong to the department.
 */
export function changePostChannel(post: EditablePost, channel: string, categories: readonly EditablePostCategory[]): EditablePost {
  if (post.channel === channel) return post;
  const categoryId = canonicalChannel(post.categoryId) === channel ? post.categoryId : sortedCategories(categories, channel)[0]?.id ?? post.categoryId;
  const owner = channel === 'center' && post.owner === 'department' ? CENTER_OWNER_IDS[0] : post.owner;
  return { ...post, channel, categoryId, owner };
}

export function setPostAudience(post: EditablePost, program: string, included: boolean): EditablePost {
  const current = new Set(post.audiences ?? []);
  if (included) current.add(program);
  else current.delete(program);
  const ordered = [
    ...PROGRAM_IDS.filter((id) => current.has(id)),
    ...[...current].filter((id) => !PROGRAM_IDS.some((known) => known === id)),
  ];
  return withOptional(post, 'audiences', ordered.length === 0 ? undefined : ordered);
}

export function replacePost(payload: EditablePostsPayload, index: number, post: EditablePost): EditablePostsPayload {
  return { ...payload, posts: replaceAt(payload.posts, index, post) };
}

export function categoryLabel(categories: readonly EditablePostCategory[], categoryId: string, isZh: boolean): string {
  const category = categories.find((candidate) => candidate.id === categoryId);
  if (category === undefined) return categoryId;
  return isZh ? category.label.zh || category.id : category.label.en ?? category.label.zh;
}

export type { PostCategoryId };
