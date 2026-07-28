import { useEffect, type RefObject } from 'react';

/**
 * Opens a horizontally overflowing element centred rather than at its left
 * edge. Wide diagrams (the hub chart, the admin team tree) are pinned to a
 * minimum width so their labels stay legible, which means narrow viewports
 * would otherwise start on an empty margin with the content off to the side.
 *
 * Re-centres whenever any value in `deps` changes (e.g. switching layout).
 */
export function useCenteredScroll(
  ref: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const centre = () => {
      const overflow = el.scrollWidth - el.clientWidth;
      if (overflow > 0) el.scrollLeft = overflow / 2;
    };

    centre();
    // Web fonts can widen the content after first layout, so centre again once
    // the next frame has settled.
    const frame = requestAnimationFrame(centre);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
