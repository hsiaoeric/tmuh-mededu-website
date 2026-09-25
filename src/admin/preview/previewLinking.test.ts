// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { controlForPreviewTarget, editorCardFor, editorControls, previewElementsFor } from './previewLinking';

function mount(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.append(root);
  return root;
}

afterEach(() => {
  document.body.replaceChildren();
});

const EDITOR = `
  <div class="admin-field"><label class="admin-field-label">標題</label><div lang="zh-Hant"><input id="zh-title" value="全人照護教育中心正式成立"></div></div>
  <div class="admin-field"><div lang="en"><input id="en-title" value="The Center is officially established"></div></div>
  <div class="admin-field"><input id="count" value="12"></div>
  <div class="admin-field"><textarea id="lines">第一行內容文字
第二行內容文字</textarea></div>`;

describe('preview linking', () => {
  it('maps a preview element to the field whose value it shows, preferring the preview language', () => {
    const editor = mount(EDITOR);
    const preview = mount('<section><h3 id="t">全人照護教育中心正式成立</h3><p>其他說明文字與內容，包含許多與欄位無關的字。</p></section>');

    const match = controlForPreviewTarget(preview.querySelector('#t')!, preview, editorControls(editor, true));

    expect(match?.control.id).toBe('zh-title');
  });

  it('does not let a large container claim a field it merely contains', () => {
    const editor = mount(EDITOR);
    const preview = mount('<section id="s"><h3>全人照護教育中心正式成立</h3><p>其他說明文字與內容，包含許多與欄位無關的字，而且比標題長得多很多很多。</p></section>');

    expect(controlForPreviewTarget(preview.querySelector('#s')!, preview, editorControls(editor, true))).toBeNull();
  });

  it('matches short values only as a whole element', () => {
    const editor = mount(EDITOR);
    const preview = mount('<p id="a">2012 年</p><strong id="b">12</strong>');
    const controls = editorControls(editor, true);

    expect(controlForPreviewTarget(preview.querySelector('#a')!, preview, controls)).toBeNull();
    expect(controlForPreviewTarget(preview.querySelector('#b')!, preview, controls)?.control.id).toBe('count');
  });

  it('finds the innermost preview elements for a field, using a textarea’s first line', () => {
    const editor = mount(EDITOR);
    const preview = mount('<ul><li id="one">第一行內容文字</li><li>第二行內容文字</li></ul>');

    const found = previewElementsFor(editor.querySelector('textarea')!, preview);

    expect(found.map((element) => element.id)).toEqual(['one']);
  });

  it('marks a collapsed item instead of its hidden field', () => {
    const editor = mount('<li class="admin-editor-collection-item" data-collapsed><div class="admin-field"><input id="x" value="abc"></div></li>');

    expect(editorCardFor(editor.querySelector('input')!)?.classList.contains('admin-editor-collection-item')).toBe(true);
  });
});
