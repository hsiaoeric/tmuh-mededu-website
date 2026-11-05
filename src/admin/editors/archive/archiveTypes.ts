import type {
  StructuredEditorCommit,
  StructuredEditorCommitResult,
  StructuredEditorIssueSummary,
} from '@/admin/editors/shared';
import type { EditableBlock, EditableLocalizedBlocks } from '@/content/contracts/blocks';
import type { EditableLocalizedText } from '@/content/contracts/localized';
import type { EditableCmsPayloadByKind } from '@/content/contracts/registry';
import type { ArchiveLockedIds } from './lockedIds';

export type ArchiveEditorKind = 'posts' | 'department_info' | 'gallery';

export type EditablePostsPayload = EditableCmsPayloadByKind['posts'];
export type EditablePost = EditablePostsPayload['posts'][number];
export type EditablePostCategory = EditablePostsPayload['categories'][number];
export type EditableAttachment = EditablePost['attachments'][number];

export type EditableDepartmentInfoPayload = EditableCmsPayloadByKind['department_info'];
export type EditableDepartmentPage = EditableDepartmentInfoPayload['pages'][number];
export type EditableProgram = EditableDepartmentInfoPayload['programs'][number];
export type EditableLinkGroup = EditableDepartmentInfoPayload['linkGroups'][number];
export type EditableLink = EditableLinkGroup['links'][number];
export type EditableDownloadGroup = EditableDepartmentInfoPayload['downloads'][number];
export type EditableDownloadItem = EditableDownloadGroup['items'][number];

export type EditableGalleryPayload = EditableCmsPayloadByKind['gallery'];
export type EditableAlbum = EditableGalleryPayload['albums'][number];
export type EditablePhoto = EditableAlbum['photos'][number];
export type EditableVideo = EditableGalleryPayload['videos'][number];

export type { EditableBlock, EditableLocalizedBlocks, EditableLocalizedText };

export type ArchiveIssues = readonly StructuredEditorIssueSummary[];
export type ArchiveCommit<Payload> = StructuredEditorCommit<Payload>;
export type ArchiveCommitResult = StructuredEditorCommitResult;
export type JsonPath = readonly PropertyKey[];

export const UNCHANGED: ArchiveCommitResult = { status: 'unchanged' };

/** Common props of the three archive document editors. */
export type ArchiveEditorProps<Payload> = {
  readonly payload: Payload;
  readonly issues: ArchiveIssues;
  readonly onChange: ArchiveCommit<Payload>;
  /**
   * Top-level ids that can no longer change: published, or the target of a legacy redirect.
   * `null` while loading (every existing id is then treated as locked).
   */
  readonly lockedIds?: ArchiveLockedIds | null;
  /** Today as YYYY-MM-DD; injectable for tests. */
  readonly today?: string;
};
