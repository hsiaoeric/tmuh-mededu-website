import { useSite } from '@/context/SiteContext';
import { centerById, CENTER_ICON } from '@/data/centers';
import { Icon, type IconName } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';

export function BuildingView() {
  const { isZh, t, buildingId, setView } = useSite();
  const center = buildingId ? centerById(buildingId) : undefined;
  if (!center) return null;

  const name = isZh ? center.zh : center.en;
  const intro = isZh ? center.introZh : center.introEn;
  const title = isZh ? '本中心專頁建置中' : 'This center page is in progress';
  const desc = isZh
    ? '內容正陸續整理上線，敬請期待。您可以先返回教學部首頁瀏覽組織架構與團隊成員。'
    : 'Content is being prepared and will be online soon. Meanwhile, return to the department home to explore the structure and teams.';

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '64vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 28px',
      }}
    >
      <Reveal style={{ maxWidth: 560, textAlign: 'center' }}>
        <span
          style={{
            width: 74,
            height: 74,
            margin: '0 auto 22px',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(140deg,${center.color},color-mix(in srgb,${center.color} 55%,#000))`,
            color: '#fff',
            boxShadow: `0 14px 32px color-mix(in srgb,${center.color} 40%,transparent)`,
          }}
        >
          <span style={{ width: 34, height: 34 }}>
            <Icon name={CENTER_ICON[center.id] as IconName} />
          </span>
        </span>
        <div
          style={{
            fontFamily: "'Archivo', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: center.color,
            marginBottom: 10,
          }}
        >
          {center.en}
        </div>
        <h1
          style={{
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(30px,4vw,42px)',
            color: 'var(--text)',
            lineHeight: 1.2,
            marginBottom: 6,
          }}
        >
          {name}
        </h1>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 9,
            margin: '14px 0 20px',
            padding: '7px 16px',
            borderRadius: 2,
            background: 'color-mix(in srgb,var(--accent) 12%,transparent)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--accent)',
              animation: 'blink 1.8s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontFamily: "'Noto Sans TC', sans-serif",
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--accent-700)',
            }}
          >
            {title}
          </span>
        </div>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: 'var(--body)',
            marginBottom: 14,
          }}
        >
          {intro}
        </p>
        <p
          style={{
            fontSize: 14.5,
            lineHeight: 1.6,
            color: 'var(--muted)',
            marginBottom: 30,
          }}
        >
          {desc}
        </p>
        <button
          onClick={() => setView('dept')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 9,
            padding: '13px 26px',
            border: 'none',
            borderRadius: 2,
            cursor: 'pointer',
            background: 'linear-gradient(140deg,var(--accent),var(--accent-700))',
            color: '#fff',
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            boxShadow: 'none',
          }}
        >
          {t.backDept}
        </button>
      </Reveal>
    </div>
  );
}
