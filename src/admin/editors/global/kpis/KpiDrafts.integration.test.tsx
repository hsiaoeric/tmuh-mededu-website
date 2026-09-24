// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseStructuredEditorText as parseGlobalEditorText } from '@/admin/editors/shared';
import { SiteProvider } from '@/app/site';
import {
  createDocumentWorkspace,
  getWorkspaceCapabilities,
  isWorkspaceDirty,
  type DocumentWorkspace,
} from '@/admin/documents';
import { document, revision } from '@/admin/workflows/testHarness';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import snapshot from '@/content/generated/cms-snapshot.json';
import { GlobalDocumentEditor } from '../GlobalDocumentEditor';

const fixtureDocument = snapshot.find((candidate) => candidate.kind === 'kpis');
if (fixtureDocument === undefined) throw new TypeError('Missing kpis fixture');
const fixturePayload = fixtureDocument.payload;
const fixture = CMS_PAYLOAD_REGISTRY.kpis.schema.parse(fixturePayload);
const fixtureText = JSON.stringify(fixture, null, 2);

function workspace(editorText: string): DocumentWorkspace {
  return {
    ...createDocumentWorkspace({
      document: document('kpis'),
      revisions: [revision({ payload: fixturePayload })],
    }),
    editorText,
  };
}

function EditorWorkspaceHarness({ initialText = fixtureText }: { readonly initialText?: string }) {
  const [editorText, setEditorText] = useState(initialText);
  const current = workspace(editorText);
  const capabilities = getWorkspaceCapabilities(current);
  return (
    <SiteProvider>
      <GlobalDocumentEditor kind="kpis" workspace={current} onChange={setEditorText} />
      <output data-testid="editor-text">{editorText}</output>
      <output data-testid="workspace-state">{JSON.stringify({
        dirty: isWorkspaceDirty(current),
        canSave: capabilities.canSave,
        canPublish: capabilities.canPublish,
      })}</output>
    </SiteProvider>
  );
}

function outputText(view: ReturnType<typeof render>): string {
  return view.getByTestId('editor-text').textContent ?? '';
}

