import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { albumPath } from '@/app/routes';
import type { AudienceOwner } from '@/content/contracts/archiveIds';
import { Reveal } from '@/motion/Reveal';
import { SplitLines } from '@/motion/SplitLines';
import { Icon } from '@/ui/Icon';
import {
  ARCHIVE_PARAMS,
  ChineseOnlyTag,
  ContentIcon,
  ContentLink,
  LocalizedText,
  VideoFacade,
  fallbackLangProps,
  formatArchiveDate,
  ownerTone,
} from '@/ui/content';
import { useArchivePageCopy } from './copy';
import type { ArchiveAlbum, ArchiveDownloadGroup, ArchiveLinkGroup, ArchiveVideo } from './data';

export function toneStyle(tone: string | undefined): CSSProperties | undefined {
  return tone === undefined ? undefined : { ['--tone' as string]: tone };
}

/** A quiet "back to …" link, as the center pages open with. */
export function BackLink({ to, children }: { readonly to: string; readonly children: ReactNode }) {
  return (
    <Link className="tlink" to={to} style={{ color: 'var(--muted)', alignSelf: 'flex-start' }}>
      <Icon name="arrow" style={{ transform: 'rotate(180deg)' }} />
      {children}
    </Link>
  );
}

interface PageIntroProps {
  readonly eyebrow: string;
  readonly title: string;
  /** `'zh-Hant'` when the title fell back to Chinese in the English UI. */
  readonly titleLang?: 'zh-Hant';
  readonly lede?: ReactNode;
  readonly back?: { readonly to: string; readonly label: string };
  readonly aside?: ReactNode;
  readonly tone?: string;
  /** Wider headline measure for long titles such as announcements. */
  readonly long?: boolean;
  readonly children?: ReactNode;
}

/** The opening block of an archive page: back link, eyebrow, the page's one `<h1>`, and a lede. */
export function PageIntro({ eyebrow, title, titleLang, lede, back, aside, tone, long = false, children }: PageIntroProps) {
  return (
    <header className="archive-intro" style={toneStyle(tone)}>
      <div className="shell stack gap-3">
        {back !== undefined && (
          <Reveal variant="fade">
            <BackLink to={back.to}>{back.label}</BackLink>
          </Reveal>
        )}
        <span className="eyebrow" style={tone === undefined ? undefined : { color: 'var(--tone-text, var(--tone))' }}>
          {eyebrow}
        </span>
        <div className="sec-head-row" lang={titleLang}>
          <SplitLines as="h1" className={`display ${long ? 'd3 news-measure' : 'd2 title-measure'}`} immediate>
            {title}
          </SplitLines>
          {aside}
        </div>
        {lede !== undefined && lede !== null && (
          <Reveal variant="up" delay={160}>
            {typeof lede === 'string' ? <p className="lede measure">{lede}</p> : lede}
          </Reveal>
        )}
        {children}
      </div>
    </header>
  );
}

/** An `<h2>` section heading for an archive page, with its eyebrow and an optional action. */
export function ArchiveSectionHead({
  id,
  eyebrow,
  title,
  desc,
  aside,
  titleLang,
}: {
  readonly id?: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly desc?: string;
  readonly aside?: ReactNode;
  /** `'zh-Hant'` when the title fell back to Chinese in the English UI. */
  readonly titleLang?: 'zh-Hant';
}) {
  return (
    <div className="sec-head archive-section-head">
      <span className="eyebrow">{eyebrow}</span>
      <div className="sec-head-row">
        <h2 id={id} className="display d3 title-measure" lang={titleLang}>
          {title}
        </h2>
        {aside}
      </div>
      {desc !== undefined && <p className="lede measure">{desc}</p>}
    </div>
  );
}

/** A plain-text empty state inside a section. */
export function EmptyNote({ children }: { readonly children: ReactNode }) {
  return (
    <div className="archive-empty">
      <p className="prose">{children}</p>
    </div>
  );
}

export const OWNER_PARAM = 'owner';

/** The `?owner=` filter, held in the URL. Unknown owners read as "all". */
export function useOwnerParam(owners: readonly AudienceOwner[]): AudienceOwner | null {
  const [params] = useSearchParams();
  const value = params.get(OWNER_PARAM);
  return owners.find((owner) => owner === value) ?? null;
}

