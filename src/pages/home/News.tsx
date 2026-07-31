import { useSite } from '@/app/site';
import { ANN_URL, buildActivities, buildAnnouncements, latestUpdate } from '@/data/news';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { Icon } from '@/ui/Icon';

export function News() {
  const { t, isZh, lang } = useSite();
  const announcements = buildAnnouncements(lang);
  const activities = buildActivities(lang);

  return (
    <Section id="news">
      <SectionHeader
        index="05"
        eyebrow={t.newsEn}
        title={t.newsZh}
        desc={t.newsDesc}
        aside={
          <a className="tlink" href={ANN_URL} target="_blank" rel="noreferrer">
            {isZh ? '對外看板' : 'Public board'}
            <Icon name="arrowUpRight" />
          </a>
        }
      />

      <div className="stack" style={{ gap: 0 }}>
        {announcements.map((a, i) => (
          <Reveal
            key={`${a.title}-${i}`}
            variant="up"
            delay={a.delay}
            className="grid"
            style={{
              gridTemplateColumns: 'minmax(0, 200px) minmax(0, 1fr)',
              gap: 'clamp(18px, 3vw, 48px)',
              padding: 'clamp(26px, 3.4vw, 44px) 0',
              borderTop: '1px solid var(--line-soft)',
              ['--tone' as string]: a.pinned ? 'var(--amber)' : 'var(--accent)',
            }}
          >
            <div className="stack gap-2">
              <div className="row gap-2 wrap">
                {a.pinned && (
                  <span className="tag" style={{ ['--tone' as string]: 'var(--amber)' }}>
                    <Icon name="pin" size={11} />
                    {a.tag}
                  </span>
                )}
                {!a.pinned && <span className="tag">{a.tag}</span>}
              </div>
              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                {a.date}
              </span>
              {a.statTop && (
                <div className="stack" style={{ gap: 2, marginTop: 8 }}>
                  <span
                    className="display"
                    style={{
                      fontSize: a.statFont === '26px' ? '1.6rem' : '2.6rem',
                      lineHeight: 1,
                      color: a.pinned ? 'var(--amber)' : 'var(--accent)',
                    }}
                  >
                    {a.statTop}
                  </span>
                  <span className="stat-sub">{a.statTopLabel}</span>
                  {a.statBot && (
                    <>
                      <span
                        className="display"
                        style={{ fontSize: '1.4rem', lineHeight: 1.2, color: 'var(--ink)', marginTop: 6 }}
                      >
                        {a.statBot}
                      </span>
                      <span className="stat-sub">{a.statBotLabel}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="stack gap-2">
              <h3 className="display d3" style={{ maxWidth: '22ch' }}>
                {a.title}
              </h3>
              <ul className="stack gap-1" style={{ marginTop: 6 }}>
                {a.lines.map((line, j) => (
                  <li key={j} className="row start gap-2">
                    <span
                      className="dot"
                      style={{
                        marginTop: 10,
                        ['--tone' as string]: a.pinned ? 'var(--amber)' : 'var(--accent)',
                        width: 5,
                        height: 5,
                      }}
                    />
                    <span className="prose" style={{ fontSize: '0.94rem' }}>
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Activities */}
      <div className="stack gap-3" style={{ marginTop: 'clamp(50px, 8vw, 96px)' }}>
        <div className="row between wrap gap-2">
          <div className="stack gap-1">
            <span className="eyebrow">{t.eventsEn}</span>
            <h3 className="display d3">{t.eventsZh}</h3>
          </div>
          <span className="mono tiny">
            {isZh ? '最後更新' : 'Updated'} {latestUpdate(lang)}
          </span>
        </div>
        <p className="prose measure">{t.eventsDesc}</p>

        <Reveal variant="up" stagger={80} className="grid auto-fit-lg" style={{ marginTop: 12 }}>
          {activities.map((act, i) => (
            <article key={i} className="card card-hover stack gap-2">
              <span className="tag">{act.cat}</span>
              <h4 className="display d4" style={{ marginTop: 6 }}>
                {act.title}
              </h4>
              <dl className="stack gap-1" style={{ marginTop: 8 }}>
                {[
                  { icon: 'calendar' as const, label: act.date },
                  { icon: 'pin' as const, label: act.place },
                  { icon: 'team' as const, label: act.speaker },
                  { icon: 'bulb' as const, label: act.topic },
                ].map((row) => (
                  <div className="row gap-2 start" key={row.label}>
                    <span style={{ color: 'var(--accent)', display: 'inline-flex', marginTop: 3 }}>
                      <Icon name={row.icon} size={14} />
                    </span>
                    <span className="tiny" style={{ color: 'var(--body)' }}>
                      {row.label}
                    </span>
                  </div>
                ))}
              </dl>
              <div
                className="row between wrap gap-2"
                style={{ marginTop: 12, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}
              >
                <span className="mono tiny">{act.enrolled}</span>
                {act.link ? (
                  <a className="tlink" href={act.link} target="_blank" rel="noreferrer">
                    {act.status}
                    <Icon name="arrowUpRight" />
                  </a>
                ) : (
                  <span className="mono tiny">{act.status}</span>
                )}
              </div>
            </article>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
