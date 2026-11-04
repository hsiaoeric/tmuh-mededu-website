// Legacy-site importer: `npm run content:import-legacy -- --mirror <abs> [--images] [--skip-existing]
// [--probe-https] [--report docs/legacy-import-report.md]`.
//
// Reads a wget mirror of tmuh-education.tmuh.org.tw as data only (jsdom parses it; nothing in it
// runs) and writes the archive bootstrap sources under src/data/legacy/, converted images under
// public/assets/legacy/, downloads under public/files/legacy/, and the import report. It never
// runs in content:check or CI; `npm run content:generate` turns its output into the snapshot/seed.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import type { LegacyDocument, LegacyElement } from 'jsdom';
import {
  POST_CATEGORY_CHANNELS,
  POST_CATEGORY_IDS,
  type AudienceOwner,
  type OwnerId,
  type PostCategoryId,
  type PostChannel,
  type ProgramId,
} from '../../../src/content/contracts/archiveIds';
import { isLocalFilePath } from '../../../src/content/contracts/blocks';
import { TEXT_LIMITS } from '../../../src/content/contracts/localized';
import { CMS_PAYLOAD_REGISTRY } from '../../../src/content/contracts/registry';
import {
  LEGACY_CENTER_CODES,
  LEGACY_CENTER_SECTION_PREFIXES,
  LEGACY_DOWNLOAD_GROUPS,
  LEGACY_LINK_GROUPS,
  LEGACY_SYSTEMS_LINK_GROUP,
  LEGACY_TITLE_AUDIENCE_TAGS,
  LEGACY_TITLE_OWNER_TAGS,
  POST_CATEGORY_TAXONOMY,
} from '../../../src/data/legacy/taxonomy';
import { stableStringify } from '../json';
import { departmentInfoSourceFrom, gallerySourceFrom, postsSourceFrom } from '../legacySources';
import { albumDate, mergeAlbumSightings, readAlbumPage, type AlbumSighting } from './albums';
import { classifyLegacyPath, newsCategoryForCode, type LegacyView } from './classify';
import {
  currentAdminRoster,
  departmentPageSpecs,
  diffRoster,
  readLegacyRoster,
  readTeamPortraits,
  readTeamSummaries,
} from './departmentPages';
import { blocksText, htmlToBlocks, type BlockNote, type ImportedBlock, type ImportedMedia } from './htmlToBlocks';
import { probeHttpsUpgrades, readHttpsUpgrades, writeHttpsUpgrades } from './httpsProbe';
import { ImageStore, locateImage, type ImageCategory, type ImageManifest, type ImageManifestEntry } from './images';
import { httpHost, outcomeHref, resolveLegacyHref, type HttpsUpgrades, type LinkOutcome } from './links';
import { elements, extractArticle, groupPostViews, LegacyImportError, loadMirrorDocument, meaningfulImageSource, parseHtml } from './parsePage';
import { downloadFileName, formatLegacyLocation, legacyLocationFromHref, type LegacyLocation } from './paths';
import { ownerHomePath, redirectTarget, RedirectTableBuilder, type RedirectLookups } from './redirects';
import { renderedSections, type SectionData } from './sections';
import { renderReport, type CountRow, type ReportData } from './report';
import { readDownloadList, readFooterSystemLinks, readLinkList } from './resources';
import { rocDateInText, timestampDateInFileName, truncate } from './text';
import { mergeVideos, readVideoCards, readVideoLinks, type VideoSighting } from './videos';
import { walkMirror, type MirrorPage } from './walk';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const LEGACY_DATA = join(REPO_ROOT, 'src', 'data', 'legacy');
const PUBLIC_ROOT = join(REPO_ROOT, 'public');
const DOWNLOAD_DIRECTORY = 'files/legacy/downloads';
const DOCUMENT_CACHE_SIZE = 64;

/** Old section roots that were never saved as pages but are obvious hand-typed entry points. */
const LEGACY_ENTRY_ALIASES: readonly (readonly [string, string])[] = [
  ['/about', '/department/organization-chart'],
  ['/board', '/honors#board'],
  ['/album', '/gallery'],
  ['/news', '/announcements'],
  ['/student', '/trainees'],
  ['/other', '/resources'],
  ['/home', '/'],
  ['/center/about', '/#organisation'],
  ['/center/events', '/#organisation'],
  ['/center/video', '/videos'],
  ['/center/album', '/gallery'],
  ['/other/links', '/resources#links'],
  ['/other/download', '/resources#downloads'],
  // `/center/<name>` with no further segment: the center's own page.
  ...Object.entries(LEGACY_CENTER_CODES).map(([name, owner]) => [`/center/${name}`, ownerHomePath(owner)] as const),
];

/** The importer files every link group under the department; program pages show none. */
const LINK_GROUP_OWNER = 'department';
/** Program page references are hand-authored later in the CMS; the import supplies none. */
const IMPORTED_PROGRAMS: readonly { readonly id: string }[] = [];

type Options = {
  readonly mirror: string;
  readonly images: boolean;
  readonly skipExisting: boolean;
  readonly probeHttps: boolean;
  readonly report: string;
};

function parseOptions(argv: readonly string[]): Options {
  const { values } = parseArgs({
    args: [...argv],
    options: {
      mirror: { type: 'string' },
      images: { type: 'boolean', default: false },
      'skip-existing': { type: 'boolean', default: false },
      'probe-https': { type: 'boolean', default: false },
      report: { type: 'string', default: 'docs/legacy-import-report.md' },
    },
    strict: true,
    allowPositionals: false,
  });
  if (values.mirror === undefined || !isAbsolute(values.mirror) || !existsSync(values.mirror)) {
    throw new LegacyImportError('--mirror must be the absolute path of the wget mirror root (tmuh-education.tmuh.org.tw/)');
  }
  return {
    mirror: values.mirror,
    images: values.images ?? false,
    skipExisting: values['skip-existing'] ?? false,
    probeHttps: values['probe-https'] ?? false,
    report: values.report ?? 'docs/legacy-import-report.md',
  };
}

type Localized = { readonly zh: string };
type LocalMedia = ImportedMedia;

