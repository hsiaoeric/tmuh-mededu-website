// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminField, BilingualFieldPair } from '@/admin/AdminFields';
import type { StructuredEditorCommitResult as GlobalEditorCommitResult } from '@/admin/editors/shared';
import {
  insertPaired,
  movePaired,
  removePaired,
  type PairedCollection,
  type PairedCollectionResult,
} from '../pairedCollections';
import { EditorCollection, type EditorCollectionCopy } from './EditorCollection';

type Row = { readonly label: string; readonly url: string };

const COPY: EditorCollectionCopy = {
  addLabel: '新增項目',
  emptyTitle: '尚無項目',
  emptyDescription: '建立第一個中英文配對項目。',
  itemLabel: (position, total) => `項目 ${position}，共 ${total} 項`,
  moveUpLabel: (position) => `上移第 ${position} 項`,
  moveDownLabel: (position) => `下移第 ${position} 項`,
  removeLabel: (position) => `刪除第 ${position} 項`,
  removeTitle: (position) => `刪除第 ${position} 項？`,
  removeDescription: '繁體中文與英文會一併刪除。',
  removeBody: '確認後才會刪除此配對項目。',
  confirmRemoveLabel: '確認刪除',
  cancelRemoveLabel: '保留項目',
  movedAnnouncement: (from, to, total) => `已將第 ${from} 項移至第 ${to} 項，共 ${total} 項。`,
};

const INITIAL: PairedCollection<Row> = {
  zh: [
    { label: '甲', url: 'https://example.test/甲' },
    { label: '乙', url: 'https://example.test/乙' },
  ],
  en: [
    { label: 'A', url: 'https://example.test/a' },
    { label: 'B', url: 'https://example.test/b' },
  ],
};

function PairedCollectionHarness({ initial = INITIAL }: { readonly initial?: PairedCollection<Row> }) {
  const [collection, setCollection] = useState(initial);
  const accept = (result: PairedCollectionResult<Row>) => {
    if (!result.ok) throw new TypeError(`Unexpected paired operation failure: ${result.reason}`);
    setCollection(result.collection);
    return { status: 'emitted' } as const;
  };
  return (
    <>
      <EditorCollection
        id="links"
        title="參考連結"
        description="同步維護繁體中文與英文。"
        itemCount={collection.zh.length}
        revisionKeys={[collection.zh, collection.en]}
        copy={COPY}
        onAdd={() => accept(insertPaired(collection, {
          index: collection.zh.length,
          rows: {
            zh: { label: '新項目', url: 'https://example.test/非常長且沒有分隔的網址值' },
            en: { label: 'New item', url: 'https://example.test/verylongunbrokenurlvalue' },
          },
        }))}
        onMove={(fromIndex, toIndex) => accept(movePaired(collection, { fromIndex, toIndex }))}
        onRemove={(index) => accept(removePaired(collection, { index }))}
        renderItem={(index) => {
          const zh = collection.zh[index];
          const en = collection.en[index];
          if (zh === undefined || en === undefined) return null;
          return (
            <BilingualFieldPair
              label={`配對內容 ${index + 1}`}
              zh={<AdminField label={`繁中 ${index + 1}`} value={zh.label} readOnly />}
              en={<AdminField label={`英文 ${index + 1}`} value={en.label} readOnly />}
            />
          );
        }}
      />
      <output data-testid="serialized">{JSON.stringify(collection)}</output>
      <button type="button" onClick={() => setCollection({
        zh: [...collection.zh].reverse(),
        en: [...collection.en].reverse(),
      })}>外部重新排序</button>
      <button type="button" onClick={() => setCollection({
        zh: collection.zh.map((row, index) => index === 0 ? { label: '替換', url: 'https://example.test/replaced' } : row),
        en: collection.en.map((row, index) => index === 0 ? { label: 'Replacement', url: 'https://example.test/replacement' } : row),
      })}>外部替換</button>
    </>
  );
}

