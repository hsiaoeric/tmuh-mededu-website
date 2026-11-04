import { useMemo } from 'react';
import { usePageTitle } from '@/app/site';
import { useHashScroll } from '@/app/hashScroll';
import { Section } from '@/ui/Section';
import { Pagination, paginate, useArchiveParams } from '@/ui/content';
import { useArchivePageCopy } from './archive/copy';
import { presentOwners, useGalleryLibrary, useOwnerLabels } from './archive/data';
import { EmptyNote, OwnerFilter, PageIntro, VideoCard, useOwnerParam } from './archive/parts';

const PAGE_SIZE = 12;
const LIST_ID = 'videos';

/** 影音看板: every video as a click-to-load player, newest first, filterable by unit with `?owner=`. */
export function VideosPage() {
  const copy = useArchivePageCopy();
  const { videos } = useGalleryLibrary();
  const ownerLabel = useOwnerLabels();
  const owners = useMemo(() => presentOwners(videos), [videos]);
  const owner = useOwnerParam(owners);
  const { page: requested } = useArchiveParams();
  const filtered = owner === null ? videos : videos.filter((video) => video.owner === owner);
  const page = paginate(filtered, requested, PAGE_SIZE);

  usePageTitle(copy.videosTitle);
  useHashScroll();

  return (
    <>
      <PageIntro eyebrow="Videos" title={copy.videosTitle} lede={copy.videosLede} />
      <Section id={LIST_ID} tight>
        {videos.length === 0 ? (
          <EmptyNote>{copy.videosEmpty}</EmptyNote>
        ) : (
          <div className="stack gap-4">
            <OwnerFilter owners={owners} label={ownerLabel} />
            <ul className="archive-video-grid" role="list" aria-label={copy.videosTitle}>
              {page.items.map((video) => (
                <li key={video.id}>
                  <VideoCard video={video} ownerLabel={ownerLabel(video.owner)} headingAs="h2" />
                </li>
              ))}
            </ul>
            <Pagination pageCount={page.pageCount} scrollTargetId={LIST_ID} />
          </div>
        )}
      </Section>
    </>
  );
}
