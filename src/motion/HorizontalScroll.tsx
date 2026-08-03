import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from './gsap';


/**
 * Pins the section and drives its track sideways with the scroll wheel.
 * Below `minWidth` — and whenever motion is reduced — the track degrades to a
 * plain horizontally-scrollable strip, which keeps every card reachable.
 */
export function HorizontalScroll({
  children,
  minWidth = 900,
  className = '',
}: {
  children: ReactNode;
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

    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth * 0.92);

    // Pinning costs a whole stage of vertical scroll, so the scrub has to buy
    // something back. Unless at least one full card is off-screen, the plain
    // strip is the better trade — a wide screen where the track nearly fits
    // would otherwise freeze the page to nudge the cards a finger's width.
    const firstCard = track.firstElementChild;
    const worthPinning = () =>
      distance() >= (firstCard ? firstCard.getBoundingClientRect().width : 320);

    if (prefersReducedMotion() || window.innerWidth < minWidth || !worthPinning()) {
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

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [minWidth]);

  return (
    <div className={`hscroll ${className}`} ref={outerRef} data-pinned={pinned}>
      <div className="hscroll-track" ref={trackRef}>
        {children}
      </div>
    </div>
  );
}
