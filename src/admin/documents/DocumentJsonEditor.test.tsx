// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteProvider } from '@/app/site';
import { CMS_DOCUMENT_KINDS, type CmsDocumentKind } from '@/content/contracts/kinds';
import { detail } from '@/admin/workflows/testHarness';
import { createDocumentWorkspace, type DocumentWorkspace } from './workspaceState';
import { DocumentJsonEditor } from './DocumentJsonEditor';

function EditorHarness({ kind = 'people' }: { readonly kind?: CmsDocumentKind }) {
  const [workspace, setWorkspace] = useState<DocumentWorkspace>(() => ({
    ...createDocumentWorkspace(detail(kind)),
    editorText: '{}',
    baselineText: '{}',
  }));
  return (
    <DocumentJsonEditor
      workspace={workspace}
      onChange={(editorText) => setWorkspace((current) => ({ ...current, editorText }))}
    />
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('DocumentJsonEditor', () => {
  it.each(CMS_DOCUMENT_KINDS)('renders the controlled editor for %s documents', (kind) => {
    // Given / When
    const view = render(<SiteProvider><EditorHarness kind={kind} /></SiteProvider>);

    // Then
    expect(view.getByRole('textbox')).toBeTruthy();
  });

  it('preserves invalid JSON text while exposing validation feedback', () => {
    // Given
    const view = render(<SiteProvider><EditorHarness /></SiteProvider>);
    const textarea = view.getByRole('textbox', { name: '雙語 JSON 內容' });

    // When
    fireEvent.change(textarea, { target: { value: '{broken' } });

    // Then
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(textarea).toHaveProperty('value', '{broken');
    expect(view.getAllByRole('alert').some((alert) => alert.textContent?.includes('JSON'))).toBe(true);
  });

  it('uses Traditional Chinese labels by default and English labels in English mode', () => {
    // Given
    const zhView = render(<SiteProvider><EditorHarness /></SiteProvider>);

    // When
    const zhEditor = zhView.getByRole('textbox', { name: '雙語 JSON 內容' });
    zhView.unmount();
    localStorage.setItem('tmuh.lang', 'en');
    const enView = render(<SiteProvider><EditorHarness /></SiteProvider>);

    // Then
    expect(zhEditor).toBeTruthy();
    expect(enView.getByRole('textbox', { name: 'Bilingual JSON content' })).toBeTruthy();
  });
});
