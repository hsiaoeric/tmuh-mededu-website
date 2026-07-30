import { useEffect, useState } from 'react';
import { useSite } from '@/context/SiteContext';
import {
  getState,
  scrollToCard,
  subscribe,
  type EngineState,
} from '@/zdepth/engine';

function Chevron({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d={up ? 'M2 9L7 4L12 9' : 'M2 5L7 10L12 5'}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * The permanent signature bar along the bottom of the viewport: brand mark,
 * current section readout, stack progress and card-to-card navigation.
 *
 * It replaces the old page footer, which cannot exist in a fixed-card stack —
 * there is no bottom of the document to put it at. The footer's crest and
 * credits move into the closing card of each view.
 */
export function Hud() {
  const { isZh } = useSite();
  const [engine, setEngine] = useState<EngineState>(getState);

  useEffect(() => subscribe(setEngine), []);

  const pct = String(Math.round(engine.progress * 100)).padStart(3, '0');
  const label = engine.labels[engine.index] ?? '';
  // Back is live as soon as the page has moved at all: from inside a long card
  // it rewinds to that card's own start before stepping to the previous one.
  const atStart = engine.progress <= 0.001;
  const onLastCard = engine.index >= engine.count - 1;

  return (
    <footer className="hud">
      <span className="hud__brand">
        <span className="hud__dot" aria-hidden="true" />
        <span>{isZh ? '北醫附醫 教學部' : 'TMUH MEDICAL EDUCATION'}</span>
      </span>

      <span className="hud__section">{label}</span>

      <div className="hud__progress">
        <div
          className="hud__track"
          role="progressbar"
          aria-label={isZh ? '閱讀進度' : 'Reading progress'}
          aria-valuenow={Math.round(engine.progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="hud__fill" style={{ width: `${engine.progress * 100}%` }} />
        </div>
        <span className="hud__pct">{pct}%</span>
      </div>

      <div className="hud__nav">
        <button
          type="button"
          className="hud__arrow"
          onClick={() => scrollToCard(engine.index - 1)}
          disabled={atStart}
          aria-label={isZh ? '上一段' : 'Previous section'}
          title={isZh ? '上一段' : 'Previous section'}
        >
          <Chevron up />
        </button>
        <button
          type="button"
          className="hud__arrow"
          onClick={() => scrollToCard(engine.index + 1)}
          disabled={onLastCard}
          aria-label={isZh ? '下一段' : 'Next section'}
          title={isZh ? '下一段' : 'Next section'}
        >
          <Chevron up={false} />
        </button>
      </div>
    </footer>
  );
}
