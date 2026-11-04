import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useGoToSection } from '@/app/navigation';
import {
  loadLegacyRedirectTable,
  mayBeLegacyPath,
  resolveLegacyPathIn,
  type LegacyRedirect,
} from '@/app/legacyRedirects';
import { NotFound } from '@/pages/NotFound';
import { assetUrl } from '@/utils/asset';

/** Leaving the app for a static file. An object so tests can replace it. */
export const legacyNavigation = {
  leaveTo(url: string): void {
    window.location.replace(url);
  },
};

type Resolution =
  | { readonly status: 'loading'; readonly key: string }
  | { readonly status: 'done'; readonly key: string; readonly redirect: LegacyRedirect | undefined };

/** Jumps to a home-page section, replacing the old URL in history. */
export function SectionRedirect({ section }: { readonly section: string }) {
  const goToSection = useGoToSection();
  useEffect(() => {
    goToSection(section, { replace: true });
  }, [goToSection, section]);
  return null;
}

/** Hands a static file (a converted image, a copied download) to the browser. */
function FileRedirect({ path }: { readonly path: string }) {
  useEffect(() => {
    legacyNavigation.leaveTo(assetUrl(path));
  }, [path]);
  return null;
}

/**
 * The catch-all route. An address whose first segment the old site used is looked up in the
 * legacy redirect table (loaded on demand); a hit replaces the old URL, anything else is 404.
 * Nothing renders while the table loads, so an old link never flashes the not-found page.
 */
export function LegacyOrNotFound() {
  const { pathname, search } = useLocation();
  const key = `${pathname}${search}`;
  const candidate = mayBeLegacyPath(pathname);
  const [resolution, setResolution] = useState<Resolution>({ status: 'loading', key });

  useEffect(() => {
    if (!candidate) return undefined;
    let active = true;
    setResolution({ status: 'loading', key });
    loadLegacyRedirectTable().then(
      (table) => {
        if (active) setResolution({ status: 'done', key, redirect: resolveLegacyPathIn(table, pathname, search) });
      },
      () => {
        if (active) setResolution({ status: 'done', key, redirect: undefined });
      },
    );
    return () => {
      active = false;
    };
  }, [candidate, key, pathname, search]);

  if (!candidate) return <NotFound />;
  if (resolution.status === 'loading' || resolution.key !== key) return null;
  const { redirect } = resolution;
  if (redirect === undefined) return <NotFound />;
  switch (redirect.kind) {
    case 'route':
      return <Navigate to={redirect.to} replace />;
    case 'home-section':
      return <SectionRedirect section={redirect.section} />;
    case 'file':
      return <FileRedirect path={redirect.path} />;
  }
}
