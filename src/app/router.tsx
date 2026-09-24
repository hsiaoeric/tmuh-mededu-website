import { createBrowserRouter, createMemoryRouter } from 'react-router-dom';
import type { ComponentProps, ReactElement } from 'react';
import { App } from './App';
import { PublicSiteProvider } from './PublicSiteProvider';
import { ContentProvider } from '@/content/ContentProvider';

type AppDependencies = ComponentProps<typeof App>;

export type AppRouterOptions = {
  readonly basename?: string;
  readonly adminAuth?: AppDependencies['adminAuth'];
  readonly adminRepository?: AppDependencies['adminRepository'];
  readonly rootElement?: ReactElement;
};

export type AppMemoryRouterOptions = AppRouterOptions & {
  readonly initialEntries?: readonly string[];
};

function RouterRoot({ app }: { readonly app: ReactElement }): ReactElement {
  return (
    <ContentProvider>
      <PublicSiteProvider>{app}</PublicSiteProvider>
    </ContentProvider>
  );
}

function createRoutes(app: ReactElement) {
  return [{ path: '*', element: <RouterRoot app={app} /> }];
}

function resolveApp(options: AppRouterOptions): ReactElement {
  return options.rootElement ?? <App adminAuth={options.adminAuth} adminRepository={options.adminRepository} />;
}

export function createAppBrowserRouter(options: AppRouterOptions = {}): ReturnType<typeof createBrowserRouter> {
  return createBrowserRouter(createRoutes(resolveApp(options)), {
    basename: options.basename ?? import.meta.env.BASE_URL,
  });
}

export function createAppMemoryRouter(options: AppMemoryRouterOptions = {}): ReturnType<typeof createMemoryRouter> {
  return createMemoryRouter(createRoutes(resolveApp(options)), {
    basename: options.basename ?? import.meta.env.BASE_URL,
    initialEntries: options.initialEntries ? [...options.initialEntries] : undefined,
  });
}
