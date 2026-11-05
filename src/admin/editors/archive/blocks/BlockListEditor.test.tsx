// @vitest-environment jsdom

import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import type { EditableLocalizedBlocks } from '@/content/contracts/blocks';
import { BlocksPayloadCheck } from './blockTestSchema';
import { BlockListEditor } from './BlockListEditor';

afterEach(cleanup);

const BODY: EditableLocalizedBlocks = {
  zh: [
    { type: 'heading', level: 2, text: '一、招募名額' },
    { type: 'paragraph', runs: [{ text: '共 32 名。' }] },
    { type: 'divider' },
  ],
};

function renderBlocks(initial: EditableLocalizedBlocks = BODY) {
  const history: EditableLocalizedBlocks[] = [];
  function Harness() {
    const [value, setValue] = useState(initial);
    return (
      <BlockListEditor
        path={['posts', 0, 'body']}
        label={{ zh: '內文', en: 'Body' }}
        value={value}
        issues={[]}
        imageSlotKind="post-block-image"
        onChange={(next) => { history.push(next); setValue(next); return { status: 'emitted' }; }}
      />
    );
  }
  const view = render(<Harness />);
  return { ...view, history, latest: () => history.slice(-1)[0] ?? initial };
}

describe('BlockListEditor', () => {
  it('reorders blocks and keeps focus on the moved block’s control', () => {
    const view = renderBlocks();
    fireEvent.click(view.getByRole('button', { name: '下移內文（中文）區塊 1' }));
    expect(view.latest().zh.map((block) => block.type)).toEqual(['paragraph', 'heading', 'divider']);
    expect(document.activeElement).toBe(view.getByRole('button', { name: '下移內文（中文）區塊 2' }));
    fireEvent.click(view.getByRole('button', { name: '上移內文（中文）區塊 3' }));
    expect(view.latest().zh.map((block) => block.type)).toEqual(['paragraph', 'divider', 'heading']);
    expect(view.getByRole('status').textContent).toContain('已將區塊 3 移至第 2 個');
  });

  it('adds a block of the chosen type at the chosen position and focuses it', () => {
    const view = renderBlocks();
    fireEvent.change(view.getByRole('combobox', { name: '區塊類型' }), { target: { value: 'list' } });
    fireEvent.change(view.getByRole('combobox', { name: '位置' }), { target: { value: '0' } });
    fireEvent.click(view.getByRole('button', { name: '新增區塊' }));
    expect(view.latest().zh[1]).toEqual({ type: 'list', ordered: false, items: [[{ text: '' }]] });
    expect(document.activeElement?.closest('[data-block-index]')?.getAttribute('data-block-index')).toBe('1');
  });

  it('confirms before deleting a block with content and deletes an empty one directly', () => {
    const view = renderBlocks();
    fireEvent.click(view.getByRole('button', { name: '刪除內文（中文）區塊 1' }));
    const dialog = view.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: '確認刪除' }));
    expect(view.latest().zh.map((block) => block.type)).toEqual(['paragraph', 'divider']);
    fireEvent.click(view.getByRole('button', { name: '刪除內文（中文）區塊 2' }));
    expect(view.queryByRole('dialog')).toBeNull();
    expect(view.latest().zh.map((block) => block.type)).toEqual(['paragraph']);
  });

  it('converts a paragraph to a heading, keeping its text', () => {
    const view = renderBlocks();
    fireEvent.change(view.getByRole('combobox', { name: '內文（中文）區塊 2：類型' }), { target: { value: 'heading' } });
    expect(view.latest().zh[1]).toEqual({ type: 'heading', level: 2, text: '共 32 名。' });
  });

  it('makes part of a paragraph bold or a link and explains an unsafe link', () => {
    const view = renderBlocks();
    fireEvent.click(view.getByRole('button', { name: '內文（中文）區塊 2：粗體' }));
    expect(view.latest().zh[1]).toEqual({ type: 'paragraph', runs: [{ text: '共 32 名。', strong: true }] });
    fireEvent.click(view.getByRole('button', { name: '內文（中文）區塊 2：連結' }));
    const href = view.getByRole('textbox', { name: '內文（中文）區塊 2：連結網址' });
    fireEvent.change(href, { target: { value: 'javascript:alert(1)' } });
    expect(href.getAttribute('aria-invalid')).toBe('true');
    expect(view.getByRole('alert').textContent).toContain('https://');
    fireEvent.change(href, { target: { value: '/announcements' } });
    expect(view.latest().zh[1]).toEqual({ type: 'paragraph', runs: [{ text: '共 32 名。', strong: true, href: '/announcements' }] });
    expect(BlocksPayloadCheck.safeParse(view.latest()).success).toBe(true);
  });

  it('turns a pasted YouTube link into a video id', () => {
    const view = renderBlocks({ zh: [{ type: 'video', youtubeId: '' }] });
    const field = view.getByRole('textbox', { name: /^內文（中文）區塊 1：YouTube 網址或影片 ID/ });
    fireEvent.change(field, { target: { value: 'https://youtu.be/uu_RKgOvtAE?si=x' } });
    expect(view.latest().zh[0]).toEqual({ type: 'video', youtubeId: 'uu_RKgOvtAE' });
    expect(field).toHaveProperty('value', 'uu_RKgOvtAE');
  });

  it('edits table cells and adds rows', () => {
    const view = renderBlocks({ zh: [{ type: 'table', rows: [['a', 'b']] }] });
    fireEvent.change(view.getByRole('textbox', { name: '內文（中文）區塊 1，第 1 列第 2 欄' }), { target: { value: 'B' } });
    fireEvent.click(view.getByRole('button', { name: '新增一列' }));
    expect(view.latest().zh[0]).toEqual({ type: 'table', rows: [['a', 'B'], ['', '']] });
  });

  it('adds an English body from the Chinese one and removes it again by deleting the en key', () => {
    const view = renderBlocks();
    expect(view.getByText('未翻譯')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '以中文內文為底稿翻譯' }));
    expect(view.latest().en).toEqual(BODY.zh);
    fireEvent.click(view.getByRole('button', { name: '移除英文內文' }));
    fireEvent.click(within(view.getByRole('dialog')).getByRole('button', { name: '移除英文' }));
    expect(view.latest()).toEqual({ zh: BODY.zh });
    expect('en' in view.latest()).toBe(false);
  });

  it('creates an image block only once an image is linked', () => {
    const view = renderBlocks({ zh: [] });
    fireEvent.change(view.getByRole('combobox', { name: '區塊類型' }), { target: { value: 'image' } });
    fireEvent.click(view.getByRole('button', { name: '新增區塊' }));
    expect(view.history).toHaveLength(0);
    const path = view.getByRole('textbox', { name: /新圖片區塊.*網站圖片路徑/ });
    fireEvent.change(path, { target: { value: 'assets/legacy/article/x.webp' } });
    expect(view.latest().zh).toEqual([{ type: 'image', media: { kind: 'local', path: 'assets/legacy/article/x.webp' }, alt: '' }]);
  });
});
