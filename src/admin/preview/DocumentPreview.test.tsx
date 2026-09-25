// @vitest-environment jsdom
import { cleanup, render, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteProvider } from '@/app/site';
import { createDocumentWorkspace, type DocumentWorkspace } from '@/admin/documents';
import { document, revision } from '@/admin/workflows/testHarness';
import { ContentProvider } from '@/content/ContentProvider';
import { parseSupabaseConfiguration } from '@/content/env';
import { Counter } from '@/motion/Counter';
import { StillMotion } from '@/motion/MotionPreference';
import { CMS_DOCUMENT_KINDS } from '@/content/contracts/kinds';
import { DocumentPreview, PREVIEW_SECTION_KINDS } from './DocumentPreview';
import { isPreviewableKind } from './previewKinds';

// jsdom has no matchMedia, which GSAP needs at import. `matches: false` keeps reduced motion off,
// so the counter test proves StillMotion rather than the environment.
vi.hoisted(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    }),
  });
});

const OFFLINE = parseSupabaseConfiguration({});

function newsWorkspace(editorText?: string): DocumentWorkspace {
  const draft = revision();
  const workspace = createDocumentWorkspace({ document: document('news'), revisions: [draft] });
  return editorText === undefined ? workspace : { ...workspace, editorText };
}

function renderPreview(workspace: DocumentWorkspace) {
  return render(
    <ContentProvider configuration={OFFLINE}>
      <SiteProvider>
        <MemoryRouter>
          <DocumentPreview kind="news" workspace={workspace} />
        </MemoryRouter>
      </SiteProvider>
    </ContentProvider>,
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('DocumentPreview', () => {
  it('renders the unsaved editor text through the live public news section', async () => {
    const base = newsWorkspace();
    const payload = JSON.parse(base.editorText) as { zh: { department: { title: string }[] } };
    payload.zh.department[0]!.title = '尚未發佈的新標題';

    const view = renderPreview({ ...base, editorText: JSON.stringify(payload) });

    // The section renders inside an iframe so the site's own breakpoints follow the device width.
    await waitFor(() => {
      const frame = view.container.querySelector('iframe')?.contentDocument?.body;
      expect(frame).toBeTruthy();
      expect(within(frame!).getByText('尚未發佈的新標題')).toBeTruthy();
    });
    expect(view.queryByText('目前無法預覽')).toBeNull();
  });

  it('explains instead of rendering when the draft fails the publication check', () => {
    const view = renderPreview(newsWorkspace('{"zh": {}}'));

    expect(view.getByText('目前無法預覽')).toBeTruthy();
  });

  it('offers previews exactly for the documents with a preview section', () => {
    expect(isPreviewableKind('news')).toBe(true);
    expect(isPreviewableKind('people')).toBe(true);
    expect(isPreviewableKind('site_copy')).toBe(false);
    expect(isPreviewableKind('holistic')).toBe(true);
    expect(isPreviewableKind('centers')).toBe(false);
    for (const kind of CMS_DOCUMENT_KINDS) {
      expect(isPreviewableKind(kind), kind).toBe(PREVIEW_SECTION_KINDS.includes(kind));
    }
  });
});

describe('StillMotion', () => {
  it('renders counters at their final value without waiting for a scroll trigger', () => {
    const view = render(<StillMotion><Counter to={42} /></StillMotion>);

    expect(view.container.textContent).toBe('42');
  });
});
