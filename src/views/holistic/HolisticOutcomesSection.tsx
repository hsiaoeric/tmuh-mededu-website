import { useSite } from '@/context/SiteContext';
import { buildHolisticOutcomes } from '@/data/holistic';
import { Reveal } from '@/components/common/Reveal';
import { Eyebrow } from '@/components/common/Eyebrow';
import { KpiCard } from '@/components/common/KpiCard';

const TEAL = 'var(--accent)';

export function HolisticOutcomesSection() {
  const { lang } = useSite();
  const outcomes = buildHolisticOutcomes(lang);

  return (
    <>
      <section id="h-symposiums" style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 28px 20px' }}>
        <Reveal style={{ marginBottom: 28 }}>
          <Eyebrow>{outcomes.symposiumEyebrow}</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, color: 'var(--text)' }}>
            {outcomes.symposiumTitle}
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 640, marginTop: 10 }}>{outcomes.symposiumDesc}</p>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {outcomes.symposiums.map((s, i) => (
            <Reveal
              key={i}
              delay={i * 70}
              style={{
                display: 'grid',
                gridTemplateColumns: '72px 1fr',
                gap: '0 22px',
                padding: '22px 0',
                borderBottom: i < outcomes.symposiums.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 800,
                    fontSize: 28,
                    color: TEAL,
                    lineHeight: 1,
                  }}
                >
                  {s.year}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>{s.edition}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 17.5, color: 'var(--text)', marginBottom: 8 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.65 }}>
                  {s.dates}
                  {s.time ? ` · ${s.time}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 11px',
                      borderRadius: 'var(--r-pill)',
                      color: TEAL,
                      background: `color-mix(in srgb,${TEAL} 12%,transparent)`,
                    }}
                  >
                    {outcomes.hostLabel}
                  </span>
                  {s.attendees != null && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '4px 11px',
                        borderRadius: 'var(--r-pill)',
                        color: 'var(--tone-slate)',
                        background: 'color-mix(in srgb,var(--tone-slate) 12%,transparent)',
                      }}
                    >
                      {s.attendees.toLocaleString()} {outcomes.attendeesLabel}
                    </span>
                  )}
                  {s.satisfaction != null && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '4px 11px',
                        borderRadius: 'var(--r-pill)',
                        color: 'var(--tone-gold)',
                        background: 'color-mix(in srgb,var(--tone-gold) 14%,transparent)',
                      }}
                    >
                      {outcomes.satisfactionLabel} {s.satisfaction}
                    </span>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="h-training" style={{ maxWidth: 1240, margin: '0 auto', padding: '20px 28px 40px' }}>
        <Reveal style={{ marginBottom: 24 }}>
          <Eyebrow>{outcomes.trainingEyebrow}</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--text)' }}>
            {outcomes.trainingTitle}
          </h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--muted)', maxWidth: 560, marginTop: 8 }}>{outcomes.trainingDesc}</p>
        </Reveal>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(186px,1fr))',
            gap: 18,
          }}
        >
          <KpiCard num={outcomes.trainingSessions.num} label={outcomes.trainingSessions.label} color={TEAL} delay={0} />
          <KpiCard num={outcomes.trainingParticipants.num} label={outcomes.trainingParticipants.label} color="var(--tone-slate)" delay={70} />
          <KpiCard
            num={outcomes.trainingSatisfaction.num}
            staticDisplay={`${outcomes.trainingSatisfaction.num}${outcomes.trainingSatisfaction.suffix}`}
            label={outcomes.trainingSatisfaction.label}
            color="var(--tone-gold)"
            delay={140}
          />
        </div>
      </section>
    </>
  );
}
