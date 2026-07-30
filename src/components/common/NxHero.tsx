import type { ReactNode } from 'react';

interface NxHeroProps {
  /** Monospaced label knocked out of a solid volt block. */
  chip: string;
  /** Two-part display title; the second half is set in the accent. */
  title: ReactNode;
  sub?: string;
  /** Scroll invitation, hidden when the hero is not the first card. */
  hint?: string;
  /**
   * The drifting glass slabs. Suppress them on heroes that already carry a
   * figure on the right, where the two would sit on top of each other.
   */
  ornament?: boolean;
  children?: ReactNode;
}

/**
 * The floating hero, after Nexus card 1: an engineering grid and three drifting
 * glass slabs behind an oversized, tightly-tracked title.
 *
 * The template centres its hero. This one is left-aligned instead, because the
 * Chinese titles are long enough that centring them leaves ragged, hard-to-scan
 * lines, and because the hero carries a row of destinations underneath.
 */
export function NxHero({
  chip,
  title,
  sub,
  hint,
  ornament = true,
  children,
}: NxHeroProps) {
  return (
    <div style={{ position: 'relative' }}>
      <div className="nx-grid-bg" aria-hidden="true" />
      {ornament && (
        <>
          <div className="nx-glass nx-glass--a" aria-hidden="true" />
          <div className="nx-glass nx-glass--b" aria-hidden="true" />
          <div className="nx-glass nx-glass--c" aria-hidden="true" />
        </>
      )}

      <div style={{ position: 'relative', maxWidth: ornament ? 880 : 'none' }}>
        <p className="nx-chip" style={{ marginBottom: 30 }}>
          {chip}
        </p>
        {/* Nexus sets its hero at 13vw, which suits a six-letter Latin word. The
            Chinese titles here are full-width glyphs six or seven characters
            long, so the ceiling comes down to keep a line on one row. */}
        <h1
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 800,
            fontSize: 'clamp(34px,5vw,72px)',
            lineHeight: 1.04,
            letterSpacing: '-0.03em',
            color: 'var(--text)',
          }}
        >
          {title}
        </h1>
        {sub && (
          <p
            style={{
              marginTop: 30,
              maxWidth: 560,
              fontSize: 16.5,
              lineHeight: 1.75,
              color: 'var(--body)',
            }}
          >
            {sub}
          </p>
        )}
        {children}
        {hint && (
          <div style={{ marginTop: 40 }}>
            <span className="nx-scroll-hint">{hint}</span>
          </div>
        )}
      </div>
    </div>
  );
}
