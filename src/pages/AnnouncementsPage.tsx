import { useMemo } from 'react';
import { useSite, usePageTitle } from '@/app/site';
import { useHashScroll } from '@/app/hashScroll';
import { usePublicContentDocument } from '@/content';
import { Section } from '@/ui/Section';
import { ActivityCard, AnnouncementRow } from '@/ui/NewsParts';
import { Reveal } from '@/motion/Reveal';
import { Icon } from '@/ui/Icon';
import { useArchivePageCopy } from './archive/copy';
import { usePostsArchive } from './archive/data';
import { ArchiveSectionHead, EmptyNote, PageIntro } from './archive/parts';
import { PostListing } from './archive/PostListing';

const PAGE_SIZE = 12;
const ARCHIVE_HEADING_ID = 'archive-heading';

/**
 * 公告: the curated highlight cards from the `news` document on top, then the full dated archive
 * (posts in the news channel) with category, year, and text filters, then upcoming events.
 */
export function AnnouncementsPage() {
  const { lang } = useSite();
  const copy = useArchivePageCopy();
  const news = usePublicContentDocument('news', 'announcements', lang).value;
  const activities = usePublicContentDocument('activities', 'calendar', lang).value.department;
  const archive = usePostsArchive();
  const categories = useMemo(
    () => archive.categories.filter((category) => category.channel === 'news'),
    [archive.categories],
  );
  const posts = useMemo(() => archive.posts.filter((post) => post.channel === 'news'), [archive.posts]);

  usePageTitle(copy.announcementsTitle);
  useHashScroll();

  return (
    <>
      <PageIntro
        eyebrow="Announcements"
        title={copy.announcementsTitle}
        lede={copy.announcementsLede}
        aside={
          <a className="tlink" href={news.announcementBoardUrl} target="_blank" rel="noreferrer">
            {copy.publicBoard}
            <Icon name="arrowUpRight" />
          </a>
        }
      />

      {news.department.length > 0 && (
        <Section id="highlights" tight>
          <ArchiveSectionHead eyebrow="Highlights" title={copy.highlightsTitle} />
          <div className="stack" style={{ gap: 0 }}>
            {news.department.map((item, index) => (
              <AnnouncementRow key={`${item.title}-${index}`} item={item} />
            ))}
          </div>
        </Section>
      )}

      <Section id="archive" tight>
        <ArchiveSectionHead id={ARCHIVE_HEADING_ID} eyebrow="Archive" title={copy.archiveTitle} />
        {posts.length === 0 ? (
          <EmptyNote>{copy.archiveEmpty}</EmptyNote>
        ) : (
          <PostListing
            posts={posts}
            categories={categories}
            pageSize={PAGE_SIZE}
            listId={ARCHIVE_HEADING_ID}
            label={copy.archiveTitle}
          />
        )}
      </Section>

      {activities.length > 0 && (
        <Section id="events" tight>
          <ArchiveSectionHead eyebrow="Events" title={copy.eventsTitle} />
          <Reveal variant="up" stagger={80} className="grid auto-fit-lg">
            {activities.map((item, index) => (
              <ActivityCard key={index} item={item} />
            ))}
          </Reveal>
        </Section>
      )}
    </>
  );
}
