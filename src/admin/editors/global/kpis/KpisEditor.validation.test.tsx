// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapStructuredEditorIssues as mapGlobalEditorIssues } from '@/admin/editors/shared';
import snapshot from '@/content/generated/cms-snapshot.json';
import { CMS_PAYLOAD_REGISTRY, type EditableCmsPayloadByKind } from '@/content/contracts/registry';
import { KpisEditor } from './KpisEditor';

type KpisPayload = EditableCmsPayloadByKind['kpis'];

const fixtureDocument = snapshot.find((document) => document.kind === 'kpis');
if (fixtureDocument === undefined) throw new TypeError('Missing kpis fixture');
const fixture: KpisPayload = CMS_PAYLOAD_REGISTRY.kpis.schema.parse(fixtureDocument.payload);
const issues = mapGlobalEditorIssues([]);

afterEach(cleanup);

describe('KPI numeric and color drafts', () => {
  it.each([
    ['繁體中文數值', 'num', '0', 0],
    ['繁體中文數值', 'num', '-4', 0],
    ['繁體中文數值', 'num', '2.75', 0],
    ['繁體中文延遲（毫秒）', 'delay', '0', 1],
    ['繁體中文延遲（毫秒）', 'delay', '-4', 0],
    ['繁體中文延遲（毫秒）', 'delay', '2.75', 0],
  ] as const)(
    'commits schema-valid %s %s value: %s',
    (label, field, value, index) => {
      // Given
      const onChange = vi.fn((_payload: KpisPayload) => ({ status: 'emitted' } as const));
      const view = render(<KpisEditor payload={fixture} issues={issues} onChange={onChange} />);

      // When
      fireEvent.change(view.getAllByRole('textbox', { name: label })[index] ?? new EventTarget(), {
        target: { value },
      });

      // Then
      const next = onChange.mock.calls[0]?.[0];
      expect(next?.zh.items[index]?.[field]).toBe(Number(value));
      expect(next?.en).toEqual(fixture.en);
      expect(CMS_PAYLOAD_REGISTRY.kpis.schema.safeParse(next).success).toBe(true);
    },
  );

  it.each([
    ['繁體中文數值', String(fixture.zh.items[0]?.num)],
    ['繁體中文色碼', fixture.zh.items[0]?.color ?? ''],
  ])('does not emit when %s receives its controlled value', (label, value) => {
    // Given
    const onChange = vi.fn((_payload: KpisPayload) => ({ status: 'emitted' } as const));
    const view = render(<KpisEditor payload={fixture} issues={issues} onChange={onChange} />);

    // When
    fireEvent.change(view.getAllByRole('textbox', { name: label })[0] ?? new EventTarget(), {
      target: { value },
    });

    // Then
    expect(onChange).not.toHaveBeenCalled();
  });

  it('emits intermediate invalid numeric text without coercion or sibling mutation', () => {
    // Given
    const onChange = vi.fn((_payload: KpisPayload) => ({ status: 'emitted' } as const));
    const view = render(<KpisEditor payload={fixture} issues={issues} onChange={onChange} />);
    const number = view.getAllByRole('textbox', { name: '繁體中文數值' })[0];
    if (number === undefined) throw new TypeError('Missing KPI number field');

    // When
    fireEvent.change(number, { target: { value: '-' } });

    // Then
    expect(onChange).toHaveBeenCalledOnce();
    const next = onChange.mock.calls[0]?.[0];
    if (next === undefined) throw new TypeError('Missing emitted numeric draft');
    view.rerender(<KpisEditor payload={next} issues={issues} onChange={onChange} />);
    expect(view.getAllByRole('textbox', { name: '繁體中文數值' })[0]).toHaveProperty('value', '-');
    expect(view.getByRole('alert').textContent).toContain('有效數字');
    expect(next.zh.items[0]?.num).toBe('-');
    expect(CMS_PAYLOAD_REGISTRY.kpis.editableSchema.safeParse(next).success).toBe(true);
    expect(CMS_PAYLOAD_REGISTRY.kpis.schema.safeParse(next).success).toBe(false);
    expect(view.getAllByRole('textbox', { name: '繁體中文後綴' })[0]?.getAttribute('value')).toBe(
      fixture.zh.items[0]?.suffix,
    );
  });

  it('lets an external payload revision supersede a stale invalid numeric draft', () => {
    // Given
    const onChange = vi.fn((_payload: KpisPayload) => ({ status: 'emitted' } as const));
    const view = render(<KpisEditor payload={fixture} issues={issues} onChange={onChange} />);
    const number = view.getAllByRole('textbox', { name: '繁體中文數值' })[0];
    if (number === undefined) throw new TypeError('Missing KPI number field');
    fireEvent.change(number, { target: { value: '1e' } });
    expect(onChange).toHaveBeenCalledOnce();
    const firstZh = fixture.zh.items[0];
    if (firstZh === undefined) throw new TypeError('Missing KPI fixture row');
    const revised: KpisPayload = {
      ...fixture,
      zh: {
        items: [{ ...firstZh, num: 84.5 }, ...fixture.zh.items.slice(1)],
      },
    };

    // When
    onChange.mockClear();
    view.rerender(<KpisEditor payload={revised} issues={issues} onChange={onChange} />);

    // Then
    expect(view.getAllByRole('textbox', { name: '繁體中文數值' })[0]?.getAttribute('value')).toBe('84.5');
    expect(view.queryByRole('alert')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('emits invalid hex text with feedback, then emits a valid color', () => {
    // Given
    const onChange = vi.fn((_payload: KpisPayload) => ({ status: 'emitted' } as const));
    const view = render(<KpisEditor payload={fixture} issues={issues} onChange={onChange} />);
    const color = view.getAllByRole('textbox', { name: '繁體中文色碼' })[0];
    if (color === undefined) throw new TypeError('Missing KPI color field');

    // When
    fireEvent.change(color, { target: { value: '#12zz99' } });

    // Then
    expect(onChange).toHaveBeenCalledOnce();
    const invalid = onChange.mock.calls[0]?.[0];
    if (invalid === undefined) throw new TypeError('Missing emitted color draft');
    view.rerender(<KpisEditor payload={invalid} issues={issues} onChange={onChange} />);
    const invalidColor = view.getAllByRole('textbox', { name: '繁體中文色碼' })[0];
    if (invalidColor === undefined) throw new TypeError('Missing invalid color field');
    expect(invalidColor).toHaveProperty('value', '#12zz99');
    expect(invalidColor.getAttribute('aria-invalid')).toBe('true');
    expect(view.getByRole('alert').textContent).toContain('6 位十六進位');
    expect(invalid.zh.items[0]?.color).toBe('#12zz99');

    // When
    fireEvent.change(invalidColor, { target: { value: '#00aBcD' } });

    // Then
    expect(onChange).toHaveBeenCalledTimes(2);
    const valid = onChange.mock.calls[1]?.[0];
    if (valid === undefined) throw new TypeError('Missing emitted valid color');
    view.rerender(<KpisEditor payload={valid} issues={issues} onChange={onChange} />);
    expect(valid.zh.items[0]?.color).toBe('#00aBcD');
    expect(view.getAllByRole('textbox', { name: '繁體中文色碼' })[0]?.closest('.admin-field')?.getAttribute('data-field-state')).toBe('valid');
  });

  it('maps contract issues to the exact locale field only', () => {
    // Given / When
    const mappedIssues = mapGlobalEditorIssues([
      { path: ['en', 'items', 0, 'color'], message: 'Use a six-digit hex color' },
    ]);
    const view = render(<KpisEditor payload={fixture} issues={mappedIssues} onChange={vi.fn()} />);

    // Then
    expect(view.getAllByRole('textbox', { name: 'English color' })[0]?.getAttribute('aria-invalid')).toBe('true');
    expect(view.getAllByRole('textbox', { name: '繁體中文色碼' })[0]?.hasAttribute('aria-invalid')).toBe(false);
    expect(view.getByRole('alert').textContent).toBe('Use a six-digit hex color');
  });
});
