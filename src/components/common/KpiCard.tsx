import type { KeyboardEvent } from 'react';
import { Reveal } from './Reveal';

interface KpiCardProps {
  num: number;
  suffix?: string;
  /** When provided, shown verbatim instead of the formatted number. */
  staticDisplay?: string;
  label: string;
  caption?: string;
  color: string;
  delay?: number;
  onClick?: () => void;
  active?: boolean;
}

/**
 * A single reported figure.
 *
 * Deliberately not a "stat card": no floating surface, no soft corners, no
 * count-up animation. It is a rule, a number set flush in tabular figures, and
 * a label — an institution reporting a value rather than a landing page
 * celebrating one. The accent rule sits on top and is the only colour.
 */
export function KpiCard({
  num,
  suffix = '',
  staticDisplay,
  label,
  caption,
  color,
  delay,
  onClick,
  active = false,
}: KpiCardProps) {
  const clickable = !!onClick;
  const Tag = clickable ? 'button' : 'div';
  return (
    <Reveal
      delay={delay}
      style={{
        position: 'relative',
        padding: '18px 0 20px',
        borderTop: `2px solid ${color}`,
        background: 'transparent',
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <Tag
        type={clickable ? 'button' : undefined}
        onClick={onClick}
        onKeyDown={
          clickable
            ? (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        style={{
          all: 'unset',
          display: 'block',
          width: '100%',
          cursor: clickable ? 'pointer' : 'default',
        }}
      >
        <div
          data-figure=""
          style={{
            fontFamily: "'Archivo', sans-serif",
            fontWeight: 700,
            fontSize: 52,
            lineHeight: 0.95,
            letterSpacing: '-0.035em',
            color: active ? color : 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {staticDisplay ?? `${num.toLocaleString('en-US')}${suffix}`}
        </div>
        <div
          style={{
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 600,
            fontSize: 14.5,
            lineHeight: 1.4,
            color: 'var(--text)',
            marginTop: 14,
          }}
        >
          {label}
        </div>
        {caption && (
          <div
            style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: 12,
              letterSpacing: '.02em',
              color: 'var(--muted)',
              marginTop: 3,
            }}
          >
            {caption}
          </div>
        )}
        {clickable && (
          <div
            aria-hidden="true"
            style={{
              height: 2,
              marginTop: 12,
              background: active ? color : 'var(--border)',
              transition: 'background .15s',
            }}
          />
        )}
      </Tag>
    </Reveal>
  );
}
