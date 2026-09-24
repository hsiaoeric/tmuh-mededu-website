// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { mapStructuredEditorIssues as mapGlobalEditorIssues } from '@/admin/editors/shared';
import snapshot from '@/content/generated/cms-snapshot.json';
import {
  CMS_PAYLOAD_REGISTRY,
  type CmsPayloadByKind,
  type EditableCmsPayloadByKind,
} from '@/content/contracts/registry';
import { KpisEditor, type KpisEditorProps } from './KpisEditor';

type KpisPayload = CmsPayloadByKind['kpis'];
type EditableKpisPayload = EditableCmsPayloadByKind['kpis'];

const fixtureDocument = snapshot.find((document) => document.kind === 'kpis');
if (fixtureDocument === undefined) throw new TypeError('Missing kpis fixture');
const fixture: KpisPayload = CMS_PAYLOAD_REGISTRY.kpis.schema.parse(fixtureDocument.payload);
const issues = mapGlobalEditorIssues([]);

function ControlledEditor({ initial = fixture }: { readonly initial?: EditableKpisPayload }) {
  const [payload, setPayload] = useState(initial);
  return (
    <>
      <KpisEditor payload={payload} issues={issues} onChange={(next) => {
        setPayload(next);
        return { status: 'emitted' };
      }} />
      <output data-testid="payload">{JSON.stringify(payload)}</output>
    </>
  );
}

afterEach(cleanup);

describe('KPI editor', () => {
  it('accepts the exact typed controlled-component contract', () => {
    expectTypeOf<KpisEditorProps['payload']>().toEqualTypeOf<EditableKpisPayload>();
    expectTypeOf<KpisEditorProps['onChange']>().toEqualTypeOf<
      KpisEditorProps['onChange']
    >();
  });

  it('renders every persisted field for both locales in Chinese-first order', () => {
    // Given / When
    const view = render(<KpisEditor payload={fixture} issues={issues} onChange={vi.fn()} />);

    // Then
    const firstGroup = view.getByRole('group', { name: 'KPI 雙語內容 1' });
    const controls = Array.from(firstGroup.querySelectorAll('input'));
    expect(controls).toHaveLength(16);
    expect(controls.map((control) => control.closest('[lang]')?.getAttribute('lang'))).toEqual([
      ...Array.from({ length: 8 }, () => 'zh-Hant'),
      ...Array.from({ length: 8 }, () => 'en'),
    ]);
    expect(controls.map((control) => control.getAttribute('value'))).toEqual([
      String(fixture.zh.items[0]?.num),
      fixture.zh.items[0]?.suffix,
      fixture.zh.items[0]?.label,
      fixture.zh.items[0]?.en,
      fixture.zh.items[0]?.panelTitle,
      fixture.zh.items[0]?.panelDescription ?? '',
      fixture.zh.items[0]?.color,
      String(fixture.zh.items[0]?.delay),
      String(fixture.en.items[0]?.num),
      fixture.en.items[0]?.suffix,
      fixture.en.items[0]?.label,
      fixture.en.items[0]?.en,
      fixture.en.items[0]?.panelTitle,
      fixture.en.items[0]?.panelDescription ?? '',
      fixture.en.items[0]?.color,
      String(fixture.en.items[0]?.delay),
    ]);
  });

  it.each([
    ['繁體中文數值', '12.5', 'zh', 'num', 12.5],
    ['English suffix', '+', 'en', 'suffix', '+'],
    ['繁體中文標籤', '更新標籤', 'zh', 'label', '更新標籤'],
    ['English label', 'Updated label', 'en', 'label', 'Updated label'],
    ['繁體中文英文輔助標籤', 'Zh auxiliary English', 'zh', 'en', 'Zh auxiliary English'],
    ['English auxiliary English label', 'English auxiliary', 'en', 'en', 'English auxiliary'],
    ['繁體中文面板標題', '更新面板標題', 'zh', 'panelTitle', '更新面板標題'],
    ['English panel description (optional)', 'Updated panel copy', 'en', 'panelDescription', 'Updated panel copy'],
    ['繁體中文色碼', '#123abc', 'zh', 'color', '#123abc'],
    ['English delay (ms)', '-2.75', 'en', 'delay', -2.75],
  ] as const)('changes only %s and preserves every sibling', (label, input, locale, field, expected) => {
    // Given
    const onChange = vi.fn((_payload: EditableKpisPayload) => ({ status: 'emitted' } as const));
    const view = render(<KpisEditor payload={fixture} issues={issues} onChange={onChange} />);

    // When
    fireEvent.change(view.getAllByRole('textbox', { name: label })[0] ?? new EventTarget(), {
      target: { value: input },
    });

    // Then
    expect(onChange).toHaveBeenCalledOnce();
    const next = onChange.mock.calls[0]?.[0];
    expect(next?.[locale].items[0]?.[field]).toBe(expected);
    const otherLocale = locale === 'zh' ? 'en' : 'zh';
    expect(next?.[otherLocale]).toEqual(fixture[otherLocale]);
    expect(next?.[locale].items.slice(1)).toEqual(fixture[locale].items.slice(1));
  });

  it('renders canonical IDs as read-only and exposes no structural controls', () => {
    // Given / When
    const view = render(<ControlledEditor />);

    // Then
    expect(view.getAllByRole('textbox', { name: '固定識別碼 / Stable ID' }).map((field) => ({
      readOnly: field.hasAttribute('readonly'),
      value: field.getAttribute('value'),
    }))).toEqual([
      { readOnly: true, value: 'department_advisors' },
      { readOnly: true, value: 'teaching_attendings' },
      { readOnly: true, value: 'teaching_allied_health' },
      { readOnly: true, value: 'education_centers' },
    ]);
    expect(view.queryByRole('button', { name: /新增 KPI|上移第|下移第|刪除第/u })).toBeNull();
  });

  it('round-trips the generated fixture without mutation or emission', () => {
    // Given
    const before = structuredClone(fixture);
    const onChange = vi.fn((_payload: EditableKpisPayload) => ({ status: 'emitted' } as const));

    // When
    render(<KpisEditor payload={fixture} issues={issues} onChange={onChange} />);

    // Then
    expect(onChange).not.toHaveBeenCalled();
    expect(fixture).toEqual(before);
    expect(CMS_PAYLOAD_REGISTRY.kpis.schema.parse(fixture)).toEqual(fixture);
  });
});
