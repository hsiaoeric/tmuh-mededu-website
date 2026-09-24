import { useEffect, useRef, useState } from 'react';
import { publicCenterById, publicCenterExternalUrl, type PublicCenter } from '@/app/publicCenters';
import { CENTER_ORDER } from '@/app/routes';
import { useSite } from '@/app/site';
import { CenterLink } from './CenterLink';
import { Icon } from './Icon';

interface NavCentersMenuProps {
  readonly centers: readonly PublicCenter[];
  readonly onNavigate: () => void;
}

export function NavCentersMenu({ centers, onNavigate }: NavCentersMenuProps) {
  const { isZh } = useSite();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number>();

  const schedule = (next: boolean) => {
    window.clearTimeout(closeTimer.current);
    if (next) setOpen(true);
    else closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => schedule(true)}
      onMouseLeave={() => schedule(false)}
    >
      <button
        className="nav-link"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
      >
        {isZh ? '五大中心' : 'Centers'}
        <Icon name="arrowDown" size={11} />
      </button>

      {open && <div
        onFocus={() => schedule(true)}
        onBlur={() => schedule(false)}
        style={{
          position: 'absolute',
          top: 'calc(100% + 14px)',
          left: '50%',
          translate: '-50% 0',
          width: 420,
          padding: 8,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--line)',
          background: 'color-mix(in srgb, var(--surface) 94%, transparent)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: 'var(--shadow-lg)',
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          transform: open ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity .32s ease, transform .42s cubic-bezier(.16,1,.3,1), visibility .32s',
        }}
      >
        {CENTER_ORDER.map((id) => {
          const center = publicCenterById(centers, id);
          const externalUrl = publicCenterExternalUrl(center, isZh);
          return (
            <CenterLink
              key={id}
              id={id}
              externalUrl={externalUrl}
              onClick={() => {
                setOpen(false);
                onNavigate();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 12px',
                borderRadius: 'var(--radius)',
                transition: 'background .25s ease',
              }}
              onMouseEnter={(event) => (event.currentTarget.style.background = 'var(--accent-veil)')}
              onMouseLeave={(event) => (event.currentTarget.style.background = 'transparent')}
            >
              <span className="dot" style={{ ['--tone' as string]: center.color }} />
              <span style={{ minWidth: 0 }}>
                <span style={{
                  display: 'block',
                  fontFamily: "'Noto Sans TC', sans-serif",
                  fontSize: '0.86rem',
                  fontWeight: 500,
                  color: 'var(--ink)',
                }}>
                  {isZh ? center.zh : center.en}
                </span>
                <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--faint)', letterSpacing: '.1em' }}>
                  {isZh ? center.en : center.zh}
                  {externalUrl && ' ↗'}
                </span>
              </span>
            </CenterLink>
          );
        })}
      </div>}
    </div>
  );
}
