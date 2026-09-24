import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  CmsDocumentKind,
  ContentSnapshotRepository,
  PublishedContent,
  PublishedContentRepository,
} from './domain';
import {
  ContentBoundaryError,
  ContentConfigurationError,
  ContentRefreshError,
  ContentRepositoryError,
  type ContentError,
} from './errors';
import { parseSupabaseConfiguration, type SupabaseConfiguration } from './env';
import { getPublicSupabaseClient } from './supabaseClient';
import { createSupabaseContentRepository } from './supabaseRepository';
import { committedSnapshotRepository } from './snapshotRepository';
import { mergePublishedContent } from './order';
import {
  committedContentState,
  completeContentState,
  configurationFailedContentState,
  refreshingContentState,
  requestFailedContentState,
  type ContentState,
} from './contentState';
import type { PublicMediaLocation } from './adapters';

export type { ContentState } from './contentState';

type ContentProviderProps = {
  readonly children: ReactNode;
  readonly snapshotRepository?: ContentSnapshotRepository;
  readonly remoteRepository?: PublishedContentRepository;
  readonly configuration?: SupabaseConfiguration;
};

type ContentContextValue = {
  readonly state: ContentState;
  readonly media: PublicMediaLocation;
};

const ContentContext = createContext<ContentContextValue | null>(null);
const DEFAULT_CONFIGURATION = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});

function refreshError(error: unknown): ContentError {
  if (
    error instanceof ContentConfigurationError ||
    error instanceof ContentBoundaryError ||
    error instanceof ContentRepositoryError ||
    error instanceof ContentRefreshError
  ) {
    return error;
  }
  if (error instanceof Error) {
    return new ContentRefreshError(error.message);
  }
  return new ContentRefreshError('Unknown CMS refresh failure');
}

export function ContentProvider({
  children,
  snapshotRepository = committedSnapshotRepository,
  remoteRepository,
  configuration = DEFAULT_CONFIGURATION,
}: ContentProviderProps) {
  const snapshot = useMemo(() => snapshotRepository.listPublished(), [snapshotRepository]);
  const repository = useMemo(() => {
    if (remoteRepository !== undefined) return remoteRepository;
    if (configuration.kind !== 'configured') return null;
    return createSupabaseContentRepository(() =>
      getPublicSupabaseClient(configuration.config),
    );
  }, [configuration, remoteRepository]);
  const [state, setState] = useState<ContentState>(() => committedContentState(snapshot));
  const media = useMemo<PublicMediaLocation>(() => ({
    baseUrl: import.meta.env.BASE_URL,
    supabaseUrl: configuration.kind === 'configured'
      ? configuration.config.url.replace(/\/+$/, '')
      : '',
  }), [configuration]);
  const value = useMemo(() => ({ state, media }), [media, state]);

  useEffect(() => {
    if (configuration.kind === 'disabled') {
      startTransition(() => {
        setState(committedContentState(snapshot));
      });
      return undefined;
    }
    if (configuration.kind === 'invalid') {
      startTransition(() => {
        setState(configurationFailedContentState(snapshot, configuration.error));
      });
      return undefined;
    }
    if (repository === null) return undefined;

    const controller = new AbortController();
    let active = true;
    startTransition(() => {
      setState(refreshingContentState(snapshot));
    });

    void repository.listPublished(controller.signal).then(
      (refreshed) => {
        if (!active || controller.signal.aborted) return;
        startTransition(() => {
          setState(completeContentState(mergePublishedContent(snapshot, refreshed)));
        });
      },
      (error: unknown) => {
        if (!active || controller.signal.aborted) return;
        startTransition(() => {
          setState(requestFailedContentState(snapshot, refreshError(error)));
        });
      },
    );

    return () => {
      active = false;
      controller.abort();
    };
  }, [configuration, repository, snapshot]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

function useContentContext(): ContentContextValue {
  const value = useContext(ContentContext);
  if (value === null) {
    throw new TypeError('useContent must be used inside ContentProvider');
  }
  return value;
}

export function useContent(): ContentState {
  return useContentContext().state;
}

export function useContentMediaLocation(): PublicMediaLocation {
  return useContentContext().media;
}

export function useContentDocument(
  kind: CmsDocumentKind,
  stableKey: string,
): PublishedContent | undefined {
  return useContent().content.find(
    (content) => content.kind === kind && content.stableKey === stableKey,
  );
}

/**
 * Renders children against the current published content with one document replaced, so public
 * components can show an unpublished draft exactly as they would render it live.
 */
export function ContentPreviewProvider({ override, children }: {
  readonly override: PublishedContent;
  readonly children: ReactNode;
}) {
  const parent = useContentContext();
  const value = useMemo<ContentContextValue>(() => ({
    media: parent.media,
    state: {
      ...parent.state,
      content: parent.state.content.map((content) => (
        content.kind === override.kind && content.stableKey === override.stableKey ? override : content
      )),
    },
  }), [override, parent]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}
