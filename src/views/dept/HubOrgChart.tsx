import { useMemo, useState, type CSSProperties } from 'react';
import { useSite, type CenterId } from '@/context/SiteContext';
import {
  CENTERS,
  CENTER_BRANCHES,
  CENTER_ICON,
  type CenterBranch,
} from '@/data/centers';
import { Icon, type IconName } from '@/components/common/Icon';

const VB_W = 100;
const VB_H = 70;
const HUB_X = 50;
const HUB_Y = 35;
const BRANCH_SPACING = 12.5;
const BRANCH_ROW_GAP = 10;
const VIEW_MARGIN = 7;

/** Place branches on perpendicular row(s) from the hub→center axis to avoid overlap. */
function branchCoords(
  cx: number,
  cy: number,
  count: number,
  index: number,
): { x: number; y: number } {
  const dx = cx - HUB_X;
  const dy = cy - HUB_Y;
  const hubDist = Math.hypot(dx, dy) || 1;
  const ux = dx / hubDist;
  const uy = dy / hubDist;
  const px = -uy;
  const py = ux;

  const useTwoRows = count >= 4;
  let row = 0;
  let col = index;
  let colsInRow = count;

  if (useTwoRows) {
    const topRowCount = Math.ceil(count / 2);
    row = index < topRowCount ? 0 : 1;
    col = index < topRowCount ? index : index - topRowCount;
    colsInRow = row === 0 ? topRowCount : count - topRowCount;
  }

  const colMid = (colsInRow - 1) / 2;
  const perpOffset = (col - colMid) * BRANCH_SPACING;
  const rowOffset = row * BRANCH_ROW_GAP;

  const nearTop = cy < 16;
  const nearBottom = cy > 54;
  const nearLeft = cx < 22;
  const nearRight = cx > 78;

  let along = 15 + rowOffset;
  if (nearTop || nearBottom) along = 12 + rowOffset;
  if (nearLeft || nearRight) along = 13 + rowOffset;

  let x = cx + ux * along + px * perpOffset;
  let y = cy + uy * along + py * perpOffset;

  if (nearTop) {
    x = cx + px * perpOffset;
    y = cy + 11 + row * BRANCH_ROW_GAP;
  } else if (nearBottom) {
    x = cx + px * perpOffset;
    y = cy - 11 - row * BRANCH_ROW_GAP;
  } else if (nearRight) {
    x = cx + ux * (9 + rowOffset) + px * perpOffset;
    y = cy + py * perpOffset;
  } else if (nearLeft) {
    x = cx + ux * (9 + rowOffset) + px * perpOffset;
    y = cy + py * perpOffset;
  }

  return {
    x: Math.min(VB_W - VIEW_MARGIN, Math.max(VIEW_MARGIN, x)),
    y: Math.min(VB_H - VIEW_MARGIN, Math.max(VIEW_MARGIN, y)),
  };
}

function pctX(x: number) {
  return `${(x / VB_W) * 100}%`;
}

function pctY(y: number) {
  return `${(y / VB_H) * 100}%`;
}

