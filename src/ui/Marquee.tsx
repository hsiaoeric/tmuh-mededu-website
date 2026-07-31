import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '@/motion/gsap';

/**
 * Infinite horizontal ticker. The track is duplicated so the loop is seamless;
 * with reduced motion it simply sits still and scrolls with the page.
 */
export function Marquee({ items, speed = 34 }: { items: string[]; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const track = el.querySelector('.marquee-track') as HTMLElement | null;
    if (!track) return;

    const ctx = gsap.context(() => {
      const width = track.offsetWidth;
      gsap.to(el.querySelectorAll('.marquee-track'), {
        x: -width,
        duration: width / speed,
        ease: 'none',
        repeat: -1,
      });
    }, el);

    return () => ctx.revert();
  }, [speed, items]);

  return (
    <div className="marquee" ref={ref} aria-hidden="true">
      {[0, 1].map((copy) => (
        <div className="marquee-track" key={copy}>
          {items.map((item, i) => (
            <span className="marquee-item" key={i}>
              {item}
              <span style={{ color: 'var(--accent)' }}>◦</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
