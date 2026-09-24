import { fireEvent, render, type RenderResult, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { SiteProvider } from '@/app/site';
import { AdminProtectedAccessProvider } from '@/admin/auth';
import { AdminDocumentRepositoryProvider } from '@/admin/repository/AdminDocumentRepositoryProvider';
import { assertNever } from '@/admin/documents/assertNever';
import { parseDraftPayload } from '@/admin/documents';
import { compactEbmFixture } from '@/admin/editors/pages/ebm/EbmEditor.testFixture';
import { facdevPayload } from '@/admin/editors/pages/facdev/FacdevEditor.testHarness';
import { compactHolisticFixture } from '@/admin/editors/pages/holistic/HolisticEditor.testHarness';
import { compactHolisticResearchFixture } from '@/admin/editors/pages/holisticResearch/HolisticResearchEditor.testHarness';
import type { Json } from '@/content/database.types';
import { AdminMediaOwnershipProvider, AdminMediaRuntimeProvider } from '@/admin/media';
import type { DraftMediaClient } from '@/admin/media/types';
import { document, type FakeDocumentRepository, revision } from '@/admin/workflows/testHarness';
import type { PageEditorKind } from '@/admin/editors/pages';
import snapshot from '@/content/generated/cms-snapshot.json';
import { AdminDocumentPage } from './AdminDocumentPage';

function documentRoute(
  repository: FakeDocumentRepository,
  options: {
    readonly path: string;
    readonly mutationsAllowed: boolean;
    readonly mediaClient?: DraftMediaClient;
  },
) {
  const router = createMemoryRouter([{
    path: '/admin/content/:kind',
    element: (
      <SiteProvider>
        <AdminProtectedAccessProvider mutationsAllowed={options.mutationsAllowed}>
          <AdminMediaRuntimeProvider configuration={{ kind: 'disabled' }} client={options.mediaClient}>
            <AdminMediaOwnershipProvider>
              <AdminDocumentRepositoryProvider repository={repository}>
                <AdminDocumentPage />
              </AdminDocumentRepositoryProvider>
            </AdminMediaOwnershipProvider>
          </AdminMediaRuntimeProvider>
        </AdminProtectedAccessProvider>
      </SiteProvider>
    ),
  }], { initialEntries: [options.path] });
  return { router, view: render(<RouterProvider router={router} />) };
}

export function renderDocumentRoute(
  repository: FakeDocumentRepository,
  path = '/admin/content/news',
  mutationsAllowed = true,
) {
  return documentRoute(repository, { path, mutationsAllowed }).view;
}

export function renderNavigableDocumentRoute(
  repository: FakeDocumentRepository,
  path = '/admin/content/news',
) {
  return documentRoute(repository, { path, mutationsAllowed: true });
}

export function renderDocumentRouteWithMedia(
  repository: FakeDocumentRepository,
  mediaClient: DraftMediaClient,
  path = '/admin/content/people',
) {
  return documentRoute(repository, {
    path,
    mutationsAllowed: true,
    mediaClient,
  }).view;
}

export const PAGE_EDITOR_KINDS = [
  'digital_materials',
  'facdev',
  'ebm',
  'holistic',
  'holistic_research',
] as const satisfies readonly PageEditorKind[];

export const PAGE_EDITOR_SELECTORS = {
  digital_materials: '#digital-materials-editor',
  facdev: '[data-facdev-editor]',
  ebm: '[data-testid="ebm-structured-editor"]',
  holistic: '#holistic-kpis-editor',
  holistic_research: '#holistic-research-copy',
} as const satisfies Record<PageEditorKind, string>;

function jsonFixture(payload: unknown, kind: PageEditorKind): Json {
  const parsed = parseDraftPayload(JSON.stringify(payload));
  if (!parsed.ok) throw new TypeError(`Invalid ${kind} fixture`);
  return parsed.payload;
}

export function pageFixture(kind: PageEditorKind): Json {
  switch (kind) {
    case 'digital_materials': {
      const source = snapshot.find((candidate) => candidate.kind === kind);
      if (source === undefined) throw new TypeError(`Missing ${kind} fixture`);
      return source.payload;
    }
    case 'facdev': {
      const payload = facdevPayload();
      const compactLocale = (locale: 'zh' | 'en') => ({
        ...payload[locale],
        kpis: payload[locale].kpis.slice(0, 1),
        services: payload[locale].services.slice(0, 1),
        groups: payload[locale].groups.slice(0, 1),
      });
      return jsonFixture({ zh: compactLocale('zh'), en: compactLocale('en') }, kind);
    }
    case 'ebm': {
      const payload = compactEbmFixture();
      const compactLocale = (locale: 'zh' | 'en') => ({
        ...payload[locale],
        kpis: payload[locale].kpis.slice(0, 1),
        missions: payload[locale].missions.slice(0, 1),
        awardsLit: payload[locale].awardsLit.slice(0, 1),
        awardsClin: payload[locale].awardsClin.slice(0, 1),
        awardsTrans: payload[locale].awardsTrans.slice(0, 1),
        stages: payload[locale].stages.slice(0, 1).map((stage) => ({
          ...stage,
          items: stage.items.slice(0, 1),
        })),
        courseGroups: payload[locale].courseGroups.slice(0, 1).map((group) => ({
          ...group,
          rows: group.rows.slice(0, 1),
        })),
      });
      return jsonFixture({ zh: compactLocale('zh'), en: compactLocale('en') }, kind);
    }
    case 'holistic': {
      const payload = compactHolisticFixture();
      return jsonFixture({
        zh: { ...payload.zh, kpis: payload.zh.kpis.slice(0, 1) },
        en: { ...payload.en, kpis: payload.en.kpis.slice(0, 1) },
      }, kind);
    }
    case 'holistic_research':
      return jsonFixture(compactHolisticResearchFixture(), kind);
    default:
      return assertNever(kind, 'page editor fixture kind');
  }
}

export function queuePageDocument(
  repository: FakeDocumentRepository,
  kind: PageEditorKind,
  payload: Json = pageFixture(kind),
): void {
  repository.listResults.push(Promise.resolve({ ok: true, value: [document(kind)] }));
  repository.readResults.push(Promise.resolve({
    ok: true,
    value: { document: document(kind), revisions: [revision({ payload })] },
  }));
}

export async function readyPageRoute(
  repository: FakeDocumentRepository,
  kind: PageEditorKind,
): Promise<RenderResult> {
  queuePageDocument(repository, kind);
  const view = renderDocumentRoute(repository, `/admin/content/${kind}`);
  await pageEditorModeToolbar(view);
  await waitFor(() => {
    const editor = structuredPageEditor(view, kind);
    if (editor.querySelector('input, textarea') === null) {
      throw new TypeError(`Missing editable ${kind} field`);
    }
  });
  return view;
}

async function pageEditorModeToolbar(view: RenderResult): Promise<HTMLElement> {
  return waitFor(() => {
    const toolbar = view.container.querySelector('[role="toolbar"][aria-label="編輯模式"]');
    if (!(toolbar instanceof HTMLElement)) throw new TypeError('Missing page editor mode toolbar');
    return toolbar;
  });
}

export function structuredPageEditor(view: RenderResult, kind: PageEditorKind): HTMLElement {
  const editor = view.container.querySelector(PAGE_EDITOR_SELECTORS[kind]);
  if (!(editor instanceof HTMLElement)) throw new TypeError(`Missing ${kind} structured editor`);
  return editor;
}

export async function pageAdvancedEditor(view: RenderResult): Promise<HTMLTextAreaElement> {
  const toolbar = await pageEditorModeToolbar(view);
  const advancedButton = within(toolbar).getByRole('button', { name: '進階 JSON' });
  if (advancedButton.getAttribute('aria-pressed') !== 'true') {
    fireEvent.click(advancedButton);
  }
  const editor = await view.findByLabelText('雙語 JSON 內容');
  if (!(editor instanceof HTMLTextAreaElement)) throw new TypeError('Missing page JSON editor');
  return editor;
}
