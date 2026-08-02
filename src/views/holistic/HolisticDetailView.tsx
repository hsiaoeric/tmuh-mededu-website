import { Link } from 'react-router-dom';
import { useSite } from '@/context/SiteContext';
import { buildHolisticOutcomes } from '@/data/holistic';
import { HOLISTIC_EDU_PAPERS, buildHolisticResearch } from '@/data/holisticPapers';
import { Reveal } from '@/components/common/Reveal';
import { Eyebrow } from '@/components/common/Eyebrow';
import { PaperEntry } from './HolisticResearchSection';

const TEAL = '#4f8c7d';

export function HolisticDetailView({
  kind,
  year,
}: {
  kind: 'symposia' | 'research';
  year: number;
}) {
  const { lang, isZh } = useSite();
  const outcomes = buildHolisticOutcomes(lang);
  const research = buildHolisticResearch(lang);
  const symposium = outcomes.symposiums.find((item) => item.year === year);
  const papers = HOLISTIC_EDU_PAPERS.filter((paper) => paper.year === year).sort(
    (a, b) => b.month - a.month,
  );
  const found = kind === 'symposia' ? !!symposium : papers.length > 0;

  return (
    <main style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', padding: '54px 28px 72px' }}>
      <Link
        to="/holistic"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 30,
          color: 'var(--teal-700)',
          fontFamily: "'Noto Sans TC', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        ← {isZh ? '返回全人照護教育中心' : 'Back to Holistic Care Education Center'}
      </Link>

      {!found ? (
        <Reveal style={{ padding: '42px 36px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <Eyebrow>{isZh ? '找不到內容' : 'Not Found'}</Eyebrow>
          <h1 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)' }}>
            {isZh ? '此年度內容尚未建立' : 'No content is available for this year'}
          </h1>
        </Reveal>
      ) : kind === 'symposia' && symposium ? (
        <Reveal>
          <Eyebrow>{outcomes.symposiumEyebrow}</Eyebrow>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 52, lineHeight: 1, fontWeight: 800, color: TEAL }}>
            {symposium.year}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>{symposium.edition}</div>
          <h1 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 'clamp(30px,5vw,46px)', lineHeight: 1.3, color: 'var(--text)', marginTop: 18 }}>
            {symposium.title}
          </h1>
          <div
            style={{
              marginTop: 28,
              padding: '26px 28px',
              borderRadius: 18,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--body)' }}>
              {symposium.dates}
              {symposium.time ? ` · ${symposium.time}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              <span style={{ padding: '6px 13px', borderRadius: 999, color: TEAL, background: `color-mix(in srgb,${TEAL} 12%,transparent)`, fontSize: 13, fontWeight: 700 }}>
                {outcomes.hostLabel}
              </span>
              {symposium.attendees != null && (
                <span style={{ padding: '6px 13px', borderRadius: 999, color: '#5E7A8C', background: 'color-mix(in srgb,#5E7A8C 12%,transparent)', fontSize: 13, fontWeight: 700 }}>
                  {symposium.attendees.toLocaleString()} {outcomes.attendeesLabel}
                </span>
              )}
              {symposium.satisfaction != null && (
                <span style={{ padding: '6px 13px', borderRadius: 999, color: '#B69B66', background: 'color-mix(in srgb,#B69B66 14%,transparent)', fontSize: 13, fontWeight: 700 }}>
                  {outcomes.satisfactionLabel} {symposium.satisfaction}
                </span>
              )}
            </div>
          </div>
        </Reveal>
      ) : (
        <Reveal>
          <Eyebrow>{research.eyebrow}</Eyebrow>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 52, lineHeight: 1, fontWeight: 800, color: TEAL }}>
            {year}
          </div>
          <h1 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 900, fontSize: 'clamp(30px,5vw,42px)', lineHeight: 1.3, color: 'var(--text)', marginTop: 18 }}>
            {research.eduTitle}
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', marginTop: 12 }}>{research.eduDesc}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 30 }}>
            {papers.map((paper, index) => (
              <div
                key={paper.title}
                style={{
                  padding: '24px 0',
                  borderBottom: index < papers.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <PaperEntry paper={paper} authorsLabel={research.authorsLabel} isZh={isZh} />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--muted)', marginTop: 26 }}>
            {research.sourceNote}
          </p>
        </Reveal>
      )}
    </main>
  );
}
