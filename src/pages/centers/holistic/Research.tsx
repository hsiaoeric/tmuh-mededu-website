import { Link } from 'react-router-dom';
import { useSite } from '@/app/site';
import { holisticDetailPath } from '@/app/routes';
import {
  buildHolisticResearch,
  HOLISTIC_EDU_PAPERS,
  HOLISTIC_PAPER_TOTAL,
} from '@/data/holisticPapers';
import { Counter } from '@/motion/Counter';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { StatRow } from '@/ui/Stats';
import { Icon } from '@/ui/Icon';

const EDU_TONE = '#4f8c7d';
const CLINICAL_TONE = '#A87A6B';
const CHART_H = 190;

export function Research() {
  const { lang, isZh } = useSite();
  const r = buildHolisticResearch(lang);
  const peak = Math.max(...r.byYear.map((y) => y.edu + y.clinical));
  const eduYears = [...new Set(HOLISTIC_EDU_PAPERS.map((p) => p.year))].sort((a, b) => b - a);

  return (
    <Section id="research">
      <SectionHeader index="07" eyebrow={r.eyebrow} title={r.title} desc={r.desc} />

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

          {/* The bars carry no text, and their per-segment counts are only in
              `title` tooltips — which never surface on touch. The same numbers
              go out as a table for screen readers. */}
          {/* Wrapped in a div because `.sr-only` sizes a <table> unreliably —
              a table treats `height` as a minimum. */}
          <div className="sr-only">
            <table>
              <caption>{r.byYearTitle}</caption>
              <thead>
                <tr>
                  <th scope="col">{isZh ? '年份' : 'Year'}</th>
                  <th scope="col">{r.eduLegend}</th>
                  <th scope="col">{r.clinicalLegend}</th>
                </tr>
              </thead>
              <tbody>
                {r.byYear.map((y) => (
                  <tr key={y.year}>
                    <th scope="row">{y.year}</th>
                    <td>{y.edu}</td>
                    <td>{y.clinical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="row"
            style={{ alignItems: 'flex-end', gap: 'clamp(6px, 1.4vw, 18px)', height: CHART_H }}
            aria-hidden="true"
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

        {/* Year entry cards, newest first — the titles themselves live on the
            per-year detail page rather than expanded here. */}
        <Reveal
          variant="up"
          stagger={60}
          className="grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            marginTop: 10,
          }}
        >
          {eduYears.map((year) => {
            const count = HOLISTIC_EDU_PAPERS.filter((p) => p.year === year).length;
            return (
              <Link
                key={year}
                to={holisticDetailPath('research', year)}
                className="card card-hover stack gap-2"
                style={{ ['--tone' as string]: EDU_TONE }}
                data-cursor={isZh ? '查看' : 'View'}
              >
                <span className="display" style={{ fontSize: '2rem', lineHeight: 1, color: EDU_TONE }}>
                  {year}
                </span>
                <span className="tiny">
                  {isZh
                    ? `${count} 篇全人照護教育論文`
                    : `${count} education ${count === 1 ? 'paper' : 'papers'}`}
                </span>
                <span
                  className="row gap-1 tiny"
                  style={{ marginTop: 'auto', paddingTop: 12, color: EDU_TONE }}
                >
                  {isZh ? '查看論文' : 'View papers'}
                  <Icon name="arrow" size={12} />
                </span>
              </Link>
            );
          })}
        </Reveal>
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
