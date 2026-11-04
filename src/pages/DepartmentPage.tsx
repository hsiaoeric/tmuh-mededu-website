import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { publicCenterById, usePublicCenters } from '@/app/publicCenters';
import { departmentPagePath } from '@/app/routes';
import { useSite, usePageTitle } from '@/app/site';
import { useHashScroll } from '@/app/hashScroll';
import { Reveal } from '@/motion/Reveal';
import { Icon } from '@/ui/Icon';
import { PersonCard, PersonRoster } from '@/ui/Person';
import { Section } from '@/ui/Section';
import { ChineseOnlyTag, LocalizedText, fallbackLangProps } from '@/ui/content';
import { useArchivePageCopy } from './archive/copy';
import { useDepartmentInfo, type DepartmentPage as DepartmentInfoPage } from './archive/data';
import { ArchiveSectionHead, FramedImage, PageIntro } from './archive/parts';

/** The imported page that carries the old site's 團隊介紹 roster. */
export const ADMINISTRATIVE_TEAM_PAGE_ID = 'administrative-team';

/** Leadership keeps portraits; the rest of the admin team reads as a duty roster, as on home. */
const LEADERSHIP_COUNT = 5;

function isMessage(page: DepartmentInfoPage): boolean {
  return page.id.endsWith('-message');
}

/** A department page as a card linking to its detail page. */
export function DepartmentPageCard({ page, headingAs: Heading = 'h3' }: {
  readonly page: DepartmentInfoPage;
  readonly headingAs?: 'h3' | 'h4';
}) {
  const copy = useArchivePageCopy();
  return (
    <article className="card card-hover archive-page-card">
      <FramedImage className="archive-page-portrait" url={page.portraitUrl} />
      <div className="stack gap-2" style={{ minWidth: 0 }}>
        {page.subtitle !== null && <LocalizedText className="eyebrow" value={page.subtitle} />}
        <Heading className="display d4" {...fallbackLangProps(page.title)}>
          <Link className="post-stretched-link" to={departmentPagePath(page.id)}>{page.title.text}</Link>
        </Heading>
        <ChineseOnlyTag fallback={page.title.fallback} style={{ alignSelf: 'flex-start' }} />
        {page.summary !== null && <LocalizedText as="p" className="tiny" value={page.summary} />}
        <span className="tlink archive-card-more" aria-hidden="true">
          {copy.readMore}
          <Icon name="arrow" />
        </span>
      </div>
    </article>
  );
}

/**
 * 教學部: messages from leadership, the administrative team (the people directory, as the home
 * org panel shows it), teaching faculty and leads, and the committees. Sections without content
 * are left out; `#team` and `#committees` are the anchors old-site redirects land on.
 */
export function DepartmentPage() {
  const { lang } = useSite();
  const copy = useArchivePageCopy();
  const { pages } = useDepartmentInfo();
  const admin = publicCenterById(usePublicCenters(lang), 'admin');

  const about = useMemo(() => pages.filter((page) => page.section === 'about'), [pages]);
  const messages = about.filter(isMessage);
  const teamPage = about.find((page) => page.id === ADMINISTRATIVE_TEAM_PAGE_ID);
  const faculty = about.filter((page) => !isMessage(page) && page.id !== ADMINISTRATIVE_TEAM_PAGE_ID);
  const committees = useMemo(() => pages.filter((page) => page.section === 'committee'), [pages]);

  const leadership = admin.people.slice(0, LEADERSHIP_COUNT);
  const specialists = admin.people.slice(LEADERSHIP_COUNT);

  usePageTitle(copy.departmentTitle);
  useHashScroll();

  return (
    <>
      <PageIntro eyebrow={copy.departmentEyebrow} title={copy.departmentTitle} lede={copy.departmentLede} />

      {messages.length > 0 && (
        <Section id="messages" tight>
          <ArchiveSectionHead eyebrow="Messages" title={copy.messagesTitle} />
          <Reveal variant="up" stagger={80} className="grid g2">
            {messages.map((page) => <DepartmentPageCard key={page.id} page={page} />)}
          </Reveal>
        </Section>
      )}

      <Section id="team" tight>
        <ArchiveSectionHead
          eyebrow="Team"
          title={copy.teamTitle}
          desc={copy.teamDesc}
          aside={teamPage !== undefined ? (
            <Link className="tlink" to={departmentPagePath(teamPage.id)}>
              {copy.teamRosterPage}
              <Icon name="arrow" />
            </Link>
          ) : undefined}
        />
        <div className="stack gap-4" style={{ ['--tone' as string]: admin.color, ['--tone-text' as string]: `color-mix(in srgb, ${admin.color} 60%, var(--ink))` }}>
          <Reveal variant="up" stagger={60} className="grid grid-people">
            {leadership.map((person, index) => (
              <PersonCard key={`${person.en}-${index}`} person={person} accent={admin.color} />
            ))}
          </Reveal>
          {specialists.length > 0 && (
            <div className="stack gap-2">
              <div className="row between baseline gap-2">
                <h3 className="eyebrow" style={{ color: 'var(--tone-text)' }}>{copy.teamSpecialists}</h3>
                <span className="eyebrow roster-contact-label">{copy.teamContactColumn}</span>
              </div>
              <PersonRoster people={[...specialists]} accent={admin.color} showDuty showContact />
            </div>
          )}
        </div>
      </Section>

      {faculty.length > 0 && (
        <Section id="faculty" tight>
          <ArchiveSectionHead eyebrow="Faculty" title={copy.facultyTitle} />
          <Reveal variant="up" stagger={80} className="grid auto-fit-lg">
            {faculty.map((page) => <DepartmentPageCard key={page.id} page={page} />)}
          </Reveal>
        </Section>
      )}

      {committees.length > 0 && (
        <Section id="committees" tight>
          <ArchiveSectionHead eyebrow="Committees" title={copy.committeesTitle} desc={copy.committeesDesc} />
          <Reveal variant="up" stagger={80} className="grid auto-fit-lg">
            {committees.map((page) => <DepartmentPageCard key={page.id} page={page} />)}
          </Reveal>
        </Section>
      )}
    </>
  );
}
