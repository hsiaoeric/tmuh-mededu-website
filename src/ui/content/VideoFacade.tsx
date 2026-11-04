import { useEffect, useRef, useState } from 'react';
import { YOUTUBE_ID_PATTERN } from '@/content/contracts/blocks';
import { useContentCopy } from './copy';
import { ContentIcon } from './icons';

export function youtubeThumbnailUrl(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`;
}

interface VideoFacadeProps {
  readonly youtubeId: string;
  /** The video's title: the play button's name and the iframe's `title`. */
  readonly title: string;
  /** `'zh-Hant'` when the title fell back to Chinese in the English UI. */
  readonly titleLang?: string;
  readonly className?: string;
}

/**
 * A click-to-load YouTube player. Until the visitor presses play, the page shows only a thumbnail
 * from i.ytimg.com; the privacy-enhanced youtube-nocookie.com player, and with it every request to
 * YouTube's player, loads after the press. Focus moves into the player so keyboard users keep
 * their place.
 */
export function VideoFacade({ youtubeId, title, titleLang, className }: VideoFacadeProps) {
  const copy = useContentCopy();
  const [playing, setPlaying] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setPlaying(false);
    setThumbnailFailed(false);
  }, [youtubeId]);

  useEffect(() => {
    if (playing) frameRef.current?.focus();
  }, [playing]);

  if (!YOUTUBE_ID_PATTERN.test(youtubeId)) return null;

  return (
    <div className={['video-facade', className].filter(Boolean).join(' ')}>
      {playing ? (
        <iframe
          ref={frameRef}
          className="video-facade-frame"
          src={youtubeEmbedUrl(youtubeId)}
          title={title}
          lang={titleLang}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className="video-facade-button"
          aria-label={`${copy.playVideo}${title}`}
          onClick={() => setPlaying(true)}
        >
          {!thumbnailFailed && (
            <img
              className="video-facade-thumb"
              src={youtubeThumbnailUrl(youtubeId)}
              alt=""
              loading="lazy"
              decoding="async"
              width={480}
              height={360}
              onError={() => setThumbnailFailed(true)}
            />
          )}
          <span className="video-facade-play" aria-hidden="true">
            <ContentIcon name="play" size={26} filled />
          </span>
        </button>
      )}
    </div>
  );
}
