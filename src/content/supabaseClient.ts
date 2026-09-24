import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type { SupabaseConfig } from './env';

export type SupabaseClientCreationOptions = {
  readonly auth: {
    readonly persistSession: boolean;
    readonly autoRefreshToken: boolean;
    readonly detectSessionInUrl: false;
    readonly storageKey?: string;
  };
};

type ClientAccessDependencies<Library, Client> = {
  readonly loadLibrary: () => Promise<Library>;
  readonly createClient: (
    library: Library,
    config: SupabaseConfig,
    options: SupabaseClientCreationOptions,
  ) => Client | Promise<Client>;
};

type SupabaseClientAccess<Client> = {
  readonly getPublicClient: (config: SupabaseConfig) => Promise<Client>;
  readonly getAdminClient: (config: SupabaseConfig) => Promise<Client>;
};

const PUBLIC_OPTIONS = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
} satisfies SupabaseClientCreationOptions;

const ADMIN_OPTIONS = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'tmuh-mededu-admin-auth-token',
  },
} satisfies SupabaseClientCreationOptions;

export function createSupabaseClientAccess<Library, Client>(
  dependencies: ClientAccessDependencies<Library, Client>,
): SupabaseClientAccess<Client> {
  const createGetter = (options: SupabaseClientCreationOptions) => {
    const clientPromises = new Map<string, Promise<Client>>();

    return (config: SupabaseConfig): Promise<Client> => {
      const cacheKey = JSON.stringify([config.url, config.publishableKey]);
      const clientPromise = clientPromises.get(cacheKey);
      if (clientPromise !== undefined) return clientPromise;

      const pending = dependencies
        .loadLibrary()
        .then((library) => dependencies.createClient(library, config, options));
      const cached = pending.catch((error: unknown) => {
        clientPromises.delete(cacheKey);
        throw error;
      });
      clientPromises.set(cacheKey, cached);
      return cached;
    };
  };

  return {
    getPublicClient: createGetter(PUBLIC_OPTIONS),
    getAdminClient: createGetter(ADMIN_OPTIONS),
  };
}

type SupabaseLibrary = typeof import('@supabase/supabase-js');

let libraryPromise: Promise<SupabaseLibrary> | undefined;

function loadSupabaseLibrary(): Promise<SupabaseLibrary> {
  if (libraryPromise !== undefined) return libraryPromise;

  const pending = import('@supabase/supabase-js');
  libraryPromise = pending.catch((error: unknown) => {
    libraryPromise = undefined;
    throw error;
  });
  return libraryPromise;
}

const browserAccess = createSupabaseClientAccess<
  SupabaseLibrary,
  SupabaseClient<Database>
>({
  loadLibrary: loadSupabaseLibrary,
  createClient: (library, config, options) =>
    library.createClient<Database>(config.url, config.publishableKey, options),
});

export const getPublicSupabaseClient = browserAccess.getPublicClient;
export const getAdminSupabaseClient = browserAccess.getAdminClient;
