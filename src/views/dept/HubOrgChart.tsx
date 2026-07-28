import { useMemo, useState, type CSSProperties } from 'react';
import { useSite, type CenterId } from '@/context/SiteContext';
import {
  CENTERS,
  CENTER_BRANCHES,
  CENTER_ICON,
  type CenterBranch,
} from '@/data/centers';
import { Icon, type IconName } from '@/components/common/Icon';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const VB_W = 100;
const HUB_X = 50;
const BRANCH_SPACING = 11;
const BRANCH_ROW_GAP = 10;
const BRANCHS_PER_LINE = 3;

/**
 * Below this width the chart switches to the compact layout. Keep in sync with
 * the `.hub-org-chart` media query in global.css, which supplies the matching
 * card sizes and box aspect-ratio.
 *
 * The threshold is the narrowest viewport where the wide layout's 860px still
 * fits inside the section's padding, so neither layout ever has to be panned.
 */
export const HUB_COMPACT_MAX_WIDTH = 920;

interface HubLayout {
  /**
   * Height of the SVG viewBox; the width is always VB_W. The box's CSS
   * aspect-ratio must equal VB_W / vbH, otherwise `xMidYMid meet` letterboxes
   * the viewBox and the connector lines drift away from the cards, which are
   * positioned as percentages of the box.
   */
  vbH: number;
  /** Ring positions in viewBox units, keyed by center. */
  pos: Record<CenterId, readonly [number, number]>;
  /**
   * Branch chips fly outward from their center, which costs roughly 40% of the
   * chart width in empty margin. The compact layout spends that width on the
   * ring instead and relies on the detail panel's tabs to reach the branches.
   */
  branches: boolean;
}

/** Landscape ring, wide enough to fan branch chips outward. */
const HUB_WIDE: HubLayout = {
  vbH: 70,
  pos: {
    faculty_dev: [50, 6],
    clinical_skills: [74, 21],
    ebm: [74, 49],
    holistic: [50, 64],
    med_edu_research: [26, 49],
    admin: [26, 21],
  },
  branches: true,
};

/**
 * Square ring for phones: the same clock positions pulled in against the hub
 * and spread further apart vertically, so all six cards fit on screen at once
 * without panning.
 */
const HUB_COMPACT: HubLayout = {
  vbH: 100,
  pos: {
    faculty_dev: [50, 16],
    clinical_skills: [83, 32],
    ebm: [83, 68],
    holistic: [50, 84],
    med_edu_research: [17, 68],
    admin: [17, 32],
  },
  branches: false,
};

type BranchSide = 'top' | 'bottom' | 'left' | 'right';

function sideForCenter(centerId: CenterId): BranchSide {
  if (centerId === 'faculty_dev') return 'bottom';
  if (centerId === 'holistic') return 'top';
  if (centerId === 'clinical_skills' || centerId === 'ebm') return 'right';
  return 'left';
}

/** Smallest gap, in viewBox units, kept between a branch chip and the chart edge. */
const VIEW_MARGIN = 7;

/**
 * Place branches into multi-line slots on a fixed outer side per center so
 * branch cards and tooltips do not sit on top of other center nodes.
 *
 * Only used by the wide layout, so it clamps against that layout's height.
 */
function branchCoords(
  centerId: CenterId,
  cx: number,
  cy: number,
  count: number,
  index: number,
): { x: number; y: number; side: BranchSide } {
  const side = sideForCenter(centerId);
  const line = Math.floor(index / BRANCHS_PER_LINE);
  const col = index % BRANCHS_PER_LINE;
  const colMid = (Math.min(BRANCHS_PER_LINE, count - line * BRANCHS_PER_LINE) - 1) / 2;
  const colOffset = (col - colMid) * BRANCH_SPACING;
  const lineOffset = line * BRANCH_ROW_GAP;

  let x = cx;
  let y = cy;

  if (side === 'bottom') {
    x = cx + colOffset;
    y = cy + 12 + lineOffset;
  } else if (side === 'top') {
    x = cx + colOffset;
    y = cy - 12 - lineOffset;
  } else if (side === 'right') {
    x = cx + 13 + lineOffset;
    y = cy + colOffset;
  } else {
    x = cx - 13 - lineOffset;
    y = cy + colOffset;
  }

  return {
    x: Math.min(VB_W - VIEW_MARGIN, Math.max(VIEW_MARGIN, x)),
    y: Math.min(HUB_WIDE.vbH - VIEW_MARGIN, Math.max(VIEW_MARGIN, y)),
    side,
  };
}

