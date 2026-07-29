import type { CSSProperties, ElementType, ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Retained for call-site compatibility; no longer staggers anything. */
  delay?: number;
  as?: ElementType;
  style?: CSSProperties;
  id?: string;
  className?: string;
}

/**
 * Plain layout wrapper.
 *
 * This used to opt an element into a global fade-up-on-scroll animation. That
 * animation was removed with the Swiss-grotesque redesign — content now renders
 * immediately — but the component is kept (as an inert `div`/`Tag` with the
 * `data-reveal` hook) so the ~24 call sites did not all need rewriting.
 */
export function Reveal({
  children,
  delay,
  as: Tag = 'div',
  style,
  id,
  className,
}: RevealProps) {
  return (
    <Tag
      data-reveal=""
      data-reveal-delay={delay}
      id={id}
      className={className}
      style={style}
    >
      {children}
    </Tag>
  );
}
