// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminButton } from '@/admin/AdminButton';
import { EditorSection } from './EditorSection';

describe('editor section', () => {
  it('names a semantic section and keeps actions beside its introduction', () => {
    // Given / When
    const view = render(
      <EditorSection
        id="editor-identity"
        title="基本資料"
        description="先完成繁體中文，再核對英文內容。"
        actions={<AdminButton>預覽</AdminButton>}
      >
        <p>欄位內容</p>
      </EditorSection>,
    );

    // Then
    const section = view.getByRole('region', { name: '基本資料' });
    expect(section.getAttribute('aria-labelledby')).toBe('editor-identity-title');
    expect(view.getByRole('heading', { level: 2, name: '基本資料' }).id).toBe('editor-identity-title');
    expect(section.contains(view.getByRole('button', { name: '預覽' }))).toBe(true);
  });
});
