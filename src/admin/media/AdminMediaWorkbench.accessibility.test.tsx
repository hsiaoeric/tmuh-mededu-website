// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientWith, resetWorkbenchTestState, workbenchTree } from './AdminMediaWorkbench.testHarness';

afterEach(resetWorkbenchTestState);

describe('AdminMediaWorkbench accessibility', () => {
  it('disables every mutation when editor text is invalid', () => {
    // Given / When
    const view = render(workbenchTree({
      editorText: '{"zh":',
      savedDraftPayload: null,
      onEditorTextChange: vi.fn(),
    }, clientWith()));

    // Then
    expect(view.getByRole('heading', { name: '視覺媒體工作區' })).toBeTruthy();
    expect(view.getByText(/JSON/)).toBeTruthy();
    expect(view.container.querySelector('input[type="file"]')).toBeNull();
  });
});
