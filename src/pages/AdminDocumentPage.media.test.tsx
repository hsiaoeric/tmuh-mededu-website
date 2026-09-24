// @vitest-environment jsdom

import { cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CmsDocumentKind } from '@/content/contracts/kinds';
import { detail, document, FakeDocumentRepository } from '@/admin/workflows/testHarness';
import { renderDocumentRoute } from './AdminDocumentPage.testHarness';

async function readyDocument(kind: CmsDocumentKind) {
  const repository = new FakeDocumentRepository();
  repository.listResults.push(Promise.resolve({ ok: true, value: [document(kind)] }));
  repository.readResults.push(Promise.resolve({ ok: true, value: detail(kind) }));
  const view = renderDocumentRoute(repository, `/admin/content/${kind}`);
  if (kind === 'people' || kind === 'news') {
    fireEvent.click(await view.findByRole('button', { name: '進階 JSON' }));
  }
  await view.findByRole('textbox', { name: '雙語 JSON 內容' });
  return view;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AdminDocumentPage media workbench', () => {
  it.each(['people', 'facdev'] satisfies readonly CmsDocumentKind[])(
    'renders portrait controls for the %s document',
    async (kind) => {
      // Given / When
      const view = await readyDocument(kind);

      // Then
      expect(view.getByRole('heading', { name: '視覺媒體工作區' })).toBeTruthy();
    },
  );

  it('keeps the workbench out of unsupported documents', async () => {
    // Given / When
    const view = await readyDocument('news');

    // Then
    expect(view.queryByRole('heading', { name: '視覺媒體工作區' })).toBeNull();
  });
});
