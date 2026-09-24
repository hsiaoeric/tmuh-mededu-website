import {
  createContext,
  useContext,
  type ReactElement,
  type ReactNode,
} from 'react';
import { parseSupabaseConfiguration, type SupabaseConfiguration } from '@/content/env';
import {
  loadBrowserAdminAuthClient,
  type AdminAuthClientLoader,
} from './adminAuthClient';
import { useAdminAuthController } from './useAdminAuthController';
import type { AdminAuthState } from './adminAuthState';

export type AdminAuthContextValue = {
  readonly state: AdminAuthState;
  readonly signIn: (email: string, password: string) => Promise<void>;
  readonly signOut: () => Promise<void>;
  readonly retry: () => Promise<void>;
};

export type AdminAuthProviderProps = {
  readonly children: ReactNode;
  readonly configuration?: SupabaseConfiguration;
  readonly loadClient?: AdminAuthClientLoader;
};

const DEFAULT_CONFIGURATION = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({
  children,
  configuration = DEFAULT_CONFIGURATION,
  loadClient = loadBrowserAdminAuthClient,
}: AdminAuthProviderProps): ReactElement {
  const value = useAdminAuthController({ configuration, loadClient });
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useOptionalAdminAuth(): AdminAuthContextValue | null {
  return useContext(AdminAuthContext);
}

export function useAdminAuth(): AdminAuthContextValue {
  const value = useOptionalAdminAuth();
  if (value === null) {
    throw new TypeError('useAdminAuth must be used inside AdminAuthProvider');
  }
  return value;
}