type DraftPost = {
  readonly id: string;
  readonly channel: PostChannel;
  readonly categoryId: PostCategoryId;
  readonly owner: OwnerId;
  readonly audiences: readonly ProgramId[];
  readonly publishedOn: string;
  readonly title: string;
  readonly coverSrc?: string;
  /** The page the cover was found on (center articles take it from the center list page). */
  readonly coverPage: MirrorPage;
  readonly body?: LegacyElement;
  readonly page: MirrorPage;
};

type DraftPage = {
  readonly id: string;
  readonly section: 'about' | 'committee';
  readonly order: number;
  readonly title: string;
  readonly summary?: string;
  readonly portraitSrc?: string;
  readonly body?: LegacyElement;
  readonly page: MirrorPage;
};

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function localized(text: string): Localized {
  return { zh: text };
}

class Importer {
  private readonly documents = new Map<string, LegacyDocument>();
  private readonly redirects = new RedirectTableBuilder();
  private readonly report = {
    datesEstimated: [] as { post: string; title: string; date: string; method: string }[],
    ownerInference: [] as { post: string; title: string; owner: string }[],
    audienceInference: [] as { post: string; title: string; audiences: string[] }[],
    droppedImages: [] as { where: string; src: string; reason: string }[],
    generatedAlts: new Map<string, number>(),
    links: {
      http: [] as { where: string; href: string; detail: string }[],
      upgraded: [] as { where: string; from: string; href: string }[],
      repaired: [] as { where: string; from: string; href: string }[],
      internal: [] as { where: string; from: string; href: string }[],
      dropped: [] as { where: string; from: string; reason: string }[],
    },
    tables: [] as { where: string; detail: string }[],
    headings: [] as { where: string; detail: string }[],
    posterOnly: [] as { where: string; title: string; images: number }[],
    emptyAlbums: [] as { album: string; title: string; owner: string; cover?: string; redirect: string }[],
    downloadsCopied: [] as { label: string; path: string; bytes: number }[],
    downloadsMissing: [] as { label: string; href: string; reason: string }[],
    emptyDownloadGroups: [] as string[],
    emptyPages: [] as string[],
    personalData: [] as { where: string; title: string; note: string }[],
  };
  private readonly pages: readonly { readonly page: MirrorPage; readonly view: LegacyView }[];
  private images!: ImageStore;
  private readonly resolvedImages = new Map<string, ImageManifestEntry | null>();
  private httpsUpgrades: HttpsUpgrades;

  constructor(private readonly options: Options) {
    const walked = walkMirror(options.mirror);
    const unknown: string[] = [];
    const pages: { page: MirrorPage; view: LegacyView }[] = [];
    for (const page of walked) {
      const view = classifyLegacyPath(page.location.path);
      if (view === undefined) unknown.push(formatLegacyLocation(page.location));
      else pages.push({ page, view });
    }
    if (unknown.length > 0) throw new LegacyImportError(`Unclassified mirror pages (add a rule in classify.ts):\n${unknown.join('\n')}`);
    this.pages = pages;
    this.httpsUpgrades = readHttpsUpgrades();
  }

  /** Parsed pages, least recently used first; only a bounded number stay in memory. */
  private document(page: MirrorPage): LegacyDocument {
    let document = this.documents.get(page.file);
    if (document !== undefined) {
      this.documents.delete(page.file);
    } else {
      document = loadMirrorDocument(page.file);
      while (this.documents.size >= DOCUMENT_CACHE_SIZE) {
        const oldest = this.documents.keys().next().value;
        if (oldest === undefined) break;
        this.documents.delete(oldest);
      }
    }
    this.documents.set(page.file, document);
    return document;
  }

  private pagesOf<K extends LegacyView['kind']>(kind: K): { page: MirrorPage; view: Extract<LegacyView, { kind: K }> }[] {
    return this.pages.filter((entry): entry is { page: MirrorPage; view: Extract<LegacyView, { kind: K }> } => entry.view.kind === kind);
  }

  /** Resolves an href on a mirror page to the old location it names, then classifies it. */
  private viewOfHref(href: string, page: MirrorPage): LegacyView | undefined {
    const location = legacyLocationFromHref(href.trim(), page.relativeFile);
    return location === undefined ? undefined : classifyLegacyPath(location.path);
  }

  // ---- posts ---------------------------------------------------------------------------------

  /** Covers that only the center list pages show (center articles have no cover on their own page). */
  private centerCovers(): Map<string, { src: string; page: MirrorPage }> {
    const covers = new Map<string, { src: string; page: MirrorPage }>();
    for (const { page } of this.pagesOf('center')) {
      for (const item of elements(this.document(page).querySelectorAll('.featurette'))) {
        const href = item.querySelector('a[href]')?.getAttribute('href') ?? '';
        const view = this.viewOfHref(href, page);
        const src = meaningfulImageSource(item.querySelector('img')?.getAttribute('src'));
        if (view?.kind === 'post' && src !== undefined && !covers.has(view.postId)) covers.set(view.postId, { src, page });
      }
    }
    return covers;
  }

  private inferOwner(title: string): OwnerId | undefined {
    return LEGACY_TITLE_OWNER_TAGS.find((tag) => tag.pattern.test(title))?.owner;
  }

