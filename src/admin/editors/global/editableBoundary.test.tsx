// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { parseStructuredEditorText as parseGlobalEditorText } from '@/admin/editors/shared';
import { SiteProvider } from '@/app/site';
import { createDocumentWorkspace, type DocumentWorkspace } from '@/admin/documents';
import { document, revision } from '@/admin/workflows/testHarness';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import type { Json } from '@/content/database.types';
import snapshot from '@/content/generated/cms-snapshot.json';
import { GlobalDocumentEditor } from './GlobalDocumentEditor';
import type { GlobalEditorKind } from './types';

function fixturePayload(kind: GlobalEditorKind): Json {
  const source = snapshot.find((candidate) => candidate.kind === kind);
  if (source === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return structuredClone(source.payload);
}

function fixtureText(kind: GlobalEditorKind): string {
  return JSON.stringify(fixturePayload(kind), null, 2);
}

function workspace(kind: GlobalEditorKind, editorText: string): DocumentWorkspace {
  return {
    ...createDocumentWorkspace({
      document: document(kind),
      revisions: [revision({ payload: fixturePayload(kind) })],
    }),
    editorText,
  };
}

function EditorHarness({ kind, initialText }: { readonly kind: GlobalEditorKind; readonly initialText: string }) {
  const [editorText, setEditorText] = useState(initialText);
  return (
    <SiteProvider>
      <GlobalDocumentEditor kind={kind} workspace={workspace(kind, editorText)} onChange={setEditorText} />
      <output data-testid="editor-text">{editorText}</output>
    </SiteProvider>
  );
}

function parityMismatch(kind: 'activities' | 'kpis' | 'honors'): string {
  switch (kind) {
    case 'activities': {
      const payload = CMS_PAYLOAD_REGISTRY.activities.schema.parse(fixturePayload(kind));
      return JSON.stringify({ ...payload, en: { ...payload.en, holistic: payload.en.holistic.slice(1) } });
    }
    case 'kpis': {
      const payload = CMS_PAYLOAD_REGISTRY.kpis.schema.parse(fixturePayload(kind));
      return JSON.stringify({ ...payload, en: { ...payload.en, items: payload.en.items.slice(1) } });
    }
    case 'honors': {
      const payload = CMS_PAYLOAD_REGISTRY.honors.schema.parse(fixturePayload(kind));
      return JSON.stringify({ ...payload, en: { ...payload.en, snqProjects: payload.en.snqProjects.slice(1) } });
    }
  }
}

afterEach(cleanup);

describe('editable global boundary', () => {
  it('keeps a newly added blank-date activity structured with inline feedback', async () => {
    const user = userEvent.setup();
    const view = render(<EditorHarness kind="activities" initialText={fixtureText('activities')} />);

    await user.click(view.getByRole('button', { name: '新增教學部活動' }));

    expect(view.getByRole('heading', { name: '活動管理' })).toBeTruthy();
    expect(view.queryByRole('textbox', { name: '雙語 JSON 內容' })).toBeNull();
    expect(view.getAllByText(/日期與時間格式/).length).toBeGreaterThan(0);
    const result = parseGlobalEditorText('activities', view.getByTestId('editor-text').textContent ?? '');
    expect(result.status).toBe('editable-invalid');
  });

  it('forces exact-text recovery for divergent canonical News dates', () => {
    const payload = CMS_PAYLOAD_REGISTRY.news.schema.parse(fixturePayload('news'));
    const firstZh = payload.zh.department[0];
    if (firstZh === undefined) throw new TypeError('Missing news fixture row');
    const invalidText = JSON.stringify({
      ...payload,
      zh: { ...payload.zh, department: [{ ...firstZh, publishedOn: '2026-02-28' }, ...payload.zh.department.slice(1)] },
    });
    const view = render(<EditorHarness kind="news" initialText={invalidText} />);

    expect(view.getByRole('textbox', { name: '雙語 JSON 內容' })).toHaveProperty('value', invalidText);
    expect(parseGlobalEditorText('news', view.getByTestId('editor-text').textContent ?? '').status).toBe('invalid-payload');
  });

  it('keeps a wrong-locale Activity date structured, then returns to strict-valid when corrected', () => {
    const payload = CMS_PAYLOAD_REGISTRY.activities.schema.parse(fixturePayload('activities'));
    const firstZh = payload.zh.holistic[0];
    if (firstZh === undefined) throw new TypeError('Missing activity fixture row');
    const invalidText = JSON.stringify({
      ...payload,
      zh: {
        ...payload.zh,
        holistic: [{ ...firstZh, date: 'Wed 2026/07/22 12:30–13:30' }, ...payload.zh.holistic.slice(1)],
      },
    });
    const view = render(<EditorHarness kind="activities" initialText={invalidText} />);

    const dateFields = view.getAllByRole('textbox', { name: '日期與時間（繁體中文）' });
    const date = dateFields[dateFields.length - 1];
    if (date === undefined) throw new TypeError('Missing activity date field');
    expect(date.getAttribute('aria-invalid')).toBe('true');
    expect(parseGlobalEditorText('activities', view.getByTestId('editor-text').textContent ?? '').status).toBe('editable-invalid');

    fireEvent.change(date, { target: { value: '2026/07/22（三）12:30–13:30' } });

    expect(parseGlobalEditorText('activities', view.getByTestId('editor-text').textContent ?? '').status).toBe('valid');
  });

  it.each(['activities', 'kpis', 'honors'] as const)('forces exact-text recovery for %s parity mismatch', (kind) => {
    const exactText = parityMismatch(kind);
    const view = render(<EditorHarness kind={kind} initialText={exactText} />);

    expect(view.getByRole('textbox', { name: '雙語 JSON 內容' })).toHaveProperty('value', exactText);
    expect(view.getByText('無法開啟結構化編輯器')).toBeTruthy();
    expect(view.getByTestId('editor-text').textContent).toBe(exactText);
  });
});
