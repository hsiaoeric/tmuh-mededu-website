import { z } from 'zod';
import type { PublishedContentRepository } from '../../src/content/domain';
import type { SupabaseClientCreationOptions } from '../../src/content/supabaseClient';

const PublishableKeyPattern = /^sb_publishable_[A-Za-z0-9_-]+$/;
const SecretEnvironmentNamePattern = /^SUPABASE_.*(?:SECRET|SERVICE_ROLE).*KEY$/;

const SupabaseUrlSchema = z.string().refine((value) => {
  if (!URL.canParse(value)) return false;
  const endpoint = new URL(value);
  const usesAllowedProtocol = endpoint.protocol === 'https:'
    || (endpoint.protocol === 'http:'
      && (endpoint.hostname === 'localhost' || endpoint.hostname === '127.0.0.1'));
  const isRootEndpoint = endpoint.username === ''
    && endpoint.password === ''
    && endpoint.pathname === '/'
    && endpoint.search === ''
    && endpoint.hash === ''
    && endpoint.href === `${endpoint.origin}${endpoint.pathname}`;
  return usesAllowedProtocol && isRootEndpoint;
}, 'SUPABASE_URL must be an HTTPS root endpoint or an HTTP loopback root endpoint');

const CheckpointEnvironmentSchema = z.object({
  SUPABASE_URL: SupabaseUrlSchema,
  SUPABASE_PUBLISHABLE_KEY: z.string().trim().regex(PublishableKeyPattern),
  CMS_ADMIN_EMAIL: z.email(),
  CMS_ADMIN_PASSWORD: z.string().min(1),
});

export type CheckpointConfiguration = {
  readonly url: string;
  readonly publishableKey: string;
  readonly email: string;
  readonly password: string;
};

export class CheckpointConfigurationError extends Error {
  readonly name = 'CheckpointConfigurationError';
}

type AuthFailure = { readonly message: string };
type AuthResult = { readonly error: AuthFailure | null };
type UserResult = {
  readonly data: { readonly user: { readonly id: string } | null };
  readonly error: AuthFailure | null;
};
type AdminResult = { readonly data: unknown; readonly error: AuthFailure | null };

export interface CheckpointOperatorClient {
  signInWithPassword(credentials: {
    readonly email: string;
    readonly password: string;
  }): Promise<AuthResult>;
  getUser(): Promise<UserResult>;
  isCmsAdmin(): Promise<AdminResult>;
  signOutLocally(): Promise<AuthResult>;
}

export type CheckpointSession = {
  readonly client: CheckpointOperatorClient;
  readonly repository: PublishedContentRepository;
};

export type CheckpointCommandDependencies = {
  readonly environment: Readonly<Record<string, unknown>>;
  readonly createSession: (
    configuration: CheckpointConfiguration,
  ) => CheckpointSession | Promise<CheckpointSession>;
  readonly checkpoint: (repository: PublishedContentRepository) => Promise<void>;
};

type CheckpointAuthReason =
  | 'authentication-failed'
  | 'user-unverified'
  | 'authorization-failed'
  | 'admin-denied'
  | 'sign-out-failed';

export class CheckpointAuthError extends Error {
  readonly name = 'CheckpointAuthError';

  constructor(readonly reason: CheckpointAuthReason, message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export const CHECKPOINT_SUPABASE_OPTIONS = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
} as const satisfies SupabaseClientCreationOptions;

export function parseCheckpointEnvironment(
  environment: Readonly<Record<string, unknown>>,
): CheckpointConfiguration {
  const forbiddenName = Object.entries(environment).find(
    ([name, value]) => value !== undefined && SecretEnvironmentNamePattern.test(name),
  );
  if (forbiddenName !== undefined) {
    throw new CheckpointConfigurationError(
      'Secret or service role key environment variables are forbidden for CMS checkpointing',
    );
  }
  if (typeof environment.SUPABASE_PUBLISHABLE_KEY === 'string'
    && environment.SUPABASE_PUBLISHABLE_KEY.startsWith('sb_secret_')) {
    throw new CheckpointConfigurationError(
      'SUPABASE_PUBLISHABLE_KEY must contain a publishable key, never a secret key',
    );
  }

  const parsed = CheckpointEnvironmentSchema.safeParse(environment);
  if (!parsed.success) {
    throw new CheckpointConfigurationError(
      'SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, CMS_ADMIN_EMAIL, and CMS_ADMIN_PASSWORD are required and must be valid',
    );
  }
  return {
    url: parsed.data.SUPABASE_URL,
    publishableKey: parsed.data.SUPABASE_PUBLISHABLE_KEY,
    email: parsed.data.CMS_ADMIN_EMAIL,
    password: parsed.data.CMS_ADMIN_PASSWORD,
  };
}

export async function runCheckpointCommand(
  dependencies: CheckpointCommandDependencies,
): Promise<void> {
  const configuration = parseCheckpointEnvironment(dependencies.environment);
  const session = await dependencies.createSession(configuration);
  let authenticated = false;
  let primaryFailed = false;
  try {
    const signIn = await session.client.signInWithPassword({
      email: configuration.email,
      password: configuration.password,
    });
    if (signIn.error !== null) {
      throw new CheckpointAuthError('authentication-failed', 'CMS operator authentication failed');
    }
    authenticated = true;
    const verified = await session.client.getUser();
    if (verified.error !== null || verified.data.user === null) {
      throw new CheckpointAuthError('user-unverified', 'CMS operator identity was not verified');
    }
    const authorized = await session.client.isCmsAdmin();
    if (authorized.error !== null) {
      throw new CheckpointAuthError('authorization-failed', 'CMS admin authorization check failed');
    }
    if (!z.literal(true).safeParse(authorized.data).success) {
      throw new CheckpointAuthError('admin-denied', 'Verified operator is not a CMS admin');
    }
    await dependencies.checkpoint(session.repository);
  } catch (error: unknown) {
    primaryFailed = true;
    throw error;
  } finally {
    if (authenticated) {
      const [cleanup] = await Promise.allSettled([
        Promise.resolve().then(() => session.client.signOutLocally()),
      ]);
      if (!primaryFailed) {
        switch (cleanup.status) {
          case 'rejected':
            throw new CheckpointAuthError(
              'sign-out-failed',
              'CMS operator local sign-out failed',
              { cause: cleanup.reason },
            );
          case 'fulfilled':
            if (cleanup.value.error !== null) {
              throw new CheckpointAuthError(
                'sign-out-failed',
                'CMS operator local sign-out failed',
              );
            }
            break;
          default:
            throw new TypeError(`Unexpected sign-out result: ${String(cleanup)}`);
        }
      }
    }
  }
}
