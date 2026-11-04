import { createHash } from 'node:crypto';
import type { LegacyDocument } from 'jsdom';
import type { AudienceOwner } from '../../../src/content/contracts/archiveIds';
import { TEXT_LIMITS } from '../../../src/content/contracts/localized';
import { youtubeIdFromUrl } from './htmlToBlocks';
import { elements } from './parsePage';
import { isBlank, singleLine, truncate } from './text';

export type ImportedVideo = {
  readonly id: string;
  readonly owner: AudienceOwner;
  readonly title: { readonly zh: string };
  readonly youtubeId: string;
  readonly description?: { readonly zh: string };
};

export type VideoSighting = {
  readonly youtubeId: string;
  readonly title: string;
  readonly description?: string;
  readonly owner: AudienceOwner;
  /** Mirror file the card was found on. */
  readonly page: string;
};

/** A stable item id for a YouTube video (YouTube ids are case-sensitive; slug ids are not). */
export function videoItemId(youtubeId: string): string {
  return `yt-${createHash('sha256').update(youtubeId).digest('hex').slice(0, 12)}`;
}

/**
 * Reads the video cards on an old video-board page: each card holds an embed `<iframe>` and a
 * title link to `watch?v=…`. Home-page carousel entries (title links only) are read as well.
 */
export function readVideoCards(document: LegacyDocument, owner: AudienceOwner, page: string): VideoSighting[] {
  const sightings: VideoSighting[] = [];
  for (const card of elements(document.querySelectorAll('.post-item'))) {
    const iframe = card.querySelector('iframe[src]');
    const link = card.querySelector('.post__title a[href]');
    const youtubeId = youtubeIdFromUrl(iframe?.getAttribute('src') ?? '') ?? youtubeIdFromUrl(link?.getAttribute('href') ?? '');
    if (youtubeId === undefined) continue;
    const title = singleLine(link?.textContent ?? card.querySelector('.post__title')?.textContent);
    const description = singleLine(card.querySelector('.post__desc')?.textContent);
    sightings.push({
      youtubeId,
      title,
      ...(description.length > 0 && !isBlank(description) ? { description } : {}),
      owner,
      page,
    });
  }
  return sightings;
}

/** Video links on the home page that are not inside a card (the 影音看板 strip). */
export function readVideoLinks(document: LegacyDocument, owner: AudienceOwner, page: string): VideoSighting[] {
  const sightings: VideoSighting[] = [];
  for (const anchor of elements(document.querySelectorAll('a[href*="youtu"]'))) {
    if (anchor.closest('.post-item, footer, header') !== null) continue;
    const youtubeId = youtubeIdFromUrl(anchor.getAttribute('href') ?? '');
    const title = singleLine(anchor.textContent);
    if (youtubeId !== undefined && title.length > 0) sightings.push({ youtubeId, title, owner, page });
  }
  return sightings;
}

export type VideoMergeResult = {
  readonly videos: ImportedVideo[];
  readonly skippedPlaceholders: readonly VideoSighting[];
  /** Same video listed under different owners; the first owner (by source priority) wins. */
  readonly ownerConflicts: readonly { readonly youtubeId: string; readonly kept: AudienceOwner; readonly also: readonly AudienceOwner[] }[];
};

/** Placeholder entries the old editors left on live boards. */
function isPlaceholder(sighting: VideoSighting): boolean {
  return /^test$/i.test(sighting.title) || sighting.title.length === 0;
}

/**
 * De-duplicates sightings by YouTube id. Sightings must arrive in priority order (owner-specific
 * boards before the site-wide board), so the most specific owner keeps the video.
 */
export function mergeVideos(sightings: readonly VideoSighting[]): VideoMergeResult {
  const byId = new Map<string, { first: VideoSighting; owners: Set<AudienceOwner> }>();
  const skipped: VideoSighting[] = [];
  for (const sighting of sightings) {
    if (isPlaceholder(sighting)) {
      skipped.push(sighting);
      continue;
    }
    const existing = byId.get(sighting.youtubeId);
    if (existing === undefined) byId.set(sighting.youtubeId, { first: sighting, owners: new Set([sighting.owner]) });
    else existing.owners.add(sighting.owner);
  }
  const videos: ImportedVideo[] = [];
  const conflicts: { youtubeId: string; kept: AudienceOwner; also: AudienceOwner[] }[] = [];
  for (const [youtubeId, { first, owners }] of byId) {
    videos.push({
      id: videoItemId(youtubeId),
      owner: first.owner,
      title: { zh: truncate(first.title, TEXT_LIMITS.title) },
      youtubeId,
      ...(first.description === undefined ? {} : { description: { zh: truncate(first.description, TEXT_LIMITS.summary) } }),
    });
    const also = [...owners].filter((owner) => owner !== first.owner);
    if (also.length > 0) conflicts.push({ youtubeId, kept: first.owner, also });
  }
  return { videos, skippedPlaceholders: skipped, ownerConflicts: conflicts };
}
