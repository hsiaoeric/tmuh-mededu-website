import { useRef, useState } from 'react';
import { useSite, type CenterId } from '@/context/SiteContext';
import { CENTERS, CENTER_ICON } from '@/data/centers';
import { Icon, type IconName } from '@/components/common/Icon';
import { useCenteredScroll } from '@/hooks/useCenteredScroll';
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
          fontFamily: 'var(--font-sans)',
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
  useCenteredScroll(hubScrollRef, [variant]);

  if (variant === 'A') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            padding: '14px 30px',
            background: 'linear-gradient(140deg,var(--teal),var(--teal-700))',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 18 }}>
            {t.hospital}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
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
            background: 'var(--surface)',
            border: '1.5px solid var(--teal)',
            color: 'var(--text)',
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 16,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {t.dept}
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-sans)',
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
