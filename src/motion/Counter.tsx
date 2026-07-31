import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from './gsap';

interface CounterProps {
  to: number;
  /** Decimal places to keep (satisfaction scores need one). */
  decimals?: number;
  duration?: number;
}

/** Counts up to a number when it scrolls into view. */
export function Counter({ to, decimals = 0, duration = 1.9 }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = to.toFixed(decimals);
      return;
    }

    const state = { n: 0 };
    const ctx = gsap.context(() => {
      gsap.to(state, {
        n: to,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = state.n.toFixed(decimals);
        },
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [to, decimals, duration]);

  return <span ref={ref}>{prefersReducedMotion() ? to.toFixed(decimals) : '0'}</span>;
}
