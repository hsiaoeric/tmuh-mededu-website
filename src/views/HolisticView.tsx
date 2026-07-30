import { useState } from 'react';
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
import { NxHero } from '@/components/common/NxHero';
import { NxCardHead } from '@/components/common/NxCardHead';
import { NxColophon } from '@/components/common/NxColophon';
import { ZCard } from '@/zdepth/ZCard';
import { scrollToId } from '@/utils/scroll';
import {
  HolisticSymposiumsSection,
  HolisticTrainingSection,
} from './holistic/HolisticOutcomesSection';
import { HolisticResearchSection } from './holistic/HolisticResearchSection';

const TEAL = 'var(--c-holistic)';

export function HolisticView() {
  const { t, isZh, lang, setView } = useSite();
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
  const aiTeam = HOLISTIC_AI_TEAM.map((p) => resolvePerson(p, 'var(--c-skills)', lang));
  const activeAlgee = ALGEE[algee];

  return (
    <>
      <ZCard id="top" label={isZh ? '01 / 全人照護' : '01 / HOLISTIC CARE'} center>
        <NxHero
          chip="HOLISTIC CARE & HUMAN FLOURISHING"
          title={t.hHeroTitle}
          sub={t.hHeroTag}
          hint={isZh ? '向下捲動' : 'Scroll to descend'}
        >
          <div style={{ display: 'flex', gap: 10, marginTop: 30, flexWrap: 'wrap' }}>
            <button
              onClick={() => scrollToId('mhfa')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                padding: '13px 22px',
                border: 'none',
                cursor: 'pointer',
                background: 'var(--volt)',
                color: 'var(--volt-ink)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: 14.5,
              }}
            >
              {t.hCtaMhfa}
              <span style={{ display: 'block', width: 16, height: 16 }}>
                <Icon name="arrow" />
              </span>
            </button>
            <button
              onClick={() => setView('dept')}
              style={{
                padding: '13px 22px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: 14.5,
              }}
            >
              {t.backDept}
            </button>
          </div>
        </NxHero>
      </ZCard>

      <ZCard id="h-about" label={isZh ? '02 / 關於中心' : '02 / ABOUT'}>
        <div className="grid grid-split" style={{ gap: 46, alignItems: 'center' }}>
          <Reveal>
            <NxCardHead num="02" kicker="ABOUT US" title={t.hAboutTitle} />
            <p style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--body)' }}>{t.hAboutBody}</p>
          </Reveal>
          <Reveal delay={120} className="grid grid-split" style={{ gap: 14 }}>
            {kpis.map((k, i) => (
              <div
                key={i}
                style={{
                  padding: 22,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-card)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: k.color }} />
                {k.isStatic ? (
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 42, color: 'var(--text)' }}>
                    {k.display}
                  </span>
                ) : (
                  <span
                    data-count={k.num}
                    data-suffix=""
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 700,
                      fontSize: 42,
                      color: 'var(--text)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    0
                  </span>
                )}
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13.5, color: 'var(--body)', marginTop: 6 }}>
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
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <span
                style={{
                  width: 42,
                  height: 42,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border)',
                  color: 'var(--teal)',
                  marginBottom: 16,
                }}
              >
                <Icon name={f.iconId as IconName} />
              </span>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 17.5, color: 'var(--text)', marginBottom: 8 }}>
                {f.title}
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--muted)' }}>{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </ZCard>

      <ZCard id="h-members" label={isZh ? '03 / 中心成員' : '03 / MEMBERS'}>
        <NxCardHead
          num="03"
          kicker="CENTER MEMBERS"
          title={isZh ? '中心成員' : 'Center Members'}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(228px,1fr))', gap: 16, maxWidth: 760 }}>
          {members.map((p, i) => (
            <PersonCard key={i} person={p} profileColor={p.accent} />
          ))}
        </div>
      </ZCard>

      <ZCard label={isZh ? '04 / 全人研討會' : '04 / SYMPOSIA'}>
        <HolisticSymposiumsSection />
      </ZCard>

      <ZCard label={isZh ? '05 / 師培課程' : '05 / FACULTY TRAINING'}>
        <HolisticTrainingSection />
      </ZCard>

      <ZCard label={isZh ? '06 / 研究成果' : '06 / RESEARCH'}>
        <HolisticResearchSection />
      </ZCard>

      <ZCard id="mhfa" label={isZh ? '07 / 心理健康急救' : '07 / MHFA'}>
        <NxCardHead
          num="07"
          kicker="MENTAL HEALTH FIRST AID"
          title={t.mhfaTitle}
          desc={t.mhfaIntro}
        />
        <div
          className="grid grid-rail"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
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
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 26, color: on ? 'var(--teal)' : 'var(--muted)' }}>
                    {a.letter}
                  </span>
                  <span style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, background: on ? 'var(--volt)' : 'transparent' }} />
                </button>
              );
            })}
          </div>
          <div style={{ padding: '38px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <span
                style={{
                  width: 50,
                  height: 50,
                  background: 'var(--volt)',
                  color: 'var(--volt-ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 24,
                }}
              >
                {activeAlgee.letter}
              </span>
              <div>
                <div className="nx-tag" style={{ color: 'var(--teal)' }}>
                  STEP {algee + 1} / 5
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 23, color: 'var(--text)' }}>
                  {isZh ? activeAlgee.zh[0] : activeAlgee.en[0]}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 16.5, lineHeight: 1.85, color: 'var(--body)' }}>
              {isZh ? activeAlgee.zh[1] : activeAlgee.en[1]}
            </p>
            <div style={{ display: 'flex', gap: 4, marginTop: 26 }}>
              {ALGEE.map((_, i) => (
                <span
                  key={i}
                  style={{ height: 3, flex: 1, background: i <= algee ? 'var(--volt)' : 'var(--border)', transition: 'background .25s' }}
                />
              ))}
            </div>
          </div>
        </div>
      </ZCard>

      <ZCard id="seed" label={isZh ? '08 / 指導員與種子教師' : '08 / INSTRUCTORS & SEED'}>
        <NxCardHead num="08" kicker="INSTRUCTORS" title={t.instructorsTitle} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(216px,1fr))', gap: 16, marginBottom: 44 }}>
          {instructors.map((p, i) => (
            <PersonCard key={i} person={p} />
          ))}
        </div>
        <Reveal style={{ marginBottom: 22, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <Eyebrow>Seed Teachers</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 26, color: 'var(--text)' }}>{t.seedTitle}</h2>
          <p style={{ fontSize: 15, color: 'var(--muted)', marginTop: 8 }}>{t.seedDesc}</p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
          {seed.map((p, i) => (
            <PersonCard key={i} person={p} />
          ))}
        </div>
      </ZCard>

      <ZCard id="scope2" label={isZh ? '09 / 健康台灣範疇二' : '09 / HEALTHY TAIWAN'}>
        <Reveal
          style={{
            position: 'relative',
            padding: '36px 34px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '2px solid var(--volt)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: 'var(--volt-wash)',
              border: '1px solid var(--volt-line)',
              marginBottom: 18,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--volt)', animation: 'blink 1.8s ease-in-out infinite' }} />
            <span className="nx-tag" style={{ color: 'var(--teal)' }}>
              HEALTHY TAIWAN / SCOPE 2
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 'clamp(24px,3vw,34px)', letterSpacing: '-0.025em', color: 'var(--text)', maxWidth: 780, lineHeight: 1.24, marginBottom: 14 }}>
            {t.aiTitle}
          </h2>
          <p style={{ fontSize: 15.5, lineHeight: 1.8, color: 'var(--body)', maxWidth: 820 }}>{t.aiBody}</p>

          <div style={{ marginTop: 30, padding: 28, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 8 }}>{ai.title}</h3>
            <p style={{ fontSize: 14.5, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 860, marginBottom: 22 }}>{ai.body}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
              {ai.flow.map((s, i) => (
                <div key={i} style={{ position: 'relative', padding: '18px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: s.color }} />
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: s.color, marginBottom: 6 }}>{s.role}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--muted)' }}>{s.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginTop: 18 }}>
            {ai.steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 13, padding: '18px 16px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <span style={{ flexShrink: 0, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 22, color: 'var(--teal)', fontVariantNumeric: 'tabular-nums' }}>{s.n}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14.5, color: 'var(--text)', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--muted)' }}>{s.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, padding: '24px 26px', background: 'color-mix(in srgb,var(--teal) 8%,var(--surface))', border: '1px solid color-mix(in srgb,var(--teal) 22%,var(--border))' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 14 }}>{ai.problemsTitle}</div>
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

          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: '28px 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 5, height: 20, background: 'var(--c-skills)' }} />
            {ai.teamLabel}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(216px,1fr))', gap: 16 }}>
            {aiTeam.map((p, i) => (
              <PersonCard key={i} person={p} />
            ))}
          </div>
        </Reveal>
      </ZCard>

      <ZCard id="h-news" label={isZh ? '10 / 最新公告' : '10 / ANNOUNCEMENTS'}>
        <NxCardHead
          num="10"
          kicker="ANNOUNCEMENTS"
          title={isZh ? '最新公告' : 'Latest News'}
          meta={`${isZh ? '最後更新' : 'UPDATED'} ${latestUpdate(lang)}`}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {announcements.map((a, i) => (
            <Reveal
              key={i}
              delay={a.delay}
              className="grid grid-statcard"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
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
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: a.statFont, lineHeight: 1.05, color: 'var(--teal-700)', fontVariantNumeric: 'tabular-nums' }}>{a.statTop}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--muted)' }}>{a.statTopLabel}</div>
                {a.statBot && (
                  <>
                    <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 26, lineHeight: 1.1, color: 'var(--teal)', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{a.statBot}</div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--muted)' }}>{a.statBotLabel}</div>
                  </>
                )}
              </div>
              <div style={{ padding: '22px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', padding: '3px 13px', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: a.tagColor, background: a.tagBg }}>{a.tag}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--muted)' }}>{a.date}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 19, color: 'var(--text)', marginBottom: 10 }}>{a.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {a.lines.map((ln, j) => (
                    <p key={j} style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--body)' }}>{ln}</p>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </ZCard>

      <ZCard id="h-activities" label={isZh ? '11 / 近期活動' : '11 / ACTIVITIES'}>
        <NxCardHead
          num="11"
          kicker="ACTIVITIES"
          title={isZh ? '近期活動' : 'Activities'}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 18 }}>
          {activities.map((a, i) => (
            <Reveal key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ padding: '22px 24px 18px' }}>
                <span style={{ display: 'inline-block', padding: '4px 13px', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--teal-700)', background: 'var(--teal-50)', marginBottom: 14 }}>{a.cat}</span>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 19, color: 'var(--text)', marginBottom: 16 }}>{a.title}</div>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', fontFamily: 'var(--font-sans)', fontSize: 13 }}>
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
      </ZCard>

      <ZCard
        id="h-contact"
        label={isZh ? '12 / 聯絡窗口' : '12 / CONTACT'}
        tone="dark"
        center
      >
        <div className="nx-grid-bg" aria-hidden="true" />
        <div className="nx-crosshair-v" style={{ left: '58%' }} aria-hidden="true" />
        <div className="nx-crosshair-h" style={{ top: '42%' }} aria-hidden="true" />
        <div className="nx-node" style={{ left: '58%', top: '42%' }} aria-hidden="true" />

        <div style={{ position: 'relative' }}>
          <Reveal style={{ marginBottom: 32, maxWidth: 640 }}>
            <span className="nx-tag" style={{ color: 'var(--volt)' }}>
              12 / CONTACT
            </span>
            <h2
              style={{
                marginTop: 18,
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 'clamp(26px,3.6vw,44px)',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: 'var(--titanium)',
              }}
            >
              {t.contactTitle}
            </h2>
          </Reveal>

          <Reveal className="grid grid-split" style={{ gap: 0, alignItems: 'stretch' }}>
            <div
              style={{
                padding: '26px 28px',
                border: '1px solid rgba(244,245,246,.18)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    flex: 'none',
                    border: '1px solid rgba(244,245,246,.3)',
                    color: 'var(--volt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="phone" />
                </span>
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--titanium)' }}>
                    {t.hContactPerson}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--volt-soft)' }}>
                    {formatPhoneExt('3760', lang)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    flex: 'none',
                    border: '1px solid rgba(244,245,246,.3)',
                    color: 'var(--volt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="pin" />
                </span>
                <div style={{ fontSize: 14, color: 'rgba(244,245,246,.78)' }}>{t.hContactPlace}</div>
              </div>
            </div>
            <div
              style={{
                padding: '26px 28px',
                border: '1px solid rgba(244,245,246,.18)',
                borderLeft: '2px solid var(--volt)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <span style={{ display: 'block', width: 28, height: 28, color: 'var(--volt)', marginBottom: 14 }}>
                <Icon name="heart" />
              </span>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  fontSize: 20,
                  lineHeight: 1.55,
                  letterSpacing: '-0.02em',
                  color: 'var(--titanium)',
                }}
              >
                {t.hContactQuote}
              </p>
            </div>
          </Reveal>

          <NxColophon />
        </div>
      </ZCard>
    </>
  );
}
