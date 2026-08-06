import { Link, useParams } from 'react-router-dom';
import { useSite, usePageTitle } from '@/app/site';
import { centerPath, type HolisticDetailKind } from '@/app/routes';
import { buildHolisticOutcomes } from '@/data/holistic';
import {
  buildHolisticResearch,
  resolveAuthorName,
  HOLISTIC_EDU_PAPERS,
} from '@/data/holisticPapers';
import { Reveal } from '@/motion/Reveal';
import { SplitLines } from '@/motion/SplitLines';
import { Icon } from '@/ui/Icon';

const TEAL = '#4f8c7d';

/**
 * One year of symposia or of holistic-care education papers. The center page
 * lists only year cards, so the full detail lives here rather than inline.
 */
export function HolisticDetail() {
  const { kind, year: yearParam } = useParams();
  const { lang, isZh } = useSite();

  const detailKind = (kind === 'symposia' || kind === 'research' ? kind : null) as
    | HolisticDetailKind
    | null;
  const year = Number(yearParam);

  const outcomes = buildHolisticOutcomes(lang);
  const research = buildHolisticResearch(lang);

  const symposium =
    detailKind === 'symposia' ? outcomes.symposiums.find((s) => s.year === year) : undefined;
  const papers =
    detailKind === 'research'
      ? HOLISTIC_EDU_PAPERS.filter((p) => p.year === year).sort((a, b) => b.month - a.month)
      : [];

  const found = detailKind === 'symposia' ? !!symposium : papers.length > 0;
  const heading = symposium
    ? symposium.title
    : detailKind === 'research'
      ? research.eduTitle
      : isZh
        ? '找不到內容'
        : 'Not found';

  usePageTitle(`${Number.isFinite(year) ? year : ''} ${heading}`.trim());

  return (
    <section className="section" style={{ ['--tone' as string]: TEAL, paddingTop: 'calc(var(--nav-h) + 60px)' }}>
      <div className="shell stack gap-4">
        <Reveal variant="fade">
          <Link className="tlink" to={centerPath('holistic')} style={{ color: 'var(--muted)' }}>
            <Icon name="arrow" style={{ transform: 'rotate(180deg)' }} />
            {isZh ? '返回全人照護教育中心' : 'Back to the Holistic Care Education Center'}
          </Link>
        </Reveal>

        {!found ? (
          <div className="stack gap-2">
            <span className="eyebrow">{isZh ? '找不到內容' : 'Not Found'}</span>
            <h1 className="display d2 title-measure">
              {isZh ? '此年度內容尚未建立' : 'No content is available for this year'}
            </h1>
          </div>
        ) : (
          <>
            <Reveal variant="left" delay={80}>
              <div className="row gap-2">
                <span className="display" style={{ fontSize: '2.4rem', lineHeight: 1, color: TEAL }}>
                  {year}
                </span>
                <span className="eyebrow" style={{ color: TEAL }}>
                  {detailKind === 'symposia' ? outcomes.symposiumEyebrow : research.eyebrow}
                </span>
              </div>
            </Reveal>

            <SplitLines as="h1" className="display d2 title-measure" immediate delay={200}>
              {heading}
            </SplitLines>

            {symposium ? (
              <Reveal variant="up" delay={280} className="panel stack gap-3">
                <span className="row gap-2 wrap">
                  <span className="row gap-1">
                    <Icon name="calendar" size={13} />
                    {symposium.dates}
                  </span>
                  {symposium.time && <span className="mono tiny">{symposium.time}</span>}
                </span>

                <span className="row gap-2 wrap">
                  <span className="tag" style={{ ['--tone' as string]: TEAL }}>
                    {outcomes.hostLabel}
                  </span>
                  {symposium.attendees !== undefined && (
                    <span className="tag" style={{ ['--tone' as string]: '#5E7A8C' }}>
                      {symposium.attendees.toLocaleString()} {outcomes.attendeesLabel}
                    </span>
                  )}
                  {symposium.satisfaction !== undefined && (
                    <span className="tag" style={{ ['--tone' as string]: '#B69B66' }}>
                      {outcomes.satisfactionLabel} {symposium.satisfaction}
                      {isZh ? '分' : ''}
                    </span>
                  )}
                </span>

                <p className="tiny" style={{ color: 'var(--faint)' }}>
                  {isZh
                    ? '議程、講者與活動照片整理中。'
                    : 'Agenda, speakers and photos are being compiled.'}
                </p>
              </Reveal>
            ) : (
              <>
                <Reveal variant="up" delay={280}>
                  <p className="lede measure">{research.eduDesc}</p>
                </Reveal>

                <div className="stack" style={{ gap: 0, marginTop: 10 }}>
                  {papers.map((p, i) => (
                    <Reveal
                      key={p.title}
                      variant="up"
                      delay={Math.min(i, 6) * 50}
                      className="stack gap-1"
                      style={{
                        minWidth: 0,
                        padding: 'clamp(18px, 2.2vw, 28px) 0',
                        borderTop: '1px solid var(--line-soft)',
                      }}
                    >
                      <span className="italic" style={{ color: 'var(--accent)', fontSize: '0.82rem' }}>
                        {p.journal}
                      </span>
                      <span style={{ color: 'var(--ink)', lineHeight: 1.5 }}>{p.title}</span>
                      <span className="tiny">{p.byline}</span>
                      <span className="row gap-1 wrap" style={{ marginTop: 5 }}>
                        <span
                          className="mono"
                          style={{ fontSize: '0.6rem', letterSpacing: '.14em', color: 'var(--faint)' }}
                        >
                          {research.authorsLabel}
                        </span>
                        {p.authors.map((a) => (
                          <span className="tag" key={a} style={{ ['--tone' as string]: TEAL }}>
                            {resolveAuthorName(a, lang)}
                          </span>
                        ))}
                      </span>
                    </Reveal>
                  ))}
                </div>

              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
