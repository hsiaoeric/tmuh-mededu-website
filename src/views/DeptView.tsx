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
import { KpiCard } from '@/components/common/KpiCard';
import { PersonCard } from '@/components/common/PersonCard';
import { NxHero } from '@/components/common/NxHero';
import { NxCardHead } from '@/components/common/NxCardHead';
import { NxColophon } from '@/components/common/NxColophon';
import { ZCard } from '@/zdepth/ZCard';
import { formatPhoneExt } from '@/utils/phone';
import { scrollToId } from '@/utils/scroll';
import { HeroImage } from '@/components/common/HeroImage';
import { person, resolvePerson, type RawPerson } from '@/data/people';
import { OrgChart } from './dept/OrgChart';
import { CenterDetailPanel } from './dept/CenterDetailPanel';
import { DeptAwardsSection } from './dept/DeptAwardsSection';
import { DeptCentersSection } from './dept/DeptCentersSection';
import { DeptNewsSection } from './dept/DeptNewsSection';
import { DeptAboutSection } from './dept/DeptAboutSection';

const KPI_MEMBER_GROUPS: Record<string, RawPerson[]> = {
  'Teaching Attendings': [
    person('邱欣怡', 'Hsin-Yi Chiu', 'lead', '', '', 'hsin-yi-chiu', 'hsin-yi-chiu'),
    person('吳政誠', 'Jeng-Cheng Wu', 'lead', '', '', 'jeng-cheng-wu', 'jeng-cheng-wu'),
    person('吳人傑', 'Jen-Chieh Wu', 'lead', '', '', 'jen-chieh-wu', 'jen-chieh-wu'),
  ],
  'Teaching Allied Health': [
    person('王莉萱', 'Li-Hsuan Wang', 'lead', '', '', 'li-hsuan-wang'),
    person('范芳郡', 'Fang-Chun Fan', 'lead', '', '', 'fang-chun-fan'),
    person('向慧芬', 'Hui-Fen Hsiang', 'lead', '', ''),
    person('鄭憲霖', 'Hsien-Lin Cheng', 'lead', '', ''),
  ],
};

/* Order of the five centers in the KPI card's expanded panel. Destinations come
   from `enterCenter`, which already knows each center's route. */
const KPI_CENTER_LINKS: CenterId[] = [
  'faculty_dev',
  'clinical_skills',
  'ebm',
  'holistic',
  'med_edu_research',
];

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
        aria-pressed={on}
        style={{
          padding: '9px 18px',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontWeight: 500,
          fontSize: 11,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          border: '1px solid var(--border)',
          borderLeft: `2px solid ${on ? 'var(--volt)' : 'var(--border)'}`,
          background: on ? 'var(--volt-wash)' : 'var(--surface)',
          color: on ? 'var(--text)' : 'var(--muted)',
          transition: 'all .3s var(--ease-silk)',
        }}
      >
        {label}
      </button>
    );
  };
  return (
    <Reveal style={{ display: 'flex', gap: 8, margin: '4px 0 28px' }}>
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
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 720 }}>
      {links.map((c) => (
        <button
          key={c.id}
          onClick={() => enterCenter(c.id)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 13px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'border-color .3s var(--ease-silk), background .3s var(--ease-silk)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--volt)';
            e.currentTarget.style.background = 'var(--volt-wash)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'var(--surface)';
          }}
        >
          <span style={{ width: 15, height: 15, display: 'block', color: 'var(--teal)' }}>
            <Icon name={c.iconId} />
          </span>
          {c.name}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9.5,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            {c.statusLabel}
          </span>
        </button>
      ))}
    </div>
  );
}

