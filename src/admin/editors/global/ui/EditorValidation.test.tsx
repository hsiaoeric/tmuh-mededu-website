// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AdminField } from '@/admin/AdminFields';
import { mapStructuredEditorIssues as mapGlobalEditorIssues } from '@/admin/editors/shared';
import { SiteProvider } from '@/app/site';
import { EditorValidation } from './EditorValidation';

const issues = mapGlobalEditorIssues([
  { path: ['zh', 'title'], message: '請填寫繁體中文標題' },
  { path: ['en', 'title'], message: 'Add the English title' },
]);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderValidation(message: string, isZh = true) {
  const localizedIssues = mapGlobalEditorIssues([
    { path: ['zh', 'title'], message, code: 'invalid_type' },
  ], isZh);
  return render(
    <SiteProvider>
      <EditorValidation issues={localizedIssues} title="請修正欄位" firstInvalidLabel="前往第一個錯誤" />
    </SiteProvider>,
  );
}

describe('editor validation', () => {
  it('links every summary issue to its deterministic field target', () => {
    // Given / When
    const view = render(
      <EditorValidation issues={issues} title="請修正 2 個欄位" firstInvalidLabel="前往第一個錯誤" />,
    );

    // Then
    expect(view.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(issues.map(({ fieldId }) => `#${fieldId}`));
    expect(view.getByRole('alert')).toBeTruthy();
  });

  it('focuses the first invalid field from the summary action', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(
      <>
        <EditorValidation issues={issues} title="請修正欄位" firstInvalidLabel="前往第一個錯誤" />
        <AdminField id={issues[0]?.fieldId} label="繁體中文標題" error={issues[0]?.issue.message} />
      </>,
    );

    // When
    await user.click(view.getByRole('button', { name: '前往第一個錯誤' }));

    // Then
    expect(document.activeElement?.id).toBe(issues[0]?.fieldId);
  });

  it('focuses a linked invalid field without changing document history', async () => {
    // Given
    const user = userEvent.setup();
    const view = render(
      <>
        <EditorValidation issues={issues} title="請修正欄位" firstInvalidLabel="前往第一個錯誤" />
        <AdminField id={issues[1]?.fieldId} label="English title" error={issues[1]?.issue.message} />
      </>,
    );

    // When
    await user.click(view.getByRole('link', { name: 'Add the English title' }));

    // Then
    expect(document.activeElement?.id).toBe(issues[1]?.fieldId);
  });

  it('renders framework validation as specific Traditional Chinese while preserving the issue link', () => {
    const view = renderValidation('Invalid input: expected string, received number');

    const link = view.getByRole('link', { name: '請輸入文字。' });
    expect(link.getAttribute('href')).toBe('#global-editor-field-s-7a_68-s-74_69_74_6c_65');
    expect(view.queryByText(/Invalid input/)).toBeNull();
  });

  it('renders framework validation as specific English in English mode', () => {
    localStorage.setItem('tmuh.lang', 'en');

    const view = renderValidation('Invalid input: expected string, received number', false);

    expect(view.getByRole('link', { name: 'Enter text.' })).toBeTruthy();
    expect(view.queryByText(/Invalid input/)).toBeNull();
  });
});
