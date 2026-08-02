import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from '@/context/SiteContext';
import { centerById } from '@/data/centers';
import { resolvePerson } from '@/data/people';
import {
  ALGEE,
  HOLISTIC_AI_TEAM,
  HOLISTIC_INSTRUCTORS,
  HOLISTIC_SEED,
  buildAiEcosystem,
  holisticFeatures,
  holisticKpis,
} from '@/data/holistic';
import { buildActivities, buildAnnouncements, latestUpdate } from '@/data/news';
import { formatPhoneExt } from '@/utils/phone';
import { Icon, type IconName } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { Eyebrow } from '@/components/common/Eyebrow';
import { PersonCard } from '@/components/common/PersonCard';
import { HeroImage } from '@/components/common/HeroImage';
import { HolisticOutcomesSection } from './holistic/HolisticOutcomesSection';
import { HolisticResearchSection } from './holistic/HolisticResearchSection';
import { HolisticDetailView } from './holistic/HolisticDetailView';

const TEAL = '#4f8c7d';

export function HolisticView() {
  const { t, isZh, lang, setView } = useSite();
  const location = useLocation();
  const [algee, setAlgee] = useState(0);

  const kpis = holisticKpis(lang);
  const features = holisticFeatures(lang);
  const ai = buildAiEcosystem(lang);
  const announcements = buildAnnouncements(lang);
  const activities = buildActivities(lang);
  const members = (centerById('holistic')?.people ?? []).map((p) =>
    resolvePerson(p, TEAL, lang),
  );
  const instructors = HOLISTIC_INSTRUCTORS.map((p) => resolvePerson(p, TEAL, lang));
  const seed = HOLISTIC_SEED.map((p) => resolvePerson(p, TEAL, lang));
  const aiTeam = HOLISTIC_AI_TEAM.map((p) => resolvePerson(p, '#5E7A8C', lang));
  const activeAlgee = ALGEE[algee];
  const detailMatch = location.pathname.match(/^\/holistic\/(symposia|research)\/(\d{4})\/?$/);

  if (detailMatch) {
    return (
      <HolisticDetailView
        kind={detailMatch[1] as 'symposia' | 'research'}
        year={Number(detailMatch[2])}
      />
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* HERO */}
      <section id="top" style={{ maxWidth: 1240, margin: '0 auto', padding: '46px 28px 24px' }}>
        <Reveal
          style={{
            position: 'relative',
            borderRadius: 26,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lift)',
            minHeight: 'clamp(380px,46vw,500px)',
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(120deg,#1c342c,#2c4b3f)',
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
                'linear-gradient(110deg,rgba(28,52,44,.92),rgba(28,52,44,.5) 55%,rgba(28,52,44,.12))',
            }}
          />
          <div style={{ position: 'relative', padding: 'clamp(34px,5vw,70px)', maxWidth: 720 }}>
            <div
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: '#bfe9dc',
                marginBottom: 18,
              }}
            >
              Center for Education in Holistic Care and Human Flourishing
            </div>
            <h1
              style={{
                fontFamily: "'Noto Serif TC', serif",
                fontWeight: 900,
                fontSize: 'clamp(38px,5vw,62px)',
                lineHeight: 1.14,
                color: '#fff',
                textShadow: '0 3px 24px rgba(0,0,0,.4)',
              }}
            >
              {t.hHeroTitle}
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.85, color: '#e6f3ee', maxWidth: 560, marginTop: 22 }}>
              {t.hHeroTag}
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 30, flexWrap: 'wrap' }}>
              <button
                onClick={() => document.getElementById('mhfa')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '13px 24px',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  background: '#fff',
                  color: 'var(--teal-700)',
                  fontFamily: "'Noto Sans TC', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {t.hCtaMhfa}
                <span style={{ display: 'block', width: 17, height: 17 }}>
                  <Icon name="arrow" />
                </span>
              </button>
              <button
                onClick={() => setView('dept')}
                style={{
                  padding: '13px 24px',
                  border: '1px solid rgba(255,255,255,.5)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,.08)',
                  color: '#fff',
                  fontFamily: "'Noto Sans TC', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {t.backDept}
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* AI ECOSYSTEM — the first content section after the hero. */}
      <section id="scope2" style={{ maxWidth: 1240, margin: '0 auto', padding: '30px 28px 50px' }}>
        <Reveal
          style={{
            position: 'relative',
            borderRadius: 22,
            overflow: 'hidden',
            padding: '42px 40px',
            background: 'linear-gradient(135deg,color-mix(in srgb,var(--teal) 22%,var(--surface)),var(--surface))',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              background: 'var(--surface)',
              border: '1px solid color-mix(in srgb,var(--teal) 30%,transparent)',
              marginBottom: 16,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', animation: 'blink 1.8s ease-in-out infinite' }} />
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--teal-700)' }}>
              Healthy Taiwan Deep Cultivation · Scope 2
            </span>
          </div>
          <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 28, color: 'var(--text)', maxWidth: 760, lineHeight: 1.35, marginBottom: 14 }}>
            {t.aiTitle}
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--body)', maxWidth: 820 }}>{t.aiBody}</p>

          <div style={{ marginTop: 30, padding: 28, borderRadius: 18, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 8 }}>{ai.title}</h3>
            <p style={{ fontSize: 14.5, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 860, marginBottom: 22 }}>{ai.body}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
              {ai.flow.map((s, i) => (
                <div key={i} style={{ position: 'relative', padding: '18px 16px', borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: s.color, borderRadius: '14px 14px 0 0' }} />
                  <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10.5, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: s.color, marginBottom: 6 }}>{s.role}</div>
                  <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--muted)' }}>{s.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginTop: 18 }}>
            {ai.steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 13, padding: '18px 16px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <span style={{ flexShrink: 0, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 22, color: 'var(--teal)', fontVariantNumeric: 'tabular-nums' }}>{s.n}</span>
                <div>
                  <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 700, fontSize: 14.5, color: 'var(--text)', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--muted)' }}>{s.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, padding: '24px 26px', borderRadius: 16, background: 'color-mix(in srgb,var(--teal) 8%,var(--surface))', border: '1px solid color-mix(in srgb,var(--teal) 22%,var(--border))' }}>
            <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 14 }}>{ai.problemsTitle}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {ai.problems.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                  <span style={{ flexShrink: 0, width: 20, height: 20, marginTop: 2, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, display: 'block' }}>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--body)' }}>{p}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: '28px 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 5, height: 20, borderRadius: 9, background: '#5E7A8C' }} />
            {ai.teamLabel}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(216px,1fr))', gap: 16 }}>
            {aiTeam.map((p, i) => (
              <PersonCard key={i} person={p} />
            ))}
          </div>
        </Reveal>
      </section>

      {/* ABOUT + KPI */}
      <section id="h-about" style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 28px' }}>
        <div className="grid grid-split" style={{ gap: 46, alignItems: 'center' }}>
          <Reveal>
            <Eyebrow>About Us</Eyebrow>
            <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', marginBottom: 18 }}>
              {t.hAboutTitle}
            </h2>
            <p style={{ fontSize: 16.5, lineHeight: 1.9, color: 'var(--body)' }}>{t.hAboutBody}</p>
          </Reveal>
          <Reveal delay={120} className="grid grid-split" style={{ gap: 14 }}>
            {kpis.map((k, i) => (
              <div
                key={i}
                style={{
                  padding: 22,
                  borderRadius: 16,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-card)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: k.color }} />
                {k.isStatic ? (
                  <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 42, color: 'var(--text)' }}>
                    {k.display}
                  </span>
                ) : (
                  <span
                    data-count={k.num}
                    data-suffix=""
                    style={{
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 42,
                      color: 'var(--text)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    0
                  </span>
                )}
                <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 600, fontSize: 13.5, color: 'var(--body)', marginTop: 6 }}>
                  {k.label}
                </div>
                {k.subtitle && (
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{k.subtitle}</div>
                )}
              </div>
            ))}
          </Reveal>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(248px,1fr))',
            gap: 18,
            marginTop: 36,
          }}
        >
          {features.map((f, i) => (
            <Reveal
              key={i}
              delay={f.delay}
              style={{
                padding: '28px 24px',
                borderRadius: 18,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(140deg,var(--teal),var(--teal-700))',
                  color: '#fff',
                  marginBottom: 16,
                }}
              >
                <Icon name={f.iconId as IconName} />
              </span>
              <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>
                {f.title}
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--muted)' }}>{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MEMBERS */}
      <section id="h-members" style={{ maxWidth: 1240, margin: '0 auto', padding: '6px 28px 24px' }}>
        <Reveal
          style={{
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: 'var(--text)',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ width: 5, height: 24, borderRadius: 3, background: 'var(--teal)' }} />
          {isZh ? '中心成員' : 'Center Members'}
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(228px,1fr))', gap: 16, maxWidth: 760 }}>
          {members.map((p, i) => (
            <PersonCard key={i} person={p} profileColor={p.accent} />
          ))}
        </div>
      </section>

      {/* MHFA / ALGEE */}
      <section id="mhfa" style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 28px' }}>
        <Reveal style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 30px' }}>
          <Eyebrow>Mental Health First Aid</Eyebrow>
          <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 34, color: 'var(--text)' }}>
            {t.mhfaTitle}
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--muted)', marginTop: 12 }}>{t.mhfaIntro}</p>
        </Reveal>
        <div
          className="grid grid-rail"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface-2)', borderRight: '1px solid var(--border)' }}>
            {ALGEE.map((a, i) => {
              const on = i === algee;
              return (
                <button
                  key={i}
                  onClick={() => setAlgee(i)}
                  style={{
                    position: 'relative',
                    flex: 1,
                    minHeight: 76,
                    border: 'none',
                    cursor: 'pointer',
                    background: on ? 'var(--surface)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background .25s',
                  }}
                >
                  <span style={{ fontFamily: "'Noto Serif TC', serif", fontWeight: 900, fontSize: 30, color: on ? 'var(--teal)' : 'var(--muted)' }}>
                    {a.letter}
                  </span>
                  <span style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 3, background: on ? 'var(--teal)' : 'transparent' }} />
                </button>
              );
            })}
          </div>
          <div style={{ padding: '38px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <span
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  background: 'linear-gradient(140deg,var(--teal),var(--teal-700))',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Noto Serif TC', serif",
                  fontWeight: 900,
                  fontSize: 28,
                }}
              >
                {activeAlgee.letter}
              </span>
              <div>
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--teal)', fontWeight: 600 }}>
                  Step {algee + 1} / 5
                </div>
                <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 25, color: 'var(--text)' }}>
                  {isZh ? activeAlgee.zh[0] : activeAlgee.en[0]}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 17, lineHeight: 1.9, color: 'var(--body)' }}>
              {isZh ? activeAlgee.zh[1] : activeAlgee.en[1]}
            </p>
            <div style={{ display: 'flex', gap: 6, marginTop: 26 }}>
              {ALGEE.map((_, i) => (
                <span
                  key={i}
                  style={{ height: 5, flex: 1, borderRadius: 9, background: i <= algee ? 'var(--teal)' : 'var(--border)', transition: 'background .25s' }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INSTRUCTORS + SEED */}
      <section id="seed" style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 28px' }}>
        <Reveal style={{ marginBottom: 22 }}>
          <Eyebrow>Instructors</Eyebrow>
          <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 28, color: 'var(--text)' }}>{t.instructorsTitle}</h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(216px,1fr))', gap: 16, marginBottom: 44 }}>
          {instructors.map((p, i) => (
            <PersonCard key={i} person={p} />
          ))}
        </div>
        <Reveal style={{ marginBottom: 22 }}>
          <Eyebrow>Seed Teachers</Eyebrow>
          <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 28, color: 'var(--text)' }}>{t.seedTitle}</h2>
          <p style={{ fontSize: 15.5, color: 'var(--muted)', marginTop: 8 }}>{t.seedDesc}</p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
          {seed.map((p, i) => (
            <PersonCard key={i} person={p} />
          ))}
        </div>
      </section>

      <HolisticOutcomesSection />

      {/* ANNOUNCEMENTS */}
      <section id="h-news" style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 28px' }}>
        <Reveal style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <Eyebrow>Announcements</Eyebrow>
            <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)' }}>{isZh ? '最新公告' : 'Latest News'}</h2>
          </div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, color: 'var(--muted)' }}>
            {isZh ? '最後更新' : 'Last updated'} · {latestUpdate(lang)}
          </div>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {announcements.map((a, i) => (
            <Reveal
              key={i}
              delay={a.delay}
              className="grid grid-statcard"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '24px 14px',
                  background: 'color-mix(in srgb,var(--teal) 8%,var(--surface-2))',
                  borderRight: '1px solid var(--border)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: a.statFont, lineHeight: 1.05, color: 'var(--teal-700)', fontVariantNumeric: 'tabular-nums' }}>{a.statTop}</div>
                <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontSize: 11.5, color: 'var(--muted)' }}>{a.statTopLabel}</div>
                {a.statBot && (
                  <>
                    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 26, lineHeight: 1.1, color: 'var(--teal)', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{a.statBot}</div>
                    <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontSize: 11.5, color: 'var(--muted)' }}>{a.statBotLabel}</div>
                  </>
                )}
              </div>
              <div style={{ padding: '22px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', padding: '3px 13px', borderRadius: 999, fontFamily: "'Noto Sans TC', sans-serif", fontSize: 12, fontWeight: 600, color: a.tagColor, background: a.tagBg }}>{a.tag}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: 'var(--muted)' }}>{a.date}</span>
                </div>
                <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 800, fontSize: 19, color: 'var(--text)', marginBottom: 10 }}>{a.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {a.lines.map((ln, j) => (
                    <p key={j} style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--body)' }}>{ln}</p>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ACTIVITIES */}
      <section id="h-activities" style={{ maxWidth: 1240, margin: '0 auto', padding: '20px 28px 40px' }}>
        <Reveal style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
          <div>
            <Eyebrow>Activities</Eyebrow>
            <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)' }}>{isZh ? '近期活動' : 'Activities'}</h2>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 18 }}>
          {activities.map((a, i) => (
            <Reveal key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ padding: '22px 24px 18px' }}>
                <span style={{ display: 'inline-block', padding: '4px 13px', borderRadius: 999, fontFamily: "'Noto Sans TC', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--teal-700)', background: 'var(--teal-50)', marginBottom: 14 }}>{a.cat}</span>
                <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 800, fontSize: 19, color: 'var(--text)', marginBottom: 16 }}>{a.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'var(--body)' }}>
                  {([['calendar', a.date], ['pin', a.place], ['brain', a.speaker], ['chart', a.topic]] as const).map(([icon, text], j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ width: 17, height: 17, marginTop: 1, color: 'var(--teal)', flexShrink: 0 }}>
                        <Icon name={icon as IconName} />
                      </span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', fontFamily: "'Noto Sans TC', sans-serif", fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>{a.enrolled}</span>
                {a.link ? (
                  <a href={a.link} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--teal-700)', fontWeight: 600, textDecoration: 'none' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)', animation: 'blink 1.8s ease-in-out infinite' }} />
                    {a.status}
                    <span style={{ width: 12, height: 12, display: 'block' }}>
                      <Icon name="arrow" />
                    </span>
                  </a>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--teal-700)', fontWeight: 600 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)', animation: 'blink 1.8s ease-in-out infinite' }} />
                    {a.status}
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <HolisticResearchSection />

      {/* CONTACT */}
      <section id="h-contact" style={{ maxWidth: 1240, margin: '0 auto', padding: '10px 28px 60px' }}>
        <Reveal className="grid grid-split" style={{ gap: 22, alignItems: 'stretch' }}>
          <div style={{ padding: 30, borderRadius: 18, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <Eyebrow>Contact</Eyebrow>
            <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 26, color: 'var(--text)', marginBottom: 18 }}>{t.contactTitle}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--teal-50)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="phone" />
                </span>
                <div>
                  <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 600, fontSize: 14.5, color: 'var(--text)' }}>{t.hContactPerson}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: 'var(--muted)' }}>{formatPhoneExt('3760', lang)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--teal-50)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="pin" />
                </span>
                <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontSize: 14.5, color: 'var(--body)' }}>{t.hContactPlace}</div>
              </div>
            </div>
          </div>
          <div style={{ padding: 30, borderRadius: 18, background: 'linear-gradient(140deg,var(--teal),var(--teal-700))', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ display: 'block', width: 34, height: 34, color: 'rgba(255,255,255,.9)', marginBottom: 14 }}>
              <Icon name="heart" />
            </span>
            <p style={{ fontFamily: "'Noto Serif TC', serif", fontWeight: 700, fontSize: 22, lineHeight: 1.6 }}>{t.hContactQuote}</p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
