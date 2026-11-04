import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { LocalizedPick } from '@/content/adapters/archive';
import { Icon } from '@/ui/Icon';
import { useContentCopy } from './copy';
import { ChineseOnlyTag, LocalizedText, fallbackLangProps } from './Localized';

/** The fields a post card or row reads; the `adaptPostsArchive` post items satisfy it. */
export interface ArchivePostItem {
  readonly id: string;
  /** ISO calendar date, `YYYY-MM-DD`. */
  readonly publishedOn: string;
  readonly pinned?: boolean;
  readonly title: LocalizedPick;
  readonly summary?: LocalizedPick | null;
  readonly coverUrl?: string | null;
}

type HeadingTag = 'h2' | 'h3' | 'h4';

interface PostItemProps {
  readonly post: ArchivePostItem;
  /** Site path of the post's detail page; rendered through the router. */
  readonly to: string;
  readonly category?: LocalizedPick | null;
  /** Owner colour (see `ownerTone`); defaults to the accent. */
  readonly tone?: string;
  readonly headingAs?: HeadingTag;
}

/** `2024-03-05` → `2024.03.05`, the old site's date style, in both languages. */
export function formatArchiveDate(isoDate: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? isoDate.replace(/-/g, '.') : isoDate;
}

function toneStyle(tone: string | undefined): CSSProperties | undefined {
  return tone === undefined ? undefined : { ['--tone' as string]: tone };
}

function PostMeta({ post, category }: { readonly post: ArchivePostItem; readonly category?: LocalizedPick | null }) {
  const copy = useContentCopy();
  return (
    <div className="post-meta">
      <time className="post-date mono" dateTime={post.publishedOn}>{formatArchiveDate(post.publishedOn)}</time>
      {category != null && <LocalizedText className="tag" value={category} />}
      {post.pinned === true && (
        <span className="tag post-pinned">
          <Icon name="pin" size={11} />
          {copy.pinned}
        </span>
      )}
    </div>
  );
}

function Cover({ url }: { readonly url: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => setFailed(null), [url]);
  if (failed === url) return null;
  return (
    <div className="post-card-cover">
      <img src={url} alt="" loading="lazy" decoding="async" onError={() => setFailed(url)} />
    </div>
  );
}

/**
 * A post as a card: optional cover, date and category, title, and summary. The whole card is one
 * link target, through a stretched title link, so it reads as a single link to assistive tech.
 */
export function PostCard({ post, to, category, tone, headingAs: Heading = 'h3' }: PostItemProps) {
  return (
    <article className="card card-hover post-card" style={toneStyle(tone)}>
      {post.coverUrl != null && post.coverUrl !== '' && <Cover url={post.coverUrl} />}
      <PostMeta post={post} category={category} />
      <Heading className="post-card-title" {...fallbackLangProps(post.title)}>
        <Link className="post-stretched-link" to={to}>{post.title.text}</Link>
      </Heading>
      <ChineseOnlyTag fallback={post.title.fallback} style={{ alignSelf: 'flex-start' }} />
      {post.summary != null && <LocalizedText as="p" className="post-summary tiny" value={post.summary} />}
    </article>
  );
}

/** A post as an editorial index row: date and category, then the title and summary. */
export function PostIndexRow({ post, to, category, tone, headingAs: Heading = 'h3' }: PostItemProps) {
  return (
    <article className="post-row" style={toneStyle(tone)}>
      <div className="post-row-body">
        <PostMeta post={post} category={category} />
        <div className="post-row-main">
          <Heading className="post-row-title news-measure" {...fallbackLangProps(post.title)}>
            <Link className="post-stretched-link" to={to}>{post.title.text}</Link>
          </Heading>
          <ChineseOnlyTag fallback={post.title.fallback} style={{ alignSelf: 'flex-start' }} />
          {post.summary != null && <LocalizedText as="p" className="post-summary tiny" value={post.summary} />}
        </div>
      </div>
      <span className="post-row-go" aria-hidden="true">
        <Icon name="arrow" />
      </span>
    </article>
  );
}
