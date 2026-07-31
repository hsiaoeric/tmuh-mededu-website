import { useSite } from '@/app/site';
import { buildHolisticOutcomes } from '@/data/holistic';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { StatRow } from '@/ui/Stats';
import { Icon } from '@/ui/Icon';

const TEAL = '#4f8c7d';

/** Symposia hosted by the department, plus AY113 faculty-training results. */
export function Outcomes() {
  const { lang } = useSite();
  const o = buildHolisticOutcomes(lang);

  return (
    <>
      <Section id="symposia">
        <SectionHeader
          index="06"
          eyebrow={o.symposiumEyebrow}
          title={o.symposiumTitle}
          desc={o.symposiumDesc}
        />

        <div className="stack" style={{ gap: 0 }}>
          {o.symposiums.map((s, i) => (
            <Reveal
              key={`${s.year}-${s.title}`}
              variant="up"
              delay={i * 70}
              className="grid"
              style={{
                gridTemplateColumns: 'minmax(0, 130px) minmax(0, 1fr) auto',
                gap: 'clamp(14px, 3vw, 40px)',
                alignItems: 'center',
                padding: 'clamp(22px, 2.8vw, 34px) 0',
                borderTop: '1px solid var(--line-soft)',
                ['--tone' as string]: TEAL,
              }}
            >
              <div className="stack gap-1">
                <span className="display" style={{ fontSize: '1.8rem', lineHeight: 1, color: TEAL }}>
                  {s.year}
                </span>
                <span className="mono tiny">{s.edition}</span>
              </div>

              <div className="stack gap-1" style={{ minWidth: 0 }}>
                <h3 className="display d4">{s.title}</h3>
                <span className="row gap-2 wrap tiny">
                  <span className="row gap-1">
                    <Icon name="calendar" size={12} />
                    {s.dates}
                  </span>
                  {s.time && <span className="mono">{s.time}</span>}
                </span>
                <span className="mono tiny" style={{ color: 'var(--faint)' }}>
                  {o.hostLabel}
                </span>
              </div>

              <div className="stack gap-1" style={{ textAlign: 'right' }}>
                {s.attendees !== undefined && (
                  <span>
                    <span className="display" style={{ fontSize: '1.5rem', color: 'var(--ink)' }}>
                      {s.attendees}
                    </span>
                    <span className="tiny"> {o.attendeesLabel}</span>
                  </span>
                )}
                {s.satisfaction !== undefined && (
                  <span className="mono tiny" style={{ color: TEAL }}>
                    {o.satisfactionLabel} {s.satisfaction}
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section id="training" tight>
        <SectionHeader
          index="07"
          eyebrow={o.trainingEyebrow}
          title={o.trainingTitle}
          desc={o.trainingDesc}
        />
        <StatRow
          items={[
            { value: o.trainingSessions.num, label: o.trainingSessions.label, tone: TEAL },
            { value: o.trainingParticipants.num, label: o.trainingParticipants.label, tone: '#6E8A77' },
            {
              value: o.trainingSatisfaction.num,
              decimals: 2,
              suffix: o.trainingSatisfaction.suffix,
              label: o.trainingSatisfaction.label,
              tone: '#B69B66',
            },
          ]}
        />
      </Section>
    </>
  );
}
