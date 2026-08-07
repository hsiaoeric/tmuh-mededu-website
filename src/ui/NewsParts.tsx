import type { Activity, Announcement } from '@/data/news';
import { Reveal } from '@/motion/Reveal';
import { Icon } from './Icon';

/**
 * One announcement: tags and figures in a left column, the headline and its
 * bullets alongside. Shared by the department's home listing and the centre
 * pages that carry announcements of their own.
 */
export function AnnouncementRow({ item }: { item: Announcement }) {
  const tone = item.pinned ? 'var(--amber)' : 'var(--accent)';

  return (
    <Reveal
      variant="up"
      delay={item.delay}
      className="grid announcement-row"
      style={{
        ['--tone' as string]: tone,
      }}
    >
      <div className="stack gap-2">
        <div className="row gap-2 wrap">
          <span className="tag">{item.categoryLabel}</span>
          <span className="tag">
            {item.pinned && <Icon name="pin" size={11} />}
            {item.tag}
          </span>
        </div>
        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
          {item.date}
        </span>
        {item.statTop && (
          <div className="stack" style={{ gap: 2, marginTop: 8 }}>
            <span
              className="display"
              style={{
                fontSize: item.statFont === '26px' ? '1.6rem' : '2.6rem',
                lineHeight: 1,
                color: tone,
              }}
            >
              {item.statTop}
            </span>
            <span className="stat-sub">{item.statTopLabel}</span>
            {item.statBot && (
              <>
                <span
                  className="display"
                  style={{ fontSize: '1.4rem', lineHeight: 1.2, color: 'var(--ink)', marginTop: 6 }}
                >
                  {item.statBot}
                </span>
                <span className="stat-sub">{item.statBotLabel}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="stack gap-2">
        <h3 className="display d3 news-measure">{item.title}</h3>
        <ul className="stack gap-1" style={{ marginTop: 6 }}>
          {item.lines.map((line, j) => (
            <li key={j} className="row start gap-2">
              <span
                className="dot"
                style={{ marginTop: 10, ['--tone' as string]: tone, width: 5, height: 5 }}
              />
              <span className="prose" style={{ fontSize: '0.94rem' }}>
                {line}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

/** One upcoming course or talk, with its TMS enrolment link. */
export function ActivityCard({ item }: { item: Activity }) {
  return (
    <article className="card card-hover stack gap-2">
      <span className="tag">{item.cat}</span>
      <h4 className="display d4" style={{ marginTop: 6 }}>
        {item.title}
      </h4>
      <dl className="stack gap-1" style={{ marginTop: 8 }}>
        {[
          { icon: 'calendar' as const, label: item.date },
          { icon: 'pin' as const, label: item.place },
          { icon: 'team' as const, label: item.speaker },
          { icon: 'bulb' as const, label: item.topic },
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
        <span className="mono tiny">{item.enrolled}</span>
        {item.link ? (
          <a className="tlink" href={item.link} target="_blank" rel="noreferrer">
            {item.status}
            <Icon name="arrowUpRight" />
          </a>
        ) : (
          <span className="mono tiny">{item.status}</span>
        )}
      </div>
    </article>
  );
}
