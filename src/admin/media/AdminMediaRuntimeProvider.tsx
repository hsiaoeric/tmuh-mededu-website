import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  parseSupabaseConfiguration,
  type SupabaseConfig,
  type SupabaseConfiguration,
} from '@/content/env';
import { loadBrowserDraftMediaClient } from './draftMediaClient';
import type { DraftMediaClient } from './types';

export type DraftMediaClientLoader = (
  configuration: SupabaseConfig,
) => Promise<DraftMediaClient>;

export type AdminMediaRuntimeState =
  | { readonly status: 'disabled' }
  | { readonly status: 'configuration-error' }
  | { readonly status: 'loading' }
  | { readonly status: 'load-error' }
  | {
      readonly status: 'ready';
      readonly client: DraftMediaClient;
      readonly configuration: SupabaseConfig | null;
    };

type AdminMediaRuntimeProviderProps = {
  readonly children: ReactNode;
  readonly configuration?: SupabaseConfiguration;
  readonly client?: DraftMediaClient;
  readonly loadClient?: DraftMediaClientLoader;
};

const DEFAULT_CONFIGURATION = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});

const AdminMediaRuntimeContext = createContext<AdminMediaRuntimeState | null>(null);

function initialState(
  configuration: SupabaseConfiguration,
  client: DraftMediaClient | undefined,
): AdminMediaRuntimeState {
  if (client !== undefined) {
    return {
      status: 'ready',
      client,
      configuration: configuration.kind === 'configured' ? configuration.config : null,
    };
  }
  switch (configuration.kind) {
    case 'disabled':
      return { status: 'disabled' };
    case 'invalid':
      return { status: 'configuration-error' };
    case 'configured':
      return { status: 'loading' };
  }
}

export function AdminMediaRuntimeProvider({
  children,
  configuration = DEFAULT_CONFIGURATION,
  client,
  loadClient = loadBrowserDraftMediaClient,
}: AdminMediaRuntimeProviderProps): ReactElement {
  const [state, setState] = useState<AdminMediaRuntimeState>(() => (
    initialState(configuration, client)
  ));

  useEffect(() => {
    if (client !== undefined) {
      setState(initialState(configuration, client));
      return;
    }
    switch (configuration.kind) {
      case 'disabled':
        setState({ status: 'disabled' });
        return;
      case 'invalid':
        setState({ status: 'configuration-error' });
        return;
      case 'configured': {
        let active = true;
        setState({ status: 'loading' });
        void loadClient(configuration.config).then(
          (loadedClient) => {
            if (active) {
              setState({
                status: 'ready',
                client: loadedClient,
                configuration: configuration.config,
              });
            }
          },
          () => {
            if (active) setState({ status: 'load-error' });
          },
        );
        return () => {
          active = false;
        };
      }
    }
  }, [client, configuration, loadClient]);

  return (
    <AdminMediaRuntimeContext.Provider value={state}>
      {children}
    </AdminMediaRuntimeContext.Provider>
  );
}

export function useAdminMediaRuntime(): AdminMediaRuntimeState {
  const value = useContext(AdminMediaRuntimeContext);
  if (value === null) {
    throw new TypeError(
      'useAdminMediaRuntime must be used inside AdminMediaRuntimeProvider',
    );
  }
  return value;
}
