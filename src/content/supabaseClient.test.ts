import { describe, expect, it, vi } from 'vitest';
import type { SupabaseConfig } from './env';
import {
  createSupabaseClientAccess,
  type SupabaseClientCreationOptions,
} from './supabaseClient';

const CONFIG: SupabaseConfig = {
  url: 'https://example.supabase.co',
  publishableKey: 'sb_publishable_test',
};

const OTHER_CONFIG: SupabaseConfig = {
  url: 'https://other.supabase.co',
  publishableKey: 'sb_publishable_other',
};

type FakeLibrary = { readonly name: 'fake-library' };
type FakeClient = { readonly sequence: number };
type CreationCall = {
  readonly library: FakeLibrary;
  readonly config: SupabaseConfig;
  readonly options: SupabaseClientCreationOptions;
};

const LIBRARY: FakeLibrary = { name: 'fake-library' };

function createFixture() {
  const calls: CreationCall[] = [];
  const loadLibrary = vi.fn(() => Promise.resolve(LIBRARY));
  const createClient = vi.fn(
    (
      library: FakeLibrary,
      config: SupabaseConfig,
      options: SupabaseClientCreationOptions,
    ): FakeClient => {
      calls.push({ library, config, options });
      return { sequence: calls.length };
    },
  );
  const access = createSupabaseClientAccess({ loadLibrary, createClient });
  return { access, calls, loadLibrary };
}

describe('createSupabaseClientAccess', () => {
  it('loads no client library before a role is explicitly requested', () => {
    // Given
    const { access, loadLibrary } = createFixture();

    // When
    const getters = [access.getPublicClient, access.getAdminClient];

    // Then
    expect(getters).toHaveLength(2);
    expect(loadLibrary).not.toHaveBeenCalled();
  });

  it('shares one concurrent public promise with exact anonymous auth options', async () => {
    // Given
    const { access, calls, loadLibrary } = createFixture();

    // When
    const first = access.getPublicClient(CONFIG);
    const second = access.getPublicClient(CONFIG);

    // Then
    expect(first).toBe(second);
    await expect(first).resolves.toEqual({ sequence: 1 });
    expect(loadLibrary).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([
      {
        library: LIBRARY,
        config: CONFIG,
        options: {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        },
      },
    ]);
  });

  it('shares one concurrent admin promise with exact persistent auth options', async () => {
    // Given
    const { access, calls, loadLibrary } = createFixture();

    // When
    const first = access.getAdminClient(CONFIG);
    const second = access.getAdminClient(CONFIG);

    // Then
    expect(first).toBe(second);
    await expect(first).resolves.toEqual({ sequence: 1 });
    expect(loadLibrary).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([
      {
        library: LIBRARY,
        config: CONFIG,
        options: {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            storageKey: 'tmuh-mededu-admin-auth-token',
          },
        },
      },
    ]);
  });

  it('creates independent public and admin instances from the same config', async () => {
    // Given
    const { access, calls } = createFixture();

    // When
    const [publicClient, adminClient] = await Promise.all([
      access.getPublicClient(CONFIG),
      access.getAdminClient(CONFIG),
    ]);

    // Then
    expect(publicClient).not.toBe(adminClient);
    expect(calls.map((call) => call.config)).toEqual([CONFIG, CONFIG]);
  });

  it.each(['getPublicClient', 'getAdminClient'] as const)(
    '%s reuses config A and creates a separate client for config B',
    async (getterName) => {
      // Given
      const { access, calls } = createFixture();

      // When
      const firstConfigA = access[getterName](CONFIG);
      const secondConfigA = access[getterName](CONFIG);
      const configB = access[getterName](OTHER_CONFIG);

      // Then
      expect(secondConfigA).toBe(firstConfigA);
      expect(configB).not.toBe(firstConfigA);
      await expect(Promise.all([firstConfigA, secondConfigA, configB])).resolves.toEqual([
        { sequence: 1 },
        { sequence: 1 },
        { sequence: 2 },
      ]);
      expect(calls.map((call) => call.config)).toEqual([CONFIG, OTHER_CONFIG]);
    },
  );

  it('clears only the public cache after a loader rejection and retries explicitly', async () => {
    // Given
    const loaderFailure = new TypeError('loader unavailable');
    let loadCount = 0;
    let creationCount = 0;
    const loadLibrary = () => {
      loadCount += 1;
      return loadCount === 1 ? Promise.reject(loaderFailure) : Promise.resolve(LIBRARY);
    };
    const createClient = () => {
      creationCount += 1;
      return { sequence: creationCount };
    };
    const access = createSupabaseClientAccess({ loadLibrary, createClient });
    const failedPublic = access.getPublicClient(CONFIG);

    // When
    await expect(failedPublic).rejects.toBe(loaderFailure);
    const stableAdmin = access.getAdminClient(CONFIG);
    const retriedPublic = access.getPublicClient(CONFIG);

    // Then
    expect(retriedPublic).not.toBe(failedPublic);
    expect(access.getAdminClient(CONFIG)).toBe(stableAdmin);
    await expect(stableAdmin).resolves.toEqual({ sequence: 1 });
    await expect(retriedPublic).resolves.toEqual({ sequence: 2 });
    expect(loadCount).toBe(3);
  });

  it('clears only the admin cache after a creator rejection and retries explicitly', async () => {
    // Given
    const creatorFailure = new TypeError('creator unavailable');
    let adminAttempts = 0;
    let sequence = 0;
    const loadLibrary = () => Promise.resolve(LIBRARY);
    const createClient = (
      _library: FakeLibrary,
      _config: SupabaseConfig,
      options: SupabaseClientCreationOptions,
    ): Promise<FakeClient> => {
      if (options.auth.persistSession) {
        adminAttempts += 1;
        if (adminAttempts === 1) return Promise.reject(creatorFailure);
      }
      sequence += 1;
      return Promise.resolve({ sequence });
    };
    const access = createSupabaseClientAccess({ loadLibrary, createClient });
    const stablePublic = access.getPublicClient(CONFIG);
    const failedAdmin = access.getAdminClient(CONFIG);

    // When
    await expect(failedAdmin).rejects.toBe(creatorFailure);
    const retriedAdmin = access.getAdminClient(CONFIG);

    // Then
    expect(retriedAdmin).not.toBe(failedAdmin);
    expect(access.getPublicClient(CONFIG)).toBe(stablePublic);
    await expect(stablePublic).resolves.toEqual({ sequence: 1 });
    await expect(retriedAdmin).resolves.toEqual({ sequence: 2 });
    expect(adminAttempts).toBe(2);
  });
});
