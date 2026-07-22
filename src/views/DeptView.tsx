import { useState } from 'react';
import { useSite, type CenterId } from '@/context/SiteContext';
import {
  CENTERS,
  CENTER_ICON,
  CENTER_LINK_ORDER,
  READY_CENTER_PAGES,
  centerById,
} from '@/data/centers';
import { deptKpis } from '@/data/kpis';
import { Icon, type IconName } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { Eyebrow } from '@/components/common/Eyebrow';
import { KpiCard } from '@/components/common/KpiCard';
import { SectionHeading } from '@/components/common/SectionHeading';
import { formatPhoneExt } from '@/utils/phone';
import { HeroImage } from '@/components/common/HeroImage';
import { OrgChart } from './dept/OrgChart';
import { CenterDetailPanel } from './dept/CenterDetailPanel';
import { DeptAwardsSection } from './dept/DeptAwardsSection';
import { DeptNewsSection } from './dept/DeptNewsSection';
import { DeptAboutSection } from './dept/DeptAboutSection';
import { DeptCentersSection } from './dept/DeptCentersSection';

function OrgToggle({
  variant,
  onSet,
}: {
  variant: 'A' | 'B';
  onSet: (v: 'A' | 'B') => void;
}) {
  const { t } = useSite();
  const btn = (v: 'A' | 'B', label: string) => {
    const on = variant === v;
    return (
      <button
        onClick={() => onSet(v)}
        style={{
          padding: '8px 18px',
          borderRadius: 999,
          cursor: 'pointer',
          fontFamily: "'Noto Sans TC', sans-serif",
          fontWeight: 600,
          fontSize: 13.5,
          border: `1px solid ${on ? 'var(--teal)' : 'var(--border)'}`,
          background: on ? 'var(--teal)' : 'var(--surface)',
          color: on ? '#fff' : 'var(--body)',
        }}
      >
        {label}
      </button>
    );
  };
  return (
    <Reveal style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '22px 0 30px' }}>
      {btn('A', t.layoutTree)}
      {btn('B', t.layoutHub)}
    </Reveal>
  );
}

function CenterLinks() {
  const { isZh, enterCenter } = useSite();
  const links = CENTER_LINK_ORDER.map((id) => centerById(id)!).map((c) => {
    const ready = READY_CENTER_PAGES.includes(c.id);
    return {
      id: c.id,
      name: isZh ? c.zh : c.en,
      iconId: CENTER_ICON[c.id] as IconName,
      statusLabel: ready ? (isZh ? '進入專頁' : 'Enter page') : isZh ? '建置中' : 'In progress',
    };
  });
  return (
    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', maxWidth: 680 }}>
      {links.map((c) => (
        <button
          key={c.id}
          onClick={() => enterCenter(c.id)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 14px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,.42)',
            background: 'rgba(255,255,255,.12)',
            color: '#fff',
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <span style={{ width: 16, height: 16, display: 'block' }}>
            <Icon name={c.iconId} />
          </span>
          {c.name}
          <span style={{ fontSize: 10.5, opacity: 0.82 }}>· {c.statusLabel}</span>
        </button>
      ))}
    </div>
  );
}