  private draftPosts(): DraftPost[] {
    const groups = groupPostViews(this.pagesOf('post'));
    const centerCovers = this.centerCovers();
    const drafts: (Omit<DraftPost, 'publishedOn'> & { publishedOn?: string; imageNames: string[]; imagePaths: string[] })[] = [];
    for (const group of groups) {
      const primary = group.pages[0]!;
      const fields = group.pages.map((page) => ({ page, fields: extractArticle(this.document(page)) }))
        .find((candidate) => candidate.fields.title.length > 0);
      if (fields === undefined) {
        this.report.emptyPages.push(`${formatLegacyLocation(primary.location)} (article ${group.postId} has no title)`);
        continue;
      }
      const article = fields.fields;
      let categoryId: PostCategoryId | undefined;
      if (group.code !== undefined && /^(?:ABT|EVT)\d\d$/.test(group.code)) {
        const prefix = group.code.slice(0, 3) as 'ABT' | 'EVT';
        categoryId = LEGACY_CENTER_SECTION_PREFIXES[prefix].categoryId;
      } else {
        categoryId = newsCategoryForCode(group.code ?? article.categoryCode ?? '');
      }
      if (categoryId === undefined) throw new LegacyImportError(`Article ${group.postId} has no category`);
      const channel = POST_CATEGORY_CHANNELS[categoryId];
      const titleText = truncate(article.title, TEXT_LIMITS.title);
      let owner: OwnerId;
      if (channel === 'center') {
        if (group.centerOwner === undefined) throw new LegacyImportError(`Center article ${group.postId} has no center`);
        owner = group.centerOwner;
      } else {
        owner = this.inferOwner(titleText) ?? 'department';
        if (owner !== 'department') this.report.ownerInference.push({ post: group.postId, title: titleText, owner });
      }
      const audiences = channel === 'news'
        ? [...new Set(LEGACY_TITLE_AUDIENCE_TAGS.filter((tag) => tag.pattern.test(titleText)).map((tag) => tag.program))]
        : [];
      if (audiences.length > 0) this.report.audienceInference.push({ post: group.postId, title: titleText, audiences });
      const listCover = article.coverSrc === undefined ? centerCovers.get(group.postId) : undefined;
      const coverSrc = article.coverSrc ?? listCover?.src;
      const coverPage = listCover?.page ?? fields.page;
      const imagePaths = [coverSrc ?? '', ...elements(article.body?.querySelectorAll('img[src]') ?? []).map((image) => image.getAttribute('src') ?? '')]
        .filter((src) => src.length > 0 && !src.startsWith('legacy-inline:'))
        .map(safeDecode);
      const imageNames = imagePaths.map((src) => src.split('/').at(-1) ?? '');
      drafts.push({
        id: group.postId,
        channel,
        categoryId,
        owner,
        audiences,
        title: titleText,
        ...(article.date === undefined ? {} : { publishedOn: article.date }),
        ...(coverSrc === undefined ? {} : { coverSrc }),
        coverPage,
        ...(article.body === undefined ? {} : { body: detach(article.body) }),
        page: fields.page,
        imageNames,
        imagePaths,
      });
    }
    // Undated (center) articles: title date, then upload timestamp, then the latest date among
    // lower-numbered articles, since the old ids were assigned in creation order.
    const dated = drafts.filter((draft) => draft.publishedOn !== undefined).sort((left, right) => Number(left.id) - Number(right.id));
    return drafts.map((draft) => {
      if (draft.publishedOn !== undefined) return { ...draft, publishedOn: draft.publishedOn };
      let date = rocDateInText(draft.title);
      let method = 'ROC date in title';
      if (date === undefined) {
        date = draft.imageNames.map(timestampDateInFileName).find((candidate) => candidate !== undefined);
        method = 'upload timestamp in image file name';
      }
      if (date === undefined) {
        // The nearest dated neighbours by id bracket the creation date; the image upload folder's
        // year (【2024年】, /ARTICLE/2024/) picks between them when it can.
        const lower = dated.filter((other) => Number(other.id) < Number(draft.id)).at(-1)?.publishedOn;
        const higher = dated.find((other) => Number(other.id) > Number(draft.id))?.publishedOn;
        const folderYear = draft.imageNames.length === 0 ? undefined : folderYearOf(draft.imagePaths);
        const candidates = [lower, higher].filter((candidate): candidate is string => candidate !== undefined);
        date = candidates.find((candidate) => folderYear !== undefined && candidate.startsWith(folderYear)) ?? candidates[0];
        method = folderYear !== undefined && date?.startsWith(folderYear) === true
          ? `estimate: neighbouring article id, matching the ${folderYear} upload folder`
          : 'estimate: nearest lower-numbered dated article';
      }
      if (date === undefined) throw new LegacyImportError(`Article ${draft.id} has no date and nothing to estimate one from`);
      this.report.datesEstimated.push({ post: draft.id, title: draft.title, date, method });
      return { ...draft, publishedOn: date };
    });
  }

  // ---- department pages ------------------------------------------------------------------------

  private draftDepartmentPages(): DraftPage[] {
    const team = this.pagesOf('team')[0];
    const summaries = team === undefined ? new Map<number, string>() : readTeamSummaries(this.document(team.page));
    const portraits = team === undefined ? new Map<number, string>() : readTeamPortraits(this.document(team.page));
    const drafts: DraftPage[] = [];
    for (const spec of departmentPageSpecs()) {
      const source = spec.legacyId === undefined
        ? this.pagesOf('organization')[0]
        : this.pagesOf('department-page').find((entry) => entry.view.legacyId === spec.legacyId);
      if (source === undefined) throw new LegacyImportError(`Department page ${spec.id} is missing from the mirror`);
      const article = extractArticle(this.document(source.page));
      const summary = spec.legacyId === undefined ? undefined : summaries.get(spec.legacyId);
      const portraitSrc = article.portraitSrc ?? (spec.legacyId === undefined ? undefined : meaningfulImageSource(portraits.get(spec.legacyId)));
      drafts.push({
        id: spec.id,
        section: spec.section,
        order: spec.order,
        title: truncate(article.title || spec.id, TEXT_LIMITS.title),
        ...(summary === undefined ? {} : { summary: truncate(summary, TEXT_LIMITS.summary) }),
        ...(portraitSrc === undefined ? {} : { portraitSrc }),
        ...(article.body === undefined ? {} : { body: detach(article.body) }),
        page: source.page,
      });
    }
    return drafts;
  }

  // ---- albums ----------------------------------------------------------------------------------

