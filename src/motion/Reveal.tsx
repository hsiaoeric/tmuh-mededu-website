import { useLayoutEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from './gsap';

type Variant = 'up' | 'fade' | 'clip' | 'scale' | 'left';

interface RevealProps {
  children: ReactNode;
  /** How the element enters. */
  variant?: Variant;
  delay?: number;
  /** Stagger direct children instead of animating the wrapper itself. */
  stagger?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

const FROM: Record<Variant, gsap.TweenVars> = {
  up: { y: 46, opacity: 0 },
  fade: { opacity: 0 },
  clip: { clipPath: 'inset(0 0 100% 0)', y: 22, opacity: 0 },
  scale: { scale: 0.94, opacity: 0 },
  left: { x: -38, opacity: 0 },
};

const TO: Record<Variant, gsap.TweenVars> = {
  up: { y: 0, opacity: 1 },
  fade: { opacity: 1 },
  clip: { clipPath: 'inset(0 0 0% 0)', y: 0, opacity: 1 },
  scale: { scale: 1, opacity: 1 },
  left: { x: 0, opacity: 1 },
};

/**
 * Scroll-triggered entrance. Content is visible by default and only hidden
 * once JS takes over, so a failed script or reduced-motion never leaves the
 * page blank.
 */
export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  stagger,
  as: Tag = 'div',
  className,
  style,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const targets: gsap.TweenTarget =
        stagger !== undefined ? Array.from(el.children) : el;

      gsap.set(targets, FROM[variant]);
      gsap.to(targets, {
        ...TO[variant],
        duration: variant === 'clip' ? 0.95 : 0.85,
        ease: EASE.out,
        delay: delay / 1000,
        stagger: stagger !== undefined ? stagger / 1000 : 0,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      });
    }, el);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [variant, delay, stagger]);

  return (
    <Tag ref={ref} className={className} style={style} id={id}>
      {children}
    </Tag>
  );
}