export function DeptView() {
  const { t, isZh, lang, enterCenter } = useSite();
  const [orgVariant, setOrgVariant] = useState<'A' | 'B'>('A');
  const [active, setActive] = useState<CenterId | null>('admin');
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [activeKpiGroup, setActiveKpiGroup] = useState<string | null>(null);
  const kpis = deptKpis(isZh ? 'zh' : 'en');
  const activeCenter = active ? centerById(active) : undefined;
  const activeKpiPeople = activeKpiGroup
    ? (KPI_MEMBER_GROUPS[activeKpiGroup] ?? []).map((p) =>
        resolvePerson(p, activeKpiGroup === 'Teaching Attendings' ? 'var(--c-ebm)' : 'var(--c-skills)', lang),
      )
    : [];
  const activeKpiCenters =
    activeKpiGroup === 'Education Centers'
      ? KPI_CENTER_LINKS.map((id) => ({ center: centerById(id) })).filter(
          (item) => !!item.center,
        )
      : [];

  const handleSelectCenter = (id: CenterId) => {
    setActive((cur) => {
      if (cur === id) {
        setActiveBranchId(null);
        return null;
      }
      setActiveBranchId(null);
      return id;
    });
  };

  const handleSelectBranch = (centerId: CenterId, branchId: string) => {
    setActive(centerId);
    setActiveBranchId(branchId);
    scrollToId('org-leadership');
  };

  const handleClosePanel = () => {
    setActive(null);
    setActiveBranchId(null);
  };

  const contacts = [
    {
      center: isZh ? '教學部' : 'Dept. of Medical Education',
      person: isZh ? '王怡文' : 'Yi-Wen Wang',
      ext: formatPhoneExt('3752', lang),
      color: 'var(--c-holistic)',
    },
    ...CENTERS.filter((c) => c.ext).map((c) => ({
      center: isZh ? c.zh : c.en,
      person: isZh ? c.contactZh : c.contactEn,
      ext: formatPhoneExt(c.ext, lang),
      color: c.color,
    })),
  ];

  return (
    <>
      {/* 01 — the floating hero, after Nexus card 1. */}
      <ZCard id="top" label={isZh ? '01 / 首頁' : '01 / HOME'} tone="light" center>
        <NxHero
          chip={t.heroEyebrow}
          title={
            <>
              {t.heroTitle1}
              <br />
              <span style={{ color: 'var(--teal)' }}>{t.heroTitle2}</span>
            </>
          }
          sub={t.heroTag}
          hint={isZh ? '向下捲動' : 'Scroll to descend'}
        >
          <div style={{ marginTop: 30 }}>
            <div className="nx-tag" style={{ marginBottom: 12 }}>
              {isZh ? '中心專頁入口' : 'CENTER PAGES'}
            </div>
            <CenterLinks />
          </div>
        </NxHero>
      </ZCard>

      {/* 02 — the engineered image overlay, after Nexus card 2. */}
      <ZCard label={isZh ? '02 / 教學部' : '02 / THE DEPARTMENT'} tone="dark" bleed>
        <DeptMacroCard />
      </ZCard>

      <ZCard label={isZh ? '03 / 部門公告' : '03 / ANNOUNCEMENTS'}>
        <DeptNewsSection />
      </ZCard>

      <ZCard label={isZh ? '04 / 五大中心' : '04 / FIVE CENTERS'}>
        <DeptCentersSection />
      </ZCard>

      <ZCard label={isZh ? '05 / 認識教學部' : '05 / ABOUT'}>
        <DeptAboutSection />
      </ZCard>

      <ZCard id="org" label={isZh ? '06 / 組織架構' : '06 / STRUCTURE'}>
        <NxCardHead
          num="06"
          kicker="ORGANIZATIONAL STRUCTURE"
          title={t.orgTitle}
          desc={t.orgDesc}
        />
        <OrgToggle variant={orgVariant} onSet={setOrgVariant} />
        <div id="org-chart">
          <OrgChart
            variant={orgVariant}
            activeId={active}
            activeBranchId={activeBranchId}
            onSelect={handleSelectCenter}
            onSelectBranch={handleSelectBranch}
          />
        </div>
        <div id="org-leadership">
          {activeCenter && (
            <CenterDetailPanel
              center={activeCenter}
              activeBranchId={activeBranchId}
              onBranchSelect={setActiveBranchId}
              onClose={handleClosePanel}
            />
          )}
        </div>
      </ZCard>

      <ZCard id="impact" label={isZh ? '07 / 品質與成果' : '07 / IMPACT'}>
        <section id="impact-kpi" >
          <NxCardHead num="07" kicker={t.kpiEyebrow} title={t.kpiTitle} />
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
                onClick={
                  KPI_MEMBER_GROUPS[k.en] || k.en === 'Education Centers'
                    ? () =>
                        setActiveKpiGroup((cur) =>
                          cur === k.en ? null : k.en,
                        )
                    : undefined
                }
                active={activeKpiGroup === k.en}
              />
            ))}
          </div>
          {activeKpiGroup && activeKpiPeople.length > 0 && (
            <div
              style={{
                marginTop: 18,
                padding: '18px 18px 20px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: 14,
                }}
              >
                {isZh
                  ? activeKpiGroup === 'Teaching Attendings'
                    ? '教學型主治成員'
                    : '職類教學型醫事人員成員'
                  : activeKpiGroup}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
                  gap: 14,
                }}
              >
                {activeKpiPeople.map((p, idx) => (
                  <PersonCard key={`${p.fullname}-${idx}`} person={p} instant hideRole />
                ))}
              </div>
            </div>
          )}
          {activeKpiGroup === 'Education Centers' && activeKpiCenters.length > 0 && (
            <div
              style={{
                marginTop: 18,
                padding: '18px 18px 20px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: 14,
                }}
              >
                {isZh ? '五中心官網入口' : 'Five Center Websites'}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))',
                  gap: 14,
                }}
              >
                {activeKpiCenters.map((item) => {
                  const center = item.center!;
                  return (
                    <div
                      key={center.id}
                      style={{
                        border: '1px solid var(--border)',
                        padding: '16px 14px',
                        background: 'var(--surface-2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span
                          style={{
                            width: 30,
                            height: 30,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: center.color,
                            background: `color-mix(in srgb,${center.color} 14%,transparent)`,
                          }}
                        >
                          <Icon name={CENTER_ICON[center.id] as IconName} />
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontWeight: 700,
                            fontSize: 14,
                            color: 'var(--text)',
                            lineHeight: 1.4,
                          }}
                        >
                          {isZh ? center.zh : center.en}
                        </span>
                      </div>
                      {/* Router navigation rather than a raw href: these are
                          in-app routes, so an absolute path would break when
                          the site is served from a sub-path. */}
                      <button
                        onClick={() => enterCenter(center.id)}
                        style={{
                          marginTop: 'auto',
                          alignSelf: 'flex-start',
                          padding: 0,
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          color: center.color,
                          fontFamily: 'var(--font-sans)',
                          fontSize: 12.5,
                          fontWeight: 700,
                        }}
                      >
                        {isZh ? '前往專頁 ↗' : 'Visit page ↗'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </ZCard>

      <ZCard id="impact-awards" label={isZh ? '08 / 教學獎項' : '08 / AWARDS'}>
        <DeptAwardsSection />
      </ZCard>

      {/* 09 — the closing card. Carbon ground, crosshair rules and the node
          marker from Nexus card 2, plus the colophon that used to be the page
          footer. */}
      <ZCard
        id="contact"
        label={isZh ? '09 / 聯絡窗口' : '09 / CONTACT'}
        tone="dark"
        center
      >
        <div className="nx-grid-bg" aria-hidden="true" />
        <div className="nx-crosshair-v" style={{ left: '62%' }} aria-hidden="true" />
        <div className="nx-crosshair-h" style={{ top: '38%' }} aria-hidden="true" />
        <div className="nx-node" style={{ left: '62%', top: '38%' }} aria-hidden="true" />

        <div style={{ position: 'relative' }}>
          <Reveal style={{ marginBottom: 34, maxWidth: 640 }}>
            <span className="nx-tag" style={{ color: 'var(--volt)' }}>
              09 / CONTACT
            </span>
            <h2
              style={{
                marginTop: 18,
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 'clamp(28px,4vw,48px)',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: 'var(--titanium)',
              }}
            >
              {t.contactTitle}
            </h2>
          </Reveal>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(228px,1fr))',
              gap: 0,
              borderTop: '1px solid rgba(244,245,246,.18)',
              borderLeft: '1px solid rgba(244,245,246,.18)',
            }}
          >
            {contacts.map((c, i) => (
              <Reveal
                key={i}
                delay={i * 50}
                style={{
                  padding: '20px 22px 22px',
                  borderRight: '1px solid rgba(244,245,246,.18)',
                  borderBottom: '1px solid rgba(244,245,246,.18)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span
                    style={{ width: 7, height: 7, borderRadius: '50%', background: c.color }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      fontSize: 14,
                      color: 'var(--titanium)',
                    }}
                  >
                    {c.center}
                  </span>
                </div>
                <div style={{ fontSize: 13.5, color: 'rgba(244,245,246,.7)', marginBottom: 8 }}>
                  {c.person}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12.5,
                    color: 'var(--volt)',
                  }}
                >
                  <span style={{ display: 'block', width: 13, height: 13 }}>
                    <Icon name="phone" />
                  </span>
                  {c.ext}
                </div>
              </Reveal>
            ))}
          </div>

          <NxColophon />
        </div>
      </ZCard>
    </>
  );
}

