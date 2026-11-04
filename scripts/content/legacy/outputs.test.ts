import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { INTERNAL_PATH_PATTERN, isLocalFilePath } from '../../../src/content/contracts/blocks';
import { CENTER_SLUG } from '../../../src/app/routes';
import { PROGRAM_IDS } from '../../../src/content/contracts/archiveIds';

// Consistency of the committed importer output (src/data/legacy/*.json, public/assets/legacy,
// public/files/legacy). These checks need no mirror, so they run in the ordinary test suite.

const repo = (path: string) => fileURLToPath(new URL(`../../../${path}`, import.meta.url));
const readJson = <T>(path: string): T => JSON.parse(readFileSync(repo(path), 'utf8')) as T;

type Media = { kind: string; path: string };
const posts = readJson<{ posts: { id: string; channel: string; owner: string; cover?: Media }[] }>('src/data/legacy/posts.json').posts;
const department = readJson<{ pages: { id: string }[]; downloads: { items: { href: string }[] }[] }>('src/data/legacy/departmentInfo.json');
const gallery = readJson<{ albums: { id: string; owner: string }[]; videos: { owner: string }[] }>('src/data/legacy/gallery.json');
const images = readJson<{ images: { source: string; path: string; width: number; height: number; bytes: number }[] }>('src/data/legacy/images.json').images;
const redirects = readJson<{ version: number; exact: Record<string, string>; query: { path: string; key: string; value: string; to: string }[] }>('src/data/legacy/redirects.json');

function collectMediaPaths(value: unknown, found: Set<string>): Set<string> {
  if (Array.isArray(value)) value.forEach((item) => collectMediaPaths(item, found));
  else if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    if (record.kind === 'local' && typeof record.path === 'string') found.add(record.path);
    Object.values(record).forEach((item) => collectMediaPaths(item, found));
  }
  return found;
}

const centerSlugs = new Set(Object.values(CENTER_SLUG));
const postsById = new Map(posts.map((post) => [post.id, post]));
const albumIds = new Set(gallery.albums.map((album) => album.id));
const pageIds = new Set(department.pages.map((page) => page.id));
const owners = new Set(['department', 'faculty_dev', 'clinical_skills', 'ebm', 'holistic', 'med_edu_research', 'digital_materials', ...PROGRAM_IDS]);

/** Fails with the offending target when a redirect names an id the archive does not hold. */
function targetProblem(target: string): string | undefined {
  if (!INTERNAL_PATH_PATTERN.test(target)) return 'not an internal path';
  const [pathAndQuery = ''] = target.split('#');
  const [path = '', query = ''] = pathAndQuery.split('?');
  const owner = /(?:^|&)owner=([^&]+)/.exec(query)?.[1];
  if (owner !== undefined && !owners.has(owner)) return `unknown owner ${owner}`;
  let match: RegExpExecArray | null;
  if ((match = /^\/announcements\/(.+)$/.exec(path)) !== null) return postsById.get(match[1] ?? '')?.channel === 'news' ? undefined : 'no such announcement';
  if ((match = /^\/honors\/(.+)$/.exec(path)) !== null) return postsById.get(match[1] ?? '')?.channel === 'honors' ? undefined : 'no such honor';
  if ((match = /^\/centers\/([^/]+)\/articles\/(.+)$/.exec(path)) !== null) {
    if (!centerSlugs.has(match[1] ?? '')) return 'unknown center slug';
    return postsById.get(match[2] ?? '')?.channel === 'center' ? undefined : 'no such center article';
  }
  if ((match = /^\/digital-materials\/articles\/(.+)$/.exec(path)) !== null) {
    return postsById.get(match[1] ?? '')?.owner === 'digital_materials' ? undefined : 'no such digital materials article';
  }
  if ((match = /^\/centers\/([^/]+)$/.exec(path)) !== null) return centerSlugs.has(match[1] ?? '') ? undefined : 'unknown center slug';
  if ((match = /^\/gallery\/(.+)$/.exec(path)) !== null) return albumIds.has(match[1] ?? '') ? undefined : 'no such album';
  if ((match = /^\/department\/(.+)$/.exec(path)) !== null) return pageIds.has(match[1] ?? '') ? undefined : 'no such department page';
  if ((match = /^\/trainees\/(.+)$/.exec(path)) !== null) return (PROGRAM_IDS as readonly string[]).includes(match[1] ?? '') ? undefined : 'no such program';
  if ((match = /^\/(assets\/legacy\/.+\.webp|files\/legacy\/.+)$/.exec(path)) !== null) return existsSync(repo(`public/${match[1]}`)) ? undefined : 'missing file';
  if (['/', '/department', '/announcements', '/honors', '/trainees', '/gallery', '/videos', '/resources', '/digital-materials'].includes(path)) return undefined;
  return 'unknown route';
}

