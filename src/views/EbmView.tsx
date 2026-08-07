import { useSite } from '@/context/SiteContext';
import { centerById } from '@/data/centers';
import { resolvePerson } from '@/data/people';
import { buildEbm } from '@/data/ebm';
import { Icon, type IconName } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { Eyebrow } from '@/components/common/Eyebrow';
import { PersonCard } from '@/components/common/PersonCard';
import { DeepContact } from '@/components/common/DeepContact';

function EbmHeroArt() {
  return (
    <svg viewBox="0 0 440 360" role="img" aria-label="Evidence-based medicine" style={{ width: '100%', maxWidth: 440, height: 'auto', display: 'block' }}>
      <circle cx="60" cy="60" r="5" fill="var(--ill-gold)" opacity=".7" />
      <circle cx="402" cy="96" r="6" fill="var(--ill-cool)" opacity=".6" />
      <circle cx="386" cy="44" r="4" fill="var(--ill-sage)" opacity=".7" />
      <path d="M44 120 l0 16 M36 128 l16 0" stroke="var(--ill-gold)" strokeWidth="3" strokeLinecap="round" opacity=".6" />
      <path d="M414 250 l0 14 M407 257 l14 0" stroke="var(--ill-cool)" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      <g transform="rotate(-8 150 150)">
        <rect x="96" y="78" width="150" height="190" rx="10" fill="var(--ill-paper-2)" />
        <rect x="116" y="104" width="92" height="7" rx="3.5" fill="var(--ill-fill)" />
        <rect x="116" y="122" width="110" height="6" rx="3" fill="var(--ill-line)" />
        <rect x="116" y="138" width="78" height="6" rx="3" fill="var(--ill-line)" />
        <rect x="116" y="154" width="104" height="6" rx="3" fill="var(--ill-line)" />
      </g>
      <g transform="rotate(4 270 170)">
        <rect x="170" y="74" width="214" height="196" rx="16" fill="var(--ill-paper)" />
        <rect x="170" y="74" width="214" height="40" rx="16" fill="var(--ill-gold)" />
        <rect x="170" y="98" width="214" height="16" fill="var(--ill-gold)" />
        <circle cx="192" cy="94" r="5" fill="var(--ill-paper)" opacity=".85" />
        <circle cx="210" cy="94" r="5" fill="var(--ill-paper)" opacity=".5" />
        <rect x="320" y="89" width="48" height="10" rx="5" fill="var(--ill-paper)" opacity=".4" />
        <rect x="196" y="206" width="22" height="40" rx="4" fill="var(--ill-cool)" />
        <rect x="228" y="184" width="22" height="62" rx="4" fill="var(--ill-cool-deep)" />
        <rect x="260" y="196" width="22" height="50" rx="4" fill="var(--ill-sage)" />
        <rect x="292" y="168" width="22" height="78" rx="4" fill="var(--ill-gold)" />
        <rect x="324" y="150" width="22" height="96" rx="4" fill="var(--ill-gold)" />
        <path d="M207 200 L239 176 L271 188 L303 158 L335 140" fill="none" stroke="var(--ill-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
        <circle cx="207" cy="200" r="4" fill="var(--ill-ink)" opacity=".7" />
        <circle cx="335" cy="140" r="4" fill="var(--ill-ink)" opacity=".7" />
        <line x1="190" y1="250" x2="356" y2="250" stroke="var(--ill-line)" strokeWidth="2" />
      </g>
      <g>
        <circle cx="322" cy="232" r="40" fill="var(--ill-cool-deep)" opacity=".14" />
        <circle cx="322" cy="232" r="40" fill="none" stroke="var(--ill-gold)" strokeWidth="9" />
        <line x1="352" y1="262" x2="384" y2="296" stroke="var(--ill-gold)" strokeWidth="13" strokeLinecap="round" />
      </g>
      <g>
        <rect x="44" y="300" width="150" height="24" rx="5" fill="var(--ill-cool-deep)" />
        <rect x="58" y="300" width="8" height="24" fill="var(--ill-cool-deep)" />
        <rect x="52" y="278" width="142" height="24" rx="5" fill="var(--ill-sage)" />
        <rect x="66" y="278" width="8" height="24" fill="var(--ill-sage)" />
        <rect x="46" y="256" width="148" height="24" rx="5" fill="var(--ill-gold)" />
        <rect x="60" y="256" width="8" height="24" fill="var(--ill-gold)" />
      </g>
    </svg>
  );
}

