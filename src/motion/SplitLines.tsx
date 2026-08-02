import {
  isValidElement,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';
import { SplitText } from 'gsap/SplitText';
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from './gsap';

gsap.registerPlugin(SplitText);

/** Flattened text of the children, used as the remount key — see below. */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return '';
}

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
  const text = textOf(children);

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
  }, [delay, immediate, stagger, text]);

  /*
   * SplitText replaces the heading's text node with per-line wrappers, so React
   * no longer owns what is on screen. When the copy changes — switching
   * language is the only case here — React writes into markup GSAP has since
   * rebuilt, and the cleanup's `revert()` then restores GSAP's cached *original*
   * HTML, putting the previous language back. Keying on the text sidesteps the
   * conflict: React discards the whole element and mounts a fresh one for the
   * effect to split, rather than trying to patch a node it no longer controls.
   */
  return (
    <Tag key={text} ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
