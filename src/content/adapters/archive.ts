import { classifyLinkHref, isLocalFilePath, type LinkHrefKind, type PublishedBlock } from '@/content/contracts/blocks';
import type { PublishedCmsPayloadByKind } from '@/content/contracts/registry';
import type { PublishedMediaReference } from '@/content/media/references';
import type { Lang } from '@/i18n';
import { assetUrl } from '@/utils/asset';
import { resolvePublishedMediaUrl, type PublicMediaLocation } from './media';

type LocalizedValue<T> = { readonly zh: T; readonly en?: T };

/**
 * Localized text chosen for the reading language. `fallback` is true when English was asked for but
 * only Chinese exists; renderers then mark the element `lang="zh-Hant"` and show a "Chinese only" tag.
 */
export type LocalizedPick = {
  readonly text: string;
  readonly lang: Lang;
  readonly fallback: boolean;
};

export type LocalizedBlocksPick = {
  readonly blocks: readonly PublishedBlock[];
  readonly lang: Lang;
  readonly fallback: boolean;
};

export function pickLocalized(value: LocalizedValue<string>, lang: Lang): LocalizedPick {
  if (lang === 'en' && value.en !== undefined && value.en.length > 0) {
    return { text: value.en, lang: 'en', fallback: false };
  }
  return { text: value.zh, lang: 'zh', fallback: lang === 'en' };
}

export function pickLocalizedBlocks(
  value: LocalizedValue<readonly PublishedBlock[]>,
  lang: Lang,
): LocalizedBlocksPick {
  if (lang === 'en' && value.en !== undefined && value.en.length > 0) {
    return { blocks: value.en, lang: 'en', fallback: false };
  }
  return { blocks: value.zh, lang: 'zh', fallback: lang === 'en' };
}

function pickOptional(value: LocalizedValue<string> | undefined, lang: Lang): LocalizedPick | null {
  return value === undefined ? null : pickLocalized(value, lang);
}

function mediaUrl(reference: PublishedMediaReference | undefined, media: PublicMediaLocation): string | null {
  if (reference === undefined) return null;
  const url = resolvePublishedMediaUrl(reference, media);
  return url === '' ? null : url;
}

export type ResolvedHref = {
  readonly href: string;
  /** `file` is a committed legacy download, already resolved against the deployed base. */
  readonly kind: LinkHrefKind | 'file';
};

/** Resolves an attachment or download target; committed files go through `assetUrl`. */
export function resolveFileHref(href: string, media: PublicMediaLocation): ResolvedHref {
  if (isLocalFilePath(href)) return { href: assetUrl(href, media.baseUrl), kind: 'file' };
  return { href, kind: classifyLinkHref(href) ?? 'https' };
}

function byOrder<T extends { readonly order: number; readonly id: string }>(left: T, right: T): number {
  return left.order - right.order || left.id.localeCompare(right.id);
}

function newestFirst(left: string | undefined, right: string | undefined): number {
  return (right ?? '').localeCompare(left ?? '');
}

export function adaptPostsArchive(
  payload: PublishedCmsPayloadByKind['posts'],
  lang: Lang,
  media: PublicMediaLocation,
) {
  return {
    categories: [...payload.categories].sort(byOrder).map((category) => ({
      id: category.id,
      channel: category.channel,
      order: category.order,
      label: pickLocalized(category.label, lang),
    })),
    posts: [...payload.posts]
      .sort((left, right) => newestFirst(left.publishedOn, right.publishedOn) || right.id.localeCompare(left.id))
      .map((post) => ({
        id: post.id,
        channel: post.channel,
        categoryId: post.categoryId,
        owner: post.owner,
        audiences: post.audiences ?? [],
        publishedOn: post.publishedOn,
        pinned: post.pinned,
        title: pickLocalized(post.title, lang),
        summary: pickOptional(post.summary, lang),
        coverUrl: mediaUrl(post.cover, media),
        body: pickLocalizedBlocks(post.body, lang),
        attachments: post.attachments.map((attachment) => ({
          id: attachment.id,
          label: pickLocalized(attachment.label, lang),
          ...resolveFileHref(attachment.href, media),
        })),
      })),
  };
}

export function adaptDepartmentInfo(
  payload: PublishedCmsPayloadByKind['department_info'],
  lang: Lang,
  media: PublicMediaLocation,
) {
  return {
    pages: [...payload.pages].sort(byOrder).map((page) => ({
      id: page.id,
      section: page.section,
      owner: page.owner ?? null,
      order: page.order,
      title: pickLocalized(page.title, lang),
      subtitle: pickOptional(page.subtitle, lang),
      summary: pickOptional(page.summary, lang),
      portraitUrl: mediaUrl(page.portrait, media),
      body: pickLocalizedBlocks(page.body, lang),
      updatedOn: page.updatedOn ?? null,
    })),
    programs: [...payload.programs].sort(byOrder).map((program) => ({
      id: program.id,
      order: program.order,
      title: pickLocalized(program.title, lang),
      summary: pickLocalized(program.summary, lang),
      coverUrl: mediaUrl(program.cover, media),
      introPageId: program.introPageId ?? null,
      outcomesPageId: program.outcomesPageId ?? null,
      schedulePageId: program.schedulePageId ?? null,
    })),
    linkGroups: [...payload.linkGroups].sort(byOrder).map((group) => ({
      id: group.id,
      owner: group.owner,
      purpose: group.purpose,
      order: group.order,
      title: pickLocalized(group.title, lang),
      links: group.links.map((link) => ({
        id: link.id,
        label: pickLocalized(link.label, lang),
        description: pickOptional(link.description, lang),
        ...resolveFileHref(link.href, media),
      })),
    })),
    downloads: payload.downloads.map((group) => ({
      id: group.id,
      owner: group.owner,
      title: pickLocalized(group.title, lang),
      items: group.items.map((item) => ({
        id: item.id,
        label: pickLocalized(item.label, lang),
        publishedOn: item.publishedOn ?? null,
        ...resolveFileHref(item.href, media),
      })),
    })),
  };
}

export function adaptGalleryLibrary(
  payload: PublishedCmsPayloadByKind['gallery'],
  lang: Lang,
  media: PublicMediaLocation,
) {
  return {
    albums: [...payload.albums]
      .sort((left, right) => newestFirst(left.date, right.date) || left.id.localeCompare(right.id))
      .map((album) => ({
        id: album.id,
        owner: album.owner,
        title: pickLocalized(album.title, lang),
        date: album.date ?? null,
        description: pickOptional(album.description, lang),
        coverUrl: mediaUrl(album.cover ?? album.photos[0]?.media, media),
        photos: album.photos.map((photo) => ({
          id: photo.id,
          url: mediaUrl(photo.media, media) ?? '',
          alt: pickOptional(photo.alt, lang),
          caption: pickOptional(photo.caption, lang),
          width: photo.width ?? null,
          height: photo.height ?? null,
        })),
      })),
    videos: [...payload.videos]
      .sort((left, right) => newestFirst(left.publishedOn, right.publishedOn) || left.id.localeCompare(right.id))
      .map((video) => ({
        id: video.id,
        owner: video.owner,
        youtubeId: video.youtubeId,
        publishedOn: video.publishedOn ?? null,
        title: pickLocalized(video.title, lang),
        description: pickOptional(video.description, lang),
      })),
  };
}
