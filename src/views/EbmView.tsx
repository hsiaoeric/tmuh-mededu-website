import { useSite } from '@/context/SiteContext';
import { centerById } from '@/data/centers';
import { resolvePerson } from '@/data/people';
import { buildEbm } from '@/data/ebm';
import { Icon, type IconName } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { PersonCard } from '@/components/common/PersonCard';
import { DeepContact } from '@/components/common/DeepContact';
import { NxHero } from '@/components/common/NxHero';
import { NxCardHead } from '@/components/common/NxCardHead';
import { NxBlueprint } from '@/components/common/NxBlueprint';
import { ZCard } from '@/zdepth/ZCard';

export function EbmView() {
  const { lang, t, isZh } = useSite();
  const ebm = buildEbm(lang);
  const { gold, blue } = ebm.colors;
  const members = (centerById('ebm')?.people ?? []).map((p) => resolvePerson(p, gold, lang));

  const awardColumns = [
    { title: ebm.awardsLitTitle, icon: 'chart' as IconName, tone: gold, items: ebm.awardsLit },
    { title: ebm.awardsClinTitle, icon: 'skills' as IconName, tone: blue, items: ebm.awardsClin },
    { title: ebm.awardsTransTitle, icon: 'research' as IconName, tone: 'var(--c-skills)', items: ebm.awardsTrans },
  ];

  return (
    <>
      <ZCard id="top" label={isZh ? '01 / 實證醫學中心' : '01 / EBM CENTER'} center>
        <NxHero
          chip={ebm.eyebrow}
          title={ebm.heroTitle}
          sub={ebm.heroTag}
          ornament={false}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))',
              gap: 40,
              alignItems: 'end',
              marginTop: 36,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(96px,1fr))',
                gap: 0,
                borderTop: '1px solid var(--border)',
                borderLeft: '1px solid var(--border)',
              }}
            >
              {ebm.kpis.map((k, i) => (
                <Reveal
                  key={i}
                  delay={k.delay}
                  style={{
                    padding: '14px 14px 16px',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: 28,
                      color: 'var(--text)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <span data-count={k.num} data-suffix={k.suffix}>
                      0
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>
                    {k.label}
                  </div>
                </Reveal>
              ))}
            </div>
            <NxBlueprint variant="evidence" label="FIG. 01 / EVIDENCE APPRAISAL" />
          </div>
        </NxHero>
      </ZCard>

      <ZCard id="ebm-about" label={isZh ? '02 / 中心簡介' : '02 / ABOUT'}>
        <NxCardHead num="02" kicker={ebm.aboutEyebrow} title={ebm.aboutTitle} />
        <Reveal className="grid grid-sidebar" style={{ gap: 40, alignItems: 'start' }}>
          <div>
            <p style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--body)', borderLeft: `2px solid ${gold}`, paddingLeft: 18, marginBottom: 16 }}>{ebm.aboutBody}</p>
            <p style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--muted)' }}>{ebm.aboutBody2}</p>
          </div>
          <div style={{ display: 'grid', gap: 0, borderTop: '1px solid var(--border)' }}>
            {ebm.kpis.map((k, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 4px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 26, color: k.color, minWidth: 64, fontVariantNumeric: 'tabular-nums' }}>{k.num}{k.suffix}</div>
                <div style={{ fontSize: 14, color: 'var(--body)' }}>{k.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </ZCard>

      <ZCard label={isZh ? '03 / 中心成員' : '03 / MEMBERS'}>
        <NxCardHead num="03" kicker="CENTER MEMBERS" title={ebm.membersTitle} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(228px,1fr))', gap: 16, maxWidth: 760 }}>
          {members.map((p, i) => (
            <PersonCard key={i} person={p} profileColor={p.accent} />
          ))}
        </div>
      </ZCard>

      <ZCard id="ebm-missions" label={isZh ? '04 / 四大核心任務' : '04 / CORE MISSIONS'}>
        <NxCardHead
          num="04"
          kicker={ebm.missionsEyebrow}
          title={ebm.missionsTitle}
          desc={ebm.missionsDesc}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
          {ebm.missions.map((m, i) => (
            <Reveal key={i} style={{ position: 'relative', padding: '26px 24px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, bottom: 0, background: gold }} />
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 40, color: `color-mix(in srgb,${gold} 32%,transparent)`, lineHeight: 1 }}>{m.tag}</div>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 18, color: 'var(--text)', margin: '12px 0 10px', lineHeight: 1.4 }}>{m.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--body)' }}>{m.desc}</p>
            </Reveal>
          ))}
        </div>
      </ZCard>

      <ZCard id="ebm-awards" label={isZh ? '05 / 競賽成就' : '05 / AWARDS'}>
        <NxCardHead
          num="05"
          kicker={ebm.awardsEyebrow}
          title={ebm.awardsTitle}
          desc={ebm.awardsDesc}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 22 }}>
          {awardColumns.map((col, ci) => (
            <Reveal key={ci} delay={ci * 90} style={{ padding: 26, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <span style={{ width: 34, height: 34, background: `color-mix(in srgb,${col.tone} 16%,transparent)`, color: col.tone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 19, height: 19 }}>
                    <Icon name={col.icon} />
                  </span>
                </span>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>{col.title}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.items.map((a, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: `color-mix(in srgb,${a.tone} 7%,transparent)`, border: `1px solid color-mix(in srgb,${a.tone} 22%,transparent)` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{a.sess}</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: a.tone }} />
                        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13.5, color: a.tone }}>{a.award}</span>
                      </div>
                    </div>
                    {a.note && <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--muted)', marginTop: 7 }}>{a.note}</div>}
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </ZCard>

      <ZCard id="ebm-journey" label={isZh ? '06 / 推動歷程' : '06 / JOURNEY'}>
        <NxCardHead
          num="06"
          kicker={ebm.journeyEyebrow}
          title={ebm.journeyTitle}
          desc={ebm.journeyDesc}
        />
        <div className="grid grid-3" style={{ gap: 18 }}>
          {ebm.stages.map((s, i) => (
            <Reveal key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '18px 22px', background: `linear-gradient(135deg,color-mix(in srgb,${s.color} 16%,var(--surface)),var(--surface))`, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: s.color }}>{s.phase}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 21, color: 'var(--text)', marginTop: 4 }}>{s.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{s.years}</div>
              </div>
              <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                {s.items.map((it, j) => (
                  <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, marginTop: 7, flex: 'none' }} />
                    <span style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--body)' }}>{it}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </ZCard>

      <ZCard id="ebm-courses" label={isZh ? '07 / 訓練課程' : '07 / COURSES'}>
        <NxCardHead
          num="07"
          kicker={ebm.coursesEyebrow}
          title={ebm.coursesTitle}
          desc={ebm.coursesDesc}
        />
        <div className="grid grid-3" style={{ gap: 18 }}>
          {ebm.courseGroups.map((g, i) => (
            <Reveal key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 11, borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 36, height: 36, background: `color-mix(in srgb,${g.color} 14%,transparent)`, color: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 20, height: 20 }}>
                    <Icon name={g.gicon as IconName} />
                  </span>
                </span>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16.5, color: 'var(--text)' }}>{g.title}</h3>
              </div>
              <div style={{ padding: '8px 22px 18px' }}>
                {g.rows.map((row, j) => (
                  <div key={j} style={{ padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{row.name}</div>
                    <div style={{ fontSize: 12.5, color: g.color, marginTop: 4, fontWeight: 600 }}>{row.detail}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </ZCard>

      <ZCard
        id="ebm-contact"
        label={isZh ? '08 / 聯絡窗口' : '08 / CONTACT'}
        tone="dark"
        center
      >
        <DeepContact
          num="08"
          accent={gold}
          closingIcon="chart"
          closingTitle={ebm.closingTitle}
          closingBody={ebm.closingBody}
          contactTitle={t.contactTitle}
          contactPerson={ebm.contactPerson}
          contactExt={ebm.contactExt}
          contactPlace={ebm.contactPlace}
          contactQuote={ebm.contactQuote}
        />
      </ZCard>
    </>
  );
}
