// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { mapStructuredEditorIssues as mapGlobalEditorIssues } from '@/admin/editors/shared';
import { SiteProvider } from '@/app/site';
import {
  EditorBilingualFields,
  EditorSelectField,
  EditorTextField,
  EditorTextareaField,
} from './EditorFields';

const issues = mapGlobalEditorIssues([
  { path: ['zh', 'title'], message: '請填寫繁體中文標題' },
  { path: ['en', 'summary'], message: 'Add the English summary' },
  { path: ['category'], message: '請選擇分類' },
]);

afterEach(cleanup);

describe('editor fields', () => {
  it('projects Unit 2 ids and messages through existing field wrappers', () => {
    // Given / When
    const view = render(
      <>
        <EditorTextField path={['zh', 'title']} issues={issues} label="繁體中文標題" />
        <EditorTextareaField path={['en', 'summary']} issues={issues} label="English summary" />
        <EditorSelectField path={['category']} issues={issues} label="分類" options={[{ value: '', label: '請選擇' }]} />
      </>,
    );

    // Then
    const controls = [...view.getAllByRole('textbox'), ...view.getAllByRole('combobox')];
    expect(controls.map((control) => control.getAttribute('aria-invalid'))).toEqual(['true', 'true', 'true']);
    expect(controls.every((control) => control.getAttribute('aria-describedby') === `${control.id}-error`)).toBe(true);
    expect(view.getAllByRole('alert').map((alert) => alert.id)).toEqual(controls.map((control) => `${control.id}-error`));
  });

  it('keeps bilingual editor fields in Traditional Chinese-first order', () => {
    // Given / When
    const view = render(
      <EditorBilingualFields
        label="標題"
        zh={<EditorTextField path={['zh', 'title']} issues={issues} label="繁體中文" />}
        en={<EditorTextField path={['en', 'title']} issues={issues} label="English" />}
      />,
    );

    // Then
    expect(view.getAllByRole('textbox').map((field) => field.closest('[lang]')?.getAttribute('lang'))).toEqual(['zh-Hant', 'en']);
  });

  it('localizes an inline framework error without changing field semantics', () => {
    const localizedIssues = mapGlobalEditorIssues([
      { path: ['zh', 'count'], message: 'Invalid input: expected number, received string', code: 'invalid_type' },
    ]);

    const view = render(
      <SiteProvider>
        <EditorTextField path={['zh', 'count']} issues={localizedIssues} label="數量" />
      </SiteProvider>,
    );

    const field = view.getByRole('textbox', { name: '數量' });
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('aria-describedby')).toBe(`${field.id}-error`);
    expect(view.getByRole('alert').textContent).toBe('請輸入數字。');
    expect(view.queryByText(/Invalid input/)).toBeNull();
  });
});
