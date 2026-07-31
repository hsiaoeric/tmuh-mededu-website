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

    // On a wide enough screen the whole track already fits, so there is nothing
    // to scrub — pinning there would just freeze the page for no reason.
    if (prefersReducedMotion() || window.innerWidth < minWidth || distance() === 0) {
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
          start: 'top top',
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
