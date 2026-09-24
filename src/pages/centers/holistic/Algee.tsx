import { useState } from 'react';
import { useSite } from '@/app/site';
import type { PublicAdapterResultFor } from '@/content/adapters';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { PersonCard } from '@/ui/Person';
import { RAIL_INDEX } from './rail';

const TEAL = '#4f8c7d';

/**
 * Everything MHFA: the five action steps, then the people who teach them.
 * The instructors and seed teachers used to sit in a separate section after
 * this one, which split the programme from its team.
 */
type HolisticStep = PublicAdapterResultFor<'holistic'>['value']['algee'][number];
type HolisticPerson = PublicAdapterResultFor<'people'>['value']['holisticInstructors'][number];

export function Algee({ steps, instructors, seedTeachers }: {
  readonly steps: readonly HolisticStep[];
  readonly instructors: readonly HolisticPerson[];
  readonly seedTeachers: readonly HolisticPerson[];
}) {
  const { t } = useSite();
  const [step, setStep] = useState(0);
  const active = steps[step];
  const title = active.title;
  const body = active.description;

  return (
    <Section id="mhfa">
      <SectionHeader index={RAIL_INDEX.mhfa} eyebrow="Mental Health First Aid" title={t.mhfaTitle} desc={t.mhfaIntro} />

      <Reveal variant="up" className="row gap-2 wrap" style={{ marginBottom: 40 }}>
        {steps.map((s, i) => (
          <button
            key={i}
            className="algee-tile"
            data-on={i === step}
            onClick={() => setStep(i)}
            aria-pressed={i === step}
            aria-label={`${s.letter} — ${s.title}`}
          >
            {s.letter}
          </button>
        ))}
      </Reveal>

      <div className="grid g-editorial" style={{ alignItems: 'start' }} key={step}>
        <Reveal variant="left">
          <div className="stack gap-2">
            <span className="mono" style={{ fontSize: '0.68rem', letterSpacing: '.2em', color: 'var(--accent)' }}>
              STEP {step + 1} / {steps.length}
            </span>
            <h3 className="display d3">{title}</h3>
          </div>
        </Reveal>
        <Reveal variant="up" delay={100}>
          <p className="lede measure">{body}</p>
        </Reveal>
      </div>

      {/* The people behind the programme */}
      <div className="stack gap-3" style={{ marginTop: 'clamp(56px, 8vw, 104px)' }}>
        <h3 className="display d3">{t.instructorsTitle}</h3>
        <Reveal variant="up" stagger={90} className="grid grid-people" style={{ maxWidth: 620 }}>
          {instructors.map((p, i) => (
            <PersonCard key={`${p.en}-${i}`} person={p} accent={TEAL} />
          ))}
        </Reveal>
      </div>

      <div className="stack gap-3" style={{ marginTop: 'clamp(46px, 7vw, 88px)' }}>
        <div className="row between wrap gap-2">
          <div className="stack gap-1">
            <h3 className="display d3">{t.seedTitle}</h3>
            <p className="prose measure">{t.seedDesc}</p>
          </div>
          <span className="stat" style={{ ['--tone' as string]: TEAL }}>
            <span className="stat-num" style={{ fontSize: '2.6rem' }}>
              {seedTeachers.length}
            </span>
          </span>
        </div>

        <Reveal variant="up" stagger={50} className="grid grid-people" style={{ marginTop: 12 }}>
          {seedTeachers.map((p, i) => (
            <PersonCard key={`${p.en}-${i}`} person={p} accent={TEAL} hideRole />
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
