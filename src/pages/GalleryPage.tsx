import { useMemo } from 'react';
import { usePageTitle } from '@/app/site';
import { useHashScroll } from '@/app/hashScroll';
import { Section } from '@/ui/Section';
import { Pagination, paginate, useArchiveParams } from '@/ui/content';
import { useArchivePageCopy } from './archive/copy';
import { presentOwners, useGalleryLibrary, useOwnerLabels } from './archive/data';
import { AlbumCard, EmptyNote, OwnerFilter, PageIntro, useOwnerParam } from './archive/parts';

const PAGE_SIZE = 24;
const LIST_ID = 'albums';

/** 活動花絮: every album, newest first, filterable by unit with `?owner=`. */
export function GalleryPage() {
  const copy = useArchivePageCopy();
  const { albums } = useGalleryLibrary();
  const ownerLabel = useOwnerLabels();
  const owners = useMemo(() => presentOwners(albums), [albums]);
  const owner = useOwnerParam(owners);
  const { page: requested } = useArchiveParams();
  const filtered = owner === null ? albums : albums.filter((album) => album.owner === owner);
  const page = paginate(filtered, requested, PAGE_SIZE);

  usePageTitle(copy.galleryTitle);
  useHashScroll();

  return (
    <>
      <PageIntro eyebrow="Gallery" title={copy.galleryTitle} lede={copy.galleryLede} />
      <Section id={LIST_ID} tight>
        {albums.length === 0 ? (
          <EmptyNote>{copy.galleryEmpty}</EmptyNote>
        ) : (
          <div className="stack gap-4">
            <OwnerFilter owners={owners} label={ownerLabel} />
            <ul className="archive-card-grid" role="list" aria-label={copy.galleryTitle}>
              {page.items.map((album) => (
                <li key={album.id}>
                  <AlbumCard album={album} ownerLabel={ownerLabel(album.owner)} headingAs="h2" />
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
