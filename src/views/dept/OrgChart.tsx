import { useEffect, useRef, useState } from 'react';
import { useSite, type CenterId } from '@/context/SiteContext';
import { CENTERS, CENTER_ICON } from '@/data/centers';
import { Icon, type IconName } from '@/components/common/Icon';
import { HubOrgChart } from './HubOrgChart';

interface OrgChartProps {
  variant: 'A' | 'B';
  activeId: CenterId | null;
  activeBranchId?: string | null;
  onSelect: (id: CenterId) => void;
  onSelectBranch?: (centerId: CenterId, branchId: string) => void;
}

function TreeCenterButton({
  id,
  active,
  onSelect,
  name,
  color,
  iconId,
}: {
  id: CenterId;
  active: boolean;
  onSelect: (id: CenterId) => void;
  name: string;
  color: string;
  iconId: IconName;
}) {
  const [hover, setHover] = useState(false);
  const lifted = hover || active;

  return (
    <button
      onClick={() => onSelect(id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        padding: '18px 12px',
        borderRadius: 14,
        cursor: 'pointer',
        border: `1.5px solid ${lifted ? color : 'var(--border)'}`,
        background: active
          ? `color-mix(in srgb,${color} 12%,var(--surface))`
          : 'var(--surface)',
        boxShadow: lifted ? 'var(--shadow-lift)' : 'var(--shadow-card)',
        textAlign: 'center',
        transform: lifted ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform .25s,box-shadow .25s,border-color .25s',
      }}
    >
      <span
        style={{
          display: 'flex',
          width: 34,
          height: 34,
          margin: '0 auto 9px',
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          background: `color-mix(in srgb,${color} 16%,transparent)`,
          color,
        }}
      >
        <Icon name={iconId} />
      </span>
      <span
        style={{
          display: 'block',
          fontFamily: "'Noto Sans TC', sans-serif",
          fontWeight: 700,
          fontSize: 14,
          color: 'var(--text)',
          lineHeight: 1.3,
        }}
      >
        {name}
      </span>
    </button>
  );
}

function CenterNode({
  id,
  active,
  onSelect,
}: {
  id: CenterId;
  active: boolean;
  onSelect: (id: CenterId) => void;
}) {
  const { isZh } = useSite();
  const center = CENTERS.find((c) => c.id === id)!;

  return (
    <TreeCenterButton
      id={id}
      active={active}
      onSelect={onSelect}
      name={isZh ? center.zh : center.en}
      color={center.color}
      iconId={CENTER_ICON[id] as IconName}
    />
  );
}

export function OrgChart({
  variant,
  activeId,
  activeBranchId = null,
  onSelect,
  onSelectBranch,
}: OrgChartProps) {
  const { t } = useSite();
  const hubScrollRef = useRef<HTMLDivElement>(null);

  // The hub diagram is pinned to a legible minimum width, so it overflows on
  // narrow viewports. Open it centred on the hub instead of at its left edge.
  useEffect(() => {
    const el = hubScrollRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [variant]);

  if (variant === 'A') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            padding: '14px 30px',
            borderRadius: 14,
            background: 'linear-gradient(140deg,var(--teal),var(--teal-700))',
            color: '#fff',
            textAlign: 'center',
            boxShadow: '0 12px 26px var(--teal-glow)',
          }}
        >
          <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 700, fontSize: 18 }}>
            {t.hospital}
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 11,
              letterSpacing: '.08em',
              opacity: 0.9,
            }}
          >
            Taipei Medical University Hospital
          </div>
        </div>
        <div style={{ width: 2, height: 26, background: 'var(--border)' }} />
        <div
          style={{
            padding: '11px 26px',
            borderRadius: 12,
            background: 'var(--surface)',
            border: '1.5px solid var(--teal)',
            color: 'var(--text)',
            textAlign: 'center',
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 700,
            fontSize: 16,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {t.dept}
          <span
            style={{
              display: 'block',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: 500,
              fontSize: 10.5,
              letterSpacing: '.06em',
              color: 'var(--muted)',
            }}
          >
            Six functional units
          </span>
        </div>
        <div style={{ width: 2, height: 26, background: 'var(--border)' }} />
        <div
          className="org-center-grid"
          style={{
            display: 'grid',
            gap: 14,
            width: '100%',
          }}
        >
          {CENTERS.map((c) => (
            <CenterNode
              key={c.id}
              id={c.id}
              active={activeId === c.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={hubScrollRef} className="hub-org-scroll">
      <HubOrgChart
        activeId={activeId}
        activeBranchId={activeBranchId}
        onSelectCenter={onSelect}
        onSelectBranch={onSelectBranch ?? (() => {})}
      />
    </div>
  );
}