  private albumSightings(): { albums: AlbumSighting[]; covers: Map<string, { src: string; page: MirrorPage }> } {
    const views = this.pagesOf('album')
      // Canonical album pages (album/info/album/CODE/id) carry the owner by album code; list them first.
      .sort((left, right) => {
        const leftRank = left.page.location.path.toLowerCase().startsWith('/album/info/') ? 0 : 1;
        const rightRank = right.page.location.path.toLowerCase().startsWith('/album/info/') ? 0 : 1;
        return leftRank - rightRank || compareText(left.page.relativeFile, right.page.relativeFile);
      });
    const sightings: AlbumSighting[] = [];
    for (const { page, view } of views) {
      if (view.owner === undefined) throw new LegacyImportError(`Album ${view.albumId} at ${page.relativeFile} has no owner`);
      sightings.push(readAlbumPage(this.document(page), view.albumId, view.owner, page.relativeFile));
    }
    // Covers appear on the album lists (album/home, program and center pages).
    const covers = new Map<string, { src: string; page: MirrorPage }>();
    const listPages = this.pages.filter((entry) => ['gallery', 'owner-albums', 'program', 'center'].includes(entry.view.kind))
      .sort((left, right) => (left.view.kind === 'gallery' ? 0 : 1) - (right.view.kind === 'gallery' ? 0 : 1) || compareText(left.page.relativeFile, right.page.relativeFile));
    for (const { page } of listPages) {
      for (const card of elements(this.document(page).querySelectorAll('.post-item'))) {
        const href = card.querySelector('.post__title a[href]')?.getAttribute('href') ?? card.querySelector('a[href]')?.getAttribute('href') ?? '';
        const view = this.viewOfHref(href, page);
        const src = meaningfulImageSource(card.querySelector('img')?.getAttribute('src'));
        if (view?.kind === 'album' && src !== undefined && !covers.has(view.albumId)) covers.set(view.albumId, { src, page });
      }
    }
    return { albums: mergeAlbumSightings(sightings), covers };
  }

  // ---- videos ----------------------------------------------------------------------------------

  private videoSightings(): VideoSighting[] {
    const tiers: VideoSighting[][] = [[], [], [], []];
    for (const { page, view } of this.pages) {
      const path = page.location.path.toLowerCase();
      if (view.kind === 'videos' && view.owner !== undefined) {
        const tier = path.startsWith('/center/video/') ? 0 : path.startsWith('/home/video/stu') ? 1 : 2;
        tiers[tier]!.push(...readVideoCards(this.document(page), view.owner, page.relativeFile));
      } else if (view.kind === 'program' && view.section === 'videos') {
        tiers[0]!.push(...readVideoCards(this.document(page), view.program, page.relativeFile));
      } else if (view.kind === 'home') {
        tiers[3]!.push(...readVideoLinks(this.document(page), 'department', page.relativeFile));
      }
    }
    return tiers.flat();
  }

  // ---- links and downloads ---------------------------------------------------------------------

  private resolveLink(href: string, page: MirrorPage, where: string): string | null {
    const outcome = resolveLegacyHref(href, {
      pageRelativeFile: page.relativeFile,
      resolveLegacy: (location) => this.resolveLegacyLocation(location),
      httpsUpgrades: this.httpsUpgrades,
    });
    this.recordLink(outcome, where);
    return outcomeHref(outcome);
  }

  private recordLink(outcome: LinkOutcome, where: string): void {
    switch (outcome.status) {
      case 'http': {
        const host = httpHost(outcome.href) ?? '';
        this.report.links.http.push({ where, href: outcome.href, detail: this.httpsUpgrades.hosts[host]?.detail ?? 'not probed' });
        return;
      }
      case 'upgraded':
        this.report.links.upgraded.push({ where, from: outcome.from, href: outcome.href });
        return;
      case 'repaired':
        this.report.links.repaired.push({ where, from: outcome.from, href: outcome.href });
        return;
      case 'internal':
        this.report.links.internal.push({ where, from: outcome.from, href: outcome.href });
        return;
      case 'dropped':
        this.report.links.dropped.push({ where, from: outcome.from, reason: outcome.reason });
        return;
      case 'external':
        return;
    }
  }

  private resolveLegacyLocation(location: LegacyLocation): string | undefined {
    const direct = this.redirects.resolve(location.path, location.query);
    if (direct !== undefined) return direct;
    const view = classifyLegacyPath(location.path);
    return view === undefined ? undefined : redirectTarget(view, this.lookups!);
  }

  private lookups: RedirectLookups | undefined;

  private linkGroups(): { groups: unknown[]; httpHosts: string[]; count: number } {
    const byCode = new Map<string, { label: string; description?: string; href: string; page: MirrorPage }[]>();
    for (const { page } of this.pagesOf('links')) {
      const code = /\/links\/(l00\d)$/i.exec(page.location.path)?.[1]?.toUpperCase();
      if (code === undefined) continue;
      const list = byCode.get(code) ?? [];
      for (const link of readLinkList(this.document(page))) {
        if (!list.some((existing) => existing.label === link.label && existing.href === link.href)) list.push({ ...link, page });
      }
      byCode.set(code, list);
    }
    const home = this.pagesOf('home')[0];
    const systems = home === undefined ? [] : readFooterSystemLinks(this.document(home.page)).map((link) => ({ ...link, page: home.page }));
    const groups: unknown[] = [];
    const httpHosts: string[] = [];
    let count = 0;
    const build = (id: string, order: number, title: { zh: string; en: string }, purpose: 'related' | 'systems', sightings: readonly { label: string; description?: string; href: string; page: MirrorPage }[]) => {
      const links: unknown[] = [];
      sightings.forEach((sighting) => {
        const href = this.resolveLink(sighting.href, sighting.page, `link group ${id}: ${sighting.label}`);
        if (href === null) return;
        const host = httpHost(href);
        if (host !== undefined) httpHosts.push(host);
        links.push({
          id: `${id}-${links.length + 1}`,
          label: localized(truncate(sighting.label, TEXT_LIMITS.label)),
          ...(sighting.description === undefined ? {} : { description: localized(truncate(sighting.description, TEXT_LIMITS.summary)) }),
          href,
        });
      });
      count += links.length;
      if (links.length > 0) groups.push({ id, owner: LINK_GROUP_OWNER, purpose, order, title, links });
    };
    for (const [code, spec] of Object.entries(LEGACY_LINK_GROUPS)) build(spec.id, spec.order, spec.title, 'related', byCode.get(code) ?? []);
    build(LEGACY_SYSTEMS_LINK_GROUP.id, LEGACY_SYSTEMS_LINK_GROUP.order, LEGACY_SYSTEMS_LINK_GROUP.title, 'systems', systems);
    return { groups, httpHosts, count };
  }