export function DeptView() {
  const { t, isZh, lang } = useSite();
  const [orgVariant, setOrgVariant] = useState<'A' | 'B'>('A');
  const [active, setActive] = useState<CenterId | null>('admin');
  const kpis = deptKpis(isZh ? 'zh' : 'en');
  const activeCenter = active ? centerById(active) : undefined;

  const contacts = [
    {
      center: isZh ? '教學部' : 'Dept. of Medical Education',
      person: isZh ? '王怡文' : 'Yi-Wen Wang',
      ext: formatPhoneExt('3752', lang),
      color: '#4f8c7d',
    },
    ...CENTERS.filter((c) => c.ext).map((c) => ({
      center: isZh ? c.zh : c.en,
      person: isZh ? c.contactZh : c.contactEn,
      ext: formatPhoneExt(c.ext, lang),
      color: c.color,
    })),
  ];

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* HERO (full-bleed banner) */}
      <section id="top" style={{ maxWidth: 1240, margin: '0 auto', padding: '46px 28px 30px' }}>
        <Reveal
          style={{
            position: 'relative',
            borderRadius: 26,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lift)',
            minHeight: 'clamp(420px,52vw,560px)',
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(120deg,#1d342c,#2c4b3f)',
          }}
        >
          <HeroImage
            slug="hero"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(100deg,rgba(22,40,34,.9) 0%,rgba(22,40,34,.6) 44%,rgba(22,40,34,.12) 80%)',
            }}
          />
          <div style={{ position: 'relative', padding: 'clamp(34px,5vw,72px)', maxWidth: 760 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                padding: '6px 14px',
                borderRadius: 999,
                background: 'rgba(255,255,255,.14)',
                border: '1px solid rgba(255,255,255,.3)',
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: 11.5,
                  fontWeight: 600,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  color: '#eafff7',
                }}
              >
                {t.heroEyebrow}
              </span>
            </div>
            <h1
              style={{
                fontFamily: "'Noto Serif TC', serif",
                fontWeight: 900,
                fontSize: 'clamp(44px,6vw,76px)',
                lineHeight: 1.08,
                color: '#fff',
                textShadow: '0 3px 26px rgba(0,0,0,.35)',
              }}
            >
              {t.heroTitle1}
              <br />
              <span style={{ color: '#bfe9dc' }}>{t.heroTitle2}</span>
            </h1>
            <div style={{ width: 80, height: 5, borderRadius: 999, background: '#bfe9dc', margin: '26px 0 22px' }} />
            <p style={{ fontSize: 18, lineHeight: 1.85, color: '#e6f3ee', maxWidth: 560 }}>{t.heroTag}</p>
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  color: '#bfe9dc',
                  marginBottom: 11,
                }}
              >
                {isZh ? '中心專頁入口' : 'Center Pages'}
              </div>
              <CenterLinks />
            </div>
          </div>
        </Reveal>
      </section>

      <DeptNewsSection />
      <DeptAboutSection />
      <DeptCentersSection />

      {/* ORG CHART */}
      <section id="org" style={{ maxWidth: 1240, margin: '0 auto', padding: '46px 28px' }}>
        <SectionHeading eyebrow="Organizational Structure" title={t.orgTitle} desc={t.orgDesc} />
        <OrgToggle variant={orgVariant} onSet={setOrgVariant} />
        <div id="org-chart">
          <OrgChart
            variant={orgVariant}
            activeId={active}
            onSelect={(id) => setActive((cur) => (cur === id ? null : id))}
          />
        </div>
        <div id="org-leadership">
          {activeCenter && (
            <CenterDetailPanel center={activeCenter} onClose={() => setActive(null)} />
          )}
        </div>
      </section>

      <div id="impact">
        <section id="impact-kpi" style={{ maxWidth: 1240, margin: '0 auto', padding: '34px 28px' }}>
          <Reveal
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 24,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <Eyebrow>{t.kpiEyebrow}</Eyebrow>
              <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 30, color: 'var(--text)' }}>
                {t.kpiTitle}
              </h2>
            </div>
          </Reveal>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(186px,1fr))',
              gap: 18,
            }}
          >
            {kpis.map((k, i) => (
              <KpiCard
                key={i}
                num={k.num}
                suffix={k.suffix}
                label={k.label}
                caption={k.en}
                color={k.color}
                delay={k.delay}
              />
            ))}
          </div>
        </section>
        <div id="impact-awards">
          <DeptAwardsSection />
        </div>
      </div>

      {/* CONTACT */}
      <section id="contact" style={{ maxWidth: 1240, margin: '0 auto', padding: '20px 28px 60px' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 26 }}>
          <Eyebrow>Contact</Eyebrow>
          <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 30, color: 'var(--text)' }}>
            {t.contactTitle}
          </h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(238px,1fr))', gap: 16 }}>
          {contacts.map((c, i) => (
            <Reveal
              key={i}
              style={{
                padding: '22px 22px',
                borderRadius: 16,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                <span style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 700, fontSize: 14.5, color: 'var(--text)' }}>
                  {c.center}
                </span>
              </div>
              <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontSize: 14, color: 'var(--body)', marginBottom: 7 }}>
                {c.person}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 13,
                  color: 'var(--teal-700)',
                }}
              >
                <span style={{ display: 'block', width: 14, height: 14 }}>
                  <Icon name="phone" />
                </span>
                {c.ext}
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
