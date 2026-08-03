import { useMemo } from 'react';
import { useSite } from '@/app/site';
import { ORG_ORDER } from '@/app/routes';
import { centerById, CENTER_BRANCHES, CENTER_ICON } from '@/data/centers';
import type { CenterId } from '@/data/types';
import { Reveal } from '@/motion/Reveal';
import { Icon } from './Icon';

const VB = { w: 1000, h: 660 };
const HUB = { x: 500, y: 330, r: 62 };
const RING = { rx: 342, ry: 216 };
const NODE_R = 46;

interface NodePos {
  id: CenterId;
  x: number;
  y: number;
  /** Label sits above the node only at the top of the ring. */
  above: boolean;
}

/**
 * Six units on an ellipse in `ORG_ORDER`: the administrative team at twelve
 * o'clock, then the five centres clockwise from there.
 */
function layout(): NodePos[] {
  return ORG_ORDER.map((id, i) => {
    const angle = (-90 + i * (360 / ORG_ORDER.length)) * (Math.PI / 180);
    return {
      id,
      x: HUB.x + Math.cos(angle) * RING.rx,
      y: HUB.y + Math.sin(angle) * RING.ry,
      above: Math.sin(angle) < -0.9,
    };
  });
}

/** Curve that bows away from the straight line, so links read as filaments. */
function filament(node: NodePos) {
  const mx = (HUB.x + node.x) / 2;
  const my = (HUB.y + node.y) / 2;
  const dx = node.x - HUB.x;
  const dy = node.y - HUB.y;
  const len = Math.hypot(dx, dy) || 1;
  // Perpendicular offset, scaled so short links bow less than long ones.
  const bow = len * 0.14;
  const cx = mx + (-dy / len) * bow;
  const cy = my + (dx / len) * bow;
  return `M ${HUB.x} ${HUB.y} Q ${cx} ${cy} ${node.x} ${node.y}`;
}

interface Props {
  active: CenterId | null;
  onSelect: (id: CenterId) => void;
}

export function OrgConstellation({ active, onSelect }: Props) {
  const { isZh, t } = useSite();
  const nodes = useMemo(layout, []);

  return (
    <>
      {/* Diagram — hidden on narrow screens in favour of the list below. */}
      <div className="org-svg-wrap">
        <svg
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          className="org-svg"
          role="group"
          aria-label={isZh ? '教學部組織架構圖' : 'Department structure diagram'}
        >
          <defs>
            <radialGradient id="hubGlow">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx={HUB.x} cy={HUB.y} r={210} fill="url(#hubGlow)" />

          {/* Links */}
          {nodes.map((n, i) => {
            const center = centerById(n.id)!;
            const on = active === n.id;
            const d = filament(n);
            return (
              <g key={`link-${n.id}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={on ? center.color : 'var(--line)'}
                  strokeWidth={on ? 1.8 : 1.1}
                  opacity={active && !on ? 0.45 : 1}
                  style={{ transition: 'stroke .45s ease, opacity .45s ease, stroke-width .45s ease' }}
                />
                <path
                  className="org-pulse"
                  d={d}
                  fill="none"
                  stroke={center.color}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  // Normalised length lets one dash traverse exactly one cycle.
                  pathLength={100}
                  opacity={active && !on ? 0 : 0.85}
                  style={{ animationDelay: `${i * 1.15}s` }}
                />
              </g>
            );
          })}

          {/* Hub */}
          <g>
            <circle
              cx={HUB.x}
              cy={HUB.y}
              r={HUB.r}
              fill="var(--surface)"
              stroke="var(--accent)"
              strokeWidth={1.4}
            />
            <text
              x={HUB.x}
              y={HUB.y - 4}
              textAnchor="middle"
              className="org-hub-label"
            >
              {isZh ? t.dept : 'Medical'}
            </text>
            <text x={HUB.x} y={HUB.y + 20} textAnchor="middle" className="org-hub-sub">
              {isZh ? 'Medical Education' : 'Education'}
            </text>
          </g>

          {/* Unit nodes */}
          {nodes.map((n) => {
            const center = centerById(n.id)!;
            const on = active === n.id;
            const dim = active !== null && !on;
            const label = isZh ? center.zh : center.en;
            const labelY = n.above ? n.y - NODE_R - 22 : n.y + NODE_R + 30;

            return (
              <g
                key={n.id}
                className="org-node"
                data-on={on}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                aria-label={label}
                onClick={() => onSelect(n.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(n.id);
                  }
                }}
                style={{ opacity: dim ? 0.72 : 1 }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={NODE_R + 13}
                  fill="none"
                  stroke={center.color}
                  strokeWidth={1}
                  opacity={on ? 0.55 : 0}
                  className="org-ring"
                />
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={NODE_R}
                  fill={on ? center.color : 'var(--surface)'}
                  stroke={center.color}
                  strokeWidth={1.3}
                  className="org-disc"
                />
                <g
                  transform={`translate(${n.x - 13} ${n.y - 13})`}
                  style={{ color: on ? 'var(--on-accent)' : center.color }}
                >
                  <Icon name={CENTER_ICON[center.id]} size={26} strokeWidth={1.5} />
                </g>
                <text x={n.x} y={labelY} textAnchor="middle" className="org-node-label">
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Small-screen equivalent: the same six units as a tappable list. */}
      <div className="org-list">
        <Reveal variant="up" stagger={60} className="stack" style={{ gap: 0 }}>
          {ORG_ORDER.map((id) => {
            const c = centerById(id)!;
            const on = active === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                aria-pressed={on}
                className="org-list-row"
                style={{ ['--tone' as string]: c.color }}
                data-on={on}
              >
                <span className="org-list-icon">
                  <Icon name={CENTER_ICON[c.id]} size={18} />
                </span>
                <span className="stack" style={{ gap: 1, textAlign: 'left', minWidth: 0 }}>
                  <span style={{ fontFamily: "'Noto Sans TC',sans-serif", fontWeight: 500, color: 'var(--ink)' }}>
                    {isZh ? c.zh : c.en}
                  </span>
                  <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--faint)', letterSpacing: '.08em' }}>
                    {CENTER_BRANCHES[c.id].length} {isZh ? '個面向' : 'facets'}
                  </span>
                </span>
                <Icon name={on ? 'minus' : 'plus'} size={15} style={{ marginLeft: 'auto', color: c.color }} />
              </button>
            );
          })}
        </Reveal>
      </div>
    </>
  );
}
