import { describe, expect, it, vi } from 'vitest';
import type { PublishedContentRepository } from '../../src/content/domain';
import {
  CHECKPOINT_SUPABASE_OPTIONS,
  CheckpointConfigurationError,
  parseCheckpointEnvironment,
  runCheckpointCommand,
  type CheckpointOperatorClient,
} from './checkpoint-command';
import { checkpointRepository } from './checkpoint.test-fixtures';

const VALID_ENVIRONMENT = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_checkpoint_test',
  CMS_ADMIN_EMAIL: 'admin@example.com',
  CMS_ADMIN_PASSWORD: 'correct horse battery staple',
} as const;

function operatorClient(overrides: Partial<CheckpointOperatorClient> = {}) {
  return {
    signInWithPassword: vi.fn(() => Promise.resolve({ error: null })),
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'operator-id' } }, error: null })),
    isCmsAdmin: vi.fn(() => Promise.resolve({ data: true, error: null })),
    signOutLocally: vi.fn(() => Promise.resolve({ error: null })),
    ...overrides,
  } satisfies CheckpointOperatorClient;
}

function commandDependencies(
  client: CheckpointOperatorClient,
  repository: PublishedContentRepository = checkpointRepository(),
) {
  return {
    environment: VALID_ENVIRONMENT,
    createSession: vi.fn(() => ({ client, repository })),
    checkpoint: vi.fn((_publishedRepository: PublishedContentRepository) => Promise.resolve()),
  };
}

describe('parseCheckpointEnvironment', () => {
  it.each([
    {},
    { SUPABASE_URL: VALID_ENVIRONMENT.SUPABASE_URL },
    {
      ...VALID_ENVIRONMENT,
      CMS_ADMIN_PASSWORD: undefined,
    },
  ])('rejects missing or partial server credentials', (environment) => {
    // Given / When
    const parse = () => parseCheckpointEnvironment(environment);

    // Then
    expect(parse).toThrow(/required/i);
  });

  it.each([
    {
      ...VALID_ENVIRONMENT,
      SUPABASE_PUBLISHABLE_KEY: 'sb_secret_forbidden',
    },
    {
      ...VALID_ENVIRONMENT,
      SUPABASE_SERVICE_ROLE_KEY: 'forbidden',
    },
    {
      ...VALID_ENVIRONMENT,
      SUPABASE_SECRET_KEY: 'forbidden',
    },
  ])('rejects secret or service-role key inputs', (environment) => {
    // Given / When
    const parse = () => parseCheckpointEnvironment(environment);

    // Then
    expect(parse).toThrow(/publishable|secret|service role/i);
  });

  it('returns only the four required operator values', () => {
    // Given
    const environment = { ...VALID_ENVIRONMENT, PATH: '/usr/bin' };

    // When
    const parsed = parseCheckpointEnvironment(environment);

    // Then
    expect(parsed).toEqual({
      url: VALID_ENVIRONMENT.SUPABASE_URL,
      publishableKey: VALID_ENVIRONMENT.SUPABASE_PUBLISHABLE_KEY,
      email: VALID_ENVIRONMENT.CMS_ADMIN_EMAIL,
      password: VALID_ENVIRONMENT.CMS_ADMIN_PASSWORD,
    });
  });

  it.each([
    'https://example.supabase.co',
    'https://example.supabase.co/',
    'http://localhost',
    'http://localhost:54321/',
    'http://127.0.0.1',
    'http://127.0.0.1:54321/',
  ])('accepts the root Supabase endpoint %s', (url) => {
    // Given / When
    const parsed = parseCheckpointEnvironment({ ...VALID_ENVIRONMENT, SUPABASE_URL: url });

    // Then
    expect(parsed.url).toBe(url);
  });

  it.each([
    'https://operator:password@example.supabase.co',
    'https://example.supabase.co/rest/v1',
    'https://example.supabase.co?',
    'https://example.supabase.co?redirect=elsewhere',
    'https://example.supabase.co#',
    'https://example.supabase.co#configuration',
    'http://example.supabase.co',
    'http://localhost.example.com',
    'http://127.0.0.1.example.com',
    'http://localhost@evil.example.com',
    'http://localhost/rest/v1',
  ])('rejects a malformed or deceptive Supabase endpoint %s', (url) => {
    // Given / When
    const parse = () => parseCheckpointEnvironment({ ...VALID_ENVIRONMENT, SUPABASE_URL: url });

    // Then
    expect(parse).toThrow(CheckpointConfigurationError);
  });

  it('does not expose URL credentials in a configuration error', () => {
    // Given
    const username = 'operator-credential-marker';
    const password = 'password-credential-marker';

    // When
    let failure: unknown;
    try {
      parseCheckpointEnvironment({
        ...VALID_ENVIRONMENT,
        SUPABASE_URL: `https://${username}:${password}@example.supabase.co`,
      });
    } catch (error: unknown) {
      failure = error;
    }

    // Then
    expect(failure).toBeInstanceOf(CheckpointConfigurationError);
    if (!(failure instanceof Error)) throw new TypeError('Expected a configuration error');
    expect(failure.message).not.toContain(username);
    expect(failure.message).not.toContain(password);
  });
});

