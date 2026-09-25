import { describe, expect, it } from 'vitest';
import { fieldIdForStructuredEditorIssuePath } from '@/admin/editors/shared';
import { changedFieldIds, isFieldChanged } from './changedFields';

const published = { zh: { items: [{ title: '甲', date: '2026-01-01' }], intro: '介紹' } };

describe('changed fields', () => {
  it('reports exactly the fields that differ from the published payload', () => {
    const next = { zh: { items: [{ title: '乙', date: '2026-01-01' }], intro: '介紹' } };
    const changed = changedFieldIds(published, JSON.stringify(next));

    expect(isFieldChanged(changed, fieldIdForStructuredEditorIssuePath(['zh', 'items', 0, 'title']))).toBe(true);
    expect(isFieldChanged(changed, fieldIdForStructuredEditorIssuePath(['zh', 'items', 0, 'date']))).toBe(false);
    expect(isFieldChanged(changed, fieldIdForStructuredEditorIssuePath(['zh', 'intro']))).toBe(false);
  });

  it('counts every field of an added item as changed', () => {
    const next = { zh: { items: [{ title: '甲', date: '2026-01-01' }, { title: '新', date: '2026-02-02' }], intro: '介紹' } };
    const changed = changedFieldIds(published, JSON.stringify(next));

    expect(isFieldChanged(changed, fieldIdForStructuredEditorIssuePath(['zh', 'items', 1, 'date']))).toBe(true);
    expect(isFieldChanged(changed, fieldIdForStructuredEditorIssuePath(['zh', 'items', 0, 'date']))).toBe(false);
  });

  it('marks nothing before a first publication or while the text is not JSON', () => {
    expect(changedFieldIds(null, '{}')).toEqual([]);
    expect(changedFieldIds(published, '{broken')).toEqual([]);
  });
});
