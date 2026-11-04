import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ScrollTrigger } from '@/motion/gsap';
import { scrollToId } from '@/motion/smoothScroll';

/** Long enough to land after the route's own scroll reset and the page's first layout. */
const HASH_SCROLL_DELAY_MS = 160;

/**
 * Brings `#anchor` into view on a page other than home, through the smooth-scroll driver. Runs
 * after the route's scroll reset, on arrival and whenever the hash changes, so old-site redirects
 * such as `/honors?category=…#board` land on their section. `ready` lets a page hold off until the
 * section it is about to render exists.
 */
export function useHashScroll(ready = true) {
  const { hash } = useLocation();
  useEffect(() => {
    if (!ready || hash.length <= 1) return undefined;
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      ScrollTrigger.refresh();
      scrollToId(id);
    }, HASH_SCROLL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [hash, ready]);
}
