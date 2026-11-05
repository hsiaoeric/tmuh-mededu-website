// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { mapStructuredEditorIssues } from '@/admin/editors/shared';
import type { EditableLocalizedText } from '@/content/contracts/localized';
import { LocalizedTextField } from './LocalizedTextField';

afterEach(cleanup);

function renderField(initial: EditableLocalizedText | undefined, options: { readonly optional?: boolean; readonly multiline?: boolean } = {}) {
  const values: (EditableLocalizedText | undefined)[] = [];
  function Harness() {
    const [value, setValue] = useState(initial);
    return (
      <LocalizedTextField
        path={['posts', 0, 'title']}
        label={{ zh: '標題', en: 'Title' }}
        required
        optional={options.optional}
        multiline={options.multiline}
        value={value}
        issues={[]}
        onChange={(next) => { values.push(next); setValue(next); return { status: 'emitted' }; }}
      />
    );
  }
  const view = render(<Harness />);
  return { ...view, values, latest: () => values.slice(-1)[0] };
}

describe('LocalizedTextField', () => {
  it('shows untranslated Chinese with an explicit add-English toggle instead of an English input', () => {
    const view = renderField({ zh: '招募公告' });
    expect(view.getByRole('textbox', { name: /^標題（中文）/ })).toHaveProperty('value', '招募公告');
    expect(view.queryByRole('textbox', { name: '標題（英文）' })).toBeNull();
    expect(view.getByText('未翻譯')).toBeTruthy();
    expect(view.getByRole('button', { name: '加入英文：標題' })).toBeTruthy();
  });

  it('adds English, focuses it, and deletes the en key again when it is cleared', () => {
    const view = renderField({ zh: '招募公告' });
    fireEvent.click(view.getByRole('button', { name: '加入英文：標題' }));
    const english = view.getByRole('textbox', { name: '標題（英文）' });
    expect(document.activeElement).toBe(english);
    expect(view.values).toHaveLength(0);

    fireEvent.change(english, { target: { value: 'Recruitment' } });
    expect(view.latest()).toEqual({ zh: '招募公告', en: 'Recruitment' });

    fireEvent.change(english, { target: { value: '' } });
    expect(view.latest()).toEqual({ zh: '招募公告' });
    expect(Object.keys(view.latest() ?? {})).toEqual(['zh']);
    // The field stays open while the editor is still translating.
    expect(view.getByRole('textbox', { name: '標題（英文）' })).toBeTruthy();
  });

  it('removes English with its own button and returns focus to the add toggle', () => {
    const view = renderField({ zh: '招募公告', en: 'Recruitment' });
    fireEvent.click(view.getByRole('button', { name: '移除英文：標題' }));
    expect(view.latest()).toEqual({ zh: '招募公告' });
    expect(document.activeElement).toBe(view.getByRole('button', { name: '加入英文：標題' }));
  });

  it('removes an optional field entirely when both sides are emptied', () => {
    const view = renderField({ zh: '摘要' }, { optional: true, multiline: true });
    const chinese = view.getByRole('textbox', { name: /^標題（中文）/ });
    expect(chinese.tagName).toBe('TEXTAREA');
    fireEvent.change(chinese, { target: { value: '' } });
    expect(view.latest()).toBeUndefined();
  });

  it('maps a publish issue to the exact language field', () => {
    const issues = mapStructuredEditorIssues([{ path: ['posts', 0, 'title', 'zh'], message: 'Text must not be empty', code: 'custom' }]);
    const view = render(<LocalizedTextField path={['posts', 0, 'title']} label="標題" value={{ zh: '' }} issues={issues} onChange={() => ({ status: 'emitted' })} />);
    const chinese = view.getByRole('textbox', { name: /^標題（中文）/ });
    expect(chinese.getAttribute('aria-invalid')).toBe('true');
    expect(view.getByRole('alert').textContent).toBe('此欄位為必填，請輸入內容。');
  });
});