function pctX(x: number) {
  return `${(x / VB_W) * 100}%`;
}

function pctY(y: number, vbH: number) {
  return `${(y / vbH) * 100}%`;
}

function BranchNode({
  branch,
  color,
  x,
  y,
  vbH,
  side,
  delay,
  active,
  onSelect,
}: {
  branch: CenterBranch;
  color: string;
  x: number;
  y: number;
  vbH: number;
  side: BranchSide;
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
        top: pctY(y, vbH),
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
            className="hub-branch-node__icon"
            style={{
              background: `color-mix(in srgb,${color} 16%,transparent)`,
              color,
            }}
          >
            <Icon name={branch.icon} />
          </span>
        )}
        <span
          className="hub-branch-node__label"
          style={{ color: active ? color : 'var(--text)' }}
        >
          {label}
        </span>
      </button>
      {hover && (
        <div
          className="hub-branch-tooltip"
          data-side={side}
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
  layout,
  active,
  dimmed,
  onSelect,
}: {
  id: CenterId;
  layout: HubLayout;
  active: boolean;
  dimmed: boolean;
  onSelect: (id: CenterId) => void;
}) {
  const { isZh } = useSite();
  const [hover, setHover] = useState(false);
  const center = CENTERS.find((c) => c.id === id)!;
  const lifted = hover || active;
  const [x, y] = layout.pos[id];

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
        left: pctX(x),
        top: pctY(y, layout.vbH),
        transform: `translate(-50%,-50%) scale(${lifted ? 1.08 : 1})`,
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
        className="hub-center-node__icon"
        style={{
          background: `color-mix(in srgb,${center.color} 16%,transparent)`,
          color: center.color,
        }}
      >
        <Icon name={CENTER_ICON[id] as IconName} />
      </span>
      <span className="hub-center-node__label">{isZh ? center.zh : center.en}</span>
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
  const compact = useMediaQuery(`(max-width: ${HUB_COMPACT_MAX_WIDTH}px)`);
  const layout = compact ? HUB_COMPACT : HUB_WIDE;

  const branchLines = useMemo(() => {
    if (!activeId || !layout.branches) return [];
    const [cx, cy] = layout.pos[activeId];
    const branches = CENTER_BRANCHES[activeId];
    return branches.map((branch, i) => {
      const { x, y, side } = branchCoords(activeId, cx, cy, branches.length, i);
      return { branch, x, y, side, i };
    });
  }, [activeId, layout]);

  return (
    <div className="hub-org-chart">
      <svg
        viewBox={`0 0 ${VB_W} ${layout.vbH}`}
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
          const [cx, cy] = layout.pos[c.id];
          return (
            <line
              key={c.id}
              x1={HUB_X}
              y1={layout.vbH / 2}
              x2={cx}
              y2={cy}
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
            const [cx, cy] = layout.pos[activeId];
            return (
              <g key={branch.id}>
                <line
                  x1={cx}
                  y1={cy}
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
          <div className="hub-core-disc__title">{t.deptShort}</div>
          <div className="hub-core-disc__sub">
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
          layout={layout}
          active={activeId === c.id}
          dimmed={hasFocus && activeId !== c.id}
          onSelect={onSelectCenter}
        />
      ))}

      {activeId &&
        branchLines.map(({ branch, x, y, side, i }) => (
          <BranchNode
            key={branch.id}
            branch={branch}
            color={CENTERS.find((c) => c.id === activeId)!.color}
            x={x}
            y={y}
            vbH={layout.vbH}
            side={side}
            delay={i * 55}
            active={activeBranchId === branch.id}
            onSelect={() => onSelectBranch(activeId, branch.id)}
          />
        ))}
    </div>
  );
}