function workspaceState(view: ReturnType<typeof render>): {
  readonly dirty: boolean;
  readonly canSave: boolean;
  readonly canPublish: boolean;
} {
  return JSON.parse(view.getByTestId('workspace-state').textContent ?? '{}');
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('KPI drafts through the global document workspace', () => {
  it.each([
    ['繁體中文數值', 'num', ''],
    ['繁體中文數值', 'num', '-'],
    ['繁體中文延遲（毫秒）', 'delay', '1e'],
  ] as const)('emits an exact invalid %s draft and blocks save and publish', (label, field, draft) => {
    // Given
    const view = render(<EditorWorkspaceHarness />);
    const input = view.getAllByRole('textbox', { name: label })[0];
    if (input === undefined) throw new TypeError(`Missing ${field} field`);

    // When
    fireEvent.change(input, { target: { value: draft } });

    // Then
    const editorText = outputText(view);
    const parsedJson = JSON.parse(editorText);
    expect(input).toHaveProperty('value', draft);
    expect(parsedJson.zh.items[0][field]).toBe(draft);
    expect(editorText).toBe(JSON.stringify(parsedJson, null, 2));
    expect(parseGlobalEditorText('kpis', editorText).status).toBe('editable-invalid');
    expect(workspaceState(view)).toEqual({ dirty: true, canSave: false, canPublish: false });
    expect(view.getByRole('heading', { name: '首頁關鍵數據' })).toBeTruthy();
    expect(view.getByRole('alert').textContent).toContain('有效數字');
  });

  it('emits an exact invalid color draft and blocks save and publish', () => {
    // Given
    const view = render(<EditorWorkspaceHarness />);
    const input = view.getAllByRole('textbox', { name: '繁體中文色碼' })[0];
    if (input === undefined) throw new TypeError('Missing color field');

    // When
    fireEvent.change(input, { target: { value: '#12zz99' } });

    // Then
    const editorText = outputText(view);
    const parsedJson = JSON.parse(editorText);
    expect(input).toHaveProperty('value', '#12zz99');
    expect(parsedJson.zh.items[0].color).toBe('#12zz99');
    expect(editorText).toBe(JSON.stringify(parsedJson, null, 2));
    expect(parseGlobalEditorText('kpis', editorText).status).toBe('editable-invalid');
    expect(workspaceState(view)).toEqual({ dirty: true, canSave: false, canPublish: false });
    expect(view.getByRole('alert').textContent).toContain('6 位十六進位');
  });

  it('replaces numeric draft text with a strict number without changing siblings', () => {
    // Given
    const firstZh = fixture.zh.items[0];
    if (firstZh === undefined) throw new TypeError('Missing KPI fixture row');
    const invalid = {
      ...fixture,
      zh: { items: [{ ...firstZh, num: '-' }, ...fixture.zh.items.slice(1)] },
    };
    const view = render(<EditorWorkspaceHarness initialText={JSON.stringify(invalid, null, 2)} />);
    const input = view.getAllByRole('textbox', { name: '繁體中文數值' })[0];
    if (input === undefined) throw new TypeError('Missing number field');

    // When
    fireEvent.change(input, { target: { value: '-2.75' } });

    // Then
    const parsedJson = JSON.parse(outputText(view));
    expect(parsedJson).toEqual({
      ...fixture,
      zh: { items: [{ ...firstZh, num: -2.75 }, ...fixture.zh.items.slice(1)] },
    });
    expect(parseGlobalEditorText('kpis', outputText(view)).status).toBe('valid');
    expect(workspaceState(view)).toEqual({ dirty: true, canSave: true, canPublish: false });
    expect(view.queryByRole('alert')).toBeNull();
  });

  it('replaces a color draft with a strict color without changing siblings', () => {
    // Given
    const firstZh = fixture.zh.items[0];
    if (firstZh === undefined) throw new TypeError('Missing KPI fixture row');
    const invalid = {
      ...fixture,
      zh: { items: [{ ...firstZh, color: '' }, ...fixture.zh.items.slice(1)] },
    };
    const view = render(<EditorWorkspaceHarness initialText={JSON.stringify(invalid, null, 2)} />);
    const input = view.getAllByRole('textbox', { name: '繁體中文色碼' })[0];
    if (input === undefined) throw new TypeError('Missing color field');

    // When
    fireEvent.change(input, { target: { value: '#00aBcD' } });

    // Then
    const parsedJson = JSON.parse(outputText(view));
    expect(parsedJson).toEqual({
      ...fixture,
      zh: { items: [{ ...firstZh, color: '#00aBcD' }, ...fixture.zh.items.slice(1)] },
    });
    expect(parseGlobalEditorText('kpis', outputText(view)).status).toBe('valid');
    expect(workspaceState(view)).toEqual({ dirty: true, canSave: true, canPublish: false });
    expect(view.queryByRole('alert')).toBeNull();
  });

  it('lets an external strict source supersede a visible invalid draft without emitting', () => {
    // Given
    const onChange = vi.fn<(editorText: string) => void>();
    const initial = workspace(fixtureText);
    const view = render(
      <SiteProvider>
        <GlobalDocumentEditor kind="kpis" workspace={initial} onChange={onChange} />
      </SiteProvider>,
    );
    const input = view.getAllByRole('textbox', { name: '繁體中文數值' })[0];
    if (input === undefined) throw new TypeError('Missing number field');
    fireEvent.change(input, { target: { value: '1e' } });
    const firstZh = fixture.zh.items[0];
    if (firstZh === undefined) throw new TypeError('Missing KPI fixture row');
    const external = {
      ...fixture,
      zh: { items: [{ ...firstZh, num: 84.5 }, ...fixture.zh.items.slice(1)] },
    };
    onChange.mockClear();

    // When
    view.rerender(
      <SiteProvider>
        <GlobalDocumentEditor
          kind="kpis"
          workspace={workspace(JSON.stringify(external, null, 2))}
          onChange={onChange}
        />
      </SiteProvider>,
    );

    // Then
    expect(view.getAllByRole('textbox', { name: '繁體中文數值' })[0]).toHaveProperty('value', '84.5');
    expect(view.queryByRole('alert')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