describe('runCheckpointCommand', () => {
  it('uses non-persistent server-only Supabase auth options', () => {
    // Given / When / Then
    expect(CHECKPOINT_SUPABASE_OPTIONS).toEqual({
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  });

  it('rejects failed password authentication without checkpointing', async () => {
    // Given
    const client = operatorClient({
      signInWithPassword: vi.fn(() => Promise.resolve({
        error: { message: 'invalid credentials' },
      })),
    });
    const dependencies = commandDependencies(client);

    // When
    const command = runCheckpointCommand(dependencies);

    // Then
    await expect(command).rejects.toThrow(/authentication/i);
    expect(dependencies.checkpoint).not.toHaveBeenCalled();
    expect(client.signOutLocally).not.toHaveBeenCalled();
  });

  it('rejects an unverified user and signs out locally', async () => {
    // Given
    const client = operatorClient({
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    });
    const dependencies = commandDependencies(client);

    // When
    const command = runCheckpointCommand(dependencies);

    // Then
    await expect(command).rejects.toThrow(/verified/i);
    expect(dependencies.checkpoint).not.toHaveBeenCalled();
    expect(client.signOutLocally).toHaveBeenCalledOnce();
  });

  it.each([false, 'true'])('rejects a non-admin result of %j and signs out locally', async (adminResult) => {
    // Given
    const client = operatorClient({
      isCmsAdmin: vi.fn(() => Promise.resolve({ data: adminResult, error: null })),
    });
    const dependencies = commandDependencies(client);

    // When
    const command = runCheckpointCommand(dependencies);

    // Then
    await expect(command).rejects.toThrow(/admin/i);
    expect(dependencies.checkpoint).not.toHaveBeenCalled();
    expect(client.signOutLocally).toHaveBeenCalledOnce();
  });

  it('checkpoints through the injected repository after admin verification', async () => {
    // Given
    const calls: string[] = [];
    const client = operatorClient({
      signInWithPassword: vi.fn(() => {
        calls.push('sign-in');
        return Promise.resolve({ error: null });
      }),
      getUser: vi.fn(() => {
        calls.push('get-user');
        return Promise.resolve({ data: { user: { id: 'operator-id' } }, error: null });
      }),
      isCmsAdmin: vi.fn(() => {
        calls.push('admin-check');
        return Promise.resolve({ data: true, error: null });
      }),
      signOutLocally: vi.fn(() => {
        calls.push('sign-out');
        return Promise.resolve({ error: null });
      }),
    });
    const repository = checkpointRepository();
    const dependencies = commandDependencies(client, repository);
    dependencies.checkpoint.mockImplementation(() => {
      calls.push('checkpoint');
      return Promise.resolve();
    });

    // When
    await runCheckpointCommand(dependencies);

    // Then
    expect(dependencies.checkpoint).toHaveBeenCalledWith(repository);
    expect(client.signInWithPassword).toHaveBeenCalledWith({
      email: VALID_ENVIRONMENT.CMS_ADMIN_EMAIL,
      password: VALID_ENVIRONMENT.CMS_ADMIN_PASSWORD,
    });
    expect(client.signOutLocally).toHaveBeenCalledOnce();
    expect(calls).toEqual([
      'sign-in',
      'get-user',
      'admin-check',
      'checkpoint',
      'sign-out',
    ]);
  });

  it('does not mask a checkpoint failure when local sign-out also fails', async () => {
    // Given
    const client = operatorClient({
      signOutLocally: vi.fn(() => Promise.reject(new TypeError('cleanup failed'))),
    });
    const dependencies = commandDependencies(client);
    dependencies.checkpoint.mockRejectedValue(new TypeError('checkpoint failed'));

    // When
    const command = runCheckpointCommand(dependencies);

    // Then
    await expect(command).rejects.toThrow('checkpoint failed');
  });

  it.each([
    ['rejects', () => Promise.reject(new TypeError('cleanup rejected'))],
    ['throws', () => { throw new TypeError('cleanup threw'); }],
  ] satisfies readonly (readonly [string, CheckpointOperatorClient['signOutLocally']])[])(
    'preserves an undefined checkpoint rejection when local sign-out %s',
    async (_failureMode, signOutLocally) => {
      // Given
      const client = operatorClient({ signOutLocally: vi.fn(signOutLocally) });
      const dependencies = commandDependencies(client);
      dependencies.checkpoint.mockRejectedValue(undefined);

      // When
      const command = runCheckpointCommand(dependencies);

      // Then
      await expect(command).rejects.toBeUndefined();
      expect(client.signOutLocally).toHaveBeenCalledOnce();
    },
  );
});
