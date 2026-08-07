import type { KeyboardEvent } from 'react';
import { Reveal } from './Reveal';

interface KpiCardProps {
  num: number;
  suffix?: string;
  /** When provided, shown verbatim instead of the counting animation. */
  staticDisplay?: string;
  label: string;
  caption?: string;
  color: string;
  delay?: number;
  onClick?: () => void;
  active?: boolean;
}

/** A single metric card with a count-up number and a colored accent bar. */
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
        padding: '24px 22px',
        borderRadius: 'var(--r-lg)',
        background: 'var(--surface)',
        border: `1px solid ${active ? color : 'var(--border)'}`,
        boxShadow: active ? 'var(--e-2)' : 'var(--e-1)',
        overflow: 'hidden',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'border-color .2s,box-shadow .2s,transform .2s',
        transform: active ? 'translateY(-2px)' : 'none',
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
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 3,
            height: '100%',
            background: color,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 4,
          }}
        >
          <span
            {...(staticDisplay == null
              ? { 'data-count': num, 'data-suffix': suffix }
              : {})}
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 54,
              lineHeight: 1,
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {staticDisplay ?? 0}
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            fontSize: 15,
            color: 'var(--text)',
            marginTop: 12,
          }}
        >
          {label}
        </div>
        {caption && (
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 11.5,
              letterSpacing: '.05em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginTop: 2,
            }}
          >
            {caption}
          </div>
        )}
      </Tag>
    </Reveal>
  );
}
