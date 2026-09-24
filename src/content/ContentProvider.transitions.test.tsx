// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { ContentProvider, useContent, type ContentState } from './ContentProvider';
import type {
  ContentSnapshotRepository,
  PublishedContentBatch,
  PublishedContentRepository,
} from './domain';
import {
  parseSupabaseConfiguration,
  type SupabaseConfiguration,
} from './env';
import committedSnapshot from './generated/cms-snapshot.json';
import { parsePublishedContentRows } from './parsers';
import { createSnapshotRepository } from './snapshotRepository';

const CONFIGURED = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
});
const DISABLED = parseSupabaseConfiguration({});
const INVALID = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: 'https://example.supabase.co',
});

function snapshotRow(version: number) {
  const row = committedSnapshot.find((item) => item.kind === 'news');
  if (row === undefined) throw new TypeError('Missing committed news fixture');
  return { ...row, version };
}

function content(version: number): PublishedContentBatch {
  return { content: parsePublishedContentRows([snapshotRow(version)]), failures: [] };
}

function snapshotRepository(version: number): ContentSnapshotRepository {
  return createSnapshotRepository([snapshotRow(version)]);
}

function deferred<Value>(): {
  readonly promise: Promise<Value>;
  readonly resolve: (value: Value) => void;
} {
  let resolve = (_value: Value): void => {
    throw new TypeError('Deferred promise resolved before initialization');
  };
  const promise = new Promise<Value>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function StateProbe() {
  const state = useContent();
  const first = state.content[0];
  const document = state.documents[0];
  const errorName = state.lifecycle.status === 'failed' ? state.lifecycle.error.name : 'ok';
  return (
    <output data-testid="state">
      {`${document?.outcome ?? 'empty'}:${document?.source ?? 'empty'}:${document?.freshness ?? 'empty'}:${state.lifecycle.status}:${first?.version ?? 'empty'}:${errorName}`}
    </output>
  );
}

type ProviderTreeProps = {
  readonly snapshotRepository: ContentSnapshotRepository;
  readonly remoteRepository: PublishedContentRepository;
  readonly configuration: SupabaseConfiguration;
};

function providerTree({
  snapshotRepository,
  remoteRepository,
  configuration,
}: ProviderTreeProps) {
  return (
    <ContentProvider
      snapshotRepository={snapshotRepository}
      remoteRepository={remoteRepository}
      configuration={configuration}
    >
      <StateProbe />
    </ContentProvider>
  );
}

afterEach(cleanup);

describe('ContentProvider transitions', () => {
  it('correlates lifecycle status with document variants', () => {
    type IdleDocument = Extract<ContentState, {
      readonly lifecycle: { readonly status: 'idle' };
    }>['documents'][number];
    type RefreshingDocument = Extract<ContentState, {
      readonly lifecycle: { readonly status: 'refreshing' };
    }>['documents'][number];
    type ConfigurationFallbackDocument = Extract<ContentState, {
      readonly lifecycle: { readonly status: 'failed'; readonly failure: 'configuration' };
    }>['documents'][number];
    type RequestFallbackDocument = Extract<ContentState, {
      readonly lifecycle: { readonly status: 'failed'; readonly failure: 'request' };
    }>['documents'][number];

    expectTypeOf<IdleDocument['outcome']>().toEqualTypeOf<'committed'>();
    expectTypeOf<RefreshingDocument['outcome']>().toEqualTypeOf<'refreshing'>();
    expectTypeOf<ConfigurationFallbackDocument['outcome']>()
      .toEqualTypeOf<'configuration-fallback'>();
    expectTypeOf<RequestFallbackDocument['outcome']>().toEqualTypeOf<'request-fallback'>();
  });

  it.each([
    { name: 'disabled', configuration: DISABLED, expected: 'committed:snapshot:committed:idle:3:ok' },
    {
      name: 'invalid',
      configuration: INVALID,
      expected: 'configuration-fallback:snapshot:stale:failed:3:ContentConfigurationError',
    },
  ])('restores the current snapshot when configuration becomes $name', async ({
    configuration,
    expected,
  }) => {
    // Given
    const remoteRepository: PublishedContentRepository = {
      listPublished: () => Promise.resolve(content(2)),
    };
    const view = render(providerTree({
      snapshotRepository: snapshotRepository(1),
      remoteRepository,
      configuration: CONFIGURED,
    }));
    await waitFor(() => {
      expect(view.getByTestId('state').textContent).toBe('remote:supabase:fresh:complete:2:ok');
    });

    // When
    view.rerender(providerTree({
      snapshotRepository: snapshotRepository(3),
      remoteRepository,
      configuration,
    }));

    // Then
    await waitFor(() => {
      expect(view.getByTestId('state').textContent).toBe(expected);
    });
  });

  it('does not request remote content when configuration is invalid', async () => {
    // Given
    const listPublished = vi.fn(() => Promise.resolve(content(2)));

    // When
    const view = render(providerTree({
      snapshotRepository: snapshotRepository(1),
      remoteRepository: { listPublished },
      configuration: INVALID,
    }));

    // Then
    await waitFor(() => {
      expect(view.getByTestId('state').textContent)
        .toBe('configuration-fallback:snapshot:stale:failed:1:ContentConfigurationError');
    });
    expect(listPublished).not.toHaveBeenCalled();
  });

  it('refreshes from a changed snapshot while repository and configuration stay stable', async () => {
    // Given
    const refresh = deferred<PublishedContentBatch>();
    const remoteRepository: PublishedContentRepository = {
      listPublished: () => refresh.promise,
    };
    const view = render(providerTree({
      snapshotRepository: snapshotRepository(1),
      remoteRepository,
      configuration: CONFIGURED,
    }));

    // When
    view.rerender(providerTree({
      snapshotRepository: snapshotRepository(2),
      remoteRepository,
      configuration: CONFIGURED,
    }));

    // Then
    await waitFor(() => {
      expect(view.getByTestId('state').textContent).toBe('refreshing:snapshot:refreshing:refreshing:2:ok');
    });
    await act(async () => {
      refresh.resolve(content(3));
      await refresh.promise;
    });
    expect(view.getByTestId('state').textContent).toBe('remote:supabase:fresh:complete:3:ok');
  });

  it('restores the stable snapshot when only the replacement repository fails', async () => {
    // Given
    const stableSnapshot = snapshotRepository(1);
    const initialRepository: PublishedContentRepository = {
      listPublished: () => Promise.resolve(content(2)),
    };
    const failedRepository: PublishedContentRepository = {
      listPublished: () => Promise.reject(new TypeError('network unavailable')),
    };
    const view = render(providerTree({
      snapshotRepository: stableSnapshot,
      remoteRepository: initialRepository,
      configuration: CONFIGURED,
    }));
    await waitFor(() => {
      expect(view.getByTestId('state').textContent).toBe('remote:supabase:fresh:complete:2:ok');
    });

    // When
    view.rerender(providerTree({
      snapshotRepository: stableSnapshot,
      remoteRepository: failedRepository,
      configuration: CONFIGURED,
    }));

    // Then
    await waitFor(() => {
      expect(view.getByTestId('state').textContent)
        .toBe('request-fallback:snapshot:stale:failed:1:ContentRefreshError');
    });
  });

  it('rejects the old completion after the current replacement has completed', async () => {
    // Given
    const stableSnapshot = snapshotRepository(1);
    const replaced = deferred<PublishedContentBatch>();
    const current = deferred<PublishedContentBatch>();
    const replacedRepository: PublishedContentRepository = {
      listPublished: () => replaced.promise,
    };
    const currentRepository: PublishedContentRepository = {
      listPublished: () => current.promise,
    };
    const view = render(providerTree({
      snapshotRepository: stableSnapshot,
      remoteRepository: replacedRepository,
      configuration: CONFIGURED,
    }));

    // When
    view.rerender(providerTree({
      snapshotRepository: stableSnapshot,
      remoteRepository: currentRepository,
      configuration: CONFIGURED,
    }));

    // Then
    await waitFor(() => {
      expect(view.getByTestId('state').textContent).toBe('refreshing:snapshot:refreshing:refreshing:1:ok');
    });
    await act(async () => {
      current.resolve(content(3));
      await current.promise;
    });
    expect(view.getByTestId('state').textContent).toBe('remote:supabase:fresh:complete:3:ok');
    await act(async () => {
      replaced.resolve(content(9));
      await replaced.promise;
    });
    expect(view.getByTestId('state').textContent).toBe('remote:supabase:fresh:complete:3:ok');
  });
});
