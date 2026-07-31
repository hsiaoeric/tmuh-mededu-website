import { useLayoutEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { SplitText } from 'gsap/SplitText';
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from './gsap';

gsap.registerPlugin(SplitText);

interface SplitLinesProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  /** Play immediately (hero) instead of waiting for the scroll trigger. */
  immediate?: boolean;
  stagger?: number;
}

/**
 * Masked line-by-line entrance for display headings. SplitText re-measures on
 * resize, which matters here because Chinese and English wrap very differently.
 */
export function SplitLines({
  children,
  as: Tag = 'h2',
  className,
  style,
  delay = 0,
  immediate = false,
  stagger = 0.09,
}: SplitLinesProps) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let split: SplitText | null = null;
    const ctx = gsap.context(() => {
      split = new SplitText(el, {
        type: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        mask: 'lines',
      });

      gsap.from(split.lines, {
        yPercent: 118,
        duration: 1.1,
        ease: EASE.out,
        stagger,
        delay: delay / 1000,
        scrollTrigger: immediate
          ? undefined
          : { trigger: el, start: 'top 90%', once: true },
      });
    }, el);

    ScrollTrigger.refresh();
    return () => {
      split?.revert();
      ctx.revert();
    };
  }, [delay, immediate, stagger, children]);

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
