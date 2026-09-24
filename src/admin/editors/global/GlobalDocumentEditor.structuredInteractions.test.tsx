// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  emitStructuredEditorText as emitGlobalEditorText,
  parseStructuredEditorText as parseGlobalEditorText,
} from '@/admin/editors/shared';
import { SiteProvider } from '@/app/site';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { buildDraftMediaReference } from '@/content/media';
import { GlobalDocumentEditor } from './GlobalDocumentEditor';
import {
  fixtureText,
  renderEditor,
  STRUCTURED_HEADINGS,
  workspace,
} from './GlobalDocumentEditor.testHarness';

function atomicCentersText(): string {
  const parsed = parseGlobalEditorText('centers', fixtureText('centers'));
  if (parsed.status !== 'valid') throw new TypeError('Invalid centers fixture');
  const zhCenter = parsed.payload.zh.centers[0];
  const enCenter = parsed.payload.en.centers[0];
  if (zhCenter === undefined || enCenter === undefined) throw new TypeError('Missing paired center fixture');
  return emitGlobalEditorText('centers', {
    zh: { centers: [{ ...zhCenter, branches: zhCenter.branches.slice(0, 1) }] },
    en: { centers: [{ ...enCenter, branches: enCenter.branches.slice(0, 1) }] },
  });
}

function atomicNewsText(): string {
  const parsed = parseGlobalEditorText('news', fixtureText('news'));
  if (parsed.status !== 'valid') throw new TypeError('Invalid news fixture');
  return emitGlobalEditorText('news', {
    ...parsed.payload,
    zh: {
      ...parsed.payload.zh,
      department: parsed.payload.zh.department.slice(0, 1),
      holistic: [],
    },
    en: {
      ...parsed.payload.en,
      department: parsed.payload.en.department.slice(0, 1),
      holistic: [],
    },
  });
}

