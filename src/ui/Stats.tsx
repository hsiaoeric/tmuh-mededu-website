import type { ReactNode } from 'react';
import { Counter } from '@/motion/Counter';
import { Reveal } from '@/motion/Reveal';

export interface StatItem {
  /** Numeric value to count up to, or a literal string to show as-is. */
  value: number | string;
  suffix?: string;
  label: string;
  sub?: string;
  tone?: string;
  decimals?: number;
}

export function Stat({ item }: { item: StatItem }) {
  const { value, suffix, label, sub, tone, decimals = 0 } = item;
  return (
    <div className="stat" style={tone ? { ['--tone' as string]: tone } : undefined}>
      <div className="stat-num">
        {typeof value === 'number' ? <Counter to={value} decimals={decimals} /> : value}
        {suffix && <span className="stat-suffix">{suffix}</span>}
      </div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

/** A row of statistics separated by hairlines. */
export function StatRow({
  items,
  columns = 'auto-fit-sm',
  children,
}: {
  items: StatItem[];
  columns?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <Reveal variant="up" stagger={90} className={`grid ${columns}`}>
        {items.map((item, i) => (
          <div className="stat-cell" key={`${item.label}-${i}`}>
            <Stat item={item} />
          </div>
        ))}
      </Reveal>
      {children}
    </>
  );
}
