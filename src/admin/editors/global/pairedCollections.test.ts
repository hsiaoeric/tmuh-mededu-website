import { describe, expect, it } from 'vitest';
import {
  insertPaired,
  movePaired,
  nextCollectionId,
  removePaired,
  updatePaired,
  type PairedCollection,
} from './pairedCollections';

type Row = { readonly label: string };

function collection(): PairedCollection<Row> {
  return {
    zh: [{ label: '甲' }, { label: '乙' }, { label: '丙' }],
    en: [{ label: 'A' }, { label: 'B' }, { label: 'C' }],
  };
}

describe('paired bilingual collection operations', () => {
  it('returns the first available deterministic identity for a collection', () => {
    // Given
    const existingIds = ['new-person-1', 'new-person-3'];

    // When
    const id = nextCollectionId('new-person', existingIds);

    // Then
    expect(id).toBe('new-person-2');
  });

  it('inserts both locale rows at the same position without adding identity metadata', () => {
    const source = collection();
    const rows = { zh: { label: '新' }, en: { label: 'New' } };

    const result = insertPaired(source, { index: 1, rows });

    expect(result).toEqual({
      ok: true,
      collection: {
        zh: [{ label: '甲' }, { label: '新' }, { label: '乙' }, { label: '丙' }],
        en: [{ label: 'A' }, { label: 'New' }, { label: 'B' }, { label: 'C' }],
      },
    });
    expect(Object.keys(rows.zh)).toEqual(['label']);
    expect(source).toEqual(collection());
  });

  it('removes and moves corresponding locale rows atomically', () => {
    const source = collection();

    const removed = removePaired(source, { index: 1 });
    const moved = movePaired(source, { fromIndex: 0, toIndex: 2 });

    expect(removed).toEqual({
      ok: true,
      collection: {
        zh: [{ label: '甲' }, { label: '丙' }],
        en: [{ label: 'A' }, { label: 'C' }],
      },
    });
    expect(moved).toEqual({
      ok: true,
      collection: {
        zh: [{ label: '乙' }, { label: '丙' }, { label: '甲' }],
        en: [{ label: 'B' }, { label: 'C' }, { label: 'A' }],
      },
    });
    expect(source).toEqual(collection());
  });

  it('updates only the paired rows at the requested position', () => {
    const source = collection();
    const rows = { zh: { label: '改' }, en: { label: 'Changed' } };

    const result = updatePaired(source, { index: 2, rows });

    expect(result).toEqual({
      ok: true,
      collection: {
        zh: [{ label: '甲' }, { label: '乙' }, { label: '改' }],
        en: [{ label: 'A' }, { label: 'B' }, { label: 'Changed' }],
      },
    });
    expect(source.zh[2]).toEqual({ label: '丙' });
    expect(source.en[2]).toEqual({ label: 'C' });
  });

  it.each([
    ['insert', (value: PairedCollection<Row>) => insertPaired(value, {
      index: 0,
      rows: { zh: { label: '新' }, en: { label: 'New' } },
    })],
    ['remove', (value: PairedCollection<Row>) => removePaired(value, { index: 0 })],
    ['move', (value: PairedCollection<Row>) => movePaired(value, {
      fromIndex: 0,
      toIndex: 1,
    })],
    ['update', (value: PairedCollection<Row>) => updatePaired(value, {
      index: 0,
      rows: { zh: { label: '改' }, en: { label: 'Changed' } },
    })],
  ] as const)('rejects mismatched locale lengths before %s', (_name, operation) => {
    const source = { zh: [{ label: '甲' }], en: [] };

    const result = operation(source);

    expect(result).toEqual({ ok: false, reason: 'length-mismatch' });
    expect(source).toEqual({ zh: [{ label: '甲' }], en: [] });
  });

  it.each([
    ['insert', insertPaired(collection(), {
      index: 4,
      rows: { zh: { label: '新' }, en: { label: 'New' } },
    })],
    ['remove', removePaired(collection(), { index: -1 })],
    ['move-source', movePaired(collection(), { fromIndex: 3, toIndex: 0 })],
    ['move-target', movePaired(collection(), { fromIndex: 0, toIndex: 3 })],
    ['update', updatePaired(collection(), {
      index: 3,
      rows: { zh: { label: '改' }, en: { label: 'Changed' } },
    })],
  ])('rejects out-of-bounds %s operations', (_name, result) => {
    expect(result).toEqual({ ok: false, reason: 'index-out-of-bounds' });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, 0.5])(
    'rejects a non-integer index without touching either locale: %s',
    (index) => {
      const source = collection();

      const result = removePaired(source, { index });

      expect(result).toEqual({ ok: false, reason: 'index-out-of-bounds' });
      expect(source).toEqual(collection());
    },
  );

  it('composes recursively for nested paired arrays', () => {
    type NestedRow = {
      readonly heading: string;
      readonly children: PairedCollection<Row>;
    };
    const children = collection();
    const source: PairedCollection<NestedRow> = {
      zh: [{ heading: '中文', children }],
      en: [{ heading: 'English', children }],
    };
    const nested = removePaired(children, { index: 0 });
    if (!nested.ok) throw new TypeError('Expected nested removal to succeed');

    const result = updatePaired(source, {
      index: 0,
      rows: {
        zh: { ...source.zh[0], children: nested.collection },
        en: { ...source.en[0], children: nested.collection },
      },
    });

    expect(result.ok && result.collection.zh[0]?.children.zh).toEqual([
      { label: '乙' },
      { label: '丙' },
    ]);
    expect(children).toEqual(collection());
  });
});
