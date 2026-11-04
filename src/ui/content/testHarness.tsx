import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { SiteProvider } from '@/app/site';
import { ContentProvider } from '@/content/ContentProvider';
import { parseSupabaseConfiguration } from '@/content/env';
import type { Lang } from '@/i18n';

/** Shared by the src/ui/content tests: offline content, a site language, and a router. */
export const OFFLINE = parseSupabaseConfiguration({});

export function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</output>;
}

export function renderContent(ui: ReactElement, options: {
  readonly lang?: Lang;
  readonly path?: string;
  readonly basename?: string;
} = {}) {
  localStorage.setItem('tmuh.lang', options.lang ?? 'zh');
  const basename = options.basename;
  const path = options.path ?? '/';
  return render(
    <ContentProvider configuration={OFFLINE}>
      <SiteProvider>
        <MemoryRouter basename={basename} initialEntries={[`${basename ?? ''}${path}`]}>
          {ui}
          <LocationProbe />
        </MemoryRouter>
      </SiteProvider>
    </ContentProvider>,
  );
}
