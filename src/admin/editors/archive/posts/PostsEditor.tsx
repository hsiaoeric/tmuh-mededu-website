import { useCallback, useMemo, useState } from 'react';
import { AdminButton } from '@/admin/AdminButton';
import { AdminField, AdminSelect } from '@/admin/AdminFields';
import { AdminToolbar } from '@/admin/AdminShell';
import { fieldIdForStructuredEditorIssuePath, isStructuredEditorCommitAccepted } from '@/admin/editors/shared';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { useFieldDecorations } from '@/admin/fieldDecorations';
import { POST_CHANNELS } from '@/content/contracts/archiveIds';
import type { ArchiveEditorProps, EditablePostsPayload, JsonPath } from '../archiveTypes';
import { ArchiveRecordList, type ArchiveRecordBadge, type ArchiveRecordRow } from '../ArchiveRecordList';
import { ArchiveValidation } from '../ArchiveValidation';
import { channelLabel, NOUNS, ownerLabel } from '../copy';
import { issuesWithin, useIsZh } from '../fields';
import { localToday } from '../ids';
import { useIdLock } from '../lockedIds';
import { removeAt } from '../blocks/blockModel';
import { CategoriesEditor } from './CategoriesEditor';
import { PostFields } from './PostFields';
import {
  ALL,
  categoryLabel,
  createPost,
  filteredPostIndexes,
  NO_FILTERS,
  postYears,
  replacePost,
  sortedCategories,
  type PostFilters,
} from './postsModel';

export type PostsEditorProps = ArchiveEditorProps<EditablePostsPayload>;

/**
 * The posts archive: every announcement, honor-board entry, and center article in one document.
 * Posts list as one-line rows (date · category · title) that open one at a time, so a large
 * archive types as quickly as a short one.
 */
