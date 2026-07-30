import { Reveal } from './Reveal';

interface NxCardHeadProps {
  /** Card number in the stack, e.g. `02`. Nexus numbers every section. */
  num: string;
  /** Short monospaced descriptor shown beside the number. */
  kicker: string;
  title: string;
  desc?: string;
  /** Right-hand metadata, e.g. a last-updated stamp. */
  meta?: string;
}

/**
 * The head of a content card: `NN / kicker` on a hairline rule, then the title.
 * Replaces the centred eyebrow-and-title block the views used before — Nexus
 * heads are left-aligned and ruled, which also reads better with long Chinese
 * headings than a centred stack does.
 */
export function NxCardHead({ num, kicker, title, desc, meta }: NxCardHeadProps) {
  return (
    <Reveal style={{ marginBottom: 30 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          paddingBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span className="nx-tag">
          <span style={{ color: 'var(--teal)' }}>{num}</span> / {kicker}
        </span>
        {meta && <span className="nx-tag">{meta}</span>}
      </div>
      <h2
        style={{
          marginTop: 20,
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: 'clamp(26px,3.4vw,42px)',
          lineHeight: 1.14,
          letterSpacing: '-0.025em',
          color: 'var(--text)',
        }}
      >
        {title}
      </h2>
      {desc && (
        <p
          style={{
            marginTop: 14,
            maxWidth: 720,
            fontSize: 15.5,
            lineHeight: 1.75,
            color: 'var(--muted)',
          }}
        >
          {desc}
        </p>
      )}
    </Reveal>
  );
}
