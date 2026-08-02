import { Link } from 'react-router-dom';
import { useSite } from '@/context/SiteContext';
import { buildHolisticOutcomes } from '@/data/holistic';
import { Reveal } from '@/components/common/Reveal';
import { Eyebrow } from '@/components/common/Eyebrow';
import { KpiCard } from '@/components/common/KpiCard';

const TEAL = '#4f8c7d';

export function HolisticOutcomesSection() {
  const { lang } = useSite();
  const outcomes = buildHolisticOutcomes(lang);

  return (
    <>
      <section id="h-symposiums" style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 28px 20px' }}>
        <Reveal style={{ marginBottom: 28 }}>
          <Eyebrow>{outcomes.symposiumEyebrow}</Eyebrow>
          <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)' }}>
            {outcomes.symposiumTitle}
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 640, marginTop: 10 }}>{outcomes.symposiumDesc}</p>
        </Reveal>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))',
            gap: 16,
          }}
        >
          {outcomes.symposiums.map((s, i) => (
            <Reveal
              key={i}
              delay={i * 70}
              style={{
                display: 'flex',
                minHeight: 170,
              }}
            >
              <Link
                to={`/holistic/symposia/${s.year}`}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '24px 22px',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-card)',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <div
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 30,
                    color: TEAL,
                    lineHeight: 1,
                  }}
                >
                  {s.year}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>{s.edition}</div>
                <div style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 800, fontSize: 17, lineHeight: 1.5, color: 'var(--text)', marginTop: 18 }}>
                  {s.title}
                </div>
                {/* Year + name + a headline figure only; the rest lives on the detail page. */}
                {(s.attendees != null || s.satisfaction != null) && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    {s.attendees != null && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, color: '#5E7A8C', background: 'color-mix(in srgb,#5E7A8C 12%,transparent)' }}>
                        {s.attendees.toLocaleString()} {outcomes.attendeesLabel}
                      </span>
                    )}
                    {s.satisfaction != null && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, color: '#B69B66', background: 'color-mix(in srgb,#B69B66 14%,transparent)' }}>
                        {outcomes.satisfactionLabel} {s.satisfaction}
                      </span>
                    )}
                  </div>
                )}
                <div style={{ marginTop: 'auto', paddingTop: 18, color: TEAL, fontSize: 13, fontWeight: 700 }}>
                  {lang === 'zh' ? '查看詳情' : 'View details'} →
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="h-training" style={{ maxWidth: 1240, margin: '0 auto', padding: '20px 28px 40px' }}>
        <Reveal style={{ marginBottom: 24 }}>
          <Eyebrow>{outcomes.trainingEyebrow}</Eyebrow>
          <h2 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 28, color: 'var(--text)' }}>
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
          <KpiCard num={outcomes.trainingParticipants.num} label={outcomes.trainingParticipants.label} color="#5E7A8C" delay={70} />
          <KpiCard
            num={outcomes.trainingSatisfaction.num}
            staticDisplay={`${outcomes.trainingSatisfaction.num}${outcomes.trainingSatisfaction.suffix}`}
            label={outcomes.trainingSatisfaction.label}
            color="#B69B66"
            delay={140}
          />
        </div>
      </section>
    </>
  );
}
