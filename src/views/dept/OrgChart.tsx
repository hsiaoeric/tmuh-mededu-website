import { useState, type CSSProperties } from 'react';
import { useSite, type CenterId } from '@/context/SiteContext';
import { CENTERS, CENTER_BRANCHES, CENTER_ICON } from '@/data/centers';
import { Icon, type IconName } from '@/components/common/Icon';

interface OrgChartProps {
  variant: 'A' | 'B';
  activeId: CenterId | null;
  onSelect: (id: CenterId) => void;
}

function CenterNode({
  id,
  active,
  onSelect,
  layout,
}: {
  id: CenterId;
  active: boolean;
  onSelect: (id: CenterId) => void;
  layout: 'tree' | 'hub';
}) {
  const { isZh } = useSite();
  const [hover, setHover] = useState(false);
  const center = CENTERS.find((c) => c.id === id)!;
  const lifted = hover || active;
  const count = center.people.length
    ? `${center.people.length}${isZh ? ' 位' : ''}`
    : isZh
      ? '籌備中'
      : '—';

  const base = {
    position: hover && layout === 'hub' ? 'absolute' : ('relative' as const),
    borderRadius: 14,
    cursor: 'pointer',
    border: `1.5px solid ${lifted ? center.color : 'var(--border)'}`,
    background: active
      ? `color-mix(in srgb,${center.color} 12%,var(--surface))`
      : 'var(--surface)',
    boxShadow: lifted ? 'var(--shadow-lift)' : 'var(--shadow-card)',
    textAlign: 'center' as const,
  };

  if (layout === 'tree') {
    return (
      <button
        onClick={() => onSelect(id)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          ...base,
          position: 'relative',
          padding: '18px 12px',
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
            fontSize: 14,
            color: 'var(--text)',
            lineHeight: 1.3,
          }}
        >
          {isZh ? center.zh : center.en}
        </span>
        <span
          style={{
            display: 'block',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 10.5,
            color: 'var(--muted)',
            marginTop: 4,
          }}
        >
          {count}
        </span>
      </button>
    );
  }

  // hub node
  const branchPlacement: Record<CenterId, CSSProperties> = {
    faculty_dev: { top: 'calc(100% + 9px)', left: '50%', transform: 'translateX(-50%)' },
    clinical_skills: { left: 'calc(100% + 9px)', top: '50%', transform: 'translateY(-50%)' },
    ebm: { left: 'calc(100% + 9px)', top: '50%', transform: 'translateY(-50%)' },
    holistic: { bottom: 'calc(100% + 9px)', left: '50%', transform: 'translateX(-50%)' },
    med_edu_research: { right: 'calc(100% + 9px)', top: '50%', transform: 'translateY(-50%)' },
    admin: { right: 'calc(100% + 9px)', top: '50%', transform: 'translateY(-50%)' },
  };

  return (
    <button
      onClick={() => onSelect(id)}
      aria-expanded={active}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute',
        left: center.hleft,
        top: center.htop,
        transform: `translate(-50%,-50%) scale(${hover ? 1.06 : 1})`,
        width: 118,
        padding: '14px 10px',
        borderRadius: 14,
        cursor: 'pointer',
        border: `1.5px solid ${lifted ? center.color : 'var(--border)'}`,
        background: active
          ? `color-mix(in srgb,${center.color} 12%,var(--surface))`
          : 'var(--surface)',
        boxShadow: lifted ? 'var(--shadow-lift)' : 'var(--shadow-card)',
        textAlign: 'center',
        zIndex: 3,
        transition: 'transform .25s,box-shadow .25s',
      }}
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
      {active && (
        <span
          aria-label={isZh ? `${center.zh}相關分支` : `${center.en} branches`}
          style={{
            position: 'absolute',
            width: 176,
            padding: 8,
            borderRadius: 12,
            border: `1px solid color-mix(in srgb,${center.color} 30%,var(--border))`,
            background: 'color-mix(in srgb,var(--surface) 94%,transparent)',
            boxShadow: 'var(--shadow-lift)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 5,
            pointerEvents: 'none',
            animation: 'branch-pop .22s ease-out',
            ...branchPlacement[id],
          }}
        >
          {CENTER_BRANCHES[id].map((branch) => (
            <span
              key={branch.zh}
              style={{
                padding: '3px 7px',
                borderRadius: 999,
                background: `color-mix(in srgb,${center.color} 12%,var(--surface))`,
                color: 'var(--body)',
                fontSize: 10.5,
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
              }}
            >
              {isZh ? branch.zh : branch.en}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}

export function OrgChart({ variant, activeId, onSelect }: OrgChartProps) {
  const { t } = useSite();

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
              layout="tree"
            />
          ))}
        </div>
      </div>
    );
  }

  // variant B: hub
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 760,
        margin: '0 auto',
        aspectRatio: '1.45 / 1',
      }}
    >
      <svg
        viewBox="0 0 100 70"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
      >
        {CENTERS.map((c) => (
          <line
            key={c.id}
            x1="50"
            y1="35"
            x2={c.hx}
            y2={c.hy}
            stroke={c.color}
            strokeWidth={0.4}
            strokeDasharray="60"
            strokeDashoffset="60"
            style={{ animation: 'draw 1.1s ease forwards .2s', opacity: 0.55 }}
          />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 128,
          height: 128,
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: 'linear-gradient(140deg,var(--teal),var(--teal-700))',
          color: '#fff',
          boxShadow: '0 14px 32px var(--teal-glow)',
          zIndex: 2,
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
      {CENTERS.map((c) => (
        <CenterNode
          key={c.id}
          id={c.id}
          active={activeId === c.id}
          onSelect={onSelect}
          layout="hub"
        />
      ))}
    </div>
  );
}