export function PostsEditor({ payload, issues, onChange, lockedIds, today }: PostsEditorProps) {
  const isZh = useIsZh();
  const decorations = useFieldDecorations();
  const [filters, setFilters] = useState<PostFilters>(NO_FILTERS);
  const [expanded, setExpanded] = useState<number | null>(null);
  const lock = useIdLock('posts', lockedIds);
  const years = useMemo(() => postYears(payload.posts), [payload.posts]);
  const indexes = useMemo(() => filteredPostIndexes(payload.posts, filters), [payload.posts, filters]);
  const filterCategories = sortedCategories(payload.categories, filters.channel === ALL ? undefined : filters.channel);

  const rows = useMemo<readonly ArchiveRecordRow[]>(() => indexes.flatMap((index) => {
    const post = payload.posts[index];
    if (post === undefined) return [];
    const english = post.title.en;
    const badges: ArchiveRecordBadge[] = [];
    if (post.pinned) badges.push({ label: isZh ? '置頂' : 'Pinned', status: 'info' });
    if (english === undefined && post.title.zh !== '') badges.push({ label: isZh ? '僅中文' : 'Chinese only', status: 'disabled' });
    if (lockedIds !== undefined && !lock.isLocked(post.id)) badges.push({ label: isZh ? '新文章' : 'New', status: 'success' });
    return [{
      index,
      title: isZh || english === undefined ? post.title.zh : english,
      titleLang: isZh || english === undefined ? 'zh-Hant' : 'en',
      meta: [
        post.publishedOn,
        categoryLabel(payload.categories, post.categoryId, isZh),
        ...(post.owner === 'department' ? [] : [ownerLabel(post.owner, isZh)]),
      ],
      badges,
      changed: decorations?.isChanged?.(fieldIdForStructuredEditorIssuePath(['posts', index])) === true,
      issueCount: issuesWithin(['posts', index], issues).length,
    }];
  }), [decorations, indexes, isZh, issues, lock, lockedIds, payload.categories, payload.posts]);

  const setFilter = (key: keyof PostFilters, value: string) => setFilters((current) => ({
    ...current,
    [key]: value,
    // A category belongs to one channel, so switching channel clears a category from another.
    ...(key === 'channel' ? { categoryId: ALL } : {}),
  }));

  const openPath = useCallback((path: JsonPath) => {
    if (path[0] !== 'posts' || typeof path[1] !== 'number') return;
    setFilters(NO_FILTERS);
    setExpanded(path[1]);
  }, []);

  const addPost = () => {
    const post = createPost(payload, {
      today: today ?? localToday(),
      channel: filters.channel === ALL ? undefined : filters.channel,
      categoryId: filters.categoryId === ALL ? undefined : filters.categoryId,
    });
    const index = payload.posts.length;
    if (!isStructuredEditorCommitAccepted(onChange({ ...payload, posts: [...payload.posts, post] }))) return null;
    lock.markCreated(post.id);
    setFilters({ ...NO_FILTERS, channel: filters.channel, categoryId: filters.categoryId === ALL ? ALL : post.categoryId });
    return index;
  };

  const postIssues = issues.filter((summary) => summary.issue.path[0] === 'posts' || summary.issue.path.length === 0);
  const filtered = indexes.length !== payload.posts.length;

  return (
    <div className="admin-stack" data-archive-editor="posts">
      <EditorSection
        id="posts-editor"
        title={isZh ? '公告與文章' : 'Posts'}
        description={isZh
          ? '公告、榮譽榜與各中心文章。點選一列展開編輯；英文為選填，未翻譯時網站顯示中文。'
          : 'Announcements, honor-board entries, and center articles. Open a row to edit it; English is optional and the site shows the Chinese until it is translated.'}
      >
        <ArchiveValidation issues={postIssues} openPath={openPath} />
        <ArchiveRecordList
          id="posts-list"
          title={isZh ? '文章清單' : 'All posts'}
          rows={rows}
          totalCount={payload.posts.length}
          expanded={expanded}
          onExpandedChange={setExpanded}
          itemNoun={isZh ? NOUNS.post.zh : NOUNS.post.en}
          emptyTitle={isZh ? '尚無文章' : 'No posts yet'}
          emptyDescription={isZh ? '新增第一篇文章。' : 'Add the first post.'}
          addLabel={isZh ? '新增文章' : 'Add post'}
          onAdd={addPost}
          toolbar={(
            <AdminToolbar label={isZh ? '篩選文章' : 'Filter posts'}>
              <AdminField
                className="admin-toolbar-search"
                type="search"
                label={isZh ? '搜尋標題、摘要或識別碼' : 'Search titles, summaries, or ids'}
                value={filters.query}
                onChange={(event) => setFilter('query', event.currentTarget.value)}
              />
              <AdminSelect
                label={isZh ? '頻道' : 'Channel'}
                value={filters.channel}
                options={[{ value: ALL, label: isZh ? '全部頻道' : 'All channels' }, ...POST_CHANNELS.map((channel) => ({ value: channel, label: channelLabel(channel, isZh) }))]}
                onChange={(event) => setFilter('channel', event.currentTarget.value)}
              />
              <AdminSelect
                label={isZh ? '分類' : 'Category'}
                value={filters.categoryId}
                options={[{ value: ALL, label: isZh ? '全部分類' : 'All categories' }, ...filterCategories.map((category) => ({ value: category.id, label: categoryLabel(payload.categories, category.id, isZh) }))]}
                onChange={(event) => setFilter('categoryId', event.currentTarget.value)}
              />
              <AdminSelect
                label={isZh ? '年份' : 'Year'}
                value={filters.year}
                options={[{ value: ALL, label: isZh ? '全部年份' : 'All years' }, ...years.map((year) => ({ value: year, label: year }))]}
                onChange={(event) => setFilter('year', event.currentTarget.value)}
              />
              {filtered ? <AdminButton variant="quiet" onClick={() => setFilters(NO_FILTERS)}>{isZh ? '清除篩選' : 'Clear filters'}</AdminButton> : null}
            </AdminToolbar>
          )}
          removal={{
            title: (row) => (isZh ? `刪除「${row.title || '未命名文章'}」？` : `Delete “${row.title || 'Untitled post'}”?`),
            description: (row) => {
              const post = payload.posts[row.index];
              const legacy = post !== undefined && lock.isLocked(post.id);
              return legacy
                ? (isZh ? '這篇文章已發布或有舊網站連結轉址到它；刪除並發布後，這些連結會顯示找不到頁面。' : 'This post is published or a legacy link redirects to it; once deleted and published, those links show “not found”.')
                : (isZh ? '這篇文章尚未發布，刪除後不會影響網站。' : 'This post is not published yet, so deleting it does not affect the site.');
            },
            onRemove: (index) => onChange({ ...payload, posts: removeAt(payload.posts, index) }),
          }}
          renderItem={(index) => {
            const post = payload.posts[index];
            if (post === undefined) return null;
            return (
              <PostFields
                index={index}
                post={post}
                categories={payload.categories}
                otherIds={payload.posts.flatMap((candidate, position) => (position === index ? [] : [candidate.id]))}
                idLocked={lock.isLocked(post.id)}
                issues={issues}
                onChange={(next) => {
                  if (next.id !== post.id && !lock.isLocked(post.id)) lock.markCreated(next.id);
                  return onChange(replacePost(payload, index, next));
                }}
              />
            );
          }}
        />
      </EditorSection>
      <CategoriesEditor payload={payload} issues={issues} onChange={onChange} />
    </div>
  );
}
