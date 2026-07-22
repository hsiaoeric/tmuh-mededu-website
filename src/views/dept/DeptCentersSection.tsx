import { useSite } from '@/context/SiteContext';
import {
  CENTER_BRANCHES,
  CENTER_ICON,
  CENTER_LINK_ORDER,
  READY_CENTER_PAGES,
  centerById,
} from '@/data/centers';
import { Icon, type IconName } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';

export function DeptCentersSection() {
  const { isZh, enterCenter } = useSite();
  const centers = CENTER_LINK_ORDER.map((id) => centerById(id)!);

  return (
    <section id="centers" style={{ maxWidth: 1240, margin: '0 auto', padding: '46px 28px' }}>
      <SectionHeading
        eyebrow="Five Centers"
        title={isZh ? '五大中心' : 'Five Centers'}
        desc={isZh ? '以專業分工串聯完整的醫學教育支持系統。' : 'Specialized centers forming one connected medical education system.'}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 16, marginTop: 26 }}>
        {centers.map((center, index) => {
          const ready = READY_CENTER_PAGES.includes(center.id);
          return (
            <Reveal
              key={center.id}
              delay={index * 70}
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 250,
                padding: '22px 20px',
                borderRadius: 17,
                border: `1px solid color-mix(in srgb,${center.color} 28%,var(--border))`,
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <span style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, color: center.color, background: `color-mix(in srgb,${center.color} 14%,transparent)` }}>
                <Icon name={CENTER_ICON[center.id] as IconName} />
              </span>
              <h3 style={{ marginTop: 15, fontFamily: "'Noto Sans TC', sans-serif", fontSize: 17.5, lineHeight: 1.4, color: 'var(--text)' }}>
                {isZh ? center.zh : center.en}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '13px 0 18px' }}>
                {CENTER_BRANCHES[center.id].map((branch) => (
                  <span key={branch.zh} style={{ padding: '3px 7px', borderRadius: 999, background: 'var(--surface-2)', fontSize: 10.5, color: 'var(--muted)' }}>
                    {isZh ? branch.zh : branch.en}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => enterCenter(center.id)}
                style={{
                  marginTop: 'auto',
                  alignSelf: 'flex-start',
                  border: 0,
                  background: 'transparent',
                  color: center.color,
                  fontFamily: "'Noto Sans TC', sans-serif",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {ready
                  ? isZh
                    ? '進入中心專頁 →'
                    : 'Enter center →'
                  : isZh
                    ? '查看中心資訊 →'
                    : 'View center →'}
              </button>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
