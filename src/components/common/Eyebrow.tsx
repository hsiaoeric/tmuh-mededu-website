import type { CSSProperties } from 'react';

interface EyebrowProps {
  children: React.ReactNode;
  /** Accent colour of the label (defaults to the teal brand colour). */
  color?: string;
  style?: CSSProperties;
}

/**
 * Small section label shown above section titles. See `.eyebrow` in
 * layout.css — it is a plain-case label under a short accent rule, not the
 * wide-tracked uppercase kicker it used to be.
 */
export function Eyebrow({ children, color, style }: EyebrowProps) {
  return (
    <div className="eyebrow" style={{ ...(color ? { color } : null), ...style }}>
      {children}
    </div>
  );
}
