import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Single easing vocabulary for the whole site. */
export const EASE = {
  out: 'expo.out',
  soft: 'power3.out',
  inOut: 'power2.inOut',
} as const;

/** True when the visitor asked the OS to minimise motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export { gsap, ScrollTrigger };