function BranchNode({
  branch,
  color,
  x,
  y,
  delay,
  active,
  onSelect,
}: {
  branch: CenterBranch;
  color: string;
  x: number;
  y: number;
  delay: number;
  active: boolean;
  onSelect: () => void;
}) {
  const { isZh } = useSite();
  const [hover, setHover] = useState(false);
  const label = isZh ? branch.zh : branch.en;
  const desc = isZh ? branch.descZh : branch.descEn;

  return (
    <div
      className="hub-branch-wrap"
      style={{
        position: 'absolute',
        left: pctX(x),
        top: pctY(y),
        transform: 'translate(-50%, -50%)',
        zIndex: active ? 8 : 6,
        animation: `branch-pop 0.28s ease-out ${delay}ms both`,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        className={`hub-branch-node${active ? ' hub-branch-node--active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        aria-label={label}
        style={{
          borderColor: active || hover ? color : 'var(--border)',
          boxShadow:
            active || hover
              ? `0 8px 22px color-mix(in srgb,${color} 28%,transparent)`
              : 'var(--shadow-card)',
        }}
      >
        {branch.icon && (
          <span
            style={{
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 7,
              background: `color-mix(in srgb,${color} 16%,transparent)`,
              color,
              margin: '0 auto 5px',
            }}
          >
            <Icon name={branch.icon} />
          </span>
        )}
        <span
          style={{
            display: 'block',
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 700,
            fontSize: 10.5,
            lineHeight: 1.25,
            color: active ? color : 'var(--text)',
          }}
        >
          {label}
        </span>
      </button>
      {hover && (
        <div
          className="hub-branch-tooltip"
          style={{
            borderColor: `color-mix(in srgb,${color} 35%,var(--border))`,
          }}
        >
          {desc}
        </div>
      )}
    </div>
  );
}

function CenterNode({
  id,
  active,
  dimmed,
  onSelect,
}: {
  id: CenterId;
  active: boolean;
  dimmed: boolean;
  onSelect: (id: CenterId) => void;
}) {
  const { isZh } = useSite();
  const [hover, setHover] = useState(false);
  const center = CENTERS.find((c) => c.id === id)!;
  const lifted = hover || active;

  return (
    <button
      type="button"
      className={`hub-center-node${active ? ' hub-center-node--active' : ''}${dimmed ? ' hub-dimmed' : ''}`}
      onClick={() => onSelect(id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-expanded={active}
      style={{
        position: 'absolute',
        left: center.hleft,
        top: center.htop,
        transform: `translate(-50%,-50%) scale(${lifted ? 1.08 : 1})`,
        width: 118,
        padding: '14px 10px',
        borderRadius: 14,
        cursor: 'pointer',
        border: `1.5px solid ${lifted ? center.color : 'var(--border)'}`,
        background: active
          ? `color-mix(in srgb,${center.color} 14%,var(--surface))`
          : 'var(--surface)',
        boxShadow: lifted
          ? `0 14px 28px color-mix(in srgb,${center.color} 22%,transparent)`
          : 'var(--shadow-card)',
        textAlign: 'center',
        zIndex: active ? 5 : 3,
        transition: 'transform .25s,box-shadow .25s,opacity .25s',
        '--hub-color': center.color,
      } as CSSProperties}
    >
      <span
        style={{
          display: 'flex',
          width: 30,
          height: 30,
          margin: '0 auto 7px',
          borderRadius: 9,
          alignItems: 'center',
          justifyContent: 'center',
          background: `color-mix(in srgb,${center.color} 16%,transparent)`,
          color: center.color,
        }}
      >
        <Icon name={CENTER_ICON[id] as IconName} />
      </span>
      <span
        style={{
          display: 'block',
          fontFamily: "'Noto Sans TC', sans-serif",
          fontWeight: 700,
          fontSize: 12.5,
          color: 'var(--text)',
          lineHeight: 1.25,
        }}
      >
        {isZh ? center.zh : center.en}
      </span>
    </button>
  );
}

interface HubOrgChartProps {
  activeId: CenterId | null;
  activeBranchId: string | null;
  onSelectCenter: (id: CenterId) => void;
  onSelectBranch: (centerId: CenterId, branchId: string) => void;
}

export function HubOrgChart({
  activeId,
  activeBranchId,
  onSelectCenter,
  onSelectBranch,
}: HubOrgChartProps) {
  const { t } = useSite();
  const hasFocus = activeId !== null;

  const branchLines = useMemo(() => {
    if (!activeId) return [];
    const center = CENTERS.find((c) => c.id === activeId)!;
    const branches = CENTER_BRANCHES[activeId];
    return branches.map((branch, i) => {
      const { x, y } = branchCoords(center.hx, center.hy, branches.length, i);
      return { branch, x, y, i };
    });
  }, [activeId]);

  return (
    <div
      className="hub-org-chart"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 920,
        margin: '0 auto',
        aspectRatio: '1.45 / 1',
        padding: '12px 0 28px',
        overflow: 'visible',
      }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="hub-org-svg"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        {CENTERS.map((c) => {
          const isActive = activeId === c.id;
          const isDimmed = hasFocus && !isActive;
          return (
            <line
              key={c.id}
              x1={HUB_X}
              y1={HUB_Y}
              x2={c.hx}
              y2={c.hy}
              stroke={c.color}
              strokeWidth={isActive ? 0.75 : 0.4}
              strokeDasharray={isActive ? '4 2' : '60'}
              strokeDashoffset={isActive ? 0 : 60}
              className={isActive ? 'hub-line hub-line--active' : 'hub-line'}
              style={{
                opacity: isDimmed ? 0.2 : isActive ? 0.95 : 0.55,
                animation: isActive
                  ? 'line-flow 1.4s linear infinite'
                  : 'draw 1.1s ease forwards .2s',
              }}
            />
          );
        })}

        {activeId &&
          branchLines.map(({ branch, x, y, i }) => {
            const center = CENTERS.find((c) => c.id === activeId)!;
            const isBranchActive = activeBranchId === branch.id;
            return (
              <g key={branch.id}>
                <line
                  x1={center.hx}
                  y1={center.hy}
                  x2={x}
                  y2={y}
                  stroke={center.color}
                  strokeWidth={isBranchActive ? 0.55 : 0.35}
                  className="hub-line hub-line--branch"
                  style={{
                    opacity: isBranchActive ? 1 : 0.7,
                    animation: `draw 0.45s ease forwards ${i * 60}ms`,
                  }}
                />
              </g>
            );
          })}
      </svg>

      <div
        className="hub-core"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 132,
          height: 132,
          zIndex: 4,
        }}
      >
        <span className="hub-core-ring hub-core-ring--1" aria-hidden="true" />
        <span className="hub-core-ring hub-core-ring--2" aria-hidden="true" />
        <div
          className="hub-core-disc"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'linear-gradient(140deg,var(--teal),var(--teal-700))',
            color: '#fff',
            boxShadow: '0 14px 32px var(--teal-glow)',
          }}
        >
          <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 800, fontSize: 18 }}>
            {t.deptShort}
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 9.5,
              letterSpacing: '.1em',
              opacity: 0.9,
              marginTop: 2,
            }}
          >
            DEPT. OF
            <br />
            MED. EDUCATION
          </div>
        </div>
      </div>

      {CENTERS.map((c) => (
        <CenterNode
          key={c.id}
          id={c.id}
          active={activeId === c.id}
          dimmed={hasFocus && activeId !== c.id}
          onSelect={onSelectCenter}
        />
      ))}

      {activeId &&
        branchLines.map(({ branch, x, y, i }) => (
          <BranchNode
            key={branch.id}
            branch={branch}
            color={CENTERS.find((c) => c.id === activeId)!.color}
            x={x}
            y={y}
            delay={i * 55}
            active={activeBranchId === branch.id}
            onSelect={() => onSelectBranch(activeId, branch.id)}
          />
        ))}
    </div>
  );
}
