import type { AudienceOwner, OwnerId, PostChannel, ProgramId } from '../../../src/content/contracts/archiveIds';
import { isProgramId } from '../../../src/content/contracts/archiveIds';
import { CENTER_SLUG } from '../../../src/app/routes';
import { POST_CATEGORY_CHANNELS } from '../../../src/content/contracts/archiveIds';
import { resolveInLegacyTable, type LegacyRedirectTable } from '../../../src/app/legacyPaths';
import type { LegacyView } from './classify';
import { DOWNLOAD_FILE_PATH, DOWNLOAD_FILE_QUERY_KEY, normalizeLegacyPath } from './paths';
import { sectionTarget } from './sections';

/** Canonical new routes (plan §1.1). Later workers build the pages; the importer only emits paths. */
export const NEW_ROUTES = {
  home: '/',
  department: '/department',
  announcements: '/announcements',
  honors: '/honors',
  trainees: '/trainees',
  gallery: '/gallery',
  videos: '/videos',
  resources: '/resources',
  digitalMaterials: '/digital-materials',
} as const;

export type RedirectTable = LegacyRedirectTable;

export type RedirectLookups = {
  readonly posts: ReadonlyMap<string, { readonly channel: PostChannel; readonly owner: OwnerId }>;
  /** Imported (non-empty) album ids. */
  readonly albums: ReadonlySet<string>;
  /** Legacy photo id → album id, for the old per-photo pages. */
  readonly photoAlbums: ReadonlyMap<string, string>;
  /** Legacy department page number → new page id. */
  readonly departmentPages: ReadonlyMap<number, string>;
  readonly organizationPageId: string;
  /** `path#section` anchors that render for the imported data (see `renderedSections`). */
  readonly sections: ReadonlySet<string>;
};

export function ownerHomePath(owner: AudienceOwner): string {
  if (owner === 'department') return NEW_ROUTES.department;
  if (owner === 'digital_materials') return NEW_ROUTES.digitalMaterials;
  if (isProgramId(owner)) return programPath(owner);
  return `/centers/${CENTER_SLUG[owner]}`;
}

export function programPath(program: ProgramId): string {
  return `${NEW_ROUTES.trainees}/${program}`;
}

export function postPath(post: { readonly id: string; readonly channel: PostChannel; readonly owner: OwnerId }): string {
  if (post.channel === 'news') return `${NEW_ROUTES.announcements}/${post.id}`;
  if (post.channel === 'honors') return `${NEW_ROUTES.honors}/${post.id}`;
  if (post.owner === 'digital_materials') return `${NEW_ROUTES.digitalMaterials}/articles/${post.id}`;
  if (post.owner === 'department') throw new TypeError(`Center post ${post.id} has no center owner`);
  return `/centers/${CENTER_SLUG[post.owner]}/articles/${post.id}`;
}

function ownerQuery(base: string, owner: AudienceOwner | undefined): string {
  return owner === undefined ? base : `${base}?owner=${owner}`;
}

export class RedirectError extends Error {
  readonly name = 'RedirectError';
}

