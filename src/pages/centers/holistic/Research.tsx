import { useSite } from '@/app/site';
import {
  buildHolisticResearch,
  resolveAuthorName,
  HOLISTIC_EDU_PAPERS,
  HOLISTIC_PAPER_TOTAL,
} from '@/data/holisticPapers';
import { Counter } from '@/motion/Counter';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { StatRow } from '@/ui/Stats';

const EDU_TONE = '#4f8c7d';
const CLINICAL_TONE = '#A87A6B';
const CHART_H = 190;

export function Research() {
  const { lang } = useSite();
  const r = buildHolisticResearch(lang);
  const peak = Math.max(...r.byYear.map((y) => y.edu + y.clinical));

  return (
    <Section id="research">
      <SectionHeader index="08" eyebrow={r.eyebrow} title={r.title} desc={r.desc} />

      {/* Total + per-year composition */}
      <div className="grid g-aside" style={{ alignItems: 'end', marginBottom: 'clamp(40px, 6vw, 76px)' }}>
        <div className="stat" style={{ ['--tone' as string]: EDU_TONE }}>
          <div className="stat-num">
            <Counter to={HOLISTIC_PAPER_TOTAL} />
          </div>
          <span className="stat-label">{r.totalLabel}</span>
        </div>

        <Reveal variant="up" className="stack gap-2">
          <div className="row between wrap gap-2">
            <span className="eyebrow">{r.byYearTitle}</span>
            <span className="row gap-3 wrap">
              {[
                { tone: EDU_TONE, label: r.eduLegend },
                { tone: CLINICAL_TONE, label: r.clinicalLegend },
              ].map((l) => (
                <span className="row gap-1 tiny" key={l.label}>
                  <span className="dot" style={{ ['--tone' as string]: l.tone, width: 6, height: 6 }} />
                  {l.label}
                </span>
              ))}
            </span>
          </div>

          <div
            className="row"
            style={{ alignItems: 'flex-end', gap: 'clamp(6px, 1.4vw, 18px)', height: CHART_H }}
            role="img"
            aria-label={r.byYearTitle}
          >
            {r.byYear.map((y) => {
              const total = y.edu + y.clinical;
              return (
                <div key={y.year} className="stack gap-1 grow" style={{ alignItems: 'center' }}>
                  <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--muted)' }}>
                    {total}
                  </span>
                  <div className="year-bar" style={{ width: '100%', height: (total / peak) * (CHART_H - 44) }}>
                    {y.clinical > 0 && (
                      <div
                        className="year-seg"
                        style={{
                          background: CLINICAL_TONE,
                          height: `${(y.clinical / Math.max(total, 1)) * 100}%`,
                        }}
                        title={`${r.clinicalLegend}: ${y.clinical}`}
                      />
                    )}
                    {y.edu > 0 && (
                      <div
                        className="year-seg"
                        style={{
                          background: EDU_TONE,
                          height: `${(y.edu / Math.max(total, 1)) * 100}%`,
                        }}
                        title={`${r.eduLegend}: ${y.edu}`}
                      />
                    )}
                  </div>
                  <span className="mono" style={{ fontSize: '0.62rem', color: 'var(--faint)' }}>
                    {String(y.year).slice(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>

      {/* The ten tagged education papers */}
      <div className="stack gap-3">
        <div className="stack gap-1">
          <h3 className="display d3">{r.eduTitle}</h3>
          <p className="prose measure">{r.eduDesc}</p>
        </div>

        <div className="stack" style={{ gap: 0, marginTop: 10 }}>
          {HOLISTIC_EDU_PAPERS.map((p, i) => (
            <Reveal
              key={p.title}
              variant="up"
              delay={Math.min(i, 6) * 50}
              className="grid"
              style={{
                gridTemplateColumns: 'minmax(0, 78px) minmax(0, 1fr)',
                gap: 'clamp(12px, 2.4vw, 32px)',
                padding: 'clamp(18px, 2.2vw, 28px) 0',
                borderTop: '1px solid var(--line-soft)',
              }}
            >
              <span className="mono" style={{ fontSize: '0.8rem', color: EDU_TONE, paddingTop: 3 }}>
                {p.year}
              </span>
              <div className="stack gap-1" style={{ minWidth: 0 }}>
                <span className="italic" style={{ color: 'var(--accent)', fontSize: '0.82rem' }}>
                  {p.journal}
                </span>
                <span style={{ color: 'var(--ink)', lineHeight: 1.5 }}>{p.title}</span>
                <span className="tiny">{p.byline}</span>
                <span className="row gap-1 wrap" style={{ marginTop: 5 }}>
                  <span className="mono" style={{ fontSize: '0.6rem', letterSpacing: '.14em', color: 'var(--faint)' }}>
                    {r.authorsLabel}
                  </span>
                  {p.authors.map((a) => (
                    <span className="tag" key={a} style={{ ['--tone' as string]: EDU_TONE }}>
                      {resolveAuthorName(a, lang)}
                    </span>
                  ))}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Hospital-wide clinical register */}
      <div className="panel stack gap-3" style={{ marginTop: 'clamp(40px, 6vw, 76px)' }}>
        <div className="stack gap-1">
          <h3 className="display d3">{r.clinicalTitle}</h3>
          <p className="prose measure">{r.clinicalDesc}</p>
        </div>
        <StatRow
          items={r.clinicalStats.map((s) => ({
            value: s.num,
            label: s.label,
            tone: CLINICAL_TONE,
          }))}
        />
      </div>

      <p className="tiny" style={{ marginTop: 26, maxWidth: '76ch' }}>
        {r.sourceNote}
      </p>
    </Section>
  );
}
