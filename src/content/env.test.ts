import { describe, expect, it } from 'vitest';
import { parseSupabaseConfiguration } from './env';

function legacyKey(role: string): string {
  const payload = btoa(JSON.stringify({ role }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `eyJheader.${payload}.signature`;
}

describe('parseSupabaseConfiguration', () => {
  it('uses the static fallback when both variables are absent', () => {
    // Given
    const env = {};

    // When
    const configuration = parseSupabaseConfiguration(env);

    // Then
    expect(configuration.kind).toBe('disabled');
  });

  it('returns a typed error when only the URL is configured', () => {
    // Given
    const env = { VITE_SUPABASE_URL: 'https://example.supabase.co' };

    // When
    const configuration = parseSupabaseConfiguration(env);

    // Then
    expect(configuration.kind).toBe('invalid');
    if (configuration.kind === 'invalid') {
      expect(configuration.error.reason).toBe('partial');
    }
  });

  it('returns a typed error when only the publishable key is configured', () => {
    // Given
    const env = { VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' };

    // When
    const configuration = parseSupabaseConfiguration(env);

    // Then
    expect(configuration.kind).toBe('invalid');
    if (configuration.kind === 'invalid') {
      expect(configuration.error.reason).toBe('partial');
    }
  });

  it('rejects a non-local HTTP URL', () => {
    // Given
    const env = {
      VITE_SUPABASE_URL: 'http://remote.example.com',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'not-a-publishable-key',
    };

    // When
    const configuration = parseSupabaseConfiguration(env);

    // Then
    expect(configuration.kind).toBe('invalid');
    if (configuration.kind === 'invalid') {
      expect(configuration.error.reason).toBe('invalid');
    }
  });

  it('rejects a hostname that only starts with localhost', () => {
    // Given
    const env = {
      VITE_SUPABASE_URL: 'http://localhost.example.com',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    };

    // When
    const configuration = parseSupabaseConfiguration(env);

    // Then
    expect(configuration.kind).toBe('invalid');
    if (configuration.kind === 'invalid') {
      expect(configuration.error.reason).toBe('invalid');
    }
  });

  it('rejects a malformed publishable key', () => {
    // Given
    const env = {
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_',
    };

    // When
    const configuration = parseSupabaseConfiguration(env);

    // Then
    expect(configuration.kind).toBe('invalid');
    if (configuration.kind === 'invalid') {
      expect(configuration.error.reason).toBe('invalid');
    }
  });

  it('rejects a fragmented privileged-key shape', () => {
    // Given
    const privilegedShape = ['sb', 'secret', 'synthetic'].join('_');
    const env = {
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: privilegedShape,
    };

    // When
    const configuration = parseSupabaseConfiguration(env);

    // Then
    expect(configuration.kind).toBe('invalid');
    if (configuration.kind === 'invalid') {
      expect(configuration.error.reason).toBe('invalid');
    }
  });

  it('rejects a legacy JWT carrying a privileged role', () => {
    // Given
    const privilegedRole = ['service', 'role'].join('_');
    const env = {
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: legacyKey(privilegedRole),
    };

    // When
    const configuration = parseSupabaseConfiguration(env);

    // Then
    expect(configuration.kind).toBe('invalid');
    if (configuration.kind === 'invalid') {
      expect(configuration.error.reason).toBe('invalid');
    }
  });

  it('accepts a publishable key over HTTPS', () => {
    // Given
    const env = {
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic',
    };

    // When
    const configuration = parseSupabaseConfiguration(env);

    // Then
    expect(configuration).toEqual({
      kind: 'configured',
      config: {
        url: 'https://example.supabase.co',
        publishableKey: 'sb_publishable_synthetic',
      },
    });
  });

  it('accepts a legacy anon key for local Supabase', () => {
    // Given
    const env = {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: legacyKey('anon'),
    };

    // When
    const configuration = parseSupabaseConfiguration(env);

    // Then
    expect(configuration).toEqual({
      kind: 'configured',
      config: {
        url: 'http://127.0.0.1:54321',
        publishableKey: legacyKey('anon'),
      },
    });
  });
});
