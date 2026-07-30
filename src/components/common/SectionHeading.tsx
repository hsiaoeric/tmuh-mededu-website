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

/** Eyebrow + title + optional description, used at the top of most sections. */
export function SectionHeading({
  eyebrow,
  title,
  desc,
  align = 'center',
  eyebrowColor = 'var(--teal)',
  maxWidth = 680,
}: SectionHeadingProps) {
  const wrap: CSSProperties =
    align === 'center'
      ? { textAlign: 'center', maxWidth, margin: '0 auto 14px' }
      : {};
  return (
    <Reveal style={wrap}>
      {eyebrow && <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>}
      <h2
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 900,
          fontSize: 'clamp(26px,3vw,34px)',
          color: 'var(--text)',
        }}
      >
        {title}
      </h2>
      {desc && (
        <p style={{ fontSize: 16, color: 'var(--muted)', marginTop: 12 }}>
          {desc}
        </p>
      )}
    </Reveal>
  );
}
