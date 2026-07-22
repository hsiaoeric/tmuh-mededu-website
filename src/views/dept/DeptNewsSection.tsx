import { useSite } from '@/context/SiteContext';
import { buildActivities, buildAnnouncements, latestUpdate } from '@/data/news';
import { Icon, type IconName } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';

export function DeptNewsSection() {
  const { isZh, lang } = useSite();
  const activities = buildActivities(lang).slice(0, 2);
  const announcements = buildAnnouncements(lang).slice(0, 3);

  return (
    <section id="news" style={{ maxWidth: 1240, margin: '0 auto', padding: '34px 28px 46px' }}>
      <SectionHeading
        eyebrow="News & Events"
        title={isZh ? '最新消息' : 'Latest Updates'}
        desc={isZh ? '掌握教學部近期活動與重要公告。' : 'Recent activities and important announcements from the department.'}
      />
      <div className="grid grid-split" style={{ gap: 22, alignItems: 'start', marginTop: 26 }}>
        <div id="news-activities">
          <h3 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontSize: 20, color: 'var(--text)', marginBottom: 14 }}>
            {isZh ? '近期活動' : 'Activities'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {activities.map((activity, index) => (
              <Reveal
                key={`${activity.title}-${index}`}
                style={{
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-card)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '20px 22px' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--teal-700)' }}>{activity.cat}</span>
                  <h4 style={{ margin: '7px 0 13px', fontFamily: "'Noto Sans TC', sans-serif", fontSize: 18, color: 'var(--text)' }}>
                    {activity.title}
                  </h4>
                  {([
                    ['calendar', activity.date],
                    ['pin', activity.place],
                    ['brain', activity.speaker],
                  ] as const).map(([icon, text]) => (
                    <div key={icon} style={{ display: 'flex', gap: 9, marginTop: 8, fontSize: 13.5, color: 'var(--body)' }}>
                      <span style={{ width: 16, height: 16, flexShrink: 0, color: 'var(--teal)' }}>
                        <Icon name={icon as IconName} />
                      </span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '11px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  {activity.link ? (
                    <a
                      href={activity.link}
                      target="_blank"
                      rel="noopener"
                      style={{ color: 'var(--teal-700)', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}
                    >
                      {activity.status} ↗
                    </a>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: 12.5 }}>{activity.status}</span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div id="news-announcements">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <h3 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontSize: 20, color: 'var(--text)' }}>
              {isZh ? '最新公告' : 'Announcements'}
            </h3>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              {isZh ? '更新' : 'Updated'} {latestUpdate(lang)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcements.map((announcement, index) => (
              <Reveal
                key={`${announcement.title}-${index}`}
                delay={index * 60}
                style={{
                  padding: '18px 20px',
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: announcement.tagColor, background: announcement.tagBg }}>
                    {announcement.tag}
                  </span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: 'var(--muted)' }}>
                    {announcement.date}
                  </span>
                </div>
                <h4 style={{ fontFamily: "'Noto Sans TC', sans-serif", fontSize: 16.5, color: 'var(--text)', marginBottom: 6 }}>
                  {announcement.title}
                </h4>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--body)' }}>{announcement.lines[0]}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
