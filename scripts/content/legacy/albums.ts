import type { LegacyDocument } from 'jsdom';
import type { AudienceOwner } from '../../../src/content/contracts/archiveIds';
import { elements, meaningfulImageSource } from './parsePage';
import { rocDateInText, singleLine } from './text';

export type AlbumPhotoSighting = {
  /** The legacy photo id (from the photo's own page link), when the card links to one. */
  readonly photoId?: string;
  readonly src: string;
  readonly title: string;
};

export type AlbumSighting = {
  readonly albumId: string;
  readonly owner: AudienceOwner;
  readonly title: string;
  readonly photos: readonly AlbumPhotoSighting[];
  readonly page: string;
};

/** The album heading: the `<h5>` above the photo grid. */
function albumTitle(document: LegacyDocument): string {
  const heading = elements(document.querySelectorAll('.blog-grid h5'))
    .find((element) => element.closest('aside, .sidebar, .widget') === null);
  return singleLine(heading?.textContent);
}

/** Reads one album page (`album/info/album/ALB01/3`, `student/albumlist/stu01/alb01/3`, …). */
export function readAlbumPage(document: LegacyDocument, albumId: string, owner: AudienceOwner, page: string): AlbumSighting {
  const photos: AlbumPhotoSighting[] = [];
  for (const card of elements(document.querySelectorAll('.blog-grid .post-item'))) {
    const image = card.querySelector('.post__img img');
    const src = meaningfulImageSource(image?.getAttribute('data-link') ?? image?.getAttribute('src'));
    if (src === undefined) continue;
    const link = card.querySelector('.post__title a');
    const title = singleLine(link?.textContent ?? image?.getAttribute('data-caption'));
    // Photo cards link to `…/album/ALB01/64.html` (or, wrongly, to `/news/info/64`): the trailing
    // number is the photo id.
    const photoHref = card.querySelector('.post__img a')?.getAttribute('href') ?? '';
    const photoId = /\/(?:album\/[A-Za-z0-9]+)\/(\d+)\.html$/.exec(photoHref)?.[1]
      ?? /\/(\d+)(?:\.html)?$/.exec(link?.getAttribute('href') ?? '')?.[1];
    photos.push({ ...(photoId === undefined ? {} : { photoId: String(Number(photoId)) }), src, title });
  }
  return { albumId, owner, title: albumTitle(document), photos, page };
}

/** The earliest ROC date in the album or photo titles (`1091029-實習醫學生座談會`). */
export function albumDate(album: AlbumSighting): string | undefined {
  const dates = [album.title, ...album.photos.map((photo) => photo.title)]
    .map(rocDateInText)
    .filter((date): date is string => date !== undefined)
    .sort();
  return dates[0];
}

/**
 * Picks the most complete sighting of each album: the album has several duplicate pages, some of
 * which render empty because of old routing bugs.
 */
export function mergeAlbumSightings(sightings: readonly AlbumSighting[]): AlbumSighting[] {
  // The first sighting of an album decides its owner (callers list canonical album pages first);
  // later sightings can only contribute a title or a fuller photo list.
  const best = new Map<string, AlbumSighting>();
  for (const sighting of sightings) {
    const previous = best.get(sighting.albumId);
    if (previous === undefined) {
      best.set(sighting.albumId, sighting);
      continue;
    }
    best.set(sighting.albumId, {
      ...previous,
      title: previous.title || sighting.title,
      photos: sighting.photos.length > previous.photos.length ? sighting.photos : previous.photos,
    });
  }
  return [...best.values()].sort((left, right) => Number(left.albumId) - Number(right.albumId));
}
