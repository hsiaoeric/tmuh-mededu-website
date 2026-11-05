import { YOUTUBE_ID_PATTERN } from '@/content/contracts/blocks';

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

/** Path prefixes whose next segment is the video id. */
const ID_PATH_PREFIXES = ['embed', 'shorts', 'live', 'v', 'e'];

function idOrNull(candidate: string | null | undefined): string | null {
  return candidate !== null && candidate !== undefined && YOUTUBE_ID_PATTERN.test(candidate) ? candidate : null;
}

/**
 * The 11-character video id in whatever an editor pastes: a bare id, a watch, share (youtu.be),
 * embed, shorts, or live URL, with or without the scheme. Anything else, including playlist-only
 * or channel URLs, gives `null`.
 */
export function parseYoutubeId(input: string): string | null {
  const value = input.trim();
  if (value === '') return null;
  const bare = idOrNull(value);
  if (bare !== null) return bare;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//iu.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter((segment) => segment !== '');
  if (host === 'youtu.be' || host === 'www.youtu.be') return idOrNull(segments[0]);
  if (!YOUTUBE_HOSTS.has(host)) return null;
  if (segments[0] === 'watch') return idOrNull(url.searchParams.get('v'));
  if (segments[0] !== undefined && ID_PATH_PREFIXES.includes(segments[0])) return idOrNull(segments[1]);
  return null;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
