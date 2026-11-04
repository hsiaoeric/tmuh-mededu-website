import { useMemo } from 'react';
import { useSite, usePageTitle } from '@/app/site';
import { useHashScroll } from '@/app/hashScroll';
import { Section } from '@/ui/Section';
import { HonorsDetail } from './home/Honors';
import { useArchivePageCopy } from './archive/copy';
import { usePostsArchive } from './archive/data';
import { ArchiveSectionHead, EmptyNote } from './archive/parts';
import { PostListing } from './archive/PostListing';

const PAGE_SIZE = 12;
const BOARD_HEADING_ID = 'board-heading';

/** 品質榮譽 (SNQ, NHQA) from the honors document, then the dated 榮譽榜 archive at `#board`. */
export function HonorsPage() {
  const { isZh } = useSite();
  const copy = useArchivePageCopy();
  const archive = usePostsArchive();
  const categories = useMemo(
    () => archive.categories.filter((category) => category.channel === 'honors'),
    [archive.categories],
  );
  const posts = useMemo(() => archive.posts.filter((post) => post.channel === 'honors'), [archive.posts]);

  usePageTitle(isZh ? '品質榮譽' : 'Quality Honors');
  useHashScroll();

  return (
    <div style={{ paddingTop: 'var(--nav-h)' }}>
      <HonorsDetail />

      <Section id="board" tight>
        <ArchiveSectionHead id={BOARD_HEADING_ID} eyebrow="Honor Board" title={copy.boardTitle} desc={copy.boardDesc} />
        {posts.length === 0 ? (
          <EmptyNote>{copy.boardEmpty}</EmptyNote>
        ) : (
          <PostListing
            posts={posts}
            categories={categories}
            pageSize={PAGE_SIZE}
            view="cards"
            listId={BOARD_HEADING_ID}
            label={copy.boardTitle}
          />
        )}
      </Section>
    </div>
  );
}
