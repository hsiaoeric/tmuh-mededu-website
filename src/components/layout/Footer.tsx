import { useSite } from '@/context/SiteContext';
import { Icon } from '@/components/common/Icon';
import { TmuhLogo } from '@/components/common/TmuhLogo';

export function Footer() {
  const { t, isZh } = useSite();
  const designTeam = [
    {
      name: isZh ? '蕭名凱 · hsiaoeric' : 'Ming-Kai Hsiao · hsiaoeric',
      detail: isZh ? '醫學二' : 'Medicine, Year 2',
      email: 'hsiaoeric.dev@gmail.com',
      github: 'https://github.com/hsiaoeric',
    },
    {
      name: '古珉瑄',
      detail: '',
      email: 'michelleku0813@gmail.com',
      github: 'https://github.com/michelleku0813-hub',
    },
  ];
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
        <div style={{ minWidth: 260 }}>
          <div
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.13em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 10,
            }}
          >
            {isZh ? '網站設計團隊' : 'Website Design Team'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {designTeam.map((member) => (
              <div key={member.email} style={{ fontSize: 12.5, lineHeight: 1.55 }}>
                <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                  {member.name}
                  {member.detail && (
                    <span style={{ fontWeight: 400, color: 'var(--muted)' }}> · {member.detail}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a href={`mailto:${member.email}`} style={{ color: 'var(--body)' }}>
                    {member.email}
                  </a>
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--teal-700)', fontWeight: 600 }}
                  >
                    GitHub ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
