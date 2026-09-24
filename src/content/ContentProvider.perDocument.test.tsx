// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ContentProvider, useContent, type ContentState } from './ContentProvider';
import type { ContentSnapshotRepository, PublishedContentBatch, PublishedContentRepository } from './domain';
import { parseSupabaseConfiguration } from './env';
import committedSnapshot from './generated/cms-snapshot.json';
import { parsePublishedContentBatch, parsePublishedContentRows } from './parsers';

const CONFIGURED = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
});

function row(kind: 'centers' | 'news', version: number) {
  const source = committedSnapshot.find((candidate) => candidate.kind === kind);
  if (source === undefined) throw new TypeError(`Missing committed ${kind} fixture`);
  return { ...structuredClone(source), version };
}

function snapshotRepository(): ContentSnapshotRepository {
  const content = parsePublishedContentRows([row('news', 2), row('centers', 2)]);
  return { listPublished: () => content };
}

function repository(batch: PublishedContentBatch): PublishedContentRepository {
  return { listPublished: () => Promise.resolve(batch) };
}

function Probe({ states }: { readonly states: ContentState[] }) {
  states.push(useContent());
  return null;
}

function renderProvider(remoteRepository: PublishedContentRepository) {
  const states: ContentState[] = [];
  const tree = (nextRepository: PublishedContentRepository) => (
    <ContentProvider
      snapshotRepository={snapshotRepository()}
      remoteRepository={nextRepository}
      configuration={CONFIGURED}
    >
      <Probe states={states} />
    </ContentProvider>
  );
  const view = render(tree(remoteRepository));
  return {
    view,
    rerender: (nextRepository: PublishedContentRepository) => view.rerender(tree(nextRepository)),
    current: () => {
      const state = states[states.length - 1];
      if (state === undefined) throw new TypeError('Content probe has not rendered');
      return state;
    },
  };
}

function deferred<Value>() {
  let resolve = (_value: Value): void => undefined;
  const promise = new Promise<Value>((complete) => { resolve = complete; });
  return { promise, resolve };
}

afterEach(cleanup);

describe('ContentProvider per-document fallback', () => {
  it('refreshes a valid sibling while an identifiable malformed document falls back', async () => {
    // Given
    const invalid = { ...row('news', 3), payload: { zh: {}, en: {} } };

    // When
    const rendered = renderProvider(repository(parsePublishedContentBatch([invalid, row('centers', 3)])));

    // Then
    await waitFor(() => expect(rendered.current().lifecycle.status).toBe('complete'));
    expect(rendered.current().documents.map((document) => `${document.identity.kind}:${document.outcome}`))
      .toEqual(['centers:remote', 'news:invalid-fallback']);
    expect(rendered.current().content.map((content) => content.version)).toEqual([3, 2]);
  });

  it('uses invalid fallback when document_id is missing but canonical identity is valid', async () => {
    // Given
    const { document_id: removed, ...invalid } = row('news', 3);

    // When
    const rendered = renderProvider(repository(parsePublishedContentBatch([invalid, row('centers', 3)])));

    // Then
    expect(removed).toEqual(expect.any(String));
    await waitFor(() => expect(rendered.current().lifecycle.status).toBe('complete'));
    expect(rendered.current().documents.map((document) => document.outcome))
      .toEqual(['remote', 'invalid-fallback']);
  });

  it('keeps an unidentifiable row aggregate-only', async () => {
    // Given
    const { kind: removed, ...invalid } = row('news', 3);

    // When
    const rendered = renderProvider(repository(parsePublishedContentBatch([invalid, row('centers', 3)])));

    // Then
    expect(removed).toBe('news');
    await waitFor(() => expect(rendered.current().lifecycle.status).toBe('complete'));
    expect(rendered.current().documents.map((document) => document.outcome))
      .toEqual(['remote', 'missing-fallback']);
    expect(rendered.current().lifecycle).toMatchObject({ status: 'complete', unassignedFailures: [{}] });
  });

  it('rejects every duplicate participant for only the affected document', async () => {
    // Given
    const duplicate = row('news', 3);

    // When
    const rendered = renderProvider(repository(parsePublishedContentBatch([
      duplicate, duplicate, row('centers', 3),
    ])));

    // Then
    await waitFor(() => expect(rendered.current().lifecycle.status).toBe('complete'));
    expect(rendered.current().documents.map((document) => document.outcome))
      .toEqual(['remote', 'invalid-fallback']);
  });

  it('retains the snapshot for an older remote document', async () => {
    // Given / When
    const rendered = renderProvider(repository(parsePublishedContentBatch([row('news', 1), row('centers', 3)])));

    // Then
    await waitFor(() => expect(rendered.current().lifecycle.status).toBe('complete'));
    expect(rendered.current().documents.map((document) => document.outcome))
      .toEqual(['remote', 'older-fallback']);
    expect(rendered.current().content.map((content) => content.version)).toEqual([3, 2]);
  });

  it('restores every snapshot document on request failure with one aggregate error', async () => {
    // Given
    const failed: PublishedContentRepository = {
      listPublished: () => Promise.reject(new TypeError('network unavailable')),
    };

    // When
    const rendered = renderProvider(failed);

    // Then
    await waitFor(() => expect(rendered.current().lifecycle.status).toBe('failed'));
    expect(rendered.current().documents).toMatchObject([
      { outcome: 'request-fallback', source: 'snapshot', freshness: 'stale' },
      { outcome: 'request-fallback', source: 'snapshot', freshness: 'stale' },
    ]);
    expect(rendered.current().lifecycle).toMatchObject({
      status: 'failed', error: { name: 'ContentRefreshError' },
    });
  });

  it('aborts a replaced request and ignores its late completion', async () => {
    // Given
    const late = deferred<PublishedContentBatch>();
    let lateSignal: AbortSignal | undefined;
    const replaced: PublishedContentRepository = {
      listPublished: (signal) => { lateSignal = signal; return late.promise; },
    };
    const rendered = renderProvider(replaced);

    // When
    rendered.rerender(repository(parsePublishedContentBatch([row('news', 3), row('centers', 3)])));

    // Then
    await waitFor(() => expect(rendered.current().lifecycle.status).toBe('complete'));
    expect(lateSignal?.aborted).toBe(true);
    await act(async () => {
      late.resolve(parsePublishedContentBatch([row('news', 9), row('centers', 9)]));
      await late.promise;
    });
    expect(rendered.current().content.map((content) => content.version)).toEqual([3, 3]);
  });
});
