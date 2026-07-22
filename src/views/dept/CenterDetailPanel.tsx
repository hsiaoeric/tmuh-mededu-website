import { useSite } from '@/context/SiteContext';
import { type Center, CENTER_ICON } from '@/data/centers';
import { resolvePerson } from '@/data/people';
import { Icon, type IconName } from '@/components/common/Icon';
import { PersonCard } from '@/components/common/PersonCard';
import { formatPhoneExt } from '@/utils/phone';
import { AdminTeamTree } from './AdminTeamTree';

interface Props {
  center: Center;
  onClose: () => void;
}

export function CenterDetailPanel({ center, onClose }: Props) {
  const { isZh, lang, t } = useSite();
  const people = center.people.map((p) => resolvePerson(p, center.color, lang));
  const isAdmin = center.id === 'admin';
  const contactLine = center.ext
    ? `${isZh ? center.contactZh : center.contactEn} · ${formatPhoneExt(center.ext, lang)}`
    : '';

  return (
    <div
      style={{
        marginTop: 34,
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-lift)',
      }}
    >
      <div
        style={{
          padding: '26px 30px',
          background: `linear-gradient(120deg,color-mix(in srgb,${center.color} 16%,var(--surface)),var(--surface))`,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span
          style={{
            width: 50,
            height: 50,
            borderRadius: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: center.color,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <Icon name={CENTER_ICON[center.id] as IconName} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 23, color: 'var(--text)' }}>
            {isZh ? center.zh : center.en}
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 12,
              letterSpacing: '.05em',
              color: 'var(--muted)',
              textTransform: 'uppercase',
            }}
          >
            {center.en}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="close"
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '24px 30px 30px' }}>
        <p
          style={{
            fontSize: 15.5,
            lineHeight: 1.8,
            color: 'var(--body)',
            borderLeft: `3px solid ${center.color}`,
            paddingLeft: 16,
            marginBottom: 8,
          }}
        >
          {isZh ? center.introZh : center.introEn}
        </p>
        {contactLine && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              margin: '14px 0 22px',
              padding: '8px 16px',
              borderRadius: 999,
              background: 'var(--teal-50)',
              fontFamily: "'Noto Sans TC', sans-serif",
              fontSize: 13.5,
              color: 'var(--teal-700)',
              fontWeight: 600,
            }}
          >
            <span style={{ display: 'block', width: 15, height: 15 }}>
              <Icon name="phone" />
            </span>
            {contactLine}
          </div>
        )}

        {!isAdmin && people.length > 0 && (
          <>
            <div
              style={{
                fontFamily: "'Noto Sans TC', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--text)',
                margin: '6px 0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ width: 5, height: 20, borderRadius: 9, background: center.color }} />
              {t.members}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(216px,1fr))',
                gap: 16,
              }}
            >
              {people.map((p, i) => (
                <PersonCard key={i} person={p} />
              ))}
            </div>
          </>
        )}

        {isAdmin && <AdminTeamTree center={center} />}

        {people.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 36,
              border: '1.5px dashed var(--border)',
              borderRadius: 14,
              color: 'var(--muted)',
              fontFamily: "'Noto Sans TC', sans-serif",
            }}
          >
            {t.formingTeam}
          </div>
        )}
      </div>
    </div>
  );
}