/** Unit pills for `?owner=`; choosing one returns to the first page. Hidden with fewer than two owners. */
export function OwnerFilter({
  owners,
  label,
}: {
  readonly owners: readonly AudienceOwner[];
  readonly label: (owner: AudienceOwner) => string;
}) {
  const copy = useArchivePageCopy();
  const [params, setParams] = useSearchParams();
  const active = owners.find((owner) => owner === params.get(OWNER_PARAM)) ?? null;
  if (owners.length < 2) return null;

  const choose = (owner: AudienceOwner | null) => setParams((previous) => {
    const next = new URLSearchParams(previous);
    if (owner === null) next.delete(OWNER_PARAM);
    else next.set(OWNER_PARAM, owner);
    next.delete(ARCHIVE_PARAMS.page);
    return next;
  }, { preventScrollReset: true });

  return (
    <div className="archive-filters" role="group" aria-label={copy.ownerFilter}>
      <div className="archive-filter-group">
        <span className="archive-filter-label" aria-hidden="true">{copy.ownerFilter}</span>
        <div className="row gap-1 wrap">
          <button type="button" className="pill" aria-pressed={active === null} onClick={() => choose(null)}>
            {copy.ownerAll}
          </button>
          {owners.map((owner) => (
            <button
              key={owner}
              type="button"
              className="pill"
              aria-pressed={active === owner}
              onClick={() => choose(owner)}
              style={toneStyle(ownerTone(owner))}
            >
              {label(owner)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * An image in a frame that disappears, frame and all, when the URL is empty or fails to load, so a
 * missing legacy file never shows a broken-image glyph.
 */
export function FramedImage({
  url,
  alt = '',
  className,
  as: Frame = 'span',
}: {
  readonly url: string | null;
  readonly alt?: string;
  readonly className: string;
  readonly as?: 'span' | 'figure';
}) {
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => setFailed(null), [url]);
  if (url === null || url === '' || failed === url) return null;
  return (
    <Frame className={className}>
      <img src={url} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(url)} />
    </Frame>
  );
}

function CoverImage({ url }: { readonly url: string | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => setFailed(null), [url]);
  if (url === null || failed === url) {
    return (
      <span className="post-card-cover archive-card-cover archive-card-cover-empty" aria-hidden="true">
        <Icon name="image" size={22} />
      </span>
    );
  }
  return (
    <span className="post-card-cover archive-card-cover">
      <img src={url} alt="" loading="lazy" decoding="async" onError={() => setFailed(url)} />
    </span>
  );
}

/** An album as a card: cover, date and unit, title, photo count. The whole card is one link. */
export function AlbumCard({
  album,
  ownerLabel,
  headingAs: Heading = 'h3',
}: {
  readonly album: ArchiveAlbum;
  readonly ownerLabel?: string;
  readonly headingAs?: 'h2' | 'h3';
}) {
  const copy = useArchivePageCopy();
  return (
    <article className="card card-hover post-card archive-card" style={toneStyle(ownerTone(album.owner))}>
      <CoverImage url={album.coverUrl} />
      <div className="post-meta">
        {album.date !== null && (
          <time className="post-date mono" dateTime={album.date}>{formatArchiveDate(album.date)}</time>
        )}
        {ownerLabel !== undefined && <span className="tag">{ownerLabel}</span>}
      </div>
      <Heading className="post-card-title" {...fallbackLangProps(album.title)}>
        <Link className="post-stretched-link" to={albumPath(album.id)}>{album.title.text}</Link>
      </Heading>
      <ChineseOnlyTag fallback={album.title.fallback} style={{ alignSelf: 'flex-start' }} />
      <span className="tiny mono">{copy.photoCount(album.photos.length)}</span>
    </article>
  );
}

/** A video with its click-to-load player, title, date, and unit. */
export function VideoCard({
  video,
  ownerLabel,
  headingAs: Heading = 'h3',
}: {
  readonly video: ArchiveVideo;
  readonly ownerLabel?: string;
  readonly headingAs?: 'h2' | 'h3';
}) {
  return (
    <article className="archive-video" style={toneStyle(ownerTone(video.owner))}>
      <VideoFacade
        youtubeId={video.youtubeId}
        title={video.title.text}
        titleLang={video.title.fallback ? 'zh-Hant' : undefined}
      />
      <div className="stack gap-1">
        <div className="post-meta">
          {video.publishedOn !== null && (
            <time className="post-date mono" dateTime={video.publishedOn}>{formatArchiveDate(video.publishedOn)}</time>
          )}
          {ownerLabel !== undefined && <span className="tag">{ownerLabel}</span>}
        </div>
        <LocalizedText as={Heading} className="archive-video-title" value={video.title} />
        <ChineseOnlyTag fallback={video.title.fallback} style={{ alignSelf: 'flex-start' }} />
        {video.description !== null && <LocalizedText as="p" className="tiny" value={video.description} />}
      </div>
    </article>
  );
}

/** Link groups as titled lists; each link may carry a description. */
export function LinkGroupList({ groups, headingAs: Heading = 'h3' }: {
  readonly groups: readonly ArchiveLinkGroup[];
  readonly headingAs?: 'h3' | 'h4';
}) {
  return (
    <div className="archive-link-groups">
      {groups.map((group) => (
        <section key={group.id} className="panel stack gap-2 archive-link-group" aria-labelledby={`links-${group.id}`}>
          <LocalizedText as={Heading} id={`links-${group.id}`} className="display d4" value={group.title} />
          <ul className="archive-link-list">
            {group.links.map((link) => (
              <li key={link.id}>
                <ContentLink className="archive-link" href={link.href} kind={link.kind}>
                  <LocalizedText value={link.label} />
                </ContentLink>
                {link.description !== null && <LocalizedText as="p" className="tiny" value={link.description} />}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Download groups as titled lists of files with their dates. */
export function DownloadList({ groups, headingAs: Heading = 'h3' }: {
  readonly groups: readonly ArchiveDownloadGroup[];
  readonly headingAs?: 'h3' | 'h4';
}) {
  return (
    <div className="stack gap-4">
      {groups.map((group) => (
        <section key={group.id} className="stack gap-2" aria-labelledby={`downloads-${group.id}`}>
          <LocalizedText as={Heading} id={`downloads-${group.id}`} className="display d4" value={group.title} />
          <ul className="archive-download-list">
            {group.items.map((item) => (
              <li key={item.id} className="archive-download">
                <ContentLink className="archive-link" href={item.href} kind={item.kind}>
                  <ContentIcon name="file" size={15} />
                  <LocalizedText value={item.label} />
                </ContentLink>
                {item.publishedOn !== null && (
                  <time className="mono tiny" dateTime={item.publishedOn}>{formatArchiveDate(item.publishedOn)}</time>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Shows the first `limit` children, with a toggle for the rest. */
export function useShowMore<T>(items: readonly T[], limit: number) {
  const copy = useArchivePageCopy();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, limit);
  const toggle = items.length > limit ? (
    <button type="button" className="btn btn-ghost archive-more" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
      {expanded ? copy.showFewer : copy.showAll(items.length)}
      <Icon name={expanded ? 'minus' : 'plus'} />
    </button>
  ) : null;
  return { visible, toggle };
}
