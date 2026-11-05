import { useEffect, useMemo, useRef, useState } from 'react';
import type { Json } from '@/content/database.types';
import type { ArchiveEditorKind } from './archiveTypes';

/** The archive collections whose item ids appear in public URLs. */
export type ArchiveIdCollection = 'posts' | 'pages' | 'albums' | 'videos' | 'linkGroups' | 'downloads';

export type ArchiveLockedIds = { readonly [C in ArchiveIdCollection]?: ReadonlySet<string> };

const COLLECTIONS_BY_KIND: Readonly<Record<ArchiveEditorKind, readonly ArchiveIdCollection[]>> = {
  posts: ['posts'],
  department_info: ['pages', 'linkGroups', 'downloads'],
  gallery: ['albums', 'videos'],
};

function idsOf(value: Json | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => (
    item !== null && typeof item === 'object' && !Array.isArray(item) && typeof item.id === 'string' ? [item.id] : []
  ));
}

/** Ids of every item in the published revision, which public URLs may already use. */
export function publishedArchiveIds(kind: ArchiveEditorKind, published: Json | null): ArchiveLockedIds {
  const payload = published !== null && typeof published === 'object' && !Array.isArray(published) ? published : {};
  return Object.fromEntries(COLLECTIONS_BY_KIND[kind].map((collection) => [collection, new Set(idsOf(payload[collection]))]));
}

type LegacyRedirectTable = {
  readonly exact?: Readonly<Record<string, string>>;
  readonly query?: readonly { readonly to: string }[];
};

const POST_TARGET = /^\/(?:announcements|honors|digital-materials\/articles|centers\/[a-z0-9-]+\/articles)\/([a-z0-9-]+)$/u;
const PAGE_TARGET = /^\/department\/([a-z0-9-]+)$/u;
const ALBUM_TARGET = /^\/gallery\/([a-z0-9-]+)$/u;

/**
 * Ids that a redirect from the old site points at. Changing one would turn an old bookmark or
 * search result into a "not found" page, so they stay fixed even before they are published.
 */
export function legacyArchiveIds(table: LegacyRedirectTable): ArchiveLockedIds {
  const posts = new Set<string>();
  const pages = new Set<string>();
  const albums = new Set<string>();
  const targets = [...Object.values(table.exact ?? {}), ...(table.query ?? []).map((rule) => rule.to)];
  for (const target of targets) {
    const path = target.replace(/[?#].*$/u, '');
    const post = POST_TARGET.exec(path)?.[1];
    if (post !== undefined) posts.add(post);
    const page = PAGE_TARGET.exec(path)?.[1];
    if (page !== undefined) pages.add(page);
    const album = ALBUM_TARGET.exec(path)?.[1];
    if (album !== undefined) albums.add(album);
  }
  return { posts, pages, albums };
}

export function mergeLockedIds(...sources: readonly ArchiveLockedIds[]): ArchiveLockedIds {
  const merged: Partial<Record<ArchiveIdCollection, Set<string>>> = {};
  for (const source of sources) {
    for (const [collection, ids] of Object.entries(source) as [ArchiveIdCollection, ReadonlySet<string>][]) {
      const target = merged[collection] ?? new Set<string>();
      ids.forEach((id) => target.add(id));
      merged[collection] = target;
    }
  }
  return merged;
}

let legacyIdsPromise: Promise<ArchiveLockedIds> | null = null;

/** The redirect table is loaded on first use, so it stays out of every other admin page. */
function loadLegacyIds(): Promise<ArchiveLockedIds> {
  legacyIdsPromise ??= import('@/data/legacy/redirects.json').then(
    (module) => legacyArchiveIds(module.default as LegacyRedirectTable),
    () => ({}),
  );
  return legacyIdsPromise;
}

/**
 * Locked ids for an archive document: published ones plus legacy redirect targets. `null` while
 * the redirect table loads, during which editors treat every existing id as locked.
 */
export function useArchiveLockedIds(kind: ArchiveEditorKind, published: Json | null): ArchiveLockedIds | null {
  const [legacy, setLegacy] = useState<ArchiveLockedIds | null>(null);
  useEffect(() => {
    let active = true;
    void loadLegacyIds().then((ids) => { if (active) setLegacy(ids); });
    return () => { active = false; };
  }, []);
  return useMemo(
    () => (legacy === null ? null : mergeLockedIds(publishedArchiveIds(kind, published), legacy)),
    [kind, legacy, published],
  );
}

export type IdLock = {
  readonly isLocked: (id: string) => boolean;
  /** Records an id this editor session created, which stays editable until it is published. */
  readonly markCreated: (id: string) => void;
};

/**
 * Whether an item's id can still change. While the locked set is loading (`null`) only items
 * created in this session are editable; with no locked set at all (`undefined`) nothing is locked.
 */
export function useIdLock(collection: ArchiveIdCollection, lockedIds: ArchiveLockedIds | null | undefined): IdLock {
  const created = useRef(new Set<string>());
  return useMemo(() => ({
    isLocked: (id: string) => {
      if (created.current.has(id)) return lockedIds?.[collection]?.has(id) ?? false;
      if (lockedIds === null) return true;
      return lockedIds?.[collection]?.has(id) ?? false;
    },
    markCreated: (id: string) => { created.current.add(id); },
  }), [collection, lockedIds]);
}
