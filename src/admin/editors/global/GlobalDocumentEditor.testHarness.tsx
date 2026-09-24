import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { SiteProvider } from '@/app/site';
import { createDocumentWorkspace, type DocumentWorkspace } from '@/admin/documents';
import { document, revision } from '@/admin/workflows/testHarness';
import snapshot from '@/content/generated/cms-snapshot.json';
import { GlobalDocumentEditor } from './GlobalDocumentEditor';
import { type GlobalEditorKind } from './types';

export const STRUCTURED_HEADINGS = {
  site_copy: '全站共用文字',
  centers: '中心與分支',
  people: '中心與行政團隊',
  news: '公告與消息',
  activities: '活動管理',
  kpis: '首頁關鍵數據',
  honors: '品質榮譽內容',
} as const satisfies Record<GlobalEditorKind, string>;

export function fixtureText(kind: GlobalEditorKind): string {
  const source = snapshot.find((candidate) => candidate.kind === kind);
  if (source === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return JSON.stringify(source.payload, null, 2);
}

export function workspace(kind: GlobalEditorKind, editorText = fixtureText(kind)): DocumentWorkspace {
  const source = snapshot.find((candidate) => candidate.kind === kind);
  if (source === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return {
    ...createDocumentWorkspace({
      document: document(kind),
      revisions: [revision({ payload: source.payload })],
    }),
    editorText,
  };
}

export function renderEditor(
  kind: GlobalEditorKind,
  currentWorkspace: DocumentWorkspace,
  onChange = vi.fn(),
) {
  return {
    onChange,
    view: render(
      <SiteProvider>
        <GlobalDocumentEditor kind={kind} workspace={currentWorkspace} onChange={onChange} />
      </SiteProvider>,
    ),
  };
}
