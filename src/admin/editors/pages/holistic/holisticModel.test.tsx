// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useStructuredEditorModel } from '@/admin/editors/shared';
import { holisticFixture } from './HolisticEditor.testHarness';

describe('holistic shared structured model', () => {
  it('preserves raw JSON recovery when bilingual collections mismatch', () => {
    // Given
    const payload = holisticFixture();
    const editorText = JSON.stringify({ ...payload, en: { ...payload.en, algee: payload.en.algee.slice(1) } }, null, 2);

    // When
    const { result } = renderHook(() => useStructuredEditorModel({ kind: 'holistic', editorText, onEditorTextChange: vi.fn() }));

    // Then
    expect(result.current.status).toBe('invalid-payload');
    expect(result.current.editorText).toBe(editorText);
  });

  it('preserves raw JSON recovery when a required symposium year is missing', () => {
    // Given
    const payload = structuredClone(holisticFixture());
    const symposium = payload.zh.outcomes.symposiums[0];
    if (symposium === undefined) throw new TypeError('Missing symposium');
    Reflect.deleteProperty(symposium, 'year');
    const editorText = JSON.stringify(payload, null, 2);

    // When
    const { result } = renderHook(() => useStructuredEditorModel({ kind: 'holistic', editorText, onEditorTextChange: vi.fn() }));

    // Then
    expect(result.current.status).toBe('invalid-payload');
    expect(result.current.editorText).toBe(editorText);
  });

  it('gates unchanged and stale holistic commits', () => {
    // Given
    const payload = holisticFixture();
    const editorText = JSON.stringify(payload, null, 2);
    const onChange = vi.fn();
    const { result, rerender } = renderHook((text: string) => useStructuredEditorModel({ kind: 'holistic', editorText: text, onEditorTextChange: onChange }), { initialProps: editorText });
    if (result.current.status !== 'valid') throw new TypeError('Expected valid holistic model');
    const commit = result.current.commitPayload;

    // When
    let unchanged;
    let stale;
    act(() => { unchanged = commit(payload); });
    rerender(`${editorText}\n`);
    act(() => { stale = commit({ ...payload, zh: { ...payload.zh, features: [] }, en: { ...payload.en, features: [] } }); });

    // Then
    expect(unchanged).toEqual({ status: 'unchanged' });
    expect(stale).toEqual({ status: 'stale' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
