import { Link } from 'react-router-dom';
import { useSite } from '@/app/site';
import { holisticDetailPath } from '@/app/routes';
import { buildHolisticOutcomes } from '@/data/holistic';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { StatRow } from '@/ui/Stats';
import { Icon } from '@/ui/Icon';
import { RAIL_INDEX } from './rail';

const TEAL = '#4f8c7d';

/** Symposia hosted by the department. */
export function Symposia() {
  const { lang, isZh } = useSite();
  const o = buildHolisticOutcomes(lang);

  return (
      <Section id="symposia">
        <SectionHeader
          index={RAIL_INDEX.symposia}
          eyebrow={o.symposiumEyebrow}
          title={o.symposiumTitle}
          desc={o.symposiumDesc}
        />

        {/* Year cards: year, name and a headline figure only — the agenda,
            speakers and photos live on the detail page. */}
        <Reveal variant="up" stagger={70} className="grid g4">
          {o.symposiums.map((s) => (
            <Link
              key={`${s.year}-${s.title}`}
              to={holisticDetailPath('symposia', s.year)}
              className="card card-hover stack gap-2"
              style={{ ['--tone' as string]: TEAL }}
              data-cursor={isZh ? '查看' : 'View'}
            >
              <div className="stack gap-1">
                <span className="display" style={{ fontSize: '2rem', lineHeight: 1, color: TEAL }}>
                  {s.year}
                </span>
                <span className="mono tiny">{s.edition}</span>
              </div>

              <h3 className="display d4" style={{ minWidth: 0 }}>
                {s.title}
              </h3>

              <span className="row gap-1 wrap">
                {s.attendees !== undefined && (
                  <span className="tag" style={{ ['--tone' as string]: '#5E7A8C' }}>
                    {s.attendees.toLocaleString()} {o.attendeesLabel}
                  </span>
                )}
                {s.satisfaction !== undefined && (
                  <span className="tag" style={{ ['--tone' as string]: '#B69B66' }}>
                    {o.satisfactionLabel} {s.satisfaction}
                  </span>
                )}
              </span>

              <span
                className="row gap-1 tiny"
                style={{ marginTop: 'auto', paddingTop: 12, color: TEAL }}
              >
                {isZh ? '查看詳情' : 'View details'}
                <Icon name="arrow" size={12} />
              </span>
            </Link>
          ))}
        </Reveal>
      </Section>
  );
}

/** AY113 faculty-training results. */
export function Training() {
  const { lang } = useSite();
  const o = buildHolisticOutcomes(lang);

  return (
      <Section id="training" tight>
        <SectionHeader
          index={RAIL_INDEX.training}
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
  );
}