/**
 * The engineered overlay card: the department's own statement, framed by
 * crosshairs and a telemetry read-out, after Nexus card 2. The template puts a
 * macro photograph behind it; here the hero image serves, dimmed to carbon so
 * the read-out stays legible over it.
 */
function DeptMacroCard() {
  const { t, isZh } = useSite();
  const kpis = deptKpis(isZh ? 'zh' : 'en');

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <HeroImage
        slug="hero"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'grayscale(0.7) contrast(1.05)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom,rgba(13,14,21,.62),rgba(13,14,21,.38) 40%,rgba(13,14,21,.86))',
        }}
      />
      <div className="nx-crosshair-v" style={{ left: '62%' }} aria-hidden="true" />
      <div className="nx-crosshair-h" style={{ top: '40%' }} aria-hidden="true" />
      <div className="nx-node" style={{ left: '62%', top: '40%' }} aria-hidden="true" />

      {/* Telemetry read-out, pinned to the node. */}
      <div
        style={{
          position: 'absolute',
          left: 'min(calc(62% + 28px), calc(100vw - 300px))',
          top: 'calc(40% + 28px)',
          width: 272,
          maxWidth: 'calc(100vw - 48px)',
          background: 'rgba(13,14,21,.84)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(217,224,228,.3)',
          padding: 18,
        }}
      >
        <p
          className="nx-tag"
          style={{ color: 'var(--volt)', marginBottom: 12, letterSpacing: '.24em' }}
        >
          {isZh ? '教學部 / 概況' : 'DEPT / TELEMETRY'}
        </p>
        {kpis.map((k) => (
          <div
            key={k.en}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              padding: '8px 0',
              borderBottom: '1px solid rgba(217,224,228,.15)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              color: 'var(--titanium)',
            }}
          >
            <span style={{ opacity: 0.72 }}>{k.label}</span>
            <span style={{ color: 'var(--volt-soft)' }}>
              {k.num}
              {k.suffix}
            </span>
          </div>
        ))}
      </div>

      {/* Caption, clear of the fixed HUD. */}
      <div
        style={{
          position: 'absolute',
          left: 'clamp(18px,4vw,40px)',
          right: 'clamp(18px,4vw,40px)',
          bottom: 'calc(var(--hud-h) + 32px)',
          maxWidth: 620,
          color: 'var(--titanium)',
        }}
      >
        <span
          className="nx-tag"
          style={{ display: 'block', marginBottom: 14, color: 'var(--volt-soft)' }}
        >
          {isZh ? '02 / 教學部的位置' : '02 / WHERE WE STAND'}
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 'clamp(26px,4vw,48px)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
          }}
        >
          {t.heroTitle2}
        </h2>
      </div>
    </div>
  );
}
