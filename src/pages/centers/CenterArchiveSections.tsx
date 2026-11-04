import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { departmentPagePath } from '@/app/routes';
import type { OwnerId } from '@/content/contracts/archiveIds';
import { Icon } from '@/ui/Icon';
import { Section } from '@/ui/Section';
import { LocalizedText, ownerTone } from '@/ui/content';
import { useArchivePageCopy } from '../archive/copy';
import { pinnedFirst, useDepartmentInfo, useGalleryLibrary, usePostsArchive } from '../archive/data';
import { AlbumCard, ArchiveSectionHead, VideoCard, toneStyle, useShowMore } from '../archive/parts';
import { PostList } from '../archive/PostListing';

type ArchiveOwner = Exclude<OwnerId, 'department'>;

const ARTICLE_LIMIT = 6;
const ALBUM_LIMIT = 6;
const VIDEO_LIMIT = 4;

/** In-page anchors these sections render, for the owner's page to avoid reusing. */
export const CENTER_ARCHIVE_SECTION_IDS = ['center-articles', 'center-albums', 'center-videos'] as const;

/**
 * A center's (or the digital materials room's) own archive: its articles, legacy information
 * pages, albums, and videos. Each section, and the whole block, is left out when it has nothing,
 * so a center without imported material renders exactly as before.
 */
export function CenterArchiveSections({
  owner,
  tone,
  excludePageIds = [],
}: {
  readonly owner: ArchiveOwner;
  readonly tone?: string;
  /** Information pages the owner's page already shows in full. */
  readonly excludePageIds?: readonly string[];
}) {
  const copy = useArchivePageCopy();
  const archive = usePostsArchive();
  const info = useDepartmentInfo();
  const gallery = useGalleryLibrary();

  const articles = useMemo(
    () => pinnedFirst(archive.posts.filter((post) => post.channel === 'center' && post.owner === owner)),
    [archive.posts, owner],
  );
  const pages = info.pages.filter((page) => page.section === 'center' && page.owner === owner
    && !excludePageIds.includes(page.id));
  const albums = gallery.albums.filter((album) => album.owner === owner);
  const videos = gallery.videos.filter((video) => video.owner === owner);
  const moreArticles = useShowMore(articles, ARTICLE_LIMIT);
  const moreAlbums = useShowMore(albums, ALBUM_LIMIT);
  const moreVideos = useShowMore(videos, VIDEO_LIMIT);
  const resolvedTone = tone ?? ownerTone(owner);

  if (articles.length === 0 && pages.length === 0 && albums.length === 0 && videos.length === 0) return null;

  return (
    <div style={toneStyle(resolvedTone)}>
      {(articles.length > 0 || pages.length > 0) && (
        <Section id="center-articles" tight>
          <ArchiveSectionHead eyebrow="News & Events" title={copy.centerArticlesTitle} />
          <div className="stack gap-4">
            {pages.length > 0 && (
              <nav aria-label={copy.centerPagesTitle}>
                <ul className="row gap-1 wrap" role="list">
                  {pages.map((page) => (
                    <li key={page.id}>
                      <Link className="pill archive-jump" to={departmentPagePath(page.id)}>
                        <LocalizedText value={page.title} />
                        <Icon name="arrow" size={13} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {articles.length > 0 && (
              <PostList posts={moreArticles.visible} categories={archive.categories} />
            )}
            {moreArticles.toggle}
          </div>
        </Section>
      )}

      {albums.length > 0 && (
        <Section id="center-albums" tight>
          <ArchiveSectionHead eyebrow="Photos" title={copy.albumsTitle} />
          <div className="stack gap-3">
            <ul className="archive-card-grid" role="list">
              {moreAlbums.visible.map((album) => <li key={album.id}><AlbumCard album={album} /></li>)}
            </ul>
            {moreAlbums.toggle}
          </div>
        </Section>
      )}

      {videos.length > 0 && (
        <Section id="center-videos" tight>
          <ArchiveSectionHead eyebrow="Videos" title={copy.videosTitle} />
          <div className="stack gap-3">
            <ul className="archive-video-grid" role="list">
              {moreVideos.visible.map((video) => <li key={video.id}><VideoCard video={video} /></li>)}
            </ul>
            {moreVideos.toggle}
          </div>
        </Section>
      )}
    </div>
  );
}
