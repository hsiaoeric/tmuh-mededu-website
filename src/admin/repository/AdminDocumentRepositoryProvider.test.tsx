// @vitest-environment jsdom

import { cleanup, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONFIGURED_AUTH, deferred } from '@/admin/auth/testHarness';
import { FakeDocumentRepository } from '@/admin/workflows/testHarness';
import {
  AdminDocumentRepositoryProvider,
  useAdminDocumentRepository,
} from './AdminDocumentRepositoryProvider';

function Probe() {
  const context = useAdminDocumentRepository();
  return (
    <>
      <output data-testid="repository-state">{context.state.status}</output>
      <button type="button" onClick={context.retry}>Retry</button>
    </>
  );
}

afterEach(cleanup);

describe('AdminDocumentRepositoryProvider', () => {
  it('moves from load error to ready only after an explicit retry', async () => {
    // Given
    const user = userEvent.setup();
    const repository = new FakeDocumentRepository();
    const loadRepository = vi.fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(repository);
    const view = render(
      <AdminDocumentRepositoryProvider
        configuration={CONFIGURED_AUTH}
        loadRepository={loadRepository}
      >
        <Probe />
      </AdminDocumentRepositoryProvider>,
    );
    await waitFor(() => expect(view.getByTestId('repository-state').textContent).toBe('error'));

    // When
    await user.click(view.getByRole('button', { name: 'Retry' }));

    // Then
    await waitFor(() => expect(view.getByTestId('repository-state').textContent).toBe('ready'));
    expect(loadRepository).toHaveBeenCalledTimes(2);
  });

  it('maps a non-Error loader rejection to retryable load error', async () => {
    // Given
    const user = userEvent.setup();
    const repository = new FakeDocumentRepository();
    const loadRepository = vi.fn()
      .mockRejectedValueOnce('offline')
      .mockResolvedValueOnce(repository);
    const view = render(
      <AdminDocumentRepositoryProvider
        configuration={CONFIGURED_AUTH}
        loadRepository={loadRepository}
      >
        <Probe />
      </AdminDocumentRepositoryProvider>,
    );
    await waitFor(() => expect(view.getByTestId('repository-state').textContent).toBe('error'));

    // When
    await user.click(view.getByRole('button', { name: 'Retry' }));

    // Then
    await waitFor(() => expect(view.getByTestId('repository-state').textContent).toBe('ready'));
    expect(loadRepository).toHaveBeenCalledTimes(2);
  });

  it('aborts and ignores a loader result after unmount', () => {
    // Given
    const pending = deferred<FakeDocumentRepository>();
    const signals: AbortSignal[] = [];
    const view = render(
      <AdminDocumentRepositoryProvider
        configuration={CONFIGURED_AUTH}
        loadRepository={(_configuration, signal) => {
          signals.push(signal);
          return pending.promise;
        }}
      >
        <Probe />
      </AdminDocumentRepositoryProvider>,
    );

    // When
    view.unmount();

    // Then
    expect(signals[0]?.aborted).toBe(true);
    pending.resolve(new FakeDocumentRepository());
  });
});
