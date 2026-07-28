import { useSite } from '@/context/SiteContext';
import { Icon } from '@/components/common/Icon';
import { TmuhLogo } from '@/components/common/TmuhLogo';

export function Footer() {
  const { t } = useSite();
  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 1,
        borderTop: '1px solid var(--border)',
        background: 'var(--surface-2)',
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '40px 28px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <TmuhLogo size={40} />
          <div style={{ lineHeight: 1.4 }}>
            <div
              style={{
                fontFamily: "'Noto Sans TC', sans-serif",
                fontWeight: 700,
                fontSize: 14.5,
                color: 'var(--text)',
              }}
            >
              {t.footBrand}
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 11,
                color: 'var(--muted)',
              }}
            >
              {t.footBrandEn}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxWidth: 560,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              fontSize: 13,
              color: 'var(--body)',
            }}
          >
            <span style={{ width: 15, height: 15, color: 'var(--muted)', flex: 'none' }}>
              <Icon name="pin" />
            </span>
            {t.footAddr}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13,
              color: 'var(--body)',
            }}
          >
            <span style={{ width: 15, height: 15, color: 'var(--muted)', flex: 'none' }}>
              <Icon name="phone" />
            </span>
            {t.footTel}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
            {t.footNote}
          </p>
        </div>
      </div>
    </footer>
  );
}
