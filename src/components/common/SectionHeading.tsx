import type { CSSProperties } from 'react';
import { Reveal } from './Reveal';
import { Eyebrow } from './Eyebrow';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  desc?: string;
  align?: 'left' | 'center';
  eyebrowColor?: string;
  maxWidth?: number;
}

/**
 * Section label + title + optional description.
 *
 * Defaults to flush-left: headings stacked down the centre of the page were a
 * large part of the generic look this redesign moved away from. `align="center"`
 * is still available for the rare block that needs it.
 */
export function SectionHeading({
  eyebrow,
  title,
  desc,
  align = 'left',
  eyebrowColor = 'var(--accent)',
  maxWidth = 680,
}: SectionHeadingProps) {
  const wrap: CSSProperties =
    align === 'center'
      ? { textAlign: 'center', maxWidth, margin: '0 auto 14px' }
      : { maxWidth, marginBottom: 14 };
  return (
    <Reveal style={wrap}>
      {eyebrow && <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>}
      <h2
        style={{
          fontFamily: "'Noto Sans TC', sans-serif",
          fontWeight: 700,
          fontSize: 'clamp(26px,3vw,34px)',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: 'var(--text)',
        }}
      >
        {title}
      </h2>
      {desc && (
        <p
          style={{
            fontSize: 15.5,
            lineHeight: 1.6,
            color: 'var(--muted)',
            marginTop: 10,
          }}
        >
          {desc}
        </p>
      )}
    </Reveal>
  );
}