  private downloads(): { groups: unknown[]; copied: Map<string, string>; count: number } {
    const files = new Map(this.pagesOf('download-file').map(({ page }) => [downloadFileName(page.location) ?? '', page]));
    const copied = new Map<string, string>();
    const groups: unknown[] = [];
    let count = 0;
    for (const { page } of this.pagesOf('downloads')) {
      const code = /\/download\/((?:dwn|rec)\d\d)$/i.exec(page.location.path)?.[1]?.toUpperCase();
      if (code === undefined) continue;
      const spec = (LEGACY_DOWNLOAD_GROUPS as Readonly<Record<string, { id: string; owner: AudienceOwner; title: { zh: string; en: string } }>>)[code];
      if (spec === undefined) throw new LegacyImportError(`Unknown download group ${code}`);
      const items: unknown[] = [];
      for (const sighting of readDownloadList(this.document(page))) {
        const location = legacyLocationFromHref(sighting.href, page.relativeFile);
        const fileName = location === undefined ? undefined : downloadFileName(location);
        const saved = fileName === undefined ? undefined : files.get(fileName);
        if (fileName === undefined || saved === undefined || /\.html?$/i.test(saved.relativeFile)) {
          this.report.downloadsMissing.push({ label: sighting.label, href: fileName ?? sighting.href, reason: saved === undefined ? 'not in the mirror' : 'old site answered 查無此檔案 (file not found)' });
          continue;
        }
        const name = basename(fileName).toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
        const target = `${DOWNLOAD_DIRECTORY}/${name}`;
        if (!isLocalFilePath(target)) throw new LegacyImportError(`Download ${fileName} cannot be stored as ${target}`);
        mkdirSync(join(PUBLIC_ROOT, ...DOWNLOAD_DIRECTORY.split('/')), { recursive: true });
        copyFileSync(saved.file, join(PUBLIC_ROOT, ...target.split('/')));
        copied.set(fileName, target);
        this.report.downloadsCopied.push({ label: sighting.label, path: `public/${target}`, bytes: readFileSync(saved.file).length });
        items.push({ id: `${spec.id}-${items.length + 1}`, label: localized(truncate(sighting.label, TEXT_LIMITS.label)), href: target });
      }
      count += items.length;
      if (items.length > 0) groups.push({ id: spec.id, owner: spec.owner, title: spec.title, items });
      else this.report.emptyDownloadGroups.push(`${code} ${spec.title.zh}`);
    }
    return { groups, copied, count };
  }

  // ---- images ----------------------------------------------------------------------------------

  private imageKey(page: MirrorPage, src: string): string {
    return `${page.relativeFile}\u0000${src}`;
  }

  private async prepareImage(src: string, page: MirrorPage, category: ImageCategory, where: string): Promise<void> {
    const key = this.imageKey(page, src);
    if (this.resolvedImages.has(key)) return;
    const located = locateImage(src, page.relativeFile, this.options.mirror);
    if (located.status === 'file' || located.status === 'data') {
      this.resolvedImages.set(key, await this.images.ensure(located, category));
      return;
    }
    this.resolvedImages.set(key, null);
    const reason = located.status === 'external' ? 'external host (not fetched)' : located.status === 'missing' ? 'not in the mirror' : 'unreadable data URI';
    const shown = located.status === 'external' ? located.url : located.status === 'missing' ? located.key : located.src;
    this.report.droppedImages.push({ where, src: shown, reason });
  }

  private media(page: MirrorPage, src: string | undefined): { media: LocalMedia; width: number; height: number } | undefined {
    if (src === undefined) return undefined;
    const entry = this.resolvedImages.get(this.imageKey(page, src));
    return entry === null || entry === undefined ? undefined : { media: { kind: 'local', path: entry.path }, width: entry.width, height: entry.height };
  }

  private convertBody(body: LegacyElement | undefined, page: MirrorPage, title: string, where: string): ImportedBlock[] {
    if (body === undefined) return [];
    const notes: BlockNote[] = [];
    const blocks = htmlToBlocks(body, {
      title,
      resolveImage: (src) => this.media(page, src) ?? null,
      resolveLink: (href) => this.resolveLink(href, page, where),
      note: (note) => notes.push(note),
    });
    const alts = notes.filter((note) => note.kind === 'generated-alt').length;
    if (alts > 0) this.report.generatedAlts.set(where, alts);
    for (const note of notes) {
      if (note.kind === 'table-span' || note.kind === 'table-truncated') this.report.tables.push({ where, detail: note.detail });
      if (note.kind === 'table-link-dropped') this.report.links.dropped.push({ where, from: note.href, reason: 'link inside a table cell (cells are plain text)' });
      if (note.kind === 'heading-demoted') this.report.headings.push({ where, detail: `kept as a bold paragraph because ${note.reason}: ${note.text}` });
    }
    const images = blocks.filter((block) => block.type === 'image').length;
    if (images > 0 && blocksText(blocks).trim().length === 0) this.report.posterOnly.push({ where, title, images });
    return blocks;
  }

  // ---- run -------------------------------------------------------------------------------------

