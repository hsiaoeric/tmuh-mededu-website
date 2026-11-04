import { useEffect, useMemo, useState } from 'react';
import type { LocalizedPick } from '@/content/adapters/archive';
import { Icon } from '@/ui/Icon';
import { useContentCopy } from './copy';
import { Lightbox, type LightboxItem } from './Lightbox';

/** One photo as `adaptGalleryLibrary` yields it. */
export interface PhotoGridItem {
  readonly id: string;
  readonly url: string;
  readonly alt?: LocalizedPick | null;
  readonly caption?: LocalizedPick | null;
  readonly width?: number | null;
  readonly height?: number | null;
}

interface PhotoGridProps {
  readonly photos: readonly PhotoGridItem[];
  /** The album title: names the viewer, and builds alt text for photos that have none. */
  readonly title: string;
  /** Accessible name of the list; defaults to the title. */
  readonly label?: string;
}

/**
 * A responsive grid of lazily loaded thumbnails. Each opens the `Lightbox` at that photo; closing
 * it returns focus to the thumbnail. Photos without alt text are named "<album> — photo n".
 */
export function PhotoGrid({ photos, title, label }: PhotoGridProps) {
  const copy = useContentCopy();
  const [open, setOpen] = useState<number | null>(null);

  const items = useMemo<LightboxItem[]>(() => photos.map((photo, index) => {
    const fallback = photo.alt?.fallback === true || photo.caption?.fallback === true;
    return {
      url: photo.url,
      alt: photo.alt?.text ?? copy.photoFallbackAlt(title, index + 1),
      caption: photo.caption?.text ?? null,
      lang: fallback ? 'zh-Hant' : undefined,
      width: photo.width,
      height: photo.height,
    };
  }), [copy, photos, title]);

  return (
    <>
      <ul className="photo-grid" aria-label={label ?? title}>
        {items.map((item, index) => (
          <li key={photos[index].id} className="photo-grid-item">
            <PhotoThumb item={item} onOpen={() => setOpen(index)} />
          </li>
        ))}
      </ul>
      <Lightbox items={items} index={open} onIndexChange={setOpen} onClose={() => setOpen(null)} title={title} />
    </>
  );
}

function PhotoThumb({ item, onOpen }: { readonly item: LightboxItem; readonly onOpen: () => void }) {
  const copy = useContentCopy();
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => setFailed(null), [item.url]);
  const showImage = item.url !== '' && failed !== item.url;

  return (
    <button type="button" className="photo-grid-button" onClick={onOpen} aria-haspopup="dialog" lang={item.lang}>
      {showImage ? (
        <img
          src={item.url}
          alt={item.alt}
          width={item.width ?? undefined}
          height={item.height ?? undefined}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(item.url)}
        />
      ) : (
        <span className="content-image-missing photo-grid-missing">
          <Icon name="image" size={20} />
          <span className="tiny" aria-hidden="true">{copy.imageUnavailable}</span>
          <span className="sr-only">{item.alt}</span>
        </span>
      )}
    </button>
  );
}
