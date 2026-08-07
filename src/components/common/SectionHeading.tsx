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
  eyebrowColor = 'var(--indigo)',
  maxWidth = 680,
}: SectionHeadingProps) {
  const wrap: CSSProperties =
    align === 'center'
      ? { textAlign: 'center', maxWidth, margin: '0 auto 22px' }
      : { marginBottom: 8 };
  return (
    <Reveal style={wrap}>
      {eyebrow && <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>}
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 'clamp(26px,3vw,34px)',
          color: 'var(--text)',
        }}
      >
        {title}
      </h2>
      {/* The seal mark, directly under the title. */}
      <div
        className="rule-accent"
        style={{ margin: align === 'center' ? '18px auto 0' : '18px 0 0' }}
      />
      {desc && (
        <p style={{ fontSize: 16, color: 'var(--muted)', marginTop: 16 }}>
          {desc}
        </p>
      )}
    </Reveal>
  );
}
