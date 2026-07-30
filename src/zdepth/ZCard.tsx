import { useEffect, useRef, type ReactNode } from 'react';
import { registerCard, scheduleMeasure } from './engine';

interface ZCardProps {
  /** Anchor id, so cross-page and menu links can still target the section. */
  id?: string;
  /** HUD readout for this card, e.g. `03 / 組織架構`. */
  label: string;
  /** Ground treatment. `dark` cards invert to carbon, as Nexus cards 2 and 4 do. */
  tone?: 'light' | 'dark' | 'panel';
  /**
   * Vertically centre content that is shorter than the viewport. Long cards
   * (lists, charts) should stay top-aligned so they read as documents.
   */
  center?: boolean;
  /** Drop the standard container width/padding — for full-bleed cards. */
  bleed?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * One rung of the z-depth stack: a fixed, viewport-sized panel whose content is
 * scrubbed inside it while the card is pinned. See `engine.ts` for the timeline.
 *
 * Content must not set its own `position: fixed` — the card is a transformed
 * element, so fixed descendants would be positioned against the card, not the
 * viewport.
 */
export function ZCard({
  id,
  label,
  tone = 'light',
  center = false,
  bleed = false,
  className,
  children,
}: ZCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;

    const unregister = registerCard({ el, inner, label });

    // Content height drives the card's dwell, and it changes constantly here:
    // portraits and hero images decode late, the KPI cards expand member lists,
    // the org chart swaps between tree and hub. Re-measure whenever it moves.
    const observer = new ResizeObserver(() => scheduleMeasure());
    observer.observe(inner);

    return () => {
      observer.disconnect();
      unregister();
    };
    // `label` is only read at measure time for the HUD readout; re-registering
    // on a language switch would reset the stack mid-scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      ref={cardRef}
      className={['zcard', `zcard--${tone}`, className].filter(Boolean).join(' ')}
      data-z-label={label}
    >
      <div ref={innerRef} className="zcard__inner">
        <div
          id={id}
          className={[
            'zcard__body',
            center ? 'zcard__body--center' : '',
            bleed ? 'zcard__body--bleed' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
