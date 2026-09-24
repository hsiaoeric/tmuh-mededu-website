import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  parseSupabaseConfiguration,
  type SupabaseConfig,
  type SupabaseConfiguration,
} from '@/content/env';
import { loadBrowserAdminDocumentRepository } from './supabaseOperations';
import type { AdminDocumentRepository } from './types';

export type AdminDocumentRepositoryState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly repository: AdminDocumentRepository }
  | { readonly status: 'error'; readonly failure: 'configuration' | 'load' };

export type AdminDocumentRepositoryLoader = (
  configuration: SupabaseConfig,
  signal: AbortSignal,
) => Promise<AdminDocumentRepository>;

export type AdminDocumentRepositoryProviderProps = {
  readonly children: ReactNode;
  readonly configuration?: SupabaseConfiguration;
  readonly repository?: AdminDocumentRepository;
  readonly loadRepository?: AdminDocumentRepositoryLoader;
};

type AdminDocumentRepositoryContextValue = {
  readonly state: AdminDocumentRepositoryState;
  readonly retry: () => void;
};

const DEFAULT_CONFIGURATION = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});

const AdminDocumentRepositoryContext = createContext<AdminDocumentRepositoryContextValue | null>(null);

export function AdminDocumentRepositoryProvider({
  children,
  configuration = DEFAULT_CONFIGURATION,
  repository,
  loadRepository = loadBrowserAdminDocumentRepository,
}: AdminDocumentRepositoryProviderProps): ReactElement {
  const [retryGeneration, requestRetry] = useReducer((generation: number) => generation + 1, 0);
  const [state, setState] = useState<AdminDocumentRepositoryState>(
    repository === undefined ? { status: 'loading' } : { status: 'ready', repository },
  );
  const retry = useCallback(() => requestRetry(), []);

  useEffect(() => {
    if (repository !== undefined) {
      setState({ status: 'ready', repository });
      return;
    }
    if (configuration.kind !== 'configured') {
      setState({ status: 'error', failure: 'configuration' });
      return;
    }

    const controller = new AbortController();
    let active = true;
    setState({ status: 'loading' });
    void loadRepository(configuration.config, controller.signal).then(
      (loadedRepository) => {
        if (active && !controller.signal.aborted) {
          setState({ status: 'ready', repository: loadedRepository });
        }
      },
      () => {
        if (!active || controller.signal.aborted) return;
        setState({ status: 'error', failure: 'load' });
      },
    );
    return () => {
      active = false;
      controller.abort();
    };
  }, [configuration, loadRepository, repository, retryGeneration]);

  const value = useMemo(() => ({ state, retry }), [retry, state]);
  return (
    <AdminDocumentRepositoryContext.Provider value={value}>
      {children}
    </AdminDocumentRepositoryContext.Provider>
  );
}

export function useAdminDocumentRepository(): AdminDocumentRepositoryContextValue {
  const value = useContext(AdminDocumentRepositoryContext);
  if (value === null) {
    throw new TypeError('useAdminDocumentRepository must be used inside AdminDocumentRepositoryProvider');
  }
  return value;
}
