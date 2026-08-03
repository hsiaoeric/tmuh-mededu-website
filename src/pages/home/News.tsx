import { useSite } from '@/app/site';
import { ANN_URL, buildActivities, buildAnnouncements, latestUpdate } from '@/data/news';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { ActivityCard, AnnouncementRow } from '@/ui/NewsParts';
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
          <AnnouncementRow key={`${a.title}-${i}`} item={a} />
        ))}
      </div>

      {/* Activities. Centre-scoped ones live on their own centre page, so this
          block stands down entirely when nothing department-wide is running. */}
      {activities.length > 0 && (
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
              <ActivityCard key={i} item={act} />
            ))}
          </Reveal>
        </div>
      )}
    </Section>
  );
}
