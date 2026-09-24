// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  mapStructuredEditorIssues as mapGlobalEditorIssues,
  parseStructuredEditorText as parseGlobalEditorText,
} from '@/admin/editors/shared';
import snapshot from '@/content/generated/cms-snapshot.json';
import {
  CMS_PAYLOAD_REGISTRY,
  type CmsPayloadByKind,
} from '@/content/contracts/registry';
import {
  SiteCopyEditor,
  type SiteCopyEditorProps,
} from './SiteCopyEditor';

type SiteCopyPayload = CmsPayloadByKind['site_copy'];

const fixtureDocument = snapshot.find((document) => document.kind === 'site_copy');
if (fixtureDocument === undefined) {
  throw new TypeError('Missing site_copy fixture');
}
const fixture: SiteCopyPayload = CMS_PAYLOAD_REGISTRY.site_copy.schema.parse(
  fixtureDocument.payload,
);
const issues = mapGlobalEditorIssues([]);

function renderEditor(onChange = vi.fn<(payload: SiteCopyPayload) => void>()) {
  const view = render(
    <SiteCopyEditor payload={fixture} issues={issues} onChange={onChange} />,
  );
  return { ...view, onChange };
}

afterEach(cleanup);

describe('site copy editor', () => {
  it('accepts the exact typed controlled-component contract', () => {
    expectTypeOf<SiteCopyEditorProps['payload']>().toEqualTypeOf<SiteCopyPayload>();
    expectTypeOf<SiteCopyEditorProps['onChange']>().toEqualTypeOf<
      (payload: SiteCopyPayload) => void
    >();
  });

  it('renders every current strings and inline key in fixture order', () => {
    // Given / When
    const view = renderEditor();
    const expectedKeys = [
      ...Object.keys(fixture.zh.strings),
      ...Object.keys(fixture.zh.inline),
    ];

    // Then
    const legends = view.getAllByRole('group').map((group) => (
      group.querySelector('legend')?.textContent ?? ''
    ));
    expect(legends).toHaveLength(expectedKeys.length);
    expect(legends.map((legend) => legend.slice(legend.lastIndexOf(' · ') + 3))).toEqual(expectedKeys);
    expect(view.getAllByRole('textbox')).toHaveLength(expectedKeys.length * 2);
  });

  it('keeps Traditional Chinese before English for every bilingual leaf', () => {
    // Given / When
    const view = renderEditor();

    // Then
    const languages = view.getAllByRole('textbox').map((field) => (
      field.closest('[lang]')?.getAttribute('lang')
    ));
    expect(languages).toEqual(
      Array.from(
        { length: Object.keys(fixture.zh.strings).length + Object.keys(fixture.zh.inline).length },
        () => ['zh-Hant', 'en'],
      ).flat(),
    );
  });

  it('does not emit or alter the payload during a no-op fixture render', () => {
    // Given
    const before = structuredClone(fixture);

    // When
    const view = renderEditor();

    // Then
    expect(view.onChange).not.toHaveBeenCalled();
    expect(fixture).toEqual(before);
    expect(view.getAllByRole('textbox').map((field) => (
      field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
        ? field.value
        : ''
    ))).toEqual(
      [...Object.values(fixture.zh.strings).flatMap((value, index) => [
        value,
        Object.values(fixture.en.strings)[index],
      ]), ...Object.values(fixture.zh.inline).flatMap((value, index) => [
        value,
        Object.values(fixture.en.inline)[index],
      ])],
    );
  });

  it('changes only the selected English strings leaf and preserves order and siblings', () => {
    // Given
    const view = renderEditor();
    const field = view.getByRole('textbox', { name: 'English footNote' });

    // When
    fireEvent.change(field, { target: { value: 'Updated footer note' } });

    // Then
    expect(view.onChange).toHaveBeenCalledOnce();
    const nextPayload = view.onChange.mock.calls[0]?.[0];
    expect(nextPayload).toEqual({
      ...fixture,
      en: {
        ...fixture.en,
        strings: { ...fixture.en.strings, footNote: 'Updated footer note' },
      },
    });
    expect(nextPayload?.zh).toBe(fixture.zh);
    expect(nextPayload?.en.inline).toBe(fixture.en.inline);
    expect(Object.keys(nextPayload ?? {})).toEqual(Object.keys(fixture));
    expect(Object.keys(nextPayload?.en.strings ?? {})).toEqual(Object.keys(fixture.en.strings));
  });

  it('emits an empty string as a valid exact inline leaf update', () => {
    // Given
    const view = renderEditor();
    const field = view.getByRole('textbox', { name: '繁體中文 skipToContent' });

    // When
    fireEvent.change(field, { target: { value: '' } });

    // Then
    const nextPayload = view.onChange.mock.calls[0]?.[0];
    expect(nextPayload?.zh.inline.skipToContent).toBe('');
    expect(CMS_PAYLOAD_REGISTRY.site_copy.schema.safeParse(nextPayload).success).toBe(true);
  });

  it('maps a supplied issue only to its exact bilingual leaf', () => {
    // Given / When
    const mappedIssues = mapGlobalEditorIssues([
      { path: ['en', 'strings', 'heroTitle1'], message: 'Add the English title' },
    ]);
    const view = render(
      <SiteCopyEditor payload={fixture} issues={mappedIssues} onChange={vi.fn()} />,
    );

    // Then
    expect(view.getByRole('textbox', { name: 'English heroTitle1' }).getAttribute('aria-invalid')).toBe('true');
    expect(view.getByRole('textbox', { name: '繁體中文 heroTitle1' }).hasAttribute('aria-invalid')).toBe(false);
    expect(view.getByRole('alert').textContent).toBe('Add the English title');
  });

  it('keeps missing fixed keys outside the typed editor boundary', () => {
    // Given
    const { aiBody, ...stringsWithoutAiBody } = fixture.zh.strings;
    const editorText = JSON.stringify({
      ...fixture,
      zh: { ...fixture.zh, strings: stringsWithoutAiBody },
    });

    // When
    const result = parseGlobalEditorText('site_copy', editorText);

    // Then
    expect(aiBody).toBe(fixture.zh.strings.aiBody);
    expect(result.status).toBe('invalid-payload');
    if (result.status !== 'invalid-payload') return;
    expect(result.issues.map((issue) => issue.path)).toContainEqual(['zh', 'strings', 'aiBody']);
  });

  it('keeps unknown nested keys outside the typed editor boundary without stripping them', () => {
    // Given
    const editorText = JSON.stringify({
      ...fixture,
      zh: {
        ...fixture.zh,
        strings: { ...fixture.zh.strings, unexpected: 'preserve me' },
      },
    });

    // When
    const result = parseGlobalEditorText('site_copy', editorText);

    // Then
    expect(result.status).toBe('invalid-payload');
    if (result.status !== 'invalid-payload') return;
    expect(result.editorText).toBe(editorText);
    expect(result.issues.map((issue) => issue.path)).toContainEqual(['zh', 'strings']);
  });
});
