import { useMemo } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import {
  ANNOUNCEMENTS_PATH,
  HONORS_PATH,
  postPath,
} from '@/app/routes';
import { usePageTitle } from '@/app/site';
import { Reveal } from '@/motion/Reveal';
import { Icon } from '@/ui/Icon';
import {
  ChineseOnlyTag,
  ContentBlocks,
  ContentIcon,
  ContentLink,
  LocalizedText,
  fallbackLangProps,
  formatArchiveDate,
  ownerTone,
  useContentCopy,
} from '@/ui/content';
import { NotFound } from './NotFound';
import { useArchivePageCopy } from './archive/copy';
import { ownerPath, useOwnerLabels, usePostsArchive, type ArchivePost } from './archive/data';
import { BackLink, FramedImage, toneStyle } from './archive/parts';

/** Posts listed alongside this one: the same channel, and for center articles the same owner. */
function siblingsOf(post: ArchivePost, posts: readonly ArchivePost[]): ArchivePost[] {
  return posts.filter((candidate) => candidate.channel === post.channel
    && (post.channel !== 'center' || candidate.owner === post.owner));
}

function useBackLink(post: ArchivePost): { readonly to: string; readonly label: string } {
  const copy = useArchivePageCopy();
  const ownerLabel = useOwnerLabels();
  if (post.channel === 'honors') return { to: `${HONORS_PATH}#board`, label: copy.backToHonors };
  if (post.channel === 'center') {
    return { to: ownerPath(post.owner), label: copy.backToCenter(ownerLabel(post.owner)) };
  }
  return { to: ANNOUNCEMENTS_PATH, label: copy.backToAnnouncements };
}

function hasImage(post: ArchivePost): boolean {
  return post.body.blocks.some((block) => block.type === 'image');
}

/**
 * One archive post, shared by `/announcements/:postId`, `/honors/:postId`,
 * `/centers/:slug/articles/:postId`, and `/digital-materials/articles/:postId`. A post opened under
 * any path other than its canonical one is redirected there, keeping the query and hash.
 */
export function PostDetailPage() {
  const { postId } = useParams();
  const { pathname, search, hash } = useLocation();
  const archive = usePostsArchive();
  const post = archive.posts.find((candidate) => candidate.id === postId);

  if (post === undefined) return <NotFound />;
  const canonical = postPath(post);
  if (pathname !== canonical) return <Navigate replace to={`${canonical}${search}${hash}`} />;
  return <PostDetail key={post.id} post={post} posts={archive.posts} categories={archive.categories} />;
}

function PostDetail({
  post,
  posts,
  categories,
}: {
  readonly post: ArchivePost;
  readonly posts: readonly ArchivePost[];
  readonly categories: ReturnType<typeof usePostsArchive>['categories'];
}) {
  const copy = useArchivePageCopy();
  const contentCopy = useContentCopy();
  const back = useBackLink(post);
  const category = categories.find((candidate) => candidate.id === post.categoryId) ?? null;
  const tone = ownerTone(post.owner);
  const siblings = useMemo(() => siblingsOf(post, posts), [post, posts]);
  const index = siblings.findIndex((candidate) => candidate.id === post.id);
  const newer = index > 0 ? siblings[index - 1] : undefined;
  const older = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;
  const fallback = post.title.fallback || post.body.fallback;
  const showCover = post.coverUrl !== null && !hasImage(post);

  usePageTitle(post.title.text);

  return (
    <article className="archive-detail" style={toneStyle(tone)}>
      <header className="archive-intro">
        <div className="shell stack gap-3">
          <Reveal variant="fade">
            <BackLink to={back.to}>{back.label}</BackLink>
          </Reveal>
          <div className="post-meta">
            <time className="post-date mono" dateTime={post.publishedOn}>{formatArchiveDate(post.publishedOn)}</time>
            {category !== null && <LocalizedText className="tag" value={category.label} />}
            {post.pinned && (
              <span className="tag post-pinned">
                <Icon name="pin" size={11} />
                {contentCopy.pinned}
              </span>
            )}
          </div>
          <h1 className="display d3 news-measure archive-detail-title" {...fallbackLangProps(post.title)}>
            {post.title.text}
          </h1>
          <ChineseOnlyTag fallback={fallback} style={{ alignSelf: 'flex-start' }} />
          {post.summary !== null && <LocalizedText as="p" className="lede measure" value={post.summary} />}
        </div>
      </header>

      <div className="shell archive-detail-body">
        <div className="measure stack gap-4">
          {showCover && <FramedImage as="figure" className="content-figure archive-detail-cover" url={post.coverUrl} />}
          {post.body.blocks.length > 0 && (
            <ContentBlocks blocks={post.body.blocks} fallback={post.body.fallback} videoTitle={post.title.text} />
          )}

          {post.attachments.length > 0 && (
            <section className="panel sunk stack gap-2" aria-labelledby="post-attachments">
              <h2 id="post-attachments" className="eyebrow">{copy.attachments}</h2>
              <ul className="archive-download-list">
                {post.attachments.map((attachment) => (
                  <li key={attachment.id} className="archive-download">
                    <ContentLink className="archive-link" href={attachment.href} kind={attachment.kind}>
                      <ContentIcon name="file" size={15} />
                      <LocalizedText value={attachment.label} />
                    </ContentLink>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(newer !== undefined || older !== undefined) && (
            <nav className="archive-post-steps" aria-label={copy.postNavigation}>
              {newer !== undefined ? (
                <Link className="archive-post-step" to={postPath(newer)} rel="prev">
                  <span className="eyebrow">
                    <ContentIcon name="chevronLeft" size={14} />
                    {copy.newerPost}
                  </span>
                  <LocalizedText className="archive-post-step-title" value={newer.title} />
                </Link>
              ) : <span />}
              {older !== undefined && (
                <Link className="archive-post-step archive-post-step-next" to={postPath(older)} rel="next">
                  <span className="eyebrow">
                    {copy.olderPost}
                    <ContentIcon name="chevronRight" size={14} />
                  </span>
                  <LocalizedText className="archive-post-step-title" value={older.title} />
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </article>
  );
}
