// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AdminMediaOwnershipProvider,
  useAdminMediaOwnershipScope,
} from './AdminMediaOwnershipProvider';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function wrapper({ children }: { readonly children: ReactNode }) {
  return <AdminMediaOwnershipProvider>{children}</AdminMediaOwnershipProvider>;
}

describe('AdminMediaOwnershipProvider', () => {
  it('shares one scope throughout a mounted authorization epoch', () => {
    // Given
    const first = renderHook(useAdminMediaOwnershipScope, { wrapper });
    const initialScope = first.result.current;

    // When
    first.rerender();

    // Then
    expect(first.result.current).toBe(initialScope);
  });

  it('rotates scope when a new authorization epoch mounts for the same user', () => {
    // Given
    const first = renderHook(useAdminMediaOwnershipScope, { wrapper });
    const retiredScope = first.result.current;
    first.unmount();

    // When
    const second = renderHook(useAdminMediaOwnershipScope, { wrapper });

    // Then
    expect(second.result.current).not.toBe(retiredScope);
  });

  it('rejects ownership consumers outside the protected provider', () => {
    // Given
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    // When / Then
    expect(() => renderHook(useAdminMediaOwnershipScope)).toThrow(
      'useAdminMediaOwnershipScope must be used inside AdminMediaOwnershipProvider',
    );
  });
});
