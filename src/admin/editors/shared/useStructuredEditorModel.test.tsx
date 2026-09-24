// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import snapshot from '@/content/generated/cms-snapshot.json';
import { DraftMediaReferenceSchema } from '@/content/media';
import {
  emitStructuredEditorText as emitGlobalEditorText,
  useStructuredEditorModel as useGlobalEditorModel,
} from '@/admin/editors/shared';

function fixtureText(kind: 'people' | 'kpis'): string {
  const document = snapshot.find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return JSON.stringify(document.payload, null, 2);
}

type HookProps<K extends 'people' | 'kpis'> = {
  readonly kind: K;
  readonly editorText: string;
  readonly onEditorTextChange: (editorText: string) => void;
};

describe('useStructuredEditorModel', () => {
  it('projects valid controlled text without emitting during render or mode load', () => {
    const onEditorTextChange = vi.fn();
    const initialProps: HookProps<'people' | 'kpis'> = {
      kind: 'people',
      editorText: fixtureText('people'),
      onEditorTextChange,
    };
    const { result, rerender } = renderHook(
      (props: HookProps<'people' | 'kpis'>) => useGlobalEditorModel(props),
      { initialProps },
    );

    rerender({ ...initialProps, kind: 'kpis', editorText: fixtureText('kpis') });

    expect(result.current.status).toBe('valid');
    expect(result.current.kind).toBe('kpis');
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });

  it('emits an explicit typed change exactly once and suppresses an exact no-op', () => {
    const onEditorTextChange = vi.fn();
    const editorText = fixtureText('kpis');
    const { result } = renderHook(() => useGlobalEditorModel({
      kind: 'kpis',
      editorText,
      onEditorTextChange,
    }));
    if (result.current.status !== 'valid') throw new TypeError('Expected valid fixture');
    const firstItem = result.current.payload.zh.items[0];
    if (firstItem === undefined) throw new TypeError('Expected KPI fixture item');
    const changed = {
      ...result.current.payload,
      zh: {
        ...result.current.payload.zh,
        items: [
          { ...firstItem, label: `${firstItem.label} changed` },
          ...result.current.payload.zh.items.slice(1),
        ],
      },
    };

    let emitted;
    let unchanged;
    act(() => {
      emitted = result.current.status === 'valid'
        ? result.current.commitPayload(changed)
        : { status: 'stale' } as const;
      unchanged = result.current.status === 'valid'
        ? result.current.commitPayload(result.current.payload)
        : { status: 'stale' } as const;
    });

    expect(emitted).toEqual({ status: 'emitted' });
    expect(unchanged).toEqual({ status: 'unchanged' });
    expect(onEditorTextChange).toHaveBeenCalledTimes(1);
    expect(onEditorTextChange).toHaveBeenCalledWith(emitGlobalEditorText('kpis', changed));
    expect(Object.keys(JSON.parse(onEditorTextChange.mock.lastCall?.[0] ?? '{}'))).toEqual(
      Object.keys(changed),
    );
  });

  it('reparses malformed and schema-invalid external text without normalizing it', () => {
    const onEditorTextChange = vi.fn();
    const { result, rerender } = renderHook(
      (props: HookProps<'kpis'>) => useGlobalEditorModel(props),
      {
        initialProps: {
          kind: 'kpis',
          editorText: '{broken',
          onEditorTextChange,
        },
      },
    );
    expect(result.current.status).toBe('malformed-json');
    expect(result.current.editorText).toBe('{broken');

    rerender({ kind: 'kpis', editorText: '{"zh":{}}', onEditorTextChange });

    expect(result.current.status).toBe('invalid-payload');
    expect(result.current.editorText).toBe('{"zh":{}}');
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });

  it('treats an unchanged typed projection as a no-op without normalizing source formatting', () => {
    const onEditorTextChange = vi.fn();
    const editorText = JSON.stringify(JSON.parse(fixtureText('kpis')));
    const { result } = renderHook(() => useGlobalEditorModel({
      kind: 'kpis',
      editorText,
      onEditorTextChange,
    }));
    if (result.current.status !== 'valid') throw new TypeError('Expected valid fixture');

    let outcome;
    act(() => {
      outcome = result.current.status === 'valid'
        ? result.current.commitPayload(result.current.payload)
        : { status: 'stale' } as const;
    });

    expect(outcome).toEqual({ status: 'unchanged' });
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });

  it('preserves a media-originated portrait revision in the next structured edit', () => {
    const onEditorTextChange = vi.fn();
    const initialText = fixtureText('people');
    const { result, rerender } = renderHook(
      (props: HookProps<'people'>) => useGlobalEditorModel(props),
      { initialProps: { kind: 'people', editorText: initialText, onEditorTextChange } },
    );
    if (result.current.status !== 'valid') throw new TypeError('Expected valid fixture');
    const portrait = DraftMediaReferenceSchema.parse({
      kind: 'draft',
      bucket: 'draft-media',
      path: `11111111-1111-4111-8111-111111111111/${'a'.repeat(64)}.webp`,
    });
    const mediaPayload = {
      ...result.current.payload,
      zh: {
        ...result.current.payload.zh,
        holisticInstructors: result.current.payload.zh.holisticInstructors.map(
          (person, index) => index === 0 ? { ...person, portrait } : person,
        ),
      },
    };
    const mediaText = emitGlobalEditorText('people', mediaPayload);

    rerender({ kind: 'people', editorText: mediaText, onEditorTextChange });
    if (result.current.status !== 'valid') throw new TypeError('Expected media revision');
    const firstAiMember = result.current.payload.en.holisticAiTeam[0];
    if (firstAiMember === undefined) throw new TypeError('Expected AI team fixture member');
    const structuredPayload = {
      ...result.current.payload,
      en: {
        ...result.current.payload.en,
        holisticAiTeam: [
          { ...firstAiMember, duty: `${firstAiMember.duty} changed` },
          ...result.current.payload.en.holisticAiTeam.slice(1),
        ],
      },
    };
    act(() => {
      if (result.current.status === 'valid') result.current.commitPayload(structuredPayload);
    });

    const emittedText = onEditorTextChange.mock.lastCall?.[0];
    expect(typeof emittedText).toBe('string');
    expect(emittedText === undefined ? null : JSON.parse(emittedText)).toEqual(structuredPayload);
  });

  it('rejects a stale closure after an external revision, including an ABA text revision', () => {
    const onEditorTextChange = vi.fn();
    const firstText = fixtureText('kpis');
    const secondText = `${firstText}\n`;
    const { result, rerender } = renderHook(
      (props: HookProps<'kpis'>) => useGlobalEditorModel(props),
      { initialProps: { kind: 'kpis', editorText: firstText, onEditorTextChange } },
    );
    if (result.current.status !== 'valid') throw new TypeError('Expected valid fixture');
    const staleCommit = result.current.commitPayload;
    const stalePayload = result.current.payload;

    rerender({ kind: 'kpis', editorText: secondText, onEditorTextChange });
    rerender({ kind: 'kpis', editorText: firstText, onEditorTextChange });
    let outcome;
    act(() => {
      outcome = staleCommit(stalePayload);
    });

    expect(outcome).toEqual({ status: 'stale' });
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });

  it('rejects a callback captured before the synchronized document kind changes', () => {
    const onEditorTextChange = vi.fn();
    const initialProps: HookProps<'people' | 'kpis'> = {
      kind: 'people',
      editorText: fixtureText('people'),
      onEditorTextChange,
    };
    const { result, rerender } = renderHook(
      (props: HookProps<'people' | 'kpis'>) => useGlobalEditorModel(props),
      { initialProps },
    );
    if (result.current.status !== 'valid') throw new TypeError('Expected people fixture');
    const staleCommit = result.current.commitPayload;
    const stalePayload = result.current.payload;

    rerender({
      kind: 'kpis',
      editorText: fixtureText('kpis'),
      onEditorTextChange,
    });
    let outcome;
    act(() => {
      outcome = staleCommit(stalePayload);
    });

    expect(outcome).toEqual({ status: 'stale' });
    expect(result.current.kind).toBe('kpis');
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });

  it('rejects an old typed action after conflict recovery replaces text with malformed source', () => {
    const onEditorTextChange = vi.fn();
    const initialText = fixtureText('kpis');
    const conflictText = '{"server-conflict":';
    const { result, rerender } = renderHook(
      (props: HookProps<'kpis'>) => useGlobalEditorModel(props),
      { initialProps: { kind: 'kpis', editorText: initialText, onEditorTextChange } },
    );
    if (result.current.status !== 'valid') throw new TypeError('Expected valid fixture');
    const staleCommit = result.current.commitPayload;
    const stalePayload = result.current.payload;

    rerender({ kind: 'kpis', editorText: conflictText, onEditorTextChange });
    let outcome;
    act(() => {
      outcome = staleCommit(stalePayload);
    });

    expect(outcome).toEqual({ status: 'stale' });
    expect(result.current.status).toBe('malformed-json');
    expect(result.current.editorText).toBe(conflictText);
    expect(onEditorTextChange).not.toHaveBeenCalled();
  });
});
