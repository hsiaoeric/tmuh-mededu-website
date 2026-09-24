// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  parseStructuredEditorText as parseGlobalEditorText,
  useStructuredEditorModel as useGlobalEditorModel,
} from '@/admin/editors/shared';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import snapshot from '@/content/generated/cms-snapshot.json';

function invalidKpiText(): string {
  const source = snapshot.find((candidate) => candidate.kind === 'kpis');
  if (source === undefined) throw new TypeError('Missing KPI fixture');
  const payload = CMS_PAYLOAD_REGISTRY.kpis.schema.parse(structuredClone(source.payload));
  const first = payload.zh.items[0];
  if (first === undefined) throw new TypeError('Missing KPI row');
  return JSON.stringify({
    ...payload,
    zh: { items: [{ ...first, color: 'purple' }, ...payload.zh.items.slice(1)] },
  });
}

describe('useStructuredEditorModel editable-invalid state', () => {
  it('commits typed corrections and becomes strict-valid without normalizing an unchanged projection', () => {
    const onEditorTextChange = vi.fn();
    const editorText = invalidKpiText();
    const { result } = renderHook(() => useGlobalEditorModel({
      kind: 'kpis',
      editorText,
      onEditorTextChange,
    }));
    if (result.current.status !== 'editable-invalid') throw new TypeError('Expected editable-invalid KPI');
    const first = result.current.payload.zh.items[0];
    if (first === undefined) throw new TypeError('Missing editable KPI row');
    const corrected = {
      ...result.current.payload,
      zh: { items: [{ ...first, color: '#123456' }, ...result.current.payload.zh.items.slice(1)] },
    };

    let unchanged;
    let emitted;
    act(() => {
      unchanged = result.current.status === 'editable-invalid'
        ? result.current.commitPayload(result.current.payload)
        : { status: 'stale' } as const;
      emitted = result.current.status === 'editable-invalid'
        ? result.current.commitPayload(corrected)
        : { status: 'stale' } as const;
    });

    expect(unchanged).toEqual({ status: 'unchanged' });
    expect(emitted).toEqual({ status: 'emitted' });
    const emittedText = onEditorTextChange.mock.lastCall?.[0];
    expect(typeof emittedText).toBe('string');
    expect(typeof emittedText === 'string' ? parseGlobalEditorText('kpis', emittedText).status : null).toBe('valid');
  });

  it('rejects an editable-invalid stale closure after an external revision', () => {
    const onEditorTextChange = vi.fn();
    const editorText = invalidKpiText();
    const { result, rerender } = renderHook(
      (text: string) => useGlobalEditorModel({ kind: 'kpis', editorText: text, onEditorTextChange }),
      { initialProps: editorText },
    );
    if (result.current.status !== 'editable-invalid') throw new TypeError('Expected editable-invalid KPI');
    const staleCommit = result.current.commitPayload;
    const stalePayload = result.current.payload;

    rerender(`${editorText}\n`);
    let outcome;
    act(() => {
      outcome = staleCommit(stalePayload);
    });

    expect(outcome).toEqual({ status: 'stale' });
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });
});
