import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ANNOUNCEMENTS_PATH, programPath } from '@/app/routes';
import { usePageTitle } from '@/app/site';
import { useHashScroll } from '@/app/hashScroll';
import { Reveal } from '@/motion/Reveal';
import { Icon } from '@/ui/Icon';
import { Section } from '@/ui/Section';
import { ChineseOnlyTag, LocalizedText, fallbackLangProps } from '@/ui/content';
import { useArchivePageCopy } from './archive/copy';
import { pinnedFirst, useDepartmentInfo, usePostsArchive, type ArchiveProgram } from './archive/data';
import { ArchiveSectionHead, EmptyNote, FramedImage, PageIntro } from './archive/parts';
import { PostList } from './archive/PostListing';

export const TRAINEE_NOTICES_CATEGORY = 'trainee-notices';
const NOTICE_LIMIT = 6;

function ProgramCard({ program, index }: { readonly program: ArchiveProgram; readonly index: number }) {
  const copy = useArchivePageCopy();
  return (
    <article className="card card-hover post-card archive-card archive-program-card">
      <FramedImage className="post-card-cover archive-card-cover" url={program.coverUrl} />
      <span className="index">{String(index + 1).padStart(2, '0')}</span>
      <h3 className="display d4" {...fallbackLangProps(program.title)}>
        <Link className="post-stretched-link" to={programPath(program.id)}>{program.title.text}</Link>
      </h3>
      <ChineseOnlyTag fallback={program.title.fallback} style={{ alignSelf: 'flex-start' }} />
      <LocalizedText as="p" className="tiny" value={program.summary} />
      <span className="tlink archive-card-more" aria-hidden="true">
        {copy.programOpen}
        <Icon name="arrow" />
      </span>
    </article>
  );
}

/** 學員專區: the latest trainee notices, then a card for each of the five programs. */
export function TraineesPage() {
  const copy = useArchivePageCopy();
  const archive = usePostsArchive();
  const { programs } = useDepartmentInfo();
  const notices = useMemo(
    () => pinnedFirst(archive.posts.filter((post) => post.categoryId === TRAINEE_NOTICES_CATEGORY)),
    [archive.posts],
  );

  usePageTitle(copy.traineesTitle);
  useHashScroll();

  return (
    <>
      <PageIntro eyebrow="Trainees" title={copy.traineesTitle} lede={copy.traineesLede} />

      <Section id="notices" tight>
        <ArchiveSectionHead
          eyebrow="Notices"
          title={copy.noticesTitle}
          aside={notices.length > 0 ? (
            <Link className="tlink" to={`${ANNOUNCEMENTS_PATH}?category=${TRAINEE_NOTICES_CATEGORY}`}>
              {copy.allNotices}
              <Icon name="arrow" />
            </Link>
          ) : undefined}
        />
        {notices.length === 0 ? (
          <EmptyNote>{copy.noticesEmpty}</EmptyNote>
        ) : (
          <PostList posts={notices.slice(0, NOTICE_LIMIT)} categories={[]} />
        )}
      </Section>

      <Section id="programs" tight>
        <ArchiveSectionHead eyebrow="Programs" title={copy.programsTitle} />
        <Reveal variant="up" stagger={70} className="archive-card-grid">
          {programs.map((program, index) => <ProgramCard key={program.id} program={program} index={index} />)}
        </Reveal>
      </Section>
    </>
  );
}
