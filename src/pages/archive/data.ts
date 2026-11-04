import { useMemo } from 'react';
import { publicCenterById, usePublicCenters } from '@/app/publicCenters';
import {
  DEPARTMENT_PATH,
  DIGITAL_MATERIALS_PATH,
  centerPath,
  programPath,
} from '@/app/routes';
import { useSite } from '@/app/site';
import { usePublicContentDocument } from '@/content';
import { CENTER_OWNER_IDS, isProgramId, type AudienceOwner } from '@/content/contracts/archiveIds';
import { useArchivePageCopy } from './copy';

/** The adapted `posts`, `department_info`, and `gallery` documents for the current language. */
export function usePostsArchive() {
  const { lang } = useSite();
  return usePublicContentDocument('posts', 'archive', lang).value;
}

export function useDepartmentInfo() {
  const { lang } = useSite();
  return usePublicContentDocument('department_info', 'directory', lang).value;
}

export function useGalleryLibrary() {
  const { lang } = useSite();
  return usePublicContentDocument('gallery', 'library', lang).value;
}

export type ArchivePost = ReturnType<typeof usePostsArchive>['posts'][number];
export type ArchiveCategory = ReturnType<typeof usePostsArchive>['categories'][number];
export type DepartmentPage = ReturnType<typeof useDepartmentInfo>['pages'][number];
export type ArchiveProgram = ReturnType<typeof useDepartmentInfo>['programs'][number];
export type ArchiveLinkGroup = ReturnType<typeof useDepartmentInfo>['linkGroups'][number];
export type ArchiveDownloadGroup = ReturnType<typeof useDepartmentInfo>['downloads'][number];
export type ArchiveAlbum = ReturnType<typeof useGalleryLibrary>['albums'][number];
export type ArchiveVideo = ReturnType<typeof useGalleryLibrary>['videos'][number];

type CenterOwner = (typeof CENTER_OWNER_IDS)[number];

export function isCenterOwner(owner: string): owner is CenterOwner {
  return CENTER_OWNER_IDS.some((id) => id === owner);
}

/** The page an owner's material lives on: its center, the materials room, a program, or the department. */
export function ownerPath(owner: AudienceOwner): string {
  if (isCenterOwner(owner)) return centerPath(owner);
  if (owner === 'digital_materials') return DIGITAL_MATERIALS_PATH;
  if (isProgramId(owner)) return programPath(owner);
  return DEPARTMENT_PATH;
}

/** Display names for every archive owner, in the current language. */
export function useOwnerLabels(): (owner: AudienceOwner) => string {
  const { lang, isZh } = useSite();
  const copy = useArchivePageCopy();
  const centers = usePublicCenters(lang);
  const digital = usePublicContentDocument('digital_materials', 'page', lang).value;
  const { programs } = useDepartmentInfo();

  return useMemo(() => {
    const labels = new Map<string, string>();
    labels.set('department', copy.ownerDepartment);
    labels.set('digital_materials', digital.title);
    for (const id of CENTER_OWNER_IDS) {
      const center = publicCenterById(centers, id);
      labels.set(id, isZh ? center.zh : center.en);
    }
    for (const program of programs) labels.set(program.id, program.title.text);
    return (owner: AudienceOwner) => labels.get(owner) ?? owner;
  }, [centers, copy.ownerDepartment, digital.title, isZh, programs]);
}

/** Owners in a stable, meaningful order: department, centers, the materials room, programs. */
export const OWNER_ORDER: readonly AudienceOwner[] = [
  'department',
  ...CENTER_OWNER_IDS,
  'digital_materials',
  'residents',
  'pgy',
  'medical-students',
  'allied-health-trainees',
  'joint-training',
];

export function presentOwners(items: readonly { readonly owner: AudienceOwner }[]): AudienceOwner[] {
  const present = new Set(items.map((item) => item.owner));
  return OWNER_ORDER.filter((owner) => present.has(owner));
}

/** Pinned posts first, otherwise the adapter's newest-first order. */
export function pinnedFirst<T extends { readonly pinned: boolean }>(posts: readonly T[]): T[] {
  return [...posts.filter((post) => post.pinned), ...posts.filter((post) => !post.pinned)];
}
