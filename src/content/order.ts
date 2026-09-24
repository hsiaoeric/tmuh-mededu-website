import {
  CMS_DOCUMENT_KINDS,
  type ContentIdentity,
  type PublishedContent,
  type PublishedContentBatch,
  type PublishedContentRowFailure,
} from './domain';
import { ContentVersionError } from './errors';

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function comparePublishedContent(
  left: PublishedContent,
  right: PublishedContent,
): number {
  const kindOrder =
    CMS_DOCUMENT_KINDS.indexOf(left.kind) - CMS_DOCUMENT_KINDS.indexOf(right.kind);
  return kindOrder === 0 ? compareText(left.stableKey, right.stableKey) : kindOrder;
}

function contentKey(content: ContentIdentity): string {
  return `${content.kind}:${content.stableKey}`;
}

type MergedDocumentBase = {
  readonly identity: ContentIdentity;
  readonly content: PublishedContent;
};

export type MergedDocument = MergedDocumentBase & (
  | { readonly outcome: 'remote'; readonly source: 'supabase'; readonly freshness: 'fresh' }
  | { readonly outcome: 'snapshot-current'; readonly source: 'snapshot'; readonly freshness: 'fresh' }
  | { readonly outcome: 'older-fallback'; readonly source: 'snapshot'; readonly freshness: 'stale'; readonly error: ContentVersionError }
  | { readonly outcome: 'invalid-fallback'; readonly source: 'snapshot'; readonly freshness: 'stale'; readonly failures: readonly PublishedContentRowFailure[] }
  | { readonly outcome: 'missing-fallback'; readonly source: 'snapshot'; readonly freshness: 'stale' }
);

export type PublishedContentMerge = {
  readonly content: readonly PublishedContent[];
  readonly documents: readonly MergedDocument[];
  readonly unassignedFailures: readonly PublishedContentRowFailure[];
};

function identityOf(content: PublishedContent): ContentIdentity {
  return content;
}

export function mergePublishedContent(
  snapshot: readonly PublishedContent[],
  batch: PublishedContentBatch,
): PublishedContentMerge {
  const remote = new Map(batch.content.map((content) => [contentKey(content), content]));
  const failures = new Map<string, PublishedContentRowFailure[]>();
  for (const failure of batch.failures) {
    if (failure.identity === null) continue;
    const key = contentKey(failure.identity);
    const grouped = failures.get(key) ?? [];
    grouped.push(failure);
    failures.set(key, grouped);
  }
  const documents: MergedDocument[] = snapshot.map((content) => {
    const identity = identityOf(content);
    const key = contentKey(identity);
    const rowFailures = failures.get(key);
    if (rowFailures !== undefined) {
      return { identity, content, outcome: 'invalid-fallback', source: 'snapshot', freshness: 'stale', failures: rowFailures };
    }
    const refreshed = remote.get(key);
    if (refreshed === undefined) {
      return { identity, content, outcome: 'missing-fallback', source: 'snapshot', freshness: 'stale' };
    }
    remote.delete(key);
    if (refreshed.version > content.version) {
      return { identity, content: refreshed, outcome: 'remote', source: 'supabase', freshness: 'fresh' };
    }
    if (refreshed.version === content.version) {
      return { identity, content, outcome: 'snapshot-current', source: 'snapshot', freshness: 'fresh' };
    }
    return {
      identity,
      content,
      outcome: 'older-fallback',
      source: 'snapshot',
      freshness: 'stale',
      error: new ContentVersionError(identity, content.version, refreshed.version),
    };
  });
  for (const content of remote.values()) {
    documents.push({
      identity: identityOf(content),
      content,
      outcome: 'remote',
      source: 'supabase',
      freshness: 'fresh',
    });
  }
  documents.sort((left, right) => comparePublishedContent(left.content, right.content));
  return {
    content: documents.map((document) => document.content),
    documents,
    unassignedFailures: batch.failures.filter((failure) => failure.identity === null),
  };
}