  async run(): Promise<void> {
    const posts = this.draftPosts();
    const departmentPages = this.draftDepartmentPages();
    const { albums: albumSightings, covers: albumCovers } = this.albumSightings();
    const videoMerge = mergeVideos(this.videoSightings());

    // Albums with no photos cannot be published; their URLs fall back to the owner's gallery.
    const albums = albumSightings.filter((album) => album.photos.length > 0);
    const photoAlbums = new Map<string, string>();
    for (const album of albums) for (const photo of album.photos) if (photo.photoId !== undefined) photoAlbums.set(photo.photoId, album.albumId);

    // Downloads need no redirect table, and which program sections render depends on them.
    const download = this.downloads();
    const sectionData = (pages: SectionData['pages'], albumOwners: SectionData['albums']): SectionData => ({
      posts,
      pages,
      programs: IMPORTED_PROGRAMS,
      albums: albumOwners,
      videos: videoMerge.videos,
      // Link groups are built after the table (their hrefs need it); every one is the department's.
      linkGroups: [{ owner: LINK_GROUP_OWNER, links: [] }],
      downloads: download.groups as SectionData['downloads'],
    });
    const sections = renderedSections(sectionData(
      departmentPages.map((page) => ({ id: page.id, section: page.section, owner: 'department', hasBlocks: page.body !== undefined })),
      albums,
    ));

    this.lookups = {
      sections,
      posts: new Map(posts.map((post) => [post.id, { channel: post.channel, owner: post.owner }])),
      albums: new Set(albums.map((album) => album.albumId)),
      photoAlbums,
      departmentPages: new Map(departmentPageSpecs().filter((spec) => spec.legacyId !== undefined).map((spec) => [spec.legacyId!, spec.id])),
      organizationPageId: departmentPageSpecs()[0]!.id,
    };

    for (const album of albumSightings.filter((sighting) => sighting.photos.length === 0)) {
      const cover = albumCovers.get(album.albumId)?.src;
      this.report.emptyAlbums.push({
        album: album.albumId,
        title: album.title,
        owner: album.owner,
        ...(cover === undefined ? {} : { cover: safeDecode(cover.replace(/^(?:\.\.\/)+/, '/')) }),
        redirect: redirectTarget({ kind: 'album', albumId: album.albumId, owner: album.owner }, this.lookups),
      });
    }

    // Links need the redirect table, so it is built before any body is converted.
    for (const { page, view } of this.pages) {
      if (view.kind === 'download-file') {
        const fileName = downloadFileName(page.location);
        const copied = fileName === undefined ? undefined : download.copied.get(fileName);
        if (fileName !== undefined) this.redirects.addDownload(fileName, copied === undefined ? redirectTarget(view, this.lookups) : `/${copied}`);
      }
      this.redirects.addExact(page.location.path, redirectTarget(view, this.lookups));
    }
    // Directory roots that were never saved as pages but are obvious entry points.
    for (const [alias, target] of LEGACY_ENTRY_ALIASES) {
      if (!this.redirects.has(alias)) this.redirects.addExact(alias, target);
    }
    const uncovered = this.pages.filter(({ page }) => this.redirects.resolve(page.location.path, page.location.query) === undefined);
    if (uncovered.length > 0) {
      throw new LegacyImportError(`Walked pages without a redirect:\n${uncovered.map(({ page }) => formatLegacyLocation(page.location)).join('\n')}`);
    }

    const links = this.linkGroups();
    if (this.options.probeHttps) {
      this.httpsUpgrades = await probeHttpsUpgrades(this.collectHttpHosts(posts, departmentPages, links.httpHosts), this.httpsUpgrades);
      writeHttpsUpgrades(this.httpsUpgrades);
      // Re-run the link pass so the fresh probe result applies everywhere.
      this.report.links.http.length = 0;
      this.report.links.upgraded.length = 0;
      this.report.links.repaired.length = 0;
      this.report.links.internal.length = 0;
      this.report.links.dropped.length = 0;
    }
    const linkGroups = this.options.probeHttps ? this.linkGroups() : links;

    // Images: convert every referenced image once, in a deterministic order.
    const previous = this.readManifest();
    this.images = new ImageStore({ publicRoot: PUBLIC_ROOT, convert: this.options.images, skipExisting: this.options.skipExisting, previous: previous.images });
    for (const page of departmentPages) {
      const where = `page ${page.id}`;
      if (page.portraitSrc !== undefined) await this.prepareImage(page.portraitSrc, page.page, 'page', where);
      for (const image of elements(page.body?.querySelectorAll('img[src]') ?? [])) await this.prepareImage(image.getAttribute('src') ?? '', page.page, 'page', where);
    }
    for (const post of [...posts].sort((left, right) => Number(left.id) - Number(right.id))) {
      const where = `post ${post.id}`;
      const category: ImageCategory = post.channel === 'honors' ? 'board' : 'article';
      if (post.coverSrc !== undefined) await this.prepareImage(post.coverSrc, post.coverPage, category, where);
      for (const image of elements(post.body?.querySelectorAll('img[src]') ?? [])) await this.prepareImage(image.getAttribute('src') ?? '', post.page, category, where);
    }
    const albumPages = new Map(albumSightings.map((album) => [album.albumId, this.pages.find((entry) => entry.page.relativeFile === album.page)!.page]));
    for (const album of albums) {
      const page = albumPages.get(album.albumId)!;
      const cover = albumCovers.get(album.albumId);
      if (cover !== undefined) await this.prepareImage(cover.src, cover.page, 'album', `album ${album.albumId} cover`);
      for (const photo of album.photos) await this.prepareImage(photo.src, page, 'album', `album ${album.albumId}`);
    }

    // Assemble the three bootstrap files.
    const postRecords = [...posts].sort((left, right) => Number(left.id) - Number(right.id)).map((post) => {
      const where = `post ${post.id}`;
      const cover = this.media(post.coverPage, post.coverSrc);
      const body = this.convertBody(post.body, post.page, post.title, where);
      this.notePersonalData(post, body);
      return {
        id: post.id,
        channel: post.channel,
        categoryId: post.categoryId,
        owner: post.owner,
        ...(post.audiences.length === 0 ? {} : { audiences: post.audiences }),
        publishedOn: post.publishedOn,
        pinned: false,
        title: localized(post.title),
        ...(cover === undefined ? {} : { cover: cover.media }),
        body: { zh: body },
        attachments: [],
      };
    });
    const pageRecords = departmentPages.map((page) => {
      const portrait = this.media(page.page, page.portraitSrc);
      return {
        id: page.id,
        section: page.section,
        owner: 'department',
        order: page.order,
        title: localized(page.title),
        ...(page.summary === undefined ? {} : { summary: localized(page.summary) }),
        ...(portrait === undefined ? {} : { portrait: portrait.media }),
        body: { zh: this.convertBody(page.body, page.page, page.title, `page ${page.id}`) },
      };
    });
    const albumRecords = albums.map((album) => {
      const page = albumPages.get(album.albumId)!;
      const coverSighting = albumCovers.get(album.albumId);
      const cover = coverSighting === undefined ? undefined : this.media(coverSighting.page, coverSighting.src);
      const date = albumDate(album);
      const usedIds = new Set<string>();
      const photos = album.photos.flatMap((photo, index) => {
        const media = this.media(page, photo.src);
        if (media === undefined) return [];
        let id = photo.photoId ?? `photo-${index + 1}`;
        if (usedIds.has(id)) id = `${id}-${index + 1}`;
        usedIds.add(id);
        const caption = photo.title.length > 0 && photo.title !== album.title ? truncate(photo.title, TEXT_LIMITS.caption) : undefined;
        return [{
          id,
          media: media.media,
          alt: localized(truncate(caption ?? `${album.title} — 照片 ${index + 1}`, TEXT_LIMITS.alt)),
          ...(caption === undefined ? {} : { caption: localized(caption) }),
          width: media.width,
          height: media.height,
        }];
      });
      return {
        id: album.albumId,
        owner: album.owner,
        title: localized(truncate(album.title, TEXT_LIMITS.title)),
        ...(date === undefined ? {} : { date }),
        ...(cover === undefined ? {} : { cover: cover.media }),
        photos,
      };
    });

    const postsFile = { version: 1 as const, posts: postRecords };
    const departmentFile = { version: 1 as const, pages: pageRecords, programs: [...IMPORTED_PROGRAMS], linkGroups: linkGroups.groups, downloads: download.groups };
    const galleryFile = { version: 1 as const, albums: albumRecords, videos: videoMerge.videos };
    this.validate(postsFile, departmentFile, galleryFile);
    this.assertSections(sections, {
      posts: postRecords,
      pages: pageRecords.map((page) => ({ id: page.id, section: page.section, owner: page.owner, hasBlocks: page.body.zh.length > 0 })),
      programs: IMPORTED_PROGRAMS,
      albums: albumRecords,
      videos: videoMerge.videos,
      linkGroups: linkGroups.groups as SectionData['linkGroups'],
      downloads: download.groups as SectionData['downloads'],
    });

    // Every converted old-site image keeps working at its old URL.
    const manifest = this.images.manifest();
    for (const entry of manifest.images) if (entry.source.startsWith('/')) this.redirects.addExact(entry.source, `/${entry.path}`);

    this.writeJson('posts.json', postsFile);
    this.writeJson('departmentInfo.json', departmentFile);
    this.writeJson('gallery.json', galleryFile);
    this.writeJson('images.json', manifest);
    this.writeJson('redirects.json', this.redirects.table());
    const pruned = this.options.images ? this.images.pruneOutputs() : [];

    const reportPath = resolve(REPO_ROOT, this.options.report);
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, renderReport(this.reportData({ posts, pageRecords, albumRecords, albumSightings, videoMerge, linkGroups, download, manifest })), 'utf8');
    console.log(`Imported ${postRecords.length} posts, ${pageRecords.length} pages, ${albumRecords.length} albums, ${videoMerge.videos.length} videos, ${manifest.images.length} images; ${Object.keys(this.redirects.table().exact).length} redirects.`);
    if (pruned.length > 0) console.log(`Removed ${pruned.length} stale converted images.`);
    console.log(`Report: ${relative(REPO_ROOT, reportPath).split(sep).join('/')}`);
  }

  /** The redirect table's anchors were chosen before bodies were converted; the output must agree. */
  private assertSections(expected: ReadonlySet<string>, records: SectionData): void {
    const actual = renderedSections(records);
    const differ = [...new Set([...expected, ...actual])].filter((key) => expected.has(key) !== actual.has(key));
    if (differ.length > 0) throw new LegacyImportError(`Rendered sections changed after conversion: ${differ.sort().join(', ')}`);
  }

  private collectHttpHosts(posts: readonly DraftPost[], pages: readonly DraftPage[], linkHosts: readonly string[]): string[] {
    const hosts = new Set(linkHosts);
    for (const item of [...posts, ...pages]) {
      for (const anchor of elements(item.body?.querySelectorAll('a[href]') ?? [])) {
        const outcome = resolveLegacyHref(anchor.getAttribute('href') ?? '', {
          pageRelativeFile: item.page.relativeFile,
          resolveLegacy: (location) => this.resolveLegacyLocation(location),
          httpsUpgrades: { version: 1, hosts: {} },
        });
        if (outcome.status === 'http') {
          const host = httpHost(outcome.href);
          if (host !== undefined) hosts.add(host);
        }
      }
    }
    return [...hosts];
  }

  private notePersonalData(post: DraftPost, body: readonly ImportedBlock[]): void {
    if (!/榜單|甄選結果|錄取|名單/.test(post.title)) return;
    const text = blocksText(body);
    const images = body.filter((block) => block.type === 'image').length;
    const masked = /\p{Script=Han}[○〇Ｏ◯OＯ]\p{Script=Han}/u.test(text);
    const note = text.trim().length === 0
      ? `names, if any, are only in ${images} image(s); review the images`
      : masked ? 'text lists names masked with ○' : 'text may list names unmasked; review';
    this.report.personalData.push({ where: `post ${post.id}`, title: post.title, note });
  }

  private readManifest(): ImageManifest {
    const file = join(LEGACY_DATA, 'images.json');
    if (!existsSync(file)) return { version: 1, settings: { maxEdge: 1600, quality: 78, effort: 6 }, images: [] };
    return JSON.parse(readFileSync(file, 'utf8')) as ImageManifest;
  }

  private writeJson(name: string, value: unknown): void {
    writeFileSync(join(LEGACY_DATA, name), stableStringify(value), 'utf8');
  }

  private validate(posts: { version: 1; posts: unknown[] }, department: { version: 1; pages: unknown[]; programs: { id: string }[]; linkGroups: unknown[]; downloads: unknown[] }, gallery: { version: 1; albums: unknown[]; videos: unknown[] }): void {
    const payloads = [
      ['posts', postsSourceFrom(posts)],
      ['department_info', departmentInfoSourceFrom(department)],
      ['gallery', gallerySourceFrom(gallery)],
    ] as const;
    for (const [kind, payload] of payloads) {
      const result = CMS_PAYLOAD_REGISTRY[kind].publishedSchema.safeParse(JSON.parse(stableStringify(payload)));
      if (!result.success) {
        const issues = result.error.issues.slice(0, 20).map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
        throw new LegacyImportError(`Imported ${kind} payload fails the published contract:\n${issues}`);
      }
    }
  }

  private reportData(input: {
    posts: readonly DraftPost[];
    pageRecords: readonly unknown[];
    albumRecords: readonly { photos: readonly unknown[] }[];
    albumSightings: readonly AlbumSighting[];
    videoMerge: ReturnType<typeof mergeVideos>;
    linkGroups: { groups: unknown[]; count: number };
    download: { groups: unknown[]; count: number };
    manifest: ImageManifest;
  }): ReportData {
    const table = this.redirects.table();
    const usedSources = new Set(input.manifest.images.map((entry) => entry.source));
    const droppedSources = new Set(this.report.droppedImages.map((entry) => entry.src));
    const unreferenced = walkUploadFiles(this.options.mirror).filter((path) => !usedSources.has(path) && !droppedSources.has(path));
    const byChannel = (channel: PostChannel) => input.posts.filter((post) => post.channel === channel).length;
    const counts: CountRow[] = [
      ['Mirror pages walked', this.pages.length],
      ['Posts (all channels)', input.posts.length],
      ['Posts: announcements (news)', byChannel('news')],
      ['Posts: honors', byChannel('honors')],
      ['Posts: center articles', byChannel('center')],
      ['Department pages', input.pageRecords.length],
      ['Programs (taxonomy; no legacy program pages had content)', 5],
      ['Link groups', input.linkGroups.groups.length],
      ['Links', input.linkGroups.count],
      ['Download groups', input.download.groups.length],
      ['Downloads', input.download.count],
      ['Albums imported', input.albumRecords.length],
      ['Album photos', input.albumRecords.reduce((sum, album) => sum + album.photos.length, 0)],
      ['Empty albums skipped', this.report.emptyAlbums.length],
      ['Videos', input.videoMerge.videos.length],
      ['Images converted (WebP)', input.manifest.images.length],
      ['Image references dropped', this.report.droppedImages.length],
      ['Redirects (exact)', Object.keys(table.exact).length],
      ['Redirects (query rules)', table.query.length],
    ];
    const postsByCategory: CountRow[] = POST_CATEGORY_IDS.map((id) => {
      const label = POST_CATEGORY_TAXONOMY.find((category) => category.id === id)?.label.zh ?? id;
      return [`${POST_CATEGORY_CHANNELS[id]} / ${id} (${label})`, input.posts.filter((post) => post.categoryId === id).length] as const;
    });
    const titleOf = new Map(input.videoMerge.videos.map((video) => [video.youtubeId, video.title.zh]));
    const emptyPages = this.pages
      .filter(({ page }) => /\.html?$/i.test(page.relativeFile))
      .filter(({ page }) => elements(this.document(page).querySelectorAll('h5')).some((heading) => (heading.textContent ?? '').includes('很抱歉')))
      .map(({ page }) => formatLegacyLocation(page.location));
    return {
      mirrorName: basename(this.options.mirror.replace(/[\\/]+$/, '')),
      counts,
      postsByCategory,
      datesEstimated: this.report.datesEstimated,
      ownerInference: this.report.ownerInference,
      audienceInference: this.report.audienceInference,
      images: {
        dropped: this.report.droppedImages,
        generatedAlts: [...this.report.generatedAlts].map(([where, count]) => ({ where, count })),
        unreferenced,
        totalBytes: input.manifest.images.reduce((sum, entry) => sum + entry.bytes, 0),
      },
      links: this.report.links,
      tables: this.report.tables,
      headings: this.report.headings,
      posterOnly: this.report.posterOnly,
      emptyAlbums: this.report.emptyAlbums,
      videos: {
        placeholders: input.videoMerge.skippedPlaceholders.map((sighting) => ({ page: sighting.page, youtubeId: sighting.youtubeId, title: sighting.title })),
        ownerConflicts: input.videoMerge.ownerConflicts.map((conflict) => ({ ...conflict, title: titleOf.get(conflict.youtubeId) ?? '' })),
      },
      downloads: { copied: this.report.downloadsCopied, missing: this.report.downloadsMissing, emptyGroups: this.report.emptyDownloadGroups },
      emptyPages: [...this.report.emptyPages, ...emptyPages],
      skippedContent: [
        'Home-page banners (UploadFile/ADV): promotional slides that duplicate announcements; not imported.',
        'Per-photo pages (student/album/ALB0x/<id>, center/album/ELB0x/<id>): rendered empty; redirected to their album.',
        'Contact page: the new site keeps its own verified contact section; redirected to /#contact.',
        'Announcement list excerpts and sidebar widgets: derived from the articles themselves.',
      ],
      roster: (() => {
        const page = this.pagesOf('department-page').find((entry) => entry.view.legacyId === 31);
        const legacy = page === undefined ? [] : readLegacyRoster(blocksTextOf(this.document(page.page)));
        return { legacy, diff: diffRoster(legacy, currentAdminRoster()) };
      })(),
      personalData: this.report.personalData,
    };
  }
}

