import { Link } from 'react-router-dom';
import { useSite } from '@/context/SiteContext';
import {
  HOLISTIC_EDU_PAPERS,
  HOLISTIC_PAPER_TOTAL,
  buildHolisticResearch,
  resolveAuthorName,
  type HolisticEduPaper,
} from '@/data/holisticPapers';
import { Reveal } from '@/components/common/Reveal';
import { Eyebrow } from '@/components/common/Eyebrow';
import { KpiCard } from '@/components/common/KpiCard';

const TEAL = '#4f8c7d';
const SLATE = '#5E7A8C';

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--muted)' }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flex: 'none' }} />
      {label}
    </span>
  );
}

/** Stacked bar splitting a year's papers into education and clinical output. */
function YearBar({
  year,
  edu,
  clinical,
  max,
  delay,
}: {
  year: number;
  edu: number;
  clinical: number;
  max: number;
  delay: number;
}) {
  const total = edu + clinical;

  return (
    <Reveal
      delay={delay}
      style={{ display: 'grid', gridTemplateColumns: '46px 1fr 34px', alignItems: 'center', gap: 12 }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontWeight: 700,
          fontSize: 13.5,
          color: 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {year}
      </span>
      <span style={{ display: 'flex', gap: 2, height: 18 }}>
        {clinical > 0 && (
          <span
            style={{
              width: `${(clinical / max) * 100}%`,
              background: SLATE,
              borderRadius: edu > 0 ? '5px 0 0 5px' : 5,
            }}
          />
        )}
        {edu > 0 && (
          <span
            style={{
              width: `${(edu / max) * 100}%`,
              minWidth: 5,
              background: TEAL,
              borderRadius: clinical > 0 ? '0 5px 5px 0' : 5,
            }}
          />
        )}
      </span>
      <span
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontWeight: 700,
          fontSize: 13.5,
          color: 'var(--text)',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {total}
      </span>
    </Reveal>
  );
}

export function PaperEntry({
  paper,
  authorsLabel,
  isZh,
}: {
  paper: HolisticEduPaper;
  authorsLabel: string;
  isZh: boolean;
}) {
  const lang = isZh ? 'zh' : 'en';

  return (
    <div>
      <div
        style={{
          fontFamily: "'Noto Sans TC', sans-serif",
          fontWeight: 700,
          fontSize: 15.5,
          lineHeight: 1.55,
          color: 'var(--text)',
        }}
      >
        {paper.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 9 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 11px',
            borderRadius: 999,
            color: TEAL,
            background: `color-mix(in srgb,${TEAL} 12%,transparent)`,
          }}
        >
          {paper.journal}
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
          {authorsLabel} · {paper.authors.map((a) => resolveAuthorName(a, lang)).join('、')}
        </span>
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--muted)', marginTop: 6 }}>
        {paper.byline}
      </div>
    </div>
  );
}

export function HolisticResearchSection() {
  const { lang, isZh } = useSite();
  const research = buildHolisticResearch(lang);
  const max = Math.max(...research.byYear.map((y) => y.edu + y.clinical));
  const years = [...new Set(HOLISTIC_EDU_PAPERS.map((p) => p.year))].sort((a, b) => b - a);

  return (
    <section id="h-research" style={{ maxWidth: 1240, margin: '0 auto', padding: '20px 28px 40px' }}>
      <Reveal style={{ marginBottom: 26 }}>
        <Eyebrow>{research.eyebrow}</Eyebrow>
        <h2
          style={{
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 900,
            fontSize: 28,
            color: 'var(--text)',
          }}
        >
          {research.title}
        </h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--muted)', maxWidth: 620, marginTop: 8 }}>
          {research.desc}
        </p>
      </Reveal>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
          gap: 26,
          alignItems: 'start',
          marginBottom: 40,
        }}
      >
        <Reveal
          style={{
            padding: '24px 26px',
            borderRadius: 16,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontWeight: 700,
                fontSize: 54,
                lineHeight: 1,
                color: 'var(--text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {HOLISTIC_PAPER_TOTAL}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>
              {research.totalLabel}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 18 }}>
            <Legend color={TEAL} label={research.eduLegend} />
            <Legend color={SLATE} label={research.clinicalLegend} />
          </div>
        </Reveal>

        <div>
          <div
            style={{
              fontFamily: "'Noto Sans TC', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--text)',
              marginBottom: 14,
            }}
          >
            {research.byYearTitle}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {research.byYear.map((y, i) => (
              <YearBar key={y.year} {...y} max={max} delay={i * 50} />
            ))}
          </div>
        </div>
      </div>

      <Reveal style={{ marginBottom: 18 }}>
        <h3
          style={{
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 800,
            fontSize: 20,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ width: 5, height: 22, borderRadius: 3, background: TEAL }} />
          {research.eduTitle}
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--muted)', maxWidth: 640, marginTop: 8 }}>
          {research.eduDesc}
        </p>
      </Reveal>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
          gap: 16,
          marginBottom: 40,
        }}
      >
        {years.map((year, i) => {
          const paperCount = HOLISTIC_EDU_PAPERS.filter((p) => p.year === year).length;
          return (
            <Reveal
              key={year}
              delay={i * 60}
              style={{
                display: 'flex',
              }}
            >
              <Link
                to={`/holistic/research/${year}`}
                style={{
                  width: '100%',
                  minHeight: 148,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '22px 20px',
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
                  {year}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
                  {isZh ? `${paperCount} 篇全人照護教育論文` : `${paperCount} holistic-care education ${paperCount === 1 ? 'paper' : 'papers'}`}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 18, color: TEAL, fontSize: 13, fontWeight: 700 }}>
                  {isZh ? '查看論文' : 'View papers'} →
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>

      <Reveal style={{ marginBottom: 18 }}>
        <h3
          style={{
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 800,
            fontSize: 20,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ width: 5, height: 22, borderRadius: 3, background: SLATE }} />
          {research.clinicalTitle}
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--muted)', maxWidth: 640, marginTop: 8 }}>
          {research.clinicalDesc}
        </p>
      </Reveal>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(186px,1fr))',
          gap: 18,
        }}
      >
        {research.clinicalStats.map((stat, i) => (
          <KpiCard
            key={stat.label}
            num={stat.num}
            label={stat.label}
            color={i === 0 ? SLATE : i === 1 ? TEAL : '#B69B66'}
            delay={i * 70}
          />
        ))}
      </div>

      <Reveal style={{ marginTop: 22 }}>
        <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--muted)', maxWidth: 760 }}>
          {research.sourceNote}
        </p>
      </Reveal>
    </section>
  );
}
