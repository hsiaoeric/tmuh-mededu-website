import { useState } from 'react';
import { useSite } from '@/app/site';
import { ALGEE } from '@/data/holistic';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';

/** The five MHFA action steps, one letter at a time. */
export function Algee() {
  const { t, isZh } = useSite();
  const [step, setStep] = useState(0);
  const active = ALGEE[step];
  const [title, body] = isZh ? active.zh : active.en;

  return (
    <Section id="mhfa">
      <SectionHeader index="04" eyebrow="Mental Health First Aid" title={t.mhfaTitle} desc={t.mhfaIntro} />

      <Reveal variant="up" className="row gap-2 wrap" style={{ marginBottom: 40 }}>
        {ALGEE.map((s, i) => (
          <button
            key={i}
            className="algee-tile"
            data-on={i === step}
            onClick={() => setStep(i)}
            aria-pressed={i === step}
            aria-label={`${s.letter} — ${isZh ? s.zh[0] : s.en[0]}`}
          >
            {s.letter}
          </button>
        ))}
      </Reveal>

      <div className="grid g-editorial" style={{ alignItems: 'start' }} key={step}>
        <Reveal variant="left">
          <div className="stack gap-2">
            <span className="mono" style={{ fontSize: '0.68rem', letterSpacing: '.2em', color: 'var(--accent)' }}>
              STEP {step + 1} / {ALGEE.length}
            </span>
            <h3 className="display d3">{title}</h3>
          </div>
        </Reveal>
        <Reveal variant="up" delay={100}>
          <p className="lede measure">{body}</p>
        </Reveal>
      </div>
    </Section>
  );
}
