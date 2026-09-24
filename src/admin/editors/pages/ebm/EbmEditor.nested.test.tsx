// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CourseGroupsEditor } from './CourseGroupsEditor';
import { CourseRowsEditor } from './CourseRowsEditor';
import { StagesEditor } from './StagesEditor';
import { compactEbmFixture } from './EbmEditor.testFixture';
import type { CourseGroup, EbmPayload } from './types';

afterEach(cleanup);

function action(root: ParentNode, label: string): HTMLButtonElement {
  const button = Array.from(root.querySelectorAll('button')).find((candidate) => candidate.getAttribute('aria-label') === label || candidate.textContent === label);
  if (button === undefined) throw new TypeError(`Missing action: ${label}`);
  return button;
}

function NestedHarness() {
  const initial = compactEbmFixture();
  const [payload, setPayload] = useState<EbmPayload>(initial);
  const commit = (next: EbmPayload) => {
    setPayload(next);
    return { status: 'emitted' } as const;
  };
  return (
    <>
      <StagesEditor payload={payload} issues={[]} onChange={commit} />
      <CourseGroupsEditor payload={payload} issues={[]} onChange={commit} />
      <output data-testid="nested-payload">{JSON.stringify(payload)}</output>
    </>
  );
}

function nestedPayload(view: ReturnType<typeof render>): EbmPayload {
  return JSON.parse(view.getByTestId('nested-payload').textContent ?? '{}');
}

describe('EBM nested paired collections', () => {
  it('moves, edits, rejects a stale delete, then removes and adds stage items', async () => {
    // Given
    const view = render(<NestedHarness />);
    const root = view.container.querySelector<HTMLElement>('[data-editor-collection="ebm-stage-0-items"]');
    if (root === null) throw new TypeError('Missing stage items');

    // When
    fireEvent.click(action(root, '下移第 1 個階段項目'));
    expect(root.querySelector('.admin-editor-reorder-announcer')?.textContent).toContain('已將第 1 個階段項目移至第 2 個');
    fireEvent.click(action(root, '刪除第 1 個階段項目'));
    fireEvent.change(view.getByLabelText('階段 1 項目 2（繁體中文）'), { target: { value: '刪除確認後保留' } });
    fireEvent.click(action(document, '確認刪除階段項目'));

    // Then
    expect(nestedPayload(view).zh.stages[0]?.items).toEqual([
      compactEbmFixture().zh.stages[0]?.items[1],
      '刪除確認後保留',
    ]);
    fireEvent.click(action(root, '刪除第 1 個階段項目'));
    fireEvent.click(action(document, '確認刪除階段項目'));
    fireEvent.click(action(root, '新增階段項目'));
    expect(nestedPayload(view).zh.stages[0]?.items).toEqual(['刪除確認後保留', '']);
    await waitFor(() => expect(document.activeElement).toBe(view.getByLabelText('階段 1 項目 2（繁體中文）')));
  });

  it('atomically moves, edits, removes, and adds nested course rows', () => {
    // Given
    const view = render(<NestedHarness />);
    const root = view.container.querySelector<HTMLElement>('[data-editor-collection="ebm-course-group-0-rows"]');
    if (root === null) throw new TypeError('Missing course rows');
    const original = nestedPayload(view);

    // When
    fireEvent.click(action(root, '下移第 1 個課程列'));
    fireEvent.change(view.getByLabelText('課程群組 1 課程 1 名稱（英文）'), { target: { value: 'Revised nested course' } });
    fireEvent.click(action(root, '刪除第 2 個課程列'));
    fireEvent.click(action(document, '確認刪除課程列'));
    fireEvent.click(action(root, '新增課程列'));

    // Then
    const next = nestedPayload(view);
    expect(next.zh.courseGroups[0]?.rows[0]?.name).toBe(original.zh.courseGroups[0]?.rows[1]?.name);
    expect(next.en.courseGroups[0]?.rows.map((row) => row.name)).toEqual(['Revised nested course', '']);
    expect(next.zh.courseGroups[0]?.rows).toHaveLength(next.en.courseGroups[0]?.rows.length);
  });

  it('does not announce or focus changes when a nested commit is stale', () => {
    // Given
    const payload = compactEbmFixture();
    const zh = payload.zh.courseGroups[0];
    const en = payload.en.courseGroups[0];
    if (zh === undefined || en === undefined) throw new TypeError('Missing course group fixture');
    const onChange = vi.fn((_groups: { readonly zh: CourseGroup; readonly en: CourseGroup }) => ({ status: 'stale' } as const));
    const view = render(<CourseRowsEditor groupIndex={0} groups={{ zh, en }} issues={[]} onChange={onChange} />);
    const root = view.container.querySelector<HTMLElement>('[data-editor-collection="ebm-course-group-0-rows"]');
    if (root === null) throw new TypeError('Missing course rows');

    // When
    fireEvent.click(action(root, '下移第 1 個課程列'));
    fireEvent.click(action(root, '新增課程列'));

    // Then
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(root.querySelector('.admin-editor-reorder-announcer')?.textContent).toBe('');
    expect(root.querySelectorAll('[data-editor-item-index]')).toHaveLength(2);
  });
});
