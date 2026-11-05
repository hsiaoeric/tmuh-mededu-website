import type { MediaReference } from '@/content/media';
import type {
  ArchiveEditorKind,
  EditableBlock,
  EditableDepartmentInfoPayload,
  EditableGalleryPayload,
  EditablePostsPayload,
  JsonPath,
} from '../archiveTypes';

/**
 * Every place an archive document holds an image. W9's media workbench, draft claims, and the
 * publish-time reference cap can enumerate slots with `archiveMediaSlots` instead of knowing each
 * payload's shape, and the editors render each slot through `ArchiveMediaField`.
 */
export type ArchiveMediaSlotKind =
  | 'post-cover'
  | 'post-block-image'
  | 'page-portrait'
  | 'page-block-image'
  | 'program-cover'
  | 'album-cover'
  | 'album-photo';

export type ArchiveMediaSlot = {
  readonly slotKind: ArchiveMediaSlotKind;
  /** JSON path of the media reference itself, such as `['posts', 3, 'cover']`. */
  readonly path: JsonPath;
  readonly reference: MediaReference | null;
  /** A reference is required (image blocks and photos); optional slots can be cleared. */
  readonly required: boolean;
};

function blockSlots(blocks: readonly EditableBlock[], path: JsonPath, slotKind: ArchiveMediaSlotKind): ArchiveMediaSlot[] {
  return blocks.flatMap((block, index) => (block.type === 'image'
    ? [{ slotKind, path: [...path, index, 'media'], reference: block.media, required: true }]
    : []));
}

function bodySlots(body: { readonly zh: readonly EditableBlock[]; readonly en?: readonly EditableBlock[] }, path: JsonPath, slotKind: ArchiveMediaSlotKind): ArchiveMediaSlot[] {
  return [
    ...blockSlots(body.zh, [...path, 'zh'], slotKind),
    ...(body.en === undefined ? [] : blockSlots(body.en, [...path, 'en'], slotKind)),
  ];
}

function optionalSlot(reference: MediaReference | undefined, path: JsonPath, slotKind: ArchiveMediaSlotKind): ArchiveMediaSlot[] {
  return reference === undefined ? [] : [{ slotKind, path, reference, required: false }];
}

export function postsMediaSlots(payload: EditablePostsPayload): ArchiveMediaSlot[] {
  return payload.posts.flatMap((post, index) => [
    ...optionalSlot(post.cover, ['posts', index, 'cover'], 'post-cover'),
    ...bodySlots(post.body, ['posts', index, 'body'], 'post-block-image'),
  ]);
}

export function departmentInfoMediaSlots(payload: EditableDepartmentInfoPayload): ArchiveMediaSlot[] {
  return [
    ...payload.pages.flatMap((page, index) => [
      ...optionalSlot(page.portrait, ['pages', index, 'portrait'], 'page-portrait'),
      ...bodySlots(page.body, ['pages', index, 'body'], 'page-block-image'),
    ]),
    ...payload.programs.flatMap((program, index) => optionalSlot(program.cover, ['programs', index, 'cover'], 'program-cover')),
  ];
}

export function galleryMediaSlots(payload: EditableGalleryPayload): ArchiveMediaSlot[] {
  return payload.albums.flatMap((album, index) => [
    ...optionalSlot(album.cover, ['albums', index, 'cover'], 'album-cover'),
    ...album.photos.map((photo, photoIndex): ArchiveMediaSlot => ({
      slotKind: 'album-photo',
      path: ['albums', index, 'photos', photoIndex, 'media'],
      reference: photo.media,
      required: true,
    })),
  ]);
}

export type ArchivePayloadByKind = {
  readonly posts: EditablePostsPayload;
  readonly department_info: EditableDepartmentInfoPayload;
  readonly gallery: EditableGalleryPayload;
};

/** Filled media slots of an archive payload, in document order. */
export function archiveMediaSlots<K extends ArchiveEditorKind>(kind: K, payload: ArchivePayloadByKind[K]): ArchiveMediaSlot[] {
  switch (kind) {
    case 'posts':
      return postsMediaSlots(payload as EditablePostsPayload);
    case 'department_info':
      return departmentInfoMediaSlots(payload as EditableDepartmentInfoPayload);
    case 'gallery':
      return galleryMediaSlots(payload as EditableGalleryPayload);
    default:
      return [];
  }
}
