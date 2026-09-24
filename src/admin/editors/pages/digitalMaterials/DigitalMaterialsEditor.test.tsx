// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  mapStructuredEditorIssues,
  type StructuredEditorCommit,
} from '@/admin/editors/shared';
import snapshot from '@/content/generated/cms-snapshot.json';
import {
  CMS_PAYLOAD_REGISTRY,
  type EditableCmsPayloadByKind,
} from '@/content/contracts/registry';
import {
  DigitalMaterialsEditor,
  type DigitalMaterialsEditorProps,
} from './DigitalMaterialsEditor';

type DigitalMaterialsPayload = EditableCmsPayloadByKind['digital_materials'];

const fixtureDocument = snapshot.find((document) => document.kind === 'digital_materials');
if (fixtureDocument === undefined) throw new TypeError('Missing digital_materials fixture');

const fixture: DigitalMaterialsPayload = CMS_PAYLOAD_REGISTRY.digital_materials.schema.parse(
  fixtureDocument.payload,
);
const issues = mapStructuredEditorIssues([]);

function renderEditor(
  payload: DigitalMaterialsPayload = fixture,
  onChange = vi.fn<StructuredEditorCommit<DigitalMaterialsPayload>>(() => ({ status: 'emitted' })),
) {
  const view = render(
    <DigitalMaterialsEditor payload={payload} issues={issues} onChange={onChange} />,
  );
  return { ...view, onChange };
}

afterEach(cleanup);

describe('digital materials editor', () => {
  it('accepts the shared typed controlled-component contract', () => {
    expectTypeOf<DigitalMaterialsEditorProps['payload']>().toEqualTypeOf<DigitalMaterialsPayload>();
    expectTypeOf<DigitalMaterialsEditorProps['onChange']>().toEqualTypeOf<
      StructuredEditorCommit<DigitalMaterialsPayload>
    >();
  });

  it('renders five deterministic Chinese-first bilingual controls', () => {
    // Given / When
    const view = renderEditor();

    // Then
    expect(view.getAllByRole('group').map((group) => (
      group.querySelector('legend')?.textContent
    ))).toEqual([
      '頁面眉標 / Eyebrow',
      '頁面標題 / Title',
      '頁面狀態 / Status',
      '內容說明 / Body',
      '返回連結文字 / Back label',
    ]);
    expect(view.getAllByRole('textbox').map((control) => (
      control.closest('[lang]')?.getAttribute('lang')
    ))).toEqual([
      'zh-Hant', 'en',
      'zh-Hant', 'en',
      'zh-Hant', 'en',
      'zh-Hant', 'en',
      'zh-Hant', 'en',
    ]);
    expect(view.getAllByRole('textbox').filter((control) => (
      control instanceof HTMLTextAreaElement
    ))).toHaveLength(2);
    expect(view.onChange).not.toHaveBeenCalled();
  });

  it.each([
    [/^頁面標題（繁體中文）/, '更新後的數位教材室', 'zh', 'title'],
    [/^Body \(English\)/, 'Updated English construction message.', 'en', 'body'],
  ] as const)('changes only %s and preserves its sibling locale and unrelated data', (
    label,
    value,
    locale,
    field,
  ) => {
    // Given
    const view = renderEditor();

    // When
    fireEvent.change(view.getByRole('textbox', { name: label }), { target: { value } });

    // Then
    expect(view.onChange).toHaveBeenCalledOnce();
    const next = view.onChange.mock.calls[0]?.[0];
    expect(next).toEqual({
      ...fixture,
      [locale]: { ...fixture[locale], [field]: value },
    });
    expect(next?.[locale === 'zh' ? 'en' : 'zh']).toBe(
      fixture[locale === 'zh' ? 'en' : 'zh'],
    );
  });

  it('maps an issue to only the exact locale field', () => {
    // Given / When
    const mappedIssues = mapStructuredEditorIssues([
      { path: ['en', 'status'], message: 'Add the English status' },
    ]);
    const view = render(
      <DigitalMaterialsEditor payload={fixture} issues={mappedIssues} onChange={vi.fn()} />,
    );

    // Then
    expect(view.getByRole('textbox', { name: /^Status \(English\)/ }).getAttribute('aria-invalid')).toBe('true');
    expect(view.getByRole('textbox', { name: /^頁面狀態（繁體中文）/ }).hasAttribute('aria-invalid')).toBe(false);
    expect(view.getByRole('alert').textContent).toBe('Add the English status');
  });

  it('keeps a required blank editable-invalid and lets the same field repair it', () => {
    // Given
    const blank: DigitalMaterialsPayload = {
      ...fixture,
      zh: { ...fixture.zh, title: '' },
    };
    const view = renderEditor(blank);
    const field = view.getByRole('textbox', { name: /^頁面標題（繁體中文）/ });
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(view.getByRole('alert').textContent).toBe('此欄位不可留白');

    // When
    fireEvent.change(field, { target: { value: '修復後的標題' } });

    // Then
    expect(view.onChange.mock.calls[0]?.[0]).toEqual({
      ...blank,
      zh: { ...blank.zh, title: '修復後的標題' },
    });
  });
});
