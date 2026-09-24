// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { AdminField } from '@/admin/AdminFields';
import { EditorCollection, type EditorCollectionCopy } from './EditorCollection';
import { EditorDensityProvider, revealAndFocus } from './EditorDensity';

type Row = { readonly title: string; readonly date: string; readonly place: string };

const COPY: EditorCollectionCopy = {
  addLabel: '新增活動',
  emptyTitle: '尚無活動',
  emptyDescription: '建立第一個活動。',
  itemLabel: (position, total) => `第 ${position} 個活動，共 ${total} 個`,
  moveUpLabel: (position) => `上移第 ${position} 個`,
  moveDownLabel: (position) => `下移第 ${position} 個`,
  removeLabel: (position) => `刪除第 ${position} 個`,
  removeTitle: (position) => `刪除第 ${position} 個？`,
  removeDescription: '此操作會刪除活動。',
  removeBody: '確認後才會刪除。',
  confirmRemoveLabel: '確認刪除',
  cancelRemoveLabel: '保留',
  movedAnnouncement: (from, to, total) => `已將第 ${from} 個移至第 ${to} 個，共 ${total} 個。`,
};

const ROWS: readonly Row[] = [
  { title: '全人照護研習', date: '2026-07-22', place: '線上' },
  { title: '教師培育工作坊', date: '2026-08-05', place: '第一會議室' },
];

function Harness({ collapsible }: { readonly collapsible: boolean }) {
  const [rows, setRows] = useState(ROWS);
  const update = (index: number, key: keyof Row, value: string) => {
    setRows((current) => current.map((row, position) => (position === index ? { ...row, [key]: value } : row)));
  };
  return (
    <EditorDensityProvider collapseItemsByDefault={collapsible} isZh>
      <EditorCollection
        id="activities"
        title="活動清單"
        itemCount={rows.length}
        revisionKeys={[rows]}
        copy={COPY}
        onAdd={() => ({ status: 'unchanged' })}
        onRemove={() => ({ status: 'unchanged' })}
        renderItem={(index) => (
          <div lang="zh-Hant">
            <AdminField id={`activity-${index}-s-74_69_74_6c_65`} label={`標題 ${index + 1}`} value={rows[index]!.title} onChange={(event) => update(index, 'title', event.currentTarget.value)} />
            <AdminField label={`日期 ${index + 1}`} value={rows[index]!.date} onChange={(event) => update(index, 'date', event.currentTarget.value)} />
            <AdminField label={`地點 ${index + 1}`} value={rows[index]!.place} onChange={(event) => update(index, 'place', event.currentTarget.value)} />
          </div>
        )}
      />
    </EditorDensityProvider>
  );
}

afterEach(cleanup);

describe('editor collection density', () => {
  it('starts multi-field items collapsed with a title-and-date summary', () => {
    const view = render(<Harness collapsible />);

    expect(view.getByText('全人照護研習 · 2026-07-22')).toBeTruthy();
    expect(view.getByText('教師培育工作坊 · 2026-08-05')).toBeTruthy();
    expect(view.container.querySelectorAll('[data-collapsed]')).toHaveLength(2);
    expect(view.getByRole('button', { name: '展開第 1 個活動，共 2 個' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps every field visible when collapsing is not enabled', () => {
    const view = render(<Harness collapsible={false} />);

    expect(view.container.querySelectorAll('[data-collapsed]')).toHaveLength(0);
    expect(view.getByRole('textbox', { name: '標題 1' })).toBeTruthy();
  });

  it('keeps each typed character in an expanded item', async () => {
    // Typing must reach the field's own change handler. jsdom schedules React updates differently
    // from a browser, so the browser-only dropped-keystroke bug (summaries re-measured on raw
    // input events) is not reproducible here; this only guards the ordinary path.
    const user = userEvent.setup();
    const view = render(<Harness collapsible />);
    await user.click(view.getByRole('button', { name: '展開第 1 個活動，共 2 個' }));
    const title = view.getByRole('textbox', { name: '標題 1' });

    await user.type(title, '（更新）');

    expect((title as HTMLInputElement).value).toBe('全人照護研習（更新）');
  });

  it('expands and collapses every item together', async () => {
    const user = userEvent.setup();
    const view = render(<Harness collapsible />);

    await user.click(view.getByRole('button', { name: '全部展開' }));
    expect(view.container.querySelectorAll('[data-collapsed]')).toHaveLength(0);

    await user.click(view.getByRole('button', { name: '全部收合' }));
    expect(view.container.querySelectorAll('[data-collapsed]')).toHaveLength(2);
  });

  it('opens the item that holds a field a validation link reveals', () => {
    const view = render(<Harness collapsible />);
    const hiddenField = view.container.querySelector<HTMLInputElement>('#activity-1-s-74_69_74_6c_65');

    act(() => revealAndFocus(hiddenField));

    const second = view.container.querySelector('[data-editor-item-index="1"]');
    expect(second?.hasAttribute('data-collapsed')).toBe(false);
    expect(view.container.querySelector('[data-editor-item-index="0"]')?.hasAttribute('data-collapsed')).toBe(true);
    fireEvent.change(hiddenField!, { target: { value: '改名' } });
    expect(hiddenField?.value).toBe('改名');
  });
});
