// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PublishedContentRepository } from './domain';
import { ContentProvider, useContent } from './ContentProvider';
import { parseSupabaseConfiguration, type SupabaseConfig } from './env';
import { parsePublishedContentRows } from './parsers';
import { createSnapshotRepository } from './snapshotRepository';
import committedSnapshot from './generated/cms-snapshot.json';

const clientGetters = vi.hoisted(() => ({
  getPublicSupabaseClient: vi.fn(
    (_config: SupabaseConfig) => new Promise<never>(() => undefined),
  ),
  getAdminSupabaseClient: vi.fn(
    (_config: SupabaseConfig) => new Promise<never>(() => undefined),
  ),
}));

vi.mock('./supabaseClient', () => clientGetters);

function snapshotRow(version = 1) {
  const source = committedSnapshot.find((item) => item.kind === 'news');
  if (source === undefined) throw new TypeError('Missing committed news fixture');
  return { ...source, version };
}

function StateProbe() {
  const state = useContent();
  const first = state.content[0];
  const document = state.documents[0];
  const errorName = state.lifecycle.status === 'failed' ? state.lifecycle.error.name : 'ok';
  return (
    <output data-testid="state">
      {`${document?.outcome ?? 'empty'}:${state.lifecycle.status}:${first?.version ?? 'empty'}:${errorName}`}
    </output>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ContentProvider', () => {
  it('does not request either Supabase client while rendering configured content', () => {
    // Given
    const configuration = parseSupabaseConfiguration({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    });

    // When
    renderToString(
      <ContentProvider configuration={configuration}>
        <StateProbe />
      </ContentProvider>,
    );

    // Then
    expect(clientGetters.getPublicSupabaseClient).not.toHaveBeenCalled();
    expect(clientGetters.getAdminSupabaseClient).not.toHaveBeenCalled();
  });

  it('requests only the public Supabase client when the refresh effect runs', async () => {
    // Given
    const configuration = parseSupabaseConfiguration({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    });

    // When
    render(
      <ContentProvider configuration={configuration}>
        <StateProbe />
      </ContentProvider>,
    );

    // Then
    await waitFor(() => {
      expect(clientGetters.getPublicSupabaseClient).toHaveBeenCalledWith({
        url: 'https://example.supabase.co',
        publishableKey: 'sb_publishable_test',
      });
    });
    expect(clientGetters.getAdminSupabaseClient).not.toHaveBeenCalled();
  });

  it('renders the committed snapshot synchronously when Supabase is disabled', () => {
    // Given
    const snapshotRepository = createSnapshotRepository([snapshotRow()]);
    const configuration = parseSupabaseConfiguration({});

    // When
    const view = render(
      <ContentProvider
        snapshotRepository={snapshotRepository}
        configuration={configuration}
      >
        <StateProbe />
      </ContentProvider>,
    );

    // Then
    expect(view.getByTestId('state').textContent).toBe('committed:idle:1:ok');
  });

  it('retains the snapshot when a configured refresh fails', async () => {
    // Given
    const snapshotRepository = createSnapshotRepository([snapshotRow()]);
    const configuration = parseSupabaseConfiguration({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    });
    const remoteRepository: PublishedContentRepository = {
      listPublished: () => Promise.reject(new TypeError('network unavailable')),
    };

    // When
    const view = render(
      <ContentProvider
        snapshotRepository={snapshotRepository}
        remoteRepository={remoteRepository}
        configuration={configuration}
      >
        <StateProbe />
      </ContentProvider>,
    );

    // Then
    await waitFor(() => {
      expect(view.getByTestId('state').textContent)
        .toBe('request-fallback:failed:1:ContentRefreshError');
    });
  });

  it('merges a successful refresh and exposes fresh Supabase state', async () => {
    // Given
    const snapshotRepository = createSnapshotRepository([snapshotRow()]);
    const configuration = parseSupabaseConfiguration({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    });
    const refreshed = { content: parsePublishedContentRows([snapshotRow(2)]), failures: [] };
    const remoteRepository: PublishedContentRepository = {
      listPublished: () => Promise.resolve(refreshed),
    };

    // When
    const view = render(
      <ContentProvider
        snapshotRepository={snapshotRepository}
        remoteRepository={remoteRepository}
        configuration={configuration}
      >
        <StateProbe />
      </ContentProvider>,
    );

    // Then
    await waitFor(() => {
      expect(view.getByTestId('state').textContent).toBe('remote:complete:2:ok');
    });
  });

  it('aborts an in-flight refresh when the provider unmounts', () => {
    // Given
    const snapshotRepository = createSnapshotRepository([snapshotRow()]);
    const configuration = parseSupabaseConfiguration({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    });
    let observedSignal: AbortSignal | undefined;
    const remoteRepository: PublishedContentRepository = {
      listPublished: (signal) => {
        observedSignal = signal;
        return new Promise(() => undefined);
      },
    };
    const view = render(
      <ContentProvider
        snapshotRepository={snapshotRepository}
        remoteRepository={remoteRepository}
        configuration={configuration}
      >
        <StateProbe />
      </ContentProvider>,
    );

    // When
    view.unmount();

    // Then
    expect(observedSignal?.aborted).toBe(true);
  });
});
