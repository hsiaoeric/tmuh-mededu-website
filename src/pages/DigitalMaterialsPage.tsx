import { Link } from 'react-router-dom';
import { useSite, usePageTitle } from '@/app/site';
import { useHashScroll } from '@/app/hashScroll';
import { usePublicContentDocument } from '@/content';
import { Reveal } from '@/motion/Reveal';
import { Icon } from '@/ui/Icon';
import { Section } from '@/ui/Section';
import { ChineseOnlyTag, ContentBlocks } from '@/ui/content';
import { ArchiveSectionHead, PageIntro } from './archive/parts';
import { useDepartmentInfo, useGalleryLibrary, usePostsArchive } from './archive/data';
import { CenterArchiveSections } from './centers/CenterArchiveSections';

const OWNER = 'digital_materials';

/**
 * 數位教材室: the studio's introduction (its imported information page, when there is one), then
 * its articles, albums, and videos. Until any of that exists, the page keeps the digital_materials
 * document's "under construction" notice rather than shipping an empty shell.
 */
export function DigitalMaterialsPage() {
  const { lang } = useSite();
  const content = usePublicContentDocument('digital_materials', 'page', lang).value;
  const posts = usePostsArchive().posts;
  const { pages } = useDepartmentInfo();
  const { albums, videos } = useGalleryLibrary();
  usePageTitle(content.title);
  useHashScroll();

  const ownerPages = pages.filter((page) => page.section === 'center' && page.owner === OWNER);
  const intro = ownerPages[0];
  const hasArchive = ownerPages.length > 0
    || posts.some((post) => post.channel === 'center' && post.owner === OWNER)
    || albums.some((album) => album.owner === OWNER)
    || videos.some((video) => video.owner === OWNER);

  return (
    <div style={hasArchive ? undefined : { minHeight: '78vh' }}>
      <PageIntro eyebrow={content.eyebrow} title={content.title}>
        {!hasArchive && (
          <Reveal variant="up" delay={200}>
            <div className="panel stack gap-2" style={{ maxWidth: 560 }}>
              <span className="row gap-2" style={{ color: 'var(--accent)' }}>
                <Icon name="clipboard" size={16} />
                <span className="eyebrow" style={{ color: 'var(--accent)' }}>
                  {content.status}
                </span>
              </span>
              <p className="tiny">{content.body}</p>
            </div>
          </Reveal>
        )}
        {!hasArchive && (
          <Reveal variant="up" delay={300}>
            <Link className="btn btn-ghost" to="/" style={{ alignSelf: 'flex-start' }}>
              {content.backLabel}
              <Icon name="arrow" />
            </Link>
          </Reveal>
        )}
      </PageIntro>

      {intro !== undefined && (
        <Section id="intro" tight>
          <ArchiveSectionHead eyebrow="About" title={intro.title.text} titleLang={intro.title.fallback ? 'zh-Hant' : undefined} />
          <div className="measure stack gap-2">
            <ChineseOnlyTag fallback={intro.title.fallback || intro.body.fallback} style={{ alignSelf: 'flex-start' }} />
            <ContentBlocks blocks={intro.body.blocks} fallback={intro.body.fallback} headingLevel={3} videoTitle={intro.title.text} />
          </div>
        </Section>
      )}

      <CenterArchiveSections owner={OWNER} excludePageIds={intro === undefined ? [] : [intro.id]} />
    </div>
  );
}
