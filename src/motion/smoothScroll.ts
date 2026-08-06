import Lenis from 'lenis';
import { useEffect } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from './gsap';

let lenis: Lenis | null = null;

/**
 * Installs Lenis as the page's scroll driver and hands ScrollTrigger the
 * updates it needs. Mounted once, from <App>. When the visitor prefers
 * reduced motion we skip Lenis entirely and let the browser scroll natively.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const instance = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      // Touch devices keep their native scrolling: momentum there is already
      // good, and overriding it makes the page feel detached from the finger.
      smoothWheel: true,
    });
    lenis = instance;

    instance.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, []);
}

/** Scroll to an element id, clearing the fixed header. */
export function scrollToId(id: string, offsetExtra = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  const navH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
    10,
  );
  const offset = -(Number.isFinite(navH) ? navH : 74) - 24 - offsetExtra;

  if (lenis) {
    lenis.scrollTo(el, { offset });
    return;
  }
  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({
    top,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

/** Jump to the top — used on route change. */
export function scrollToTop(immediate = true) {
  if (lenis) {
    lenis.scrollTo(0, { immediate });
    return;
  }
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/**
 * Pause/resume the scroll driver (used while the mobile menu is open).
 *
 * When Lenis is running we only call `stop()` — it already `preventDefault`s
 * touchmoves outside `[data-lenis-prevent]`, which is enough to freeze the
 * page behind the sheet. Setting `body { overflow: hidden }` on top of that
 * is what used to lock iOS Safari out of scrolling the sheet itself.
 *
 * Without Lenis (prefers-reduced-motion) we fall back to locking the body,
 * and the sheet uses a dedicated scroller with `-webkit-overflow-scrolling`.
 */
export function setScrollLocked(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
    return;
  }
  document.body.style.overflow = locked ? 'hidden' : '';
}