function ControlledEditorHarness({
  kind,
  initialText,
  onEmission,
}: {
  readonly kind: 'centers' | 'news';
  readonly initialText: string;
  readonly onEmission: (editorText: string) => void;
}) {
  const [editorText, setEditorText] = useState(initialText);
  const handleChange = (nextText: string): void => {
    onEmission(nextText);
    setEditorText(nextText);
  };
  return (
    <SiteProvider>
      <GlobalDocumentEditor kind={kind} workspace={workspace(kind, editorText)} onChange={handleChange} />
    </SiteProvider>
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('GlobalDocumentEditor', () => {
  it('commits one structured leaf edit exactly once as deterministic JSON', () => {
    // Given
    const sourceText = fixtureText('site_copy');
    const parsed = parseGlobalEditorText('site_copy', sourceText);
    if (parsed.status !== 'valid') throw new TypeError('Invalid site-copy fixture');
    const { onChange, view } = renderEditor('site_copy', workspace('site_copy', sourceText));

    // When
    fireEvent.change(view.getByRole('textbox', { name: '繁體中文 aiBody' }), {
      target: { value: '更新後的 AI 全人照護內容' },
    });

    // Then
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(emitGlobalEditorText('site_copy', {
      ...parsed.payload,
      zh: {
        ...parsed.payload.zh,
        strings: { ...parsed.payload.zh.strings, aiBody: '更新後的 AI 全人照護內容' },
      },
    }));
  });

  it('updates a center ID atomically across locales without leaving structured mode', () => {
    // Given
    const onEmission = vi.fn();
    const view = render(<ControlledEditorHarness kind="centers" initialText={atomicCentersText()} onEmission={onEmission} />);
    const input = view.getByRole('textbox', { name: /Shared center ID, center 1/ });
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Missing center ID input');
    expect(view.queryByRole('textbox', { name: '繁中中心識別碼' })).toBeNull();
    expect(view.queryByRole('textbox', { name: '英文中心識別碼' })).toBeNull();
    const nextId = `${input.value}x`;

    // When
    fireEvent.change(input, { target: { value: nextId } });

    // Then
    expect(onEmission).toHaveBeenCalledTimes(1);
    const emittedText = onEmission.mock.calls[0]?.[0];
    if (typeof emittedText !== 'string') throw new TypeError('Missing center ID emission');
    const payload = CMS_PAYLOAD_REGISTRY.centers.schema.parse(JSON.parse(emittedText));
    expect(payload.zh.centers[0]?.id).toBe(nextId);
    expect(payload.en.centers[0]?.id).toBe(nextId);
    expect(view.getByRole('heading', { name: STRUCTURED_HEADINGS.centers })).toBeTruthy();
    expect(view.queryByRole('textbox', { name: '雙語 JSON 內容' })).toBeNull();
  });

  it('updates a nested branch ID atomically across locales without leaving structured mode', () => {
    // Given
    const onEmission = vi.fn();
    const view = render(<ControlledEditorHarness kind="centers" initialText={atomicCentersText()} onEmission={onEmission} />);
    const input = view.getAllByRole('textbox', { name: /Shared branch ID, branch 1/ })[0];
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Missing branch ID input');
    expect(view.queryByRole('textbox', { name: '繁中分支識別碼' })).toBeNull();
    expect(view.queryByRole('textbox', { name: '英文分支識別碼' })).toBeNull();
    const nextId = `${input.value}x`;

    // When
    fireEvent.change(input, { target: { value: nextId } });

    // Then
    expect(onEmission).toHaveBeenCalledTimes(1);
    const emittedText = onEmission.mock.calls[0]?.[0];
    if (typeof emittedText !== 'string') throw new TypeError('Missing branch ID emission');
    const payload = CMS_PAYLOAD_REGISTRY.centers.schema.parse(JSON.parse(emittedText));
    expect(payload.zh.centers[0]?.branches[0]?.id).toBe(nextId);
    expect(payload.en.centers[0]?.branches[0]?.id).toBe(nextId);
    expect(view.getByRole('heading', { name: STRUCTURED_HEADINGS.centers })).toBeTruthy();
    expect(view.queryByRole('textbox', { name: '雙語 JSON 內容' })).toBeNull();
  });

  it('updates a canonical news date atomically across locales without exposing immutable IDs', () => {
    // Given
    const onEmission = vi.fn();
    const view = render(<ControlledEditorHarness kind="news" initialText={atomicNewsText()} onEmission={onEmission} />);
    const input = view.getByRole('textbox', { name: '公告日期，第 1 則公告' });
    if (!(input instanceof HTMLInputElement)) throw new TypeError('Missing canonical news date input');
    const originalId = CMS_PAYLOAD_REGISTRY.news.schema.parse(JSON.parse(atomicNewsText())).zh.department[0]?.id;

    // When
    fireEvent.change(input, { target: { value: '2026-12-31' } });

    // Then
    expect(onEmission).toHaveBeenCalledTimes(1);
    const emittedText = onEmission.mock.calls[0]?.[0];
    if (typeof emittedText !== 'string') throw new TypeError('Missing category ID emission');
    const payload = CMS_PAYLOAD_REGISTRY.news.schema.parse(JSON.parse(emittedText));
    expect(payload.zh.department[0]?.publishedOn).toBe('2026-12-31');
    expect(payload.en.department[0]?.publishedOn).toBe('2026-12-31');
    expect(payload.zh.department[0]?.id).toBe(originalId);
    expect(view.getByRole('heading', { name: STRUCTURED_HEADINGS.news })).toBeTruthy();
    expect(view.queryByRole('textbox', { name: '雙語 JSON 內容' })).toBeNull();
  });

  it('reparses an external people media update into the structured portrait view', () => {
    // Given
    const initial = workspace('people');
    const onChange = vi.fn();
    const view = render(
      <SiteProvider>
        <GlobalDocumentEditor kind="people" workspace={initial} onChange={onChange} />
      </SiteProvider>,
    );
    const payload = CMS_PAYLOAD_REGISTRY.people.schema.parse(JSON.parse(initial.editorText));
    const person = payload.zh.holisticInstructors[0];
    if (person === undefined) throw new TypeError('Missing people portrait fixture');
    const portrait = buildDraftMediaReference({
      ownerId: '11111111-1111-4111-8111-111111111111',
      sha256: 'a'.repeat(64),
      mediaType: 'image/png',
    });
    const updatedText = emitGlobalEditorText('people', {
      ...payload,
      zh: {
        ...payload.zh,
        holisticInstructors: [{ ...person, portrait }, ...payload.zh.holisticInstructors.slice(1)],
      },
    });

    // When
    view.rerender(
      <SiteProvider>
        <GlobalDocumentEditor
          kind="people"
          workspace={{ ...initial, editorText: updatedText }}
          onChange={onChange}
        />
      </SiteProvider>,
    );

    // Then
    expect(view.getByText(portrait.path)).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(0);
  });
});
