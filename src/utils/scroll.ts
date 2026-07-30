import { scrollOffsetForElement } from '@/zdepth/engine';

/** Clearance for the fixed header, matching `--header-h` plus breathing room. */
const HEADROOM = 96;

/**
 * Scroll to an element by id.
 *
 * In the z-depth stack a section's on-screen position has nothing to do with
 * its document position — cards are fixed, and page scroll is a timeline rather
 * than an offset. The engine converts an element into the scroll position that
 * pins its card and scrubs it into view. Only when the engine is in static mode
 * (reduced motion) does the ordinary offset calculation apply.
 */
export function scrollToId(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;

  const target = scrollOffsetForElement(el, HEADROOM);
  if (target !== null) {
    window.scrollTo({ top: target, behavior: 'smooth' });
    return;
  }

  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY - HEADROOM,
    behavior: 'smooth',
  });
}
