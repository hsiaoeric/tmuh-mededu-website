import { useMemo, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TRAINEES_PATH } from '@/app/routes';
import { usePageTitle } from '@/app/site';
import { useHashScroll } from '@/app/hashScroll';
import { isProgramId, type ProgramId } from '@/content/contracts/archiveIds';
import { Reveal } from '@/motion/Reveal';
import { scrollToId } from '@/motion/smoothScroll';
import { Section } from '@/ui/Section';
import { ChineseOnlyTag, ContentBlocks, LocalizedText } from '@/ui/content';
import { NotFound } from './NotFound';
import { useArchivePageCopy } from './archive/copy';
import {
  pinnedFirst,
  useDepartmentInfo,
  useGalleryLibrary,
  usePostsArchive,
  type ArchiveProgram,
  type DepartmentPage,
} from './archive/data';
import {
  AlbumCard,
  ArchiveSectionHead,
  DownloadList,
  EmptyNote,
  LinkGroupList,
  PageIntro,
  VideoCard,
  useShowMore,
} from './archive/parts';
import { PostList } from './archive/PostListing';

const POST_LIMIT = 6;
const VIDEO_LIMIT = 6;

/** In-page anchors of a program page, in page order. Old-site program links land on these. */
export const PROGRAM_SECTIONS = ['intro', 'outcomes', 'schedule', 'notices', 'albums', 'videos', 'links', 'downloads'] as const;
type ProgramSection = (typeof PROGRAM_SECTIONS)[number];

/** 學員專區 › one program; rejects anything that is not one of the five program ids. */
export function ProgramPage() {
  const { programId } = useParams();
  const { programs } = useDepartmentInfo();
  const program = programId !== undefined && isProgramId(programId)
    ? programs.find((candidate) => candidate.id === programId)
    : undefined;
  if (program === undefined) return <NotFound />;
  return <Program key={program.id} program={program} />;
}

function PageBody({ page }: { readonly page: DepartmentPage }) {
  return (
    <div className="measure stack gap-2">
      <ChineseOnlyTag fallback={page.body.fallback} style={{ alignSelf: 'flex-start' }} />
      <ContentBlocks blocks={page.body.blocks} fallback={page.body.fallback} headingLevel={3} videoTitle={page.title.text} />
    </div>
  );
}

function Program({ program }: { readonly program: ArchiveProgram }) {
  const copy = useArchivePageCopy();
  const info = useDepartmentInfo();
  const gallery = useGalleryLibrary();
  const archive = usePostsArchive();
  const id: ProgramId = program.id;

  const pageById = (pageId: string | null) => (pageId === null
    ? undefined
    : info.pages.find((page) => page.id === pageId && page.body.blocks.length > 0));
  const intro = pageById(program.introPageId);
  const outcomes = pageById(program.outcomesPageId);
  const schedule = pageById(program.schedulePageId);
  const albums = gallery.albums.filter((album) => album.owner === id);
  const videos = gallery.videos.filter((video) => video.owner === id);
  const posts = useMemo(
    () => pinnedFirst(archive.posts.filter((post) => post.audiences.includes(id))),
    [archive.posts, id],
  );
  const links = info.linkGroups.filter((group) => group.owner === id && group.links.length > 0);
  const downloads = info.downloads.filter((group) => group.owner === id && group.items.length > 0);
  const morePosts = useShowMore(posts, POST_LIMIT);
  const moreVideos = useShowMore(videos, VIDEO_LIMIT);

  const sections: Array<{
    readonly id: ProgramSection;
    readonly title: string;
    readonly titleLang?: 'zh-Hant';
    readonly eyebrow: string;
    readonly body: ReactNode;
  }> = [];
  if (intro !== undefined) {
    sections.push({
      id: 'intro',
      title: intro.title.text,
      titleLang: intro.title.fallback ? 'zh-Hant' : undefined,
      eyebrow: 'Introduction',
      body: <PageBody page={intro} />,
    });
  }
  if (outcomes !== undefined) sections.push({ id: 'outcomes', title: copy.outcomesTitle, eyebrow: 'Outcomes', body: <PageBody page={outcomes} /> });
  if (schedule !== undefined) sections.push({ id: 'schedule', title: copy.scheduleTitle, eyebrow: 'Schedule', body: <PageBody page={schedule} /> });
  if (posts.length > 0) {
    sections.push({
      id: 'notices',
      title: copy.programPostsTitle,
      eyebrow: 'Notices',
      body: <div className="stack gap-3"><PostList posts={morePosts.visible} categories={archive.categories} />{morePosts.toggle}</div>,
    });
  }
  if (albums.length > 0) {
    sections.push({
      id: 'albums',
      title: copy.albumsTitle,
      eyebrow: 'Photos',
      body: <ul className="archive-card-grid" role="list">{albums.map((album) => <li key={album.id}><AlbumCard album={album} /></li>)}</ul>,
    });
  }
  if (videos.length > 0) {
    sections.push({
      id: 'videos',
      title: copy.videosTitle,
      eyebrow: 'Videos',
      body: (
        <div className="stack gap-3">
          <ul className="archive-video-grid" role="list">{moreVideos.visible.map((video) => <li key={video.id}><VideoCard video={video} /></li>)}</ul>
          {moreVideos.toggle}
        </div>
      ),
    });
  }
  if (links.length > 0) sections.push({ id: 'links', title: copy.linksTitle, eyebrow: 'Links', body: <LinkGroupList groups={links} /> });
  if (downloads.length > 0) sections.push({ id: 'downloads', title: copy.downloadsTitle, eyebrow: 'Downloads', body: <DownloadList groups={downloads} /> });

  usePageTitle(program.title.text);
  useHashScroll();

  return (
    <>
      <PageIntro
        eyebrow="Trainees"
        title={program.title.text}
        titleLang={program.title.fallback ? 'zh-Hant' : undefined}
        lede={<LocalizedText as="p" className="lede measure" value={program.summary} />}
        back={{ to: TRAINEES_PATH, label: copy.backToTrainees }}
      >
        {sections.length > 1 && (
          <Reveal variant="fade" delay={240}>
            <nav aria-label={copy.programContents}>
              <ul className="row gap-1 wrap" role="list">
                {sections.map((section) => (
                  <li key={section.id}>
                    <Link className="pill archive-jump" to={{ hash: section.id }} preventScrollReset onClick={() => scrollToId(section.id)}>
                      {section.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>
        )}
      </PageIntro>

      {sections.length === 0 ? (
        <Section tight>
          <EmptyNote>{copy.programEmpty}</EmptyNote>
        </Section>
      ) : (
        sections.map((section) => (
          <Section key={section.id} id={section.id} tight>
            <ArchiveSectionHead eyebrow={section.eyebrow} title={section.title} titleLang={section.titleLang} />
            {section.body}
          </Section>
        ))
      )}
    </>
  );
}