/** Where an old page's content now lives. */
export function redirectTarget(view: LegacyView, lookups: RedirectLookups): string {
  switch (view.kind) {
    case 'home':
      return NEW_ROUTES.home;
    case 'contact':
      return '/#contact';
    case 'centers':
      return '/#organisation';
    case 'news-index':
      return NEW_ROUTES.announcements;
    case 'honors-index':
      return `${NEW_ROUTES.honors}#board`;
    case 'category':
      return POST_CATEGORY_CHANNELS[view.categoryId] === 'honors'
        ? `${NEW_ROUTES.honors}?category=${view.categoryId}#board`
        : `${NEW_ROUTES.announcements}?category=${view.categoryId}`;
    case 'post': {
      const post = lookups.posts.get(view.postId);
      if (post !== undefined) return postPath({ id: view.postId, ...post });
      // An empty or deleted article: send visitors to where its siblings are listed.
      return view.centerOwner === undefined
        ? NEW_ROUTES.announcements
        : sectionTarget(ownerHomePath(view.centerOwner), ['center-articles'], lookups.sections);
    }
    case 'organization':
      return `${NEW_ROUTES.department}/${lookups.organizationPageId}`;
    case 'team':
      return `${NEW_ROUTES.department}#team`;
    case 'committees':
      return sectionTarget(NEW_ROUTES.department, ['committees'], lookups.sections);
    case 'department-page': {
      const page = lookups.departmentPages.get(view.legacyId);
      if (page === undefined) throw new RedirectError(`No department page for legacy page ${view.legacyId}`);
      return `${NEW_ROUTES.department}/${page}`;
    }
    case 'gallery':
      return NEW_ROUTES.gallery;
    case 'album':
      return lookups.albums.has(view.albumId) ? `${NEW_ROUTES.gallery}/${view.albumId}` : ownerQuery(NEW_ROUTES.gallery, view.owner);
    case 'photo': {
      const album = lookups.photoAlbums.get(view.photoId);
      return album !== undefined && lookups.albums.has(album) ? `${NEW_ROUTES.gallery}/${album}` : ownerQuery(NEW_ROUTES.gallery, view.owner);
    }
    case 'owner-albums':
      return isProgramId(view.owner)
        ? sectionTarget(programPath(view.owner), ['albums'], lookups.sections)
        : ownerQuery(NEW_ROUTES.gallery, view.owner);
    case 'program':
      // 常用資訊 (`links`) held both links and files; the program page splits them in two.
      return view.section === undefined
        ? programPath(view.program)
        : sectionTarget(programPath(view.program), view.section === 'links' ? ['links', 'downloads'] : [view.section], lookups.sections);
    case 'videos':
      return view.owner === undefined || view.owner === 'department' ? NEW_ROUTES.videos : ownerQuery(NEW_ROUTES.videos, view.owner);
    case 'center':
      return view.section === undefined
        ? ownerHomePath(view.owner)
        : sectionTarget(ownerHomePath(view.owner), [view.section], lookups.sections);
    case 'links':
      return `${NEW_ROUTES.resources}#links`;
    case 'downloads':
    case 'download-file':
      return `${NEW_ROUTES.resources}#downloads`;
  }
}

/** Builds a redirect table; duplicate keys must agree. */
export class RedirectTableBuilder {
  private readonly exact = new Map<string, string>();
  private readonly query = new Map<string, { path: string; key: string; value: string; to: string }>();

  addExact(oldPath: string, to: string): void {
    const key = normalizeLegacyPath(oldPath);
    const previous = this.exact.get(key);
    if (previous !== undefined && previous !== to) {
      throw new RedirectError(`Conflicting redirects for ${key}: ${previous} vs ${to}`);
    }
    this.exact.set(key, to);
  }

  addDownload(fileName: string, to: string): void {
    const id = `${DOWNLOAD_FILE_PATH}?${fileName}`;
    const previous = this.query.get(id);
    if (previous !== undefined && previous.to !== to) throw new RedirectError(`Conflicting download redirects for ${fileName}`);
    this.query.set(id, { path: DOWNLOAD_FILE_PATH, key: DOWNLOAD_FILE_QUERY_KEY, value: fileName, to });
  }

  has(oldPath: string): boolean {
    return this.exact.has(normalizeLegacyPath(oldPath));
  }

  /** Resolves like the SPA will: query rules first, then the exact table. */
  resolve(path: string, query: readonly (readonly [string, string])[]): string | undefined {
    return resolveInLegacyTable({ exact: Object.fromEntries(this.exact), query: [...this.query.values()] }, path, query);
  }

  table(): RedirectTable {
    const exact = Object.fromEntries([...this.exact].sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)));
    const query = [...this.query.values()].sort((left, right) => (left.value < right.value ? -1 : left.value > right.value ? 1 : 0));
    return { version: 1, exact, query };
  }
}
