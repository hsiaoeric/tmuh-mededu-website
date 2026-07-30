import { useSite } from '@/context/SiteContext';
import { centerById, CENTER_ICON } from '@/data/centers';
import { Icon, type IconName } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { NxColophon } from '@/components/common/NxColophon';
import { ZCard } from '@/zdepth/ZCard';

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
    <ZCard
      id="top"
      label={isZh ? `01 / ${name}` : `01 / ${center.en.toUpperCase()}`}
      center
    >
      <div className="nx-grid-bg" aria-hidden="true" />
      <Reveal style={{ position: 'relative', maxWidth: 640 }}>
        <span
          className="nx-chip"
          style={{ background: center.color, color: 'var(--titanium)' }}
        >
          {center.en}
        </span>
        <h1
          style={{
            marginTop: 28,
            fontFamily: 'var(--font-sans)',
            fontWeight: 800,
            fontSize: 'clamp(32px,4.6vw,66px)',
            lineHeight: 1.06,
            letterSpacing: '-0.035em',
            color: 'var(--text)',
          }}
        >
          {name}
        </h1>

        {/* Build status, read as a telemetry line rather than a badge. */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            margin: '26px 0 24px',
            padding: '9px 14px',
            border: '1px solid var(--border)',
            borderLeft: '2px solid var(--volt)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--volt)',
              animation: 'blink 1.8s ease-in-out infinite',
            }}
          />
          <span className="nx-tag" style={{ color: 'var(--text)' }}>
            {title}
          </span>
        </div>

        <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--body)', marginBottom: 14 }}>
          {intro}
        </p>
        <p style={{ fontSize: 14.5, lineHeight: 1.8, color: 'var(--muted)', marginBottom: 30 }}>
          {desc}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button
            onClick={() => setView('dept')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              padding: '13px 24px',
              border: 'none',
              cursor: 'pointer',
              background: 'var(--volt)',
              color: 'var(--volt-ink)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 14.5,
            }}
          >
            {t.backDept}
          </button>
          <span
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border)',
              color: center.color,
            }}
          >
            <span style={{ width: 20, height: 20 }}>
              <Icon name={CENTER_ICON[center.id] as IconName} />
            </span>
          </span>
        </div>

        <NxColophon />
      </Reveal>
    </ZCard>
  );
}
