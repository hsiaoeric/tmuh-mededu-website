import type { ReactNode } from 'react';
import { Reveal } from '@/motion/Reveal';
import { SplitLines } from '@/motion/SplitLines';

interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  tight?: boolean;
}

export function Section({ id, children, className = '', tight }: SectionProps) {
  return (
    <section id={id} className={`section ${tight ? 'section-tight' : ''} ${className}`}>
      <div className="shell">{children}</div>
    </section>
  );
}

/**
 * The index + eyebrow pair that opens a `SectionHeader`, on its own.
 *
 * Split out because a pinned stage scrolls its own header off screen, so it
 * has to restate which section the visitor is still inside.
 */
export function SectionTag({ index, eyebrow }: { index?: string; eyebrow: string }) {
  return (
    <div className="row gap-2 wrap">
      {index && <span className="index">{index}</span>}
      <span className="eyebrow">{eyebrow}</span>
    </div>
  );
}

interface SectionHeaderProps {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  desc?: ReactNode;
  /** Rendered on the right of the title row (a link, a toggle…). */
  aside?: ReactNode;
  align?: 'left' | 'center';
}

export function SectionHeader({
  index,
  eyebrow,
  title,
  desc,
  aside,
  align = 'left',
}: SectionHeaderProps) {
  return (
    <div
      className="sec-head"
      style={align === 'center' ? { alignItems: 'center', textAlign: 'center' } : undefined}
    >
      <Reveal variant="fade" style={align === 'center' ? { display: 'flex', justifyContent: 'center' } : undefined}>
        <SectionTag index={index} eyebrow={eyebrow} />
      </Reveal>

      <div className="sec-head-row" style={align === 'center' ? { justifyContent: 'center' } : undefined}>
        <SplitLines as="h2" className="display d2 title-measure">
          {title}
        </SplitLines>
        {aside}
      </div>

      {desc && (
        <Reveal variant="up" delay={120}>
          <p className="lede measure" style={align === 'center' ? { marginInline: 'auto' } : undefined}>
            {desc}
          </p>
        </Reveal>
      )}
    </div>
  );
}
