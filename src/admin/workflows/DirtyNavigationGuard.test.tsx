// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createMemoryRouter,
  Link,
  RouterProvider,
  useLocation,
} from 'react-router-dom';
import { SiteProvider } from '@/app/site';
import type { DocumentMutation } from '@/admin/documents';
import { DirtyNavigationGuard } from './DirtyNavigationGuard';

const NativeRequest = Request;

class RouterTestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const signal = init?.signal;
    super(input, init === undefined ? undefined : { ...init, signal: undefined });
    if (signal !== undefined && signal !== null) {
      Object.defineProperty(this, 'signal', { value: signal });
    }
  }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'Request', {
    configurable: true,
    value: RouterTestRequest,
    writable: true,
  });
});

function EditorRoute({
  initiallyDirty = false,
  pendingOperation = null,
}: {
  readonly initiallyDirty?: boolean;
  readonly pendingOperation?: DocumentMutation | null;
}) {
  const [dirty, setDirty] = useState(initiallyDirty);
  const location = useLocation();
  return (
    <SiteProvider>
      <p>Editor route</p>
      <output data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</output>
      <button type="button" onClick={() => setDirty(true)}>Mark dirty</button>
      <Link to="/next?view=all#top">Go next</Link>
      <Link to="/edit">Stay on same URL</Link>
      <DirtyNavigationGuard dirty={dirty} pendingOperation={pendingOperation} />
    </SiteProvider>
  );
}

function renderRouter(initiallyDirty = false, pendingOperation: DocumentMutation | null = null) {
  localStorage.setItem('tmuh.lang', 'en');
  const router = createMemoryRouter([
    { path: '/edit', element: <EditorRoute initiallyDirty={initiallyDirty} pendingOperation={pendingOperation} /> },
    { path: '/next', element: <h1>Next route</h1> },
  ], { initialEntries: ['/edit'] });
  return render(<RouterProvider router={router} />);
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  Object.defineProperty(globalThis, 'Request', {
    configurable: true,
    value: NativeRequest,
    writable: true,
  });
});

describe('DirtyNavigationGuard', () => {
  it('allows clean SPA navigation', async () => {
    // Given
    const user = userEvent.setup();
    const view = renderRouter();

    // When
    await user.click(view.getByRole('link', { name: 'Go next' }));

    // Then
    expect(await view.findByRole('heading', { name: 'Next route' })).toBeTruthy();
  });

  it('blocks changed destinations and stays only through the explicit action', async () => {
    // Given
    const user = userEvent.setup();
    const view = renderRouter(true);

    // When
    await user.click(view.getByRole('link', { name: 'Go next' }));
    await user.keyboard('{Escape}');
    await user.click(view.getByRole('button', { name: 'Close dialog' }));
    await user.click(view.getByRole('button', { name: 'Keep editing' }));

    // Then
    expect(view.queryByRole('dialog')).toBeNull();
    expect(view.getByTestId('location').textContent).toBe('/edit');
  });

  it('proceeds to the blocked destination through the explicit leave action', async () => {
    // Given
    const user = userEvent.setup();
    const view = renderRouter(true);
    await user.click(view.getByRole('link', { name: 'Go next' }));

    // When
    await user.click(view.getByRole('button', { name: 'Leave this page' }));

    // Then
    expect(await view.findByRole('heading', { name: 'Next route' })).toBeTruthy();
  });

  it('does not block a dirty navigation whose full destination is unchanged', async () => {
    // Given
    const user = userEvent.setup();
    const view = renderRouter(true);

    // When
    await user.click(view.getByRole('link', { name: 'Stay on same URL' }));

    // Then
    expect(view.queryByRole('dialog')).toBeNull();
    expect(view.getByTestId('location').textContent).toBe('/edit');
  });

  it.each(['publish', 'archive'] satisfies readonly DocumentMutation[])(
    'confirms navigation while %s is pending even when the editor is clean',
    async (operation) => {
      // Given
      const user = userEvent.setup();
      const view = renderRouter(false, operation);

      // When
      await user.click(view.getByRole('link', { name: 'Go next' }));

      // Then
      expect(view.getByRole('dialog')).toBeTruthy();
      expect(view.getByRole('button', { name: 'Leave this page' })).toBeTruthy();
      expect(view.getByTestId('location').textContent).toBe('/edit');
    },
  );

  it('uses pending-operation copy when the editor is also dirty', async () => {
    // Given
    const user = userEvent.setup();
    const view = renderRouter(true, 'publish');

    // When
    await user.click(view.getByRole('link', { name: 'Go next' }));

    // Then
    expect(view.getByRole('heading', { name: 'Leave while the content operation is pending?' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Keep waiting' })).toBeTruthy();
    expect(view.queryByRole('button', { name: 'Keep editing' })).toBeNull();
  });

  it('keeps the current route when staying during a pending operation', async () => {
    // Given
    const user = userEvent.setup();
    const view = renderRouter(false, 'publish');
    await user.click(view.getByRole('link', { name: 'Go next' }));

    // When
    await user.click(view.getByRole('button', { name: 'Keep waiting' }));

    // Then
    expect(view.queryByRole('dialog')).toBeNull();
    expect(view.getByTestId('location').textContent).toBe('/edit');
  });

  it('leaves the current route through explicit confirmation during a pending operation', async () => {
    // Given
    const user = userEvent.setup();
    const view = renderRouter(false, 'archive');
    await user.click(view.getByRole('link', { name: 'Go next' }));

    // When
    await user.click(view.getByRole('button', { name: 'Leave this page' }));

    // Then
    expect(await view.findByRole('heading', { name: 'Next route' })).toBeTruthy();
  });

  it('prevents beforeunload only while dirty', async () => {
    // Given
    const user = userEvent.setup();
    const view = renderRouter();
    const cleanEvent = new Event('beforeunload', { cancelable: true });

    // When
    window.dispatchEvent(cleanEvent);
    await user.click(view.getByRole('button', { name: 'Mark dirty' }));
    const dirtyEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirtyEvent);

    // Then
    expect(cleanEvent.defaultPrevented).toBe(false);
    expect(cleanEvent.returnValue).toBe(true);
    expect(dirtyEvent.defaultPrevented).toBe(true);
    expect(dirtyEvent.returnValue).toBe(false);
  });

  it('prevents beforeunload while a clean editor has a pending operation', () => {
    // Given
    renderRouter(false, 'publish');
    const pendingEvent = new Event('beforeunload', { cancelable: true });

    // When
    window.dispatchEvent(pendingEvent);

    // Then
    expect(pendingEvent.defaultPrevented).toBe(true);
    expect(pendingEvent.returnValue).toBe(false);
  });
});
