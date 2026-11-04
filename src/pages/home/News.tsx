import { Link } from 'react-router-dom';
import { useSite } from '@/app/site';
import { ANNOUNCEMENTS_PATH, postPath } from '@/app/routes';
import { usePublicContentDocument } from '@/content';
import { Reveal } from '@/motion/Reveal';
import { Section, SectionHeader } from '@/ui/Section';
import { ActivityCard, AnnouncementRow } from '@/ui/NewsParts';
import { Icon } from '@/ui/Icon';
import { PostIndexRow } from '@/ui/content/PostCard';
import { latestAnnouncements } from './latestAnnouncements';

const LATEST_COUNT = 6;

export function News() {
  const { t, isZh, lang } = useSite();
  const news = usePublicContentDocument('news', 'announcements', lang).value;
  const announcements = news.department.slice(0, 3);
  const activities = usePublicContentDocument('activities', 'calendar', lang).value.department;
  const archive = usePublicContentDocument('posts', 'archive', lang).value;
  const latest = latestAnnouncements(archive.posts, LATEST_COUNT);
  const categoryLabel = new Map(archive.categories.map((category) => [category.id, category.label]));

  return (
    <Section id="news">
      <SectionHeader
        index="03"
        eyebrow={t.newsEn}
        title={t.newsZh}
        desc={t.newsDesc}
        aside={
          <div className="row gap-2 wrap">
            <Link className="tlink" to={ANNOUNCEMENTS_PATH}>
              {isZh ? '所有公告' : 'All announcements'}
              <Icon name="arrow" />
            </Link>
            <a className="tlink" href={news.announcementBoardUrl} target="_blank" rel="noreferrer">
              {isZh ? '常用看板' : 'Public board'}
              <Icon name="arrowUpRight" />
            </a>
          </div>
        }
      />

      <div className="stack" style={{ gap: 0 }}>
        {announcements.map((a, i) => (
          <AnnouncementRow key={`${a.title}-${i}`} item={a} />
        ))}
      </div>

      {/* The newest archive posts, pinned ones first. Stands down when the
          archive has nothing in the announcements channel yet. */}
      {latest.length > 0 && (
        <section
          className="stack gap-3"
          aria-labelledby="news-latest-title"
          style={{ marginTop: 'clamp(50px, 8vw, 96px)' }}
        >
          <div className="row between wrap gap-2">
            <div className="stack gap-1">
              <span className="eyebrow">Latest</span>
              {/* 近期公告, not 最新公告: the section title above already says that. */}
              <h3 id="news-latest-title" className="display d3">{isZh ? '近期公告' : 'Latest announcements'}</h3>
            </div>
            <Link className="tlink" to={ANNOUNCEMENTS_PATH}>
              {isZh ? '全部公告' : 'All announcements'}
              <Icon name="arrow" />
            </Link>
          </div>
          <div className="stack" style={{ gap: 0 }}>
            {latest.map((post) => (
              <PostIndexRow
                key={post.id}
                post={post}
                to={postPath(post)}
                category={categoryLabel.get(post.categoryId) ?? null}
                headingAs="h4"
              />
            ))}
          </div>
        </section>
      )}

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
              {isZh ? '最後更新' : 'Updated'} {news.latestUpdate}
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
