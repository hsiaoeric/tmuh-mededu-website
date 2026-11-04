import type { AudienceOwner, PostChannel } from '../../../src/content/contracts/archiveIds';
import { isProgramId } from '../../../src/content/contracts/archiveIds';
import { CENTER_SLUG } from '../../../src/app/routes';

/*
 * Which in-page sections the new pages render for a given set of imported records. The pages hide
 * a section that has nothing in it, so a redirect may only carry `#section` when that section
 * exists; otherwise it lands on the page itself. The conditions below mirror the pages:
 *
 * - ProgramPage (`/trainees/:programId`): intro / outcomes / schedule when the program references
 *   a page with blocks; notices when a post lists the program among its audiences; albums,
 *   videos, links (non-empty link groups) and downloads (non-empty groups) owned by the program.
 * - CenterArchiveSections (`/centers/:slug`, `/digital-materials`): center-articles when the
 *   owner has a center-channel post or a center information page.
 * - DepartmentPage (`/department`): committees when any page is in the committee section.
 *
 * `src/app/legacyRedirectTargets.test.tsx` renders every hashed redirect target against the
 * committed snapshot, so a page whose conditions drift from these fails there.
 */

export type SectionPost = {
  readonly channel: PostChannel;
  readonly owner: string;
  readonly audiences?: readonly string[];
};

export type SectionPage = {
  readonly id: string;
  readonly section: string;
  readonly owner?: string;
  /** Whether the page has any content blocks (program pages skip empty referenced pages). */
  readonly hasBlocks: boolean;
};

export type SectionProgram = {
  readonly id: string;
  readonly introPageId?: string;
  readonly outcomesPageId?: string;
  readonly schedulePageId?: string;
};

export type SectionData = {
  readonly posts: readonly SectionPost[];
  readonly pages: readonly SectionPage[];
  readonly programs: readonly SectionProgram[];
  readonly albums: readonly { readonly owner: string }[];
  readonly videos: readonly { readonly owner: string }[];
  readonly linkGroups: readonly { readonly owner: string; readonly links: readonly unknown[] }[];
  readonly downloads: readonly { readonly owner: string; readonly items: readonly unknown[] }[];
};

/** The page an owner's center archive renders on. */
function centerArchivePath(owner: string): string | undefined {
  if (owner === 'digital_materials') return '/digital-materials';
  return Object.prototype.hasOwnProperty.call(CENTER_SLUG, owner)
    ? `/centers/${CENTER_SLUG[owner as keyof typeof CENTER_SLUG]}`
    : undefined;
}

/** Every `path#section` that renders for this data. */
export function renderedSections(data: SectionData): Set<string> {
  const rendered = new Set<string>();
  const add = (path: string | undefined, section: string) => {
    if (path !== undefined) rendered.add(`${path}#${section}`);
  };
  const programPath = (owner: string) => (isProgramId(owner as AudienceOwner) ? `/trainees/${owner}` : undefined);

  const pagesWithBlocks = new Set(data.pages.filter((page) => page.hasBlocks).map((page) => page.id));
  for (const program of data.programs) {
    const path = `/trainees/${program.id}`;
    if (program.introPageId !== undefined && pagesWithBlocks.has(program.introPageId)) add(path, 'intro');
    if (program.outcomesPageId !== undefined && pagesWithBlocks.has(program.outcomesPageId)) add(path, 'outcomes');
    if (program.schedulePageId !== undefined && pagesWithBlocks.has(program.schedulePageId)) add(path, 'schedule');
  }
  for (const post of data.posts) {
    for (const audience of post.audiences ?? []) add(programPath(audience), 'notices');
    if (post.channel === 'center' && post.owner !== 'department') add(centerArchivePath(post.owner), 'center-articles');
  }
  for (const page of data.pages) {
    if (page.section === 'center' && page.owner !== undefined) add(centerArchivePath(page.owner), 'center-articles');
    if (page.section === 'committee') add('/department', 'committees');
  }
  for (const album of data.albums) add(programPath(album.owner), 'albums');
  for (const video of data.videos) add(programPath(video.owner), 'videos');
  for (const group of data.linkGroups) if (group.links.length > 0) add(programPath(group.owner), 'links');
  for (const group of data.downloads) if (group.items.length > 0) add(programPath(group.owner), 'downloads');
  return rendered;
}

/**
 * `path#section` for the first candidate section that renders, else the page itself. Paths
 * with a query are matched on their pathname.
 */
export function sectionTarget(path: string, sections: readonly string[], rendered: ReadonlySet<string>): string {
  const pathname = path.split('?')[0] ?? path;
  const section = sections.find((candidate) => rendered.has(`${pathname}#${candidate}`));
  return section === undefined ? path : `${path}#${section}`;
}
