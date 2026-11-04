import { Link, useParams } from 'react-router-dom';
import { GALLERY_PATH } from '@/app/routes';
import { usePageTitle } from '@/app/site';
import { Section } from '@/ui/Section';
import { LocalizedText, PhotoGrid, formatArchiveDate, ownerTone } from '@/ui/content';
import { NotFound } from './NotFound';
import { useArchivePageCopy } from './archive/copy';
import { ownerPath, useGalleryLibrary, useOwnerLabels, type ArchiveAlbum } from './archive/data';
import { PageIntro, toneStyle } from './archive/parts';

/** One album: its details, then the photos in a grid that opens the lightbox. */
export function AlbumPage() {
  const { albumId } = useParams();
  const { albums } = useGalleryLibrary();
  const album = albums.find((candidate) => candidate.id === albumId);
  if (album === undefined) return <NotFound />;
  return <Album key={album.id} album={album} />;
}

function Album({ album }: { readonly album: ArchiveAlbum }) {
  const copy = useArchivePageCopy();
  const ownerLabel = useOwnerLabels();
  const tone = ownerTone(album.owner);

  usePageTitle(album.title.text);

  return (
    <div style={toneStyle(tone)}>
      <PageIntro
        eyebrow="Album"
        title={album.title.text}
        titleLang={album.title.fallback ? 'zh-Hant' : undefined}
        long
        tone={tone}
        back={{ to: GALLERY_PATH, label: copy.backToGallery }}
        lede={album.description !== null ? <LocalizedText as="p" className="lede measure" value={album.description} /> : undefined}
      >
        <div className="post-meta">
          {album.date !== null && (
            <time className="post-date mono" dateTime={album.date}>{formatArchiveDate(album.date)}</time>
          )}
          <Link className="tag" to={ownerPath(album.owner)}>{ownerLabel(album.owner)}</Link>
          <span className="mono tiny">{copy.photoCount(album.photos.length)}</span>
        </div>
      </PageIntro>
      <Section tight>
        <PhotoGrid photos={album.photos} title={album.title.text} />
      </Section>
    </div>
  );
}
