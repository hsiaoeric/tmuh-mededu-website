import type {
  ContentIdentity,
  PublishedContent,
  PublishedContentRowFailure,
} from './domain';
import type { ContentConfigurationError, ContentError } from './errors';
import type { MergedDocument, PublishedContentMerge } from './order';

type SnapshotDocumentBase = {
  readonly identity: ContentIdentity;
  readonly content: PublishedContent;
};

type SnapshotDocument<
  Outcome extends 'committed' | 'refreshing' | 'configuration-fallback' | 'request-fallback',
  Freshness extends 'committed' | 'refreshing' | 'stale',
> = SnapshotDocumentBase & {
  readonly outcome: Outcome;
  readonly source: 'snapshot';
  readonly freshness: Freshness;
};

export type CommittedDocumentState = SnapshotDocument<'committed', 'committed'>;
export type RefreshingDocumentState = SnapshotDocument<'refreshing', 'refreshing'>;
export type ConfigurationFallbackDocumentState = SnapshotDocument<'configuration-fallback', 'stale'>;
export type RequestFallbackDocumentState = SnapshotDocument<'request-fallback', 'stale'>;

export type ContentDocumentState =
  | MergedDocument
  | CommittedDocumentState
  | RefreshingDocumentState
  | ConfigurationFallbackDocumentState
  | RequestFallbackDocumentState;

type ContentStateBase = {
  readonly content: readonly PublishedContent[];
};

type IdleContentState = ContentStateBase & {
  readonly documents: readonly CommittedDocumentState[];
  readonly lifecycle: { readonly status: 'idle' };
};

type RefreshingContentState = ContentStateBase & {
  readonly documents: readonly RefreshingDocumentState[];
  readonly lifecycle: { readonly status: 'refreshing' };
};

type CompleteContentState = ContentStateBase & {
  readonly documents: readonly MergedDocument[];
  readonly lifecycle: {
    readonly status: 'complete';
    readonly unassignedFailures: readonly PublishedContentRowFailure[];
  };
};

type ConfigurationFailedContentState = ContentStateBase & {
  readonly documents: readonly ConfigurationFallbackDocumentState[];
  readonly lifecycle: {
    readonly status: 'failed';
    readonly failure: 'configuration';
    readonly error: ContentConfigurationError;
  };
};

type RequestFailedContentState = ContentStateBase & {
  readonly documents: readonly RequestFallbackDocumentState[];
  readonly lifecycle: {
    readonly status: 'failed';
    readonly failure: 'request';
    readonly error: ContentError;
  };
};

export type ContentState =
  | IdleContentState
  | RefreshingContentState
  | CompleteContentState
  | ConfigurationFailedContentState
  | RequestFailedContentState;

export type ContentLifecycle = ContentState['lifecycle'];

function snapshotDocuments<
  Outcome extends 'committed' | 'refreshing' | 'configuration-fallback' | 'request-fallback',
  Freshness extends 'committed' | 'refreshing' | 'stale',
>(
  content: readonly PublishedContent[],
  outcome: Outcome,
  freshness: Freshness,
): readonly SnapshotDocument<Outcome, Freshness>[] {
  return content.map((document) => ({
    identity: document,
    content: document,
    outcome,
    source: 'snapshot',
    freshness,
  }));
}

export function committedContentState(content: readonly PublishedContent[]): IdleContentState {
  return {
    content,
    documents: snapshotDocuments(content, 'committed', 'committed'),
    lifecycle: { status: 'idle' },
  };
}

export function refreshingContentState(content: readonly PublishedContent[]): RefreshingContentState {
  return {
    content,
    documents: snapshotDocuments(content, 'refreshing', 'refreshing'),
    lifecycle: { status: 'refreshing' },
  };
}

export function completeContentState(merge: PublishedContentMerge): CompleteContentState {
  return {
    content: merge.content,
    documents: merge.documents,
    lifecycle: { status: 'complete', unassignedFailures: merge.unassignedFailures },
  };
}

export function configurationFailedContentState(
  content: readonly PublishedContent[],
  error: ContentConfigurationError,
): ConfigurationFailedContentState {
  return {
    content,
    documents: snapshotDocuments(content, 'configuration-fallback', 'stale'),
    lifecycle: { status: 'failed', failure: 'configuration', error },
  };
}

export function requestFailedContentState(
  content: readonly PublishedContent[],
  error: ContentError,
): RequestFailedContentState {
  return {
    content,
    documents: snapshotDocuments(content, 'request-fallback', 'stale'),
    lifecycle: { status: 'failed', failure: 'request', error },
  };
}
