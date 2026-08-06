import { useSite } from '@/app/site';
import { buildAiEcosystem } from '@/data/holistic';
import { Reveal } from '@/motion/Reveal';
import { HorizontalScroll } from '@/motion/HorizontalScroll';
import { SectionHeader, SectionTag } from '@/ui/Section';
import { Icon } from '@/ui/Icon';
import { RAIL_INDEX } from './rail';

/** Healthy Taiwan Scope 2: the AI holistic-care teaching ecosystem. */
export function AiEcosystem() {
  const { t, lang } = useSite();
  const ai = buildAiEcosystem(lang);

  return (
    <section id="ai" className="section">
      <div className="shell">
        <SectionHeader index={RAIL_INDEX.ai} eyebrow="Healthy Taiwan · Scope 2" title={t.aiTitle} desc={t.aiBody} />

        <div className="grid g-editorial" style={{ alignItems: 'start', marginBottom: 'var(--gap-block)' }}>
          <Reveal variant="up" className="stack gap-2">
            <h3 className="display d3">{ai.title}</h3>
            <p className="prose">{ai.body}</p>
          </Reveal>

          <Reveal variant="up" delay={120} className="panel sunk stack gap-2">
            <span className="eyebrow">{ai.problemsTitle}</span>
            <ul className="stack gap-2" style={{ marginTop: 6 }}>
              {ai.problems.map((p, i) => (
                <li key={i} className="row start gap-2">
                  <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--accent)', marginTop: 5 }}>
                    0{i + 1}
                  </span>
                  <span className="prose" style={{ fontSize: '0.93rem' }}>
                    {p}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>

      {/* The four-stage flow, scrubbed sideways */}
      <HorizontalScroll head={<SectionTag index={RAIL_INDEX.ai} eyebrow="Healthy Taiwan · Scope 2" />}>
        {ai.flow.map((f, i) => (
          <article key={f.title} className="hscroll-card card" style={{ ['--tone' as string]: f.color }}>
            <div className="row between">
              {f.role ? <span className="tag">{f.role}</span> : <span />}
              <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--faint)' }}>
                0{i + 1}
              </span>
            </div>
            <h4 className="display d4" style={{ marginTop: 18 }}>
              {f.title}
            </h4>
            <p className="prose" style={{ fontSize: '0.92rem', marginTop: 10 }}>
              {f.text}
            </p>
            {i < ai.flow.length - 1 && (
              <span style={{ marginTop: 'auto', paddingTop: 20, color: f.color, display: 'inline-flex' }}>
                <Icon name="arrow" size={18} />
              </span>
            )}
          </article>
        ))}
      </HorizontalScroll>
    </section>
  );
}
