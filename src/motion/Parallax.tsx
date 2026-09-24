import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { gsap } from './gsap';
import { useReducedMotion } from './MotionPreference';

interface ParallaxProps {
  children: ReactNode;
  /** Pixels of travel across the element's full scroll pass. */
  distance?: number;
  className?: string;
  style?: CSSProperties;
}

/** Scrub-driven vertical drift. */
export function Parallax({ children, distance = 90, className, style }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: distance * 0.5 },
        {
          y: -distance * 0.5,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [distance, reduced]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
