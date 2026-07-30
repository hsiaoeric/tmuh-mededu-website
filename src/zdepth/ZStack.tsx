import { useEffect, useRef, type ReactNode } from 'react';
import { setSpacer, setStatic, startEngine, scheduleMeasure } from './engine';

interface ZStackProps {
  /** Re-measure whenever one of these changes (view, language, theme). */
  deps?: unknown[];
  children: ReactNode;
}

/**
 * Host for a stack of `ZCard`s.
 *
 * The cards themselves are `position: fixed`, so they contribute no height to
 * the document. The scroll track they ride on is this component's spacer, whose
 * height the engine sets from the sum of every card's dwell.
 *
 * Under `prefers-reduced-motion` the engine switches to static mode and the
 * cards fall back into ordinary document flow — the whole site remains readable
 * as a plain long page, which is also the no-JavaScript shape.
 */
export function ZStack({ deps = [], children }: ZStackProps) {
  const spacerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSpacer(spacerRef.current);
    const stop = startEngine();

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotion = () => setStatic(query.matches);
    applyMotion();
    query.addEventListener('change', applyMotion);

    return () => {
      query.removeEventListener('change', applyMotion);
      setSpacer(null);
      stop();
    };
  }, []);

  // A view swap replaces every card; measuring again once React has committed
  // keeps the track height honest.
  useEffect(() => {
    scheduleMeasure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return (
    <div className="zstack">
      <div ref={spacerRef} className="zstack__spacer" aria-hidden="true" />
      {children}
    </div>
  );
}
