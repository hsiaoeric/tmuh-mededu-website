// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DraftMediaClient } from './types';
import {
  AdminMediaRuntimeProvider,
  useAdminMediaRuntime,
  type DraftMediaClientLoader,
} from './index';
import type { SupabaseConfiguration } from '@/content/env';

const configuration = {
  kind: 'configured',
  config: {
    url: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
  },
} satisfies SupabaseConfiguration;

const client: DraftMediaClient = {
  upload: () => Promise.resolve({ ok: false, failure: { kind: 'transport-error' } }),
  createPreview: () => Promise.resolve({ ok: false, failure: { kind: 'transport-error' } }),
  delete: () => Promise.resolve({ ok: true }),
};

function RuntimeProbe() {
  const runtime = useAdminMediaRuntime();
  return <output data-testid="runtime-state">{runtime.status}</output>;
}

afterEach(cleanup);

describe('AdminMediaRuntimeProvider', () => {
  it('loads one browser client for a configured protected runtime', async () => {
    // Given
    const loadClient = vi.fn<DraftMediaClientLoader>(() => Promise.resolve(client));
    const view = render(
      <AdminMediaRuntimeProvider configuration={configuration} loadClient={loadClient}>
        <RuntimeProbe />
      </AdminMediaRuntimeProvider>,
    );

    // When
    await waitFor(() => expect(view.getByTestId('runtime-state').textContent).toBe('ready'));
    view.rerender(
      <AdminMediaRuntimeProvider configuration={configuration} loadClient={loadClient}>
        <RuntimeProbe />
      </AdminMediaRuntimeProvider>,
    );

    // Then
    expect(loadClient).toHaveBeenCalledTimes(1);
    expect(loadClient).toHaveBeenCalledWith(configuration.config);
  });

  it('reports disabled configuration without constructing a client', () => {
    // Given
    const loadClient = vi.fn<DraftMediaClientLoader>(() => Promise.resolve(client));

    // When
    const view = render(
      <AdminMediaRuntimeProvider configuration={{ kind: 'disabled' }} loadClient={loadClient}>
        <RuntimeProbe />
      </AdminMediaRuntimeProvider>,
    );

    // Then
    expect(view.getByTestId('runtime-state').textContent).toBe('disabled');
    expect(loadClient).not.toHaveBeenCalled();
  });

  it('uses an injected client without invoking the browser loader', () => {
    // Given
    const loadClient = vi.fn<DraftMediaClientLoader>(() => Promise.resolve(client));

    // When
    const view = render(
      <AdminMediaRuntimeProvider configuration={configuration} client={client} loadClient={loadClient}>
        <RuntimeProbe />
      </AdminMediaRuntimeProvider>,
    );

    // Then
    expect(view.getByTestId('runtime-state').textContent).toBe('ready');
    expect(loadClient).not.toHaveBeenCalled();
  });
});
