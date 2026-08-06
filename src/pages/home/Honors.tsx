import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '@/app/site';
import { centerPath } from '@/app/routes';
import { buildDeptAwards } from '@/data/deptAwards';
import { Counter } from '@/motion/Counter';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { Icon } from '@/ui/Icon';

export function Honors() {
  const { isZh, lang } = useSite();
  const a = buildDeptAwards(lang);
  const [openProject, setOpenProject] = useState<number | null>(0);

  const maxCount = Math.max(...a.snqYearCounts.map((y) => y.count));

  return (
    <Section id="honors">
      <SectionHeader index="05" eyebrow={a.eyebrow} title={a.title} desc={a.desc} />

      {/* SNQ */}
      <div className="grid g-aside" style={{ alignItems: 'start' }}>
        <div className="sticky-col stack gap-3">
          <div className="row gap-2">
            <span style={{ color: 'var(--amber)', display: 'inline-flex' }}>
              <Icon name="award" size={20} />
            </span>
            <h3 className="display d4">{a.snqTitle}</h3>
          </div>

          <div className="stack gap-2" style={{ marginTop: 8 }}>
            {a.snqYearCounts.map((y) => (
              <Reveal key={y.year} variant="fade" className="stack gap-1">
                <div className="row between baseline">
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                    {y.year}
                  </span>
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--amber)' }}>
                    {y.count}
                  </span>
                </div>
                <div className="bar-track" style={{ ['--tone' as string]: 'var(--amber)' }}>
                  <div
                    className="bar-fill"
                    style={{ width: `${(y.count / maxCount) * 100}%` }}
                  />
                </div>
              </Reveal>
            ))}
          </div>

          <div className="stat" style={{ ['--tone' as string]: 'var(--amber)', marginTop: 10 }}>
            <div className="stat-num" style={{ fontSize: '3rem' }}>
              <Counter to={a.snqProjects.length} />
            </div>
            <span className="stat-label">
              {isZh ? '項通過認證的專案' : 'Certified projects'}
            </span>
          </div>
        </div>

        <div className="stack" style={{ gap: 0 }}>
          {a.snqProjects.map((p, i) => {
            const on = openProject === i;
            return (
              <Reveal
                key={`${p.certYear}-${p.title}`}
                variant="up"
                delay={i * 60}
                style={{ borderTop: '1px solid var(--line-soft)' }}
              >
                <button
                  onClick={() => setOpenProject(on ? null : i)}
                  aria-expanded={on}
                  style={{ width: '100%', textAlign: 'left', padding: '22px 0' }}
                  data-cursor={isZh ? '展開' : 'Open'}
                >
                  <div className="row between gap-3 start">
                    <div className="stack gap-2" style={{ minWidth: 0 }}>
                      <span className="tag" style={{ ['--tone' as string]: 'var(--amber)' }}>
                        {p.certYear}
                      </span>
                      <span className="display d4" style={{ display: 'block' }}>
                        {p.title}
                      </span>
                      <span className="tiny">{p.badgeLabel}</span>
                    </div>
                    <span style={{ color: 'var(--amber)', display: 'inline-flex', marginTop: 4 }}>
                      <Icon name={on ? 'minus' : 'plus'} size={16} />
                    </span>
                  </div>
                </button>

                {on && (
                  <div className="stack gap-2" style={{ paddingBottom: 28 }}>
                    {p.renewal && (
                      <span className="mono tiny" style={{ color: 'var(--amber)' }}>
                        {a.renewalLabel} · {p.renewal}
                      </span>
                    )}
                    <div className="scroll-x">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>{a.colUnit}</th>
                            <th>{a.colRole}</th>
                            <th>{a.colPerson}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.members.map((m, j) => (
                            <tr key={j}>
                              <td>{m.unit}</td>
                              <td>{m.role}</td>
                              <td style={{ color: 'var(--ink)', whiteSpace: 'nowrap' }}>{m.person}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* NHQA */}
      <Reveal variant="up" className="panel stack gap-3" style={{ marginTop: 'clamp(48px, 7vw, 90px)' }}>
        <div className="row between wrap gap-2">
          <div className="row gap-2">
            <span style={{ color: 'var(--accent)', display: 'inline-flex' }}>
              <Icon name="spark" size={19} />
            </span>
            <h3 className="display d4">{a.nhqaTitle}</h3>
          </div>
          <span className="tag">{a.nhqa.awardNote}</span>
        </div>

        <div className="grid g-editorial" style={{ alignItems: 'start' }}>
          <div className="stack gap-2">
            <h4 className="display d3" style={{ maxWidth: '18ch' }}>
              {a.nhqa.project}
            </h4>
            <div className="row gap-1 wrap" style={{ marginTop: 8 }}>
              {a.nhqa.keywords.map((k) => (
                <span className="tag" key={k}>
                  {k}
                </span>
              ))}
            </div>
          </div>

          <div className="stack gap-2">
            {[
              { label: isZh ? '年度' : 'Year', value: a.nhqa.year },
              { label: isZh ? '活動' : 'Event', value: a.nhqa.event },
              { label: isZh ? '組別' : 'Track', value: a.nhqa.group },
              { label: isZh ? '領域' : 'Domain', value: a.nhqa.domain },
              { label: isZh ? '主要成員' : 'Leads', value: a.nhqa.leads.join(' · ') },
            ].map((row) => (
              <div
                key={row.label}
                className="row between gap-3 start"
                style={{ padding: '10px 0', borderTop: '1px solid var(--line-soft)' }}
              >
                <span className="mono" style={{ fontSize: '0.64rem', letterSpacing: '.14em', color: 'var(--faint)', whiteSpace: 'nowrap' }}>
                  {row.label}
                </span>
                <span className="tiny" style={{ color: 'var(--body)', textAlign: 'right' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="row between wrap gap-2" style={{ paddingTop: 16, borderTop: '1px solid var(--line)' }}>
          <span className="tiny">{a.dataSource}</span>
          <Link className="tlink" to={centerPath('ebm')}>
            {a.nhqaEbmLink}
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}
