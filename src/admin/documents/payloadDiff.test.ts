import { describe, expect, it } from 'vitest';
import { diffPayloads, formatChangePath, formatChangeValue } from './payloadDiff';

describe('payload diff', () => {
  it('reports only changed leaves with their paths', () => {
    const before = { zh: { title: '舊標題', tags: ['a', 'b'] }, en: { title: 'Old' } };
    const after = { zh: { title: '新標題', tags: ['a', 'b'] }, en: { title: 'Old' } };

    expect(diffPayloads(before, after)).toEqual([
      { kind: 'changed', path: ['zh', 'title'], before: '舊標題', after: '新標題' },
    ]);
  });

  it('reports an added or removed list item once instead of every field inside it', () => {
    const before = { items: [{ id: 'a', title: 'A' }] };
    const added = { items: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }] };

    expect(diffPayloads(before, added)).toEqual([
      { kind: 'added', path: ['items', 1], after: { id: 'b', title: 'B' } },
    ]);
    expect(diffPayloads(added, before)).toEqual([
      { kind: 'removed', path: ['items', 1], before: { id: 'b', title: 'B' } },
    ]);
  });

  it('returns nothing for identical payloads', () => {
    const payload = { zh: { list: [1, 2, { nested: true }] } };
    expect(diffPayloads(payload, structuredClone(payload))).toEqual([]);
  });

  it('formats locale roots and list positions for editors', () => {
    expect(formatChangePath(['zh', 'department', 1, 'title'], true)).toBe('中文 › department › 第 2 項 › title');
    expect(formatChangePath(['en', 'items', 0], false)).toBe('English › items › item 1');
  });

  it('shortens long or empty values to one readable line', () => {
    expect(formatChangeValue('')).toBe('（空白）');
    expect(formatChangeValue('line one\n  line two')).toBe('line one line two');
    expect(formatChangeValue('x'.repeat(80), 10)).toBe(`${'x'.repeat(9)}…`);
    expect(formatChangeValue({ a: 1 })).toBe('{"a":1}');
  });
});
