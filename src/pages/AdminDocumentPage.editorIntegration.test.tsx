// @vitest-environment jsdom

import { cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  GLOBAL_EDITOR_KINDS,
  isGlobalEditorKind,
  type GlobalEditorKind,
} from '@/admin/editors/global/types';
import { document, FakeDocumentRepository, revision } from '@/admin/workflows/testHarness';
import {
  CMS_DOCUMENT_KINDS,
  type CmsDocumentKind,
} from '@/content/contracts/kinds';
import snapshot from '@/content/generated/cms-snapshot.json';
import { renderDocumentRoute } from './AdminDocumentPage.testHarness';

const STRUCTURED_EDITOR_IDS = {
  site_copy: 'site-copy-strings',
  centers: 'centers-editor',
  people: 'people-center-directory',
  news: 'news-editor',
  activities: 'activities-editor',
  kpis: 'kpis-editor',
  honors: 'honors-overview',
} as const satisfies Record<GlobalEditorKind, string>;

const PAGE_KINDS = CMS_DOCUMENT_KINDS.filter(
  (kind): kind is Exclude<CmsDocumentKind, GlobalEditorKind> => !isGlobalEditorKind(kind),
);

type PageEditorKind = (typeof PAGE_KINDS)[number];

const PAGE_EDITOR_SELECTORS = {
  digital_materials: '#digital-materials-editor',
  facdev: '#facdev-editor',
  ebm: '[data-testid="ebm-structured-editor"]',
  holistic: '#holistic-kpis-editor',
  holistic_research: '#holistic-research-copy',
} as const satisfies Record<PageEditorKind, string>;

async function readyDocument(kind: CmsDocumentKind) {
  const source = snapshot.find((candidate) => candidate.kind === kind);
  if (source === undefined) throw new TypeError(`Missing ${kind} fixture`);
  const repository = new FakeDocumentRepository();
  repository.listResults.push(Promise.resolve({ ok: true, value: [document(kind)] }));
  repository.readResults.push(Promise.resolve({
    ok: true,
    value: {
      document: document(kind),
      revisions: [revision({ payload: source.payload })],
    },
  }));
  return renderDocumentRoute(repository, `/admin/content/${kind}`);
}

function expectWorkspaceChrome(view: Awaited<ReturnType<typeof readyDocument>>): void {
  const buttonLabels = Array.from(view.container.querySelectorAll('button'), (button) => button.textContent);
  expect(buttonLabels).toContain('儲存草稿');
  expect(buttonLabels).toContain('發佈');
  expect(buttonLabels).toContain('封存');
  expect(view.container.querySelector('aside[aria-label="文件資訊"]')).toBeTruthy();
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AdminDocumentPage editor integration', () => {
  it('keeps the site-copy workspace heading accessible text unchanged', async () => {
    // Given / When
    const view = await readyDocument('site_copy');
    await waitFor(() => expect(view.container.querySelector('#site-copy-strings')).toBeTruthy());

    // Then
    expect(await view.findByRole('heading', { name: '全站共用文案' })).toBeTruthy();
  });

  it('renders the localized site-copy label as a dedicated non-breaking phrase', async () => {
    // Given / When
    const view = await readyDocument('site_copy');
    await waitFor(() => expect(view.container.querySelector('#site-copy-strings')).toBeTruthy());
    const heading = await view.findByRole('heading', { name: '全站共用文案' });

    // Then
    expect(heading.querySelector('.admin-workspace-title-label')?.textContent).toBe('全站共用文案');
  });

  it.each(GLOBAL_EDITOR_KINDS)('keeps %s route actions and details around its structured editor', async (kind) => {
    // Given / When
    const view = await readyDocument(kind);

    // Then
    await waitFor(() => expect(view.container.querySelector(`#${STRUCTURED_EDITOR_IDS[kind]}`)).toBeTruthy());
    expect(view.container.querySelector('textarea.mono')).toBeNull();
    expectWorkspaceChrome(view);
  });

  it.each(PAGE_KINDS)('keeps %s route actions and details around its structured editor', async (kind) => {
    // Given / When
    const view = await readyDocument(kind);

    // Then
    await waitFor(() => expect(view.container.querySelector(PAGE_EDITOR_SELECTORS[kind])).toBeTruthy());
    expect(view.container.querySelector('textarea.mono')).toBeNull();
    expectWorkspaceChrome(view);
  });
});
