import { useState } from 'react';
import { useSite, usePageTitle } from '@/app/site';
import {
  ANN_URL,
  buildActivities,
  buildAnnouncementCategories,
  buildAnnouncements,
  type AnnouncementCategory,
} from '@/data/news';
import { Section, SectionHeader } from '@/ui/Section';
import { ActivityCard, AnnouncementRow } from '@/ui/NewsParts';
import { Reveal } from '@/motion/Reveal';
import { Icon } from '@/ui/Icon';

export function AnnouncementsPage() {
  const { isZh, lang } = useSite();
  const [category, setCategory] = useState<AnnouncementCategory | 'all'>('all');
  const announcements = buildAnnouncements(lang);
  const categories = buildAnnouncementCategories(lang);
  const visible =
    category === 'all'
      ? announcements
      : announcements.filter((item) => item.category === category);
  const activities = buildActivities(lang);

  usePageTitle(isZh ? '公告' : 'Announcements');

  return (
    <div style={{ paddingTop: 'var(--nav-h)' }}>
      <Section>
        <SectionHeader
          eyebrow="Announcements"
          title={isZh ? '公告' : 'Announcements'}
          desc={
            isZh
              ? '教學部最新消息、教育活動與常用資訊。'
              : 'Department news, education activities and frequently used information.'
          }
          aside={
            <a className="tlink" href={ANN_URL} target="_blank" rel="noreferrer">
              {isZh ? '對外看板' : 'Public board'}
              <Icon name="arrowUpRight" />
            </a>
          }
        />

        <Reveal variant="up" className="row gap-1 wrap" style={{ marginBottom: 'clamp(26px, 4vw, 48px)' }}>
          <button className="pill" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>
            {isZh ? '全部' : 'All'}
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              className="pill"
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </Reveal>

        <div className="stack" style={{ gap: 0 }}>
          {visible.map((item, index) => (
            <AnnouncementRow key={`${item.title}-${index}`} item={item} />
          ))}
        </div>

        {activities.length > 0 && (
          <div className="stack gap-3" style={{ marginTop: 'clamp(50px, 8vw, 96px)' }}>
            <div className="stack gap-1">
              <span className="eyebrow">Events</span>
              <h2 className="display d3">{isZh ? '近期活動' : 'Upcoming events'}</h2>
            </div>
            <Reveal variant="up" stagger={80} className="grid auto-fit-lg">
              {activities.map((item, index) => (
                <ActivityCard key={index} item={item} />
              ))}
            </Reveal>
          </div>
        )}
      </Section>
    </div>
  );
}