export function EbmView() {
  const { lang, t } = useSite();
  const ebm = buildEbm(lang);
  const { gold, blue, ink, goldSoft } = ebm.colors;
  const members = (centerById('ebm')?.people ?? []).map((p) => resolvePerson(p, gold, lang));

  const awardColumns = [
    { title: ebm.awardsLitTitle, icon: 'chart' as IconName, tone: gold, items: ebm.awardsLit },
    { title: ebm.awardsClinTitle, icon: 'skills' as IconName, tone: blue, items: ebm.awardsClin },
    { title: ebm.awardsTransTitle, icon: 'research' as IconName, tone: 'var(--tone-slate)', items: ebm.awardsTrans },
  ];

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* HERO */}
      <section id="top" style={{ maxWidth: 1240, margin: '0 auto', padding: '46px 28px 26px' }}>
        <Reveal
          style={{
            position: 'relative',
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--e-2)',
            background: `linear-gradient(135deg,${ink},var(--ebm-ink-2))`,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 18% 22%,rgba(176,137,75,.22),transparent 42%),radial-gradient(circle at 88% 78%,rgba(94,122,140,.28),transparent 46%)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${gold},${goldSoft} 50%,${blue})` }} />
          <div style={{ position: 'relative', padding: 'clamp(34px,5vw,66px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 36, alignItems: 'center' }}>
              <div>
                <Eyebrow color={goldSoft} style={{ marginBottom: 18 }}>{ebm.eyebrow}</Eyebrow>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(34px,4.6vw,56px)', lineHeight: 1.16, color: 'var(--on-ink)', textShadow: '0 3px 24px rgba(0,0,0,.35)' }}>{ebm.heroTitle}</h1>
                <p style={{ fontSize: 16.5, lineHeight: 1.85, color: 'var(--on-ink-dim)', maxWidth: 560, marginTop: 22 }}>{ebm.heroTag}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <EbmHeroArt />
              </div>
            </div>
            <div className="grid grid-4" style={{ gap: 14, marginTop: 30 }}>
              {ebm.kpis.map((k, i) => (
                <Reveal key={i} delay={k.delay} style={{ padding: '16px 14px', borderRadius: 'var(--r-lg)', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 34, color: 'var(--on-ink)' }}>
                    <span data-count={k.num} data-suffix={k.suffix}>0</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--on-ink-dim)', marginTop: 4, lineHeight: 1.4 }}>{k.label}</div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ABOUT + KPI list */}
      <section id="ebm-about" style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 28px 16px' }}>
        <Reveal className="grid grid-sidebar" style={{ gap: 40, alignItems: 'center' }}>
          <div>
            <Eyebrow color={gold} style={{ marginBottom: 10 }}>{ebm.aboutEyebrow}</Eyebrow>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3vw,34px)', color: 'var(--text)', lineHeight: 1.3, marginBottom: 18 }}>{ebm.aboutTitle}</h2>
            <p style={{ fontSize: 16, lineHeight: 1.9, color: 'var(--body)', borderLeft: `3px solid ${gold}`, paddingLeft: 18, marginBottom: 16 }}>{ebm.aboutBody}</p>
            <p style={{ fontSize: 15, lineHeight: 1.85, color: 'var(--muted)' }}>{ebm.aboutBody2}</p>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {ebm.kpis.map((k, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 'var(--r-lg)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--e-1)' }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 30, color: k.color, minWidth: 64 }}>{k.num}{k.suffix}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14.5, color: 'var(--body)' }}>{k.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* MEMBERS */}
      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '30px 28px 14px' }}>
        <Reveal style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 5, height: 22, borderRadius: 'var(--r-xs)', background: gold }} />
          {ebm.membersTitle}
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(228px,1fr))', gap: 16, maxWidth: 760 }}>
          {members.map((p, i) => (
            <PersonCard key={i} person={p} profileColor={p.accent} />
          ))}
        </div>
      </section>

      {/* MISSIONS */}
      <section id="ebm-missions" style={{ maxWidth: 1240, margin: '0 auto', padding: '38px 28px 18px' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 30 }}>
          <Eyebrow color={gold}>{ebm.missionsEyebrow}</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3vw,34px)', color: 'var(--text)' }}>{ebm.missionsTitle}</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 640, margin: '12px auto 0' }}>{ebm.missionsDesc}</p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
          {ebm.missions.map((m, i) => (
            <Reveal key={i} style={{ position: 'relative', padding: '26px 24px', borderRadius: 'var(--r-lg)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--e-1)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, bottom: 0, background: gold }} />
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 40, color: `color-mix(in srgb,${gold} 32%,transparent)`, lineHeight: 1 }}>{m.tag}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text)', margin: '12px 0 10px', lineHeight: 1.4 }}>{m.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--body)' }}>{m.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* AWARDS */}
      <section id="ebm-awards" style={{ maxWidth: 1240, margin: '0 auto', padding: '38px 28px 18px' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 30 }}>
          <Eyebrow color={gold}>{ebm.awardsEyebrow}</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3vw,34px)', color: 'var(--text)' }}>{ebm.awardsTitle}</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 680, margin: '12px auto 0' }}>{ebm.awardsDesc}</p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 22 }}>
          {awardColumns.map((col, ci) => (
            <Reveal key={ci} delay={ci * 90} style={{ padding: 26, borderRadius: 'var(--r-lg)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--e-1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <span style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', background: `color-mix(in srgb,${col.tone} 16%,transparent)`, color: col.tone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 19, height: 19 }}>
                    <Icon name={col.icon} />
                  </span>
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>{col.title}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.items.map((a, i) => (
                  <div key={i} style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: `color-mix(in srgb,${a.tone} 7%,transparent)`, border: `1px solid color-mix(in srgb,${a.tone} 22%,transparent)` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{a.sess}</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: a.tone }} />
                        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5, color: a.tone }}>{a.award}</span>
                      </div>
                    </div>
                    {a.note && <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--muted)', marginTop: 7 }}>{a.note}</div>}
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* JOURNEY */}
      <section id="ebm-journey" style={{ maxWidth: 1240, margin: '0 auto', padding: '38px 28px 18px' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 30 }}>
          <Eyebrow color={gold}>{ebm.journeyEyebrow}</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3vw,34px)', color: 'var(--text)' }}>{ebm.journeyTitle}</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 680, margin: '12px auto 0' }}>{ebm.journeyDesc}</p>
        </Reveal>
        <div className="grid grid-3" style={{ gap: 18 }}>
          {ebm.stages.map((s, i) => (
            <Reveal key={i} style={{ borderRadius: 'var(--r-lg)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--e-1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '18px 22px', background: `linear-gradient(135deg,color-mix(in srgb,${s.color} 16%,var(--surface)),var(--surface))`, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: s.color }}>{s.phase}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 21, color: 'var(--text)', marginTop: 4 }}>{s.name}</div>
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
      </section>

      {/* COURSES */}
      <section id="ebm-courses" style={{ maxWidth: 1240, margin: '0 auto', padding: '38px 28px 18px' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 30 }}>
          <Eyebrow color={gold}>{ebm.coursesEyebrow}</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3vw,34px)', color: 'var(--text)' }}>{ebm.coursesTitle}</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 680, margin: '12px auto 0' }}>{ebm.coursesDesc}</p>
        </Reveal>
        <div className="grid grid-3" style={{ gap: 18 }}>
          {ebm.courseGroups.map((g, i) => (
            <Reveal key={i} style={{ borderRadius: 'var(--r-lg)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--e-1)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 11, borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: `color-mix(in srgb,${g.color} 14%,transparent)`, color: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 20, height: 20 }}>
                    <Icon name={g.gicon as IconName} />
                  </span>
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16.5, color: 'var(--text)' }}>{g.title}</h3>
              </div>
              <div style={{ padding: '8px 22px 18px' }}>
                {g.rows.map((row, j) => (
                  <div key={j} style={{ padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{row.name}</div>
                    <div style={{ fontSize: 12.5, color: g.color, marginTop: 4, fontWeight: 600 }}>{row.detail}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CLOSING + CONTACT */}
      <DeepContact
        id="ebm-contact"
        accent={gold}
        ink={ink}
        inkGradientEnd="var(--ebm-ink-2)"
        closingIcon="chart"
        closingIconColor={goldSoft}
        closingTitle={ebm.closingTitle}
        closingBody={ebm.closingBody}
        contactTitle={t.contactTitle}
        contactPerson={ebm.contactPerson}
        contactExt={ebm.contactExt}
        contactPlace={ebm.contactPlace}
        contactQuote={ebm.contactQuote}
      />
    </div>
  );
}