function RejectedCollectionHarness({ result }: {
  readonly result: GlobalEditorCommitResult;
}) {
  const [rows, setRows] = useState(INITIAL.zh);
  return (
    <>
      <EditorCollection
        id="rejected-links"
        title="參考連結"
        itemCount={rows.length}
        revisionKeys={[rows]}
        copy={COPY}
        onAdd={() => result}
        onMove={() => result}
        onRemove={() => result}
        renderItem={(index) => <AdminField label={`項目欄位 ${index + 1}`} value={rows[index]?.label ?? ''} readOnly />}
      />
      <button type="button" onClick={() => setRows([...rows, { label: '外部項目', url: 'https://example.test/external' }])}>外部新增</button>
      <output data-testid="rejected-serialized">{JSON.stringify(rows)}</output>
    </>
  );
}

afterEach(cleanup);

describe('editor collection', () => {
  it.each(['stale', 'unchanged'] as const)('does not focus a later occupant after a rejected %s add', async (status) => {
    // Given
    const user = userEvent.setup();
    const view = render(<RejectedCollectionHarness result={{ status }} />);
    await user.click(view.getByRole('button', { name: '新增項目' }));
    const externalAdd = view.getByRole('button', { name: '外部新增' });

    // When
    await user.click(externalAdd);

    // Then
    await waitFor(() => expect(document.activeElement).toBe(externalAdd));
    expect(JSON.parse(view.getByTestId('rejected-serialized').textContent ?? '[]')).toHaveLength(3);
  });

  it.each(['stale', 'unchanged'] as const)('does not announce or move focus after a rejected %s move', async (status) => {
    // Given
    const user = userEvent.setup();
    const view = render(<RejectedCollectionHarness result={{ status }} />);
    const moveDown = view.getByRole('button', { name: '下移第 1 項' });

    // When
    await user.click(moveDown);

    // Then
    expect(document.activeElement).toBe(moveDown);
    expect(view.container.querySelector('.admin-editor-reorder-announcer')?.textContent).toBe('');
    expect(JSON.parse(view.getByTestId('rejected-serialized').textContent ?? '[]')).toEqual(INITIAL.zh);
  });

  it.each(['stale', 'unchanged'] as const)('returns focus to the trigger after a rejected %s removal', async (status) => {
    // Given
    const user = userEvent.setup();
    const view = render(<RejectedCollectionHarness result={{ status }} />);
    const firstRemove = view.getByRole('button', { name: '刪除第 1 項' });
    const firstRemoveFocus = vi.spyOn(firstRemove, 'focus');
    const removeSecond = view.getByRole('button', { name: '刪除第 2 項' });
    await user.click(removeSecond);

    // When
    await user.click(view.getByRole('button', { name: '確認刪除' }));

    // Then
    await waitFor(() => expect(document.activeElement).toBe(removeSecond));
    expect(firstRemoveFocus).not.toHaveBeenCalled();
    expect(JSON.parse(view.getByTestId('rejected-serialized').textContent ?? '[]')).toEqual(INITIAL.zh);
  });

  it('renders an actionable empty state and focuses the newly added row', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<PairedCollectionHarness initial={{ zh: [], en: [] }} />);
    expect(view.getByRole('heading', { name: '尚無項目' })).toBeTruthy();

    // When
    await user.click(view.getByRole('button', { name: '新增項目' }));

    // Then
    await waitFor(() => expect(document.activeElement).toBe(view.getByRole('textbox', { name: '繁中 1' })));
  });

  it('moves paired rows by keyboard with boundary states and a live position announcement', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<PairedCollectionHarness />);
    const moveDown = view.getByRole('button', { name: '下移第 1 項' });
    moveDown.focus();

    // When
    await user.keyboard('{Enter}');

    // Then
    expect(view.getByRole('button', { name: '上移第 1 項' }).hasAttribute('disabled')).toBe(true);
    expect(view.getByRole('button', { name: '下移第 2 項' }).hasAttribute('disabled')).toBe(true);
    expect(view.container.querySelector('.admin-editor-reorder-announcer')?.textContent).toBe('已將第 1 項移至第 2 項，共 2 項。');
    await waitFor(() => expect(document.activeElement).toBe(view.getByRole('button', { name: '上移第 2 項' })));
    expect(JSON.parse(view.getByTestId('serialized').textContent ?? '{}')).toMatchObject({ zh: [{ label: '乙' }, { label: '甲' }], en: [{ label: 'B' }, { label: 'A' }] });
  });

  it('returns focus after cancellation and to the surviving row after confirmed deletion', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<PairedCollectionHarness />);
    const removeFirst = view.getByRole('button', { name: '刪除第 1 項' });
    await user.click(removeFirst);
    await user.click(view.getByRole('button', { name: '保留項目' }));
    expect(document.activeElement).toBe(removeFirst);

    // When
    await user.click(removeFirst);
    await user.click(view.getByRole('button', { name: '確認刪除' }));

    // Then
    await waitFor(() => expect(document.activeElement).toBe(view.getByRole('button', { name: '刪除第 1 項' })));
    expect(JSON.parse(view.getByTestId('serialized').textContent ?? '{}')).toEqual({
      zh: [{ label: '乙', url: 'https://example.test/乙' }],
      en: [{ label: 'B', url: 'https://example.test/b' }],
    });
  });

  it('does not confirm a removal after an external same-length reorder', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<PairedCollectionHarness />);
    await user.click(view.getByRole('button', { name: '刪除第 1 項' }));

    // When
    await user.click(view.getByRole('button', { name: '外部重新排序' }));
    await user.click(view.getByRole('button', { name: '確認刪除' }));

    // Then
    expect(view.queryByRole('button', { name: '確認刪除' })).toBeNull();
    expect(JSON.parse(view.getByTestId('serialized').textContent ?? '{}')).toEqual({
      zh: [INITIAL.zh[1], INITIAL.zh[0]],
      en: [INITIAL.en[1], INITIAL.en[0]],
    });
  });

  it('does not confirm a removal after an external same-length replacement', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<PairedCollectionHarness />);
    await user.click(view.getByRole('button', { name: '刪除第 1 項' }));

    // When
    await user.click(view.getByRole('button', { name: '外部替換' }));
    await user.click(view.getByRole('button', { name: '確認刪除' }));

    // Then
    expect(view.queryByRole('button', { name: '確認刪除' })).toBeNull();
    expect(JSON.parse(view.getByTestId('serialized').textContent ?? '{}')).toEqual({
      zh: [{ label: '替換', url: 'https://example.test/replaced' }, INITIAL.zh[1]],
      en: [{ label: 'Replacement', url: 'https://example.test/replacement' }, INITIAL.en[1]],
    });
  });

  it('keeps runtime controls and focus data out of serialized paired rows', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(<PairedCollectionHarness />);

    // When
    await user.click(view.getByRole('button', { name: '新增項目' }));

    // Then
    const serialized = JSON.parse(view.getByTestId('serialized').textContent ?? '{}') as PairedCollection<Row>;
    expect(serialized.zh.flatMap(Object.keys)).toEqual(['label', 'url', 'label', 'url', 'label', 'url']);
    expect(serialized.en.flatMap(Object.keys)).toEqual(['label', 'url', 'label', 'url', 'label', 'url']);
  });

  it('composes a nested collection without declaring another scroll region', () => {
    // Given / When
    const view = render(
      <EditorCollection id="outer" title="外層" itemCount={1} revisionKeys={[]} copy={COPY} onAdd={() => ({ status: 'emitted' })} onMove={() => ({ status: 'emitted' })} onRemove={() => ({ status: 'emitted' })} renderItem={() => (
        <EditorCollection id="inner" title="內層" itemCount={0} revisionKeys={[]} copy={COPY} onAdd={() => ({ status: 'emitted' })} onMove={() => ({ status: 'emitted' })} onRemove={() => ({ status: 'emitted' })} renderItem={() => null} />
      )} />,
    );

    // Then
    expect(view.container.querySelectorAll('.admin-editor-collection')).toHaveLength(2);
    expect(view.queryByRole('region', { name: '內層' })).toBeNull();
  });
});
