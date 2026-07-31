import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { scrollToId, scrollToTop } from '@/motion/smoothScroll';
import { ScrollTrigger } from '@/motion/gsap';

/**
 * Anchor requested from another page. Home consumes it on mount, which lets a
 * nav item on a center page still jump straight to a home section.
 */
let pendingSection: string | null = null;

/** Navigate to a home section from anywhere in the site. */
export function useGoToSection() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useCallback(
    (id: string) => {
      if (pathname === '/') {
        scrollToId(id);
        return;
      }
      pendingSection = id;
      navigate('/');
    },
    [navigate, pathname],
  );
}

/** Called by the home page so a pending cross-page anchor lands correctly. */
export function useConsumePendingSection() {
  useEffect(() => {
    if (!pendingSection) return;
    const id = pendingSection;
    pendingSection = null;
    // Let the page lay out (and ScrollTrigger measure) before jumping.
    const timer = window.setTimeout(() => {
      ScrollTrigger.refresh();
      scrollToId(id);
    }, 120);
    return () => window.clearTimeout(timer);
  }, []);
}

/** Reset scroll and re-measure triggers whenever the route changes. */
export function useRouteScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pendingSection) scrollToTop();
    const timer = window.setTimeout(() => ScrollTrigger.refresh(), 180);
    return () => window.clearTimeout(timer);
  }, [pathname]);
}