/** The year of an upload folder in image paths: `【2024年】`, `【2025-2026年】`, `/ARTICLE/2024/`. */
function folderYearOf(paths: readonly string[]): string | undefined {
  for (const path of paths) {
    const match = /【(20\d{2})(?:-20\d{2})?年】|\/(?:ARTICLE|ALBUM|ABLUM)\/(20\d{2})\//i.exec(path);
    const year = match?.[1] ?? match?.[2];
    if (year !== undefined) return year;
  }
  return undefined;
}

/** Copies an element into its own small document so the (large) page document can be released. */
function detach(element: LegacyElement): LegacyElement {
  // One shared document: every jsdom window costs megabytes, whatever it holds.
  fragmentDocument ??= parseHtml('<!doctype html><html><body></body></html>');
  const copy = fragmentDocument.createElement('div');
  copy.innerHTML = element.innerHTML;
  return copy;
}

let fragmentDocument: LegacyDocument | undefined;

function blocksTextOf(document: LegacyDocument): string {
  return document.querySelector('.post__desc')?.textContent ?? '';
}

/** Every `/UploadFile/…` file in the mirror, as decoded old paths. */
function walkUploadFiles(mirror: string): string[] {
  const root = join(mirror, 'UploadFile');
  if (!existsSync(root)) return [];
  const result: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else result.push(`/${relative(mirror, file).split(sep).join('/')}`);
    }
  };
  visit(root);
  return result.sort();
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  await new Importer(options).run();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
