// @vitest-environment jsdom

import { fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAdminProtectedAccess } from '@/admin/auth';
import {
  useAdminMediaOwnershipScope,
  type DraftMediaOwnershipScope,
} from '@/admin/media';
import { AdminProtectedLayout } from './AdminProtectedLayout';

const authHarness = vi.hoisted(() => {
  let state: unknown = {
    status: 'authorized',
    user: { id: 'admin-id', email: null },
  };
  return {
    read: () => ({
      state,
      signIn: async () => undefined,
      signOut: async () => undefined,
      retry: async () => undefined,
    }),
    setState: (nextState: unknown) => { state = nextState; },
  };
});

vi.mock('@/admin/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/admin/auth')>();
  return { ...actual, useAdminAuth: authHarness.read };
});

function WorkspaceProbe({ scopes }: { readonly scopes: DraftMediaOwnershipScope[] }) {
  const scope = useAdminMediaOwnershipScope();
  const { mutationsAllowed } = useAdminProtectedAccess();
  const [editorText, setEditorText] = useState('initial');
  scopes.push(scope);
  return (
    <textarea
      aria-label="Editor"
      data-testid="workspace-node"
      data-mutations-allowed={mutationsAllowed}
      value={editorText}
      onChange={(event) => setEditorText(event.currentTarget.value)}
    />
  );
}

afterEach(() => {
  authHarness.setState({ status: 'booting' });
});

describe('AdminProtectedLayout reauthorization', () => {
  it('preserves the outlet node, editor state, and ownership scope for the same user', () => {
    // Given
    const scopes: DraftMediaOwnershipScope[] = [];
    authHarness.setState({
      status: 'authorized',
      user: { id: 'admin-id', email: null },
    });
    const routes = () => (
      <Routes>
        <Route path="/admin/login" element={<span>Login</span>} />
        <Route element={<AdminProtectedLayout />}>
          <Route path="*" element={<WorkspaceProbe scopes={scopes} />} />
        </Route>
      </Routes>
    );
    const view = render(
      <MemoryRouter initialEntries={['/admin/content/news']}>{routes()}</MemoryRouter>,
    );
    const workspaceNode = view.getByTestId('workspace-node');
    const initialScope = scopes[0];
    expect(workspaceNode.getAttribute('data-mutations-allowed')).toBe('true');
    fireEvent.change(workspaceNode, { target: { value: 'unsaved editor text' } });

    // When
    authHarness.setState({
      status: 'reauthorizing',
      user: { id: 'admin-id', email: null },
    });
    view.rerender(
      <MemoryRouter initialEntries={['/admin/content/news']}>{routes()}</MemoryRouter>,
    );

    // Then
    expect(view.getByTestId('workspace-node')).toBe(workspaceNode);
    expect(workspaceNode.getAttribute('data-mutations-allowed')).toBe('false');
    expect(view.getByRole('textbox', { name: 'Editor' })).toHaveProperty(
      'value',
      'unsaved editor text',
    );
    expect(scopes[scopes.length - 1]).toBe(initialScope);
  });
});
