import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from './gsap';


/**
 * Pins the section and drives its track sideways with the scroll wheel.
 * Below `minWidth` — and whenever motion is reduced — the track degrades to a
 * plain horizontally-scrollable strip, which keeps every card reachable.
 *
 * `head` rides inside the pinned stage rather than above it. A pin scrolls the
 * section's own header off screen for the whole scrub, so without this the
 * cards spend the entire stage floating on a bare field with nothing naming
 * the section they belong to.
 */
export function HorizontalScroll({
  children,
  head,
  minWidth = 900,
  className = '',
}: {
  children: ReactNode;
  /** Restates the section's identity while the stage holds the screen. */
  head?: ReactNode;
  minWidth?: number;
  className?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const track = trackRef.current;
    if (!outer || !track) return;

    // Both ends of the track carry the `.shell` inset, so travelling exactly
    // the overflow starts the strip flush with the section title and ends it
    // flush with the title's right margin.
    const distance = () => Math.max(0, track.scrollWidth - outer.clientWidth);

    // What sits past the right edge of the screen with the strip at rest. The
    // trailing gutter is excluded: it is empty margin, and scrolling margin
    // into view buys the visitor nothing.
    const hidden = () =>
      track.scrollWidth - (parseFloat(getComputedStyle(track).paddingRight) || 0) - outer.clientWidth;

    // Pinning costs a whole stage of vertical scroll, so the scrub has to buy
    // something back — at least half a card has to be out of sight. Below that
    // the plain strip is the better trade: on a monitor wide enough to show
    // every card at once, pinning would freeze the page to slide the margins.
    const firstCard = track.firstElementChild;
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 320;

    // Decided against the pinned layout, not the fallback strip. The two use
    // different gaps, so measuring the strip picks the wrong mode near the
    // threshold — and every measurement below needs the pinned geometry too,
    // which React has yet to re-render into place.
    outer.dataset.pinned = 'true';
    const pin =
      !prefersReducedMotion() && window.innerWidth >= minWidth && hidden() >= cardWidth / 2;

    if (!pin) {
      outer.dataset.pinned = 'false';
      setPinned(false);
      return;
    }
    setPinned(true);

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: outer,
          // A stage shorter than the viewport is pinned centred, so its slack
          // splits evenly instead of stranding the cards at the top. Anything
          // taller has to pin from the top or its head would sit off-screen.
          start: () => (outer.offsetHeight < window.innerHeight ? 'center center' : 'top top'),
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
    }, outer);

    // `head` only mounts once `pinned` commits, and it changes the stage's
    // height — which decides `start`. Refresh after the paint that added it.
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(frame);
      ctx.revert();
    };
  }, [minWidth]);

  return (
    <div className={`hscroll ${className}`} ref={outerRef} data-pinned={pinned}>
      {head && pinned && <div className="hscroll-head">{head}</div>}
      <div className="hscroll-track" ref={trackRef}>
        {children}
      </div>
    </div>
  );
}
