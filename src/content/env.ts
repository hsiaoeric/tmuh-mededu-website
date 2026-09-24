import { z } from 'zod';
import { ContentConfigurationError } from './errors';

const PublishableKeyPattern = /^sb_publishable_[A-Za-z0-9_-]+$/;
const LegacyJwtPattern = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const LegacyAnonClaimsSchema = z.object({ role: z.literal('anon') });

function isLegacyAnonKey(value: string): boolean {
  if (!LegacyJwtPattern.test(value)) return false;
  const payload = value.split('.')[1];
  if (payload === undefined) return false;

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
  try {
    const claims: unknown = JSON.parse(atob(padded));
    return LegacyAnonClaimsSchema.safeParse(claims).success;
  } catch (error: unknown) {
    if (error instanceof Error) return false;
    throw error;
  }
}

const SupabaseConfigSchema = z
  .object({
    url: z.url().refine(
      (value) =>
        value.startsWith('https://') ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(value),
      'must use HTTPS unless connecting to local Supabase',
    ),
    publishableKey: z
      .string()
      .trim()
      .refine(
        (value) => PublishableKeyPattern.test(value) || isLegacyAnonKey(value),
        'must be a Supabase publishable or legacy anon key',
      ),
  })
  .readonly();

export type SupabaseConfig = z.infer<typeof SupabaseConfigSchema>;

export type SupabaseConfiguration =
  | { readonly kind: 'disabled' }
  | { readonly kind: 'configured'; readonly config: SupabaseConfig }
  | { readonly kind: 'invalid'; readonly error: ContentConfigurationError };

export type PublicEnv = {
  readonly VITE_SUPABASE_URL?: unknown;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: unknown;
};

export function parseSupabaseConfiguration(env: PublicEnv): SupabaseConfiguration {
  const url = env.VITE_SUPABASE_URL;
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (url === undefined && publishableKey === undefined) {
    return { kind: 'disabled' };
  }
  if (url === undefined || publishableKey === undefined) {
    return {
      kind: 'invalid',
      error: new ContentConfigurationError(
        'partial',
        'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be provided together',
      ),
    };
  }

  const result = SupabaseConfigSchema.safeParse({ url, publishableKey });
  if (!result.success) {
    return {
      kind: 'invalid',
      error: new ContentConfigurationError('invalid', result.error.message),
    };
  }
  return { kind: 'configured', config: result.data };
}