describe('committed legacy import output', () => {
  it('redirect keys are normalized and every target resolves to imported content', () => {
    expect(redirects.version).toBe(1);
    const problems: string[] = [];
    for (const [from, to] of Object.entries(redirects.exact)) {
      if (from !== from.toLowerCase() || from.endsWith('/') && from !== '/' || from.endsWith('.html') || from.includes('?')) problems.push(`${from}: key not normalized`);
      const problem = targetProblem(to);
      if (problem !== undefined) problems.push(`${from} → ${to}: ${problem}`);
    }
    for (const rule of redirects.query) {
      const problem = targetProblem(rule.to);
      if (problem !== undefined) problems.push(`${rule.path}?${rule.key}=${rule.value} → ${rule.to}: ${problem}`);
    }
    expect(problems).toEqual([]);
  });

  it('every imported post, page and album has a redirect from at least one old URL', () => {
    const targets = new Set(Object.values(redirects.exact));
    const missing = [
      ...posts.map((post) => (post.channel === 'news' ? `/announcements/${post.id}` : post.channel === 'honors' ? `/honors/${post.id}` : undefined))
        .filter((target): target is string => target !== undefined),
      ...gallery.albums.map((album) => `/gallery/${album.id}`),
      ...department.pages.map((page) => `/department/${page.id}`),
    ].filter((target) => !targets.has(target));
    expect(missing).toEqual([]);
  });

  it('every converted image exists, is listed once, and is what the content references', () => {
    const manifestPaths = new Set(images.map((image) => image.path));
    expect(new Set(images.map((image) => image.source)).size).toBe(images.length);
    for (const image of images) {
      expect(image.path).toMatch(/^assets\/legacy\/(?:article|album|board|page)\/[0-9a-f]{20}\.webp$/);
      expect(statSync(repo(`public/${image.path}`)).size).toBe(image.bytes);
      expect(Math.max(image.width, image.height)).toBeLessThanOrEqual(1600);
    }
    const referenced = collectMediaPaths([posts, department, gallery], new Set());
    expect([...referenced].filter((path) => !manifestPaths.has(path))).toEqual([]);
    expect([...manifestPaths].filter((path) => !referenced.has(path))).toEqual([]);
  });

  it('keeps the converted image set within its size budget', () => {
    const unique = new Map(images.map((image) => [image.path, image.bytes]));
    const total = [...unique.values()].reduce((sum, bytes) => sum + bytes, 0);
    expect(total).toBeLessThanOrEqual(25 * 1024 * 1024);
  });

  it('every committed download exists under public/files/legacy', () => {
    for (const item of department.downloads.flatMap((group) => group.items)) {
      if (!isLocalFilePath(item.href)) continue;
      expect(existsSync(repo(`public/${item.href}`)), item.href).toBe(true);
    }
  });

  it('videos and albums belong to known owners', () => {
    for (const owner of [...gallery.albums, ...gallery.videos].map((item) => item.owner)) expect(owners.has(owner), owner).toBe(true);
  });
});
