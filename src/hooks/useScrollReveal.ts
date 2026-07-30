import { useEffect, type RefObject } from 'react';

/**
 * Reveal-on-scroll + count-up animation.
 *
 * Any descendant with `data-reveal` fades and slides in when it enters the
 * viewport; numbers with `data-count` (+ optional `data-suffix`) count up once
 * visible. Re-runs whenever any value in `deps` changes (e.g. switching
 * view/language).
 *
 * Visibility is decided by an IntersectionObserver rather than by measuring
 * `getBoundingClientRect().top` against the viewport on every scroll event.
 * The z-depth engine moves content by writing transforms inside a
 * `requestAnimationFrame`, so a scroll handler reading rects sees the frame
 * *before* the card moved and would leave pinned content invisible. The observer
 * reports the position the browser actually composited, and it also fires when
 * content moves for reasons other than scrolling.
 */
export function useScrollReveal(
  rootRef: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const countUp = (el: HTMLElement) => {
      if (el.getAttribute('data-done')) return;
      el.setAttribute('data-done', '1');
      const target = parseFloat(el.getAttribute('data-count') || '0') || 0;
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 1200;
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const show = (el: HTMLElement) => {
      const delay = el.getAttribute('data-reveal-delay') || '0';
      el.style.willChange = 'opacity,transform';
      el.style.transition = `opacity .7s cubic-bezier(.2,0,.2,1) ${delay}ms,transform .7s cubic-bezier(.2,0,.2,1) ${delay}ms`;
      el.setAttribute('data-seen', '1');
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      el.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      },
      // Hold the reveal until the element is a little way inside the viewport,
      // matching the old 92%-of-viewport trigger point.
      { rootMargin: '0px 0px -8% 0px' },
    );

    const observe = () => {
      root
        .querySelectorAll<HTMLElement>('[data-reveal]:not([data-seen])')
        .forEach((el) => observer.observe(el));
    };

    observe();

    // Cards mount and unmount as views change and panels expand, so keep
    // picking up new `[data-reveal]` nodes as they appear.
    const mutations = new MutationObserver(observe);
    mutations.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
