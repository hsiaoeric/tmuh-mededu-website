import { Navigate, useParams } from 'react-router-dom';
import { DEPARTMENT_PATH, programPath } from '@/app/routes';
import { usePageTitle } from '@/app/site';
import { isProgramId } from '@/content/contracts/archiveIds';
import { Reveal } from '@/motion/Reveal';
import {
  ChineseOnlyTag,
  ContentBlocks,
  LocalizedText,
  fallbackLangProps,
  formatArchiveDate,
  ownerTone,
} from '@/ui/content';
import { NotFound } from './NotFound';
import { useArchivePageCopy } from './archive/copy';
import { ownerPath, useDepartmentInfo, useOwnerLabels, type ArchiveProgram, type DepartmentPage } from './archive/data';
import { BackLink, FramedImage, toneStyle } from './archive/parts';

/** Where a program page is shown on its program's page. */
function programAnchor(page: DepartmentPage, program: ArchiveProgram | undefined): string {
  if (program?.outcomesPageId === page.id) return '#outcomes';
  if (program?.schedulePageId === page.id) return '#schedule';
  return '';
}

/**
 * One undated department page: a message, the team or faculty introduction, a committee, or a
 * center's legacy introduction. A program page lives on its program's page, so it redirects there.
 */
export function DepartmentPageDetail() {
  const { pageId } = useParams();
  const { pages, programs } = useDepartmentInfo();
  const page = pages.find((candidate) => candidate.id === pageId);

  if (page === undefined) return <NotFound />;
  if (page.section === 'program' && page.owner !== null && isProgramId(page.owner)) {
    const owner = page.owner;
    const program = programs.find((candidate) => candidate.id === owner);
    return <Navigate replace to={`${programPath(owner)}${programAnchor(page, program)}`} />;
  }
  return <PageDetail key={page.id} page={page} />;
}

function PageDetail({ page }: { readonly page: DepartmentPage }) {
  const copy = useArchivePageCopy();
  const ownerLabel = useOwnerLabels();
  const owner = page.section === 'center' && page.owner !== null ? page.owner : null;
  const back = owner !== null
    ? { to: ownerPath(owner), label: copy.backToCenter(ownerLabel(owner)) }
    : {
        to: page.section === 'committee' ? `${DEPARTMENT_PATH}#committees` : DEPARTMENT_PATH,
        label: copy.backToDepartment,
      };

  usePageTitle(page.title.text);

  return (
    <article className="archive-detail" style={toneStyle(ownerTone(owner))}>
      <header className="archive-intro">
        <div className="shell stack gap-3">
          <Reveal variant="fade">
            <BackLink to={back.to}>{back.label}</BackLink>
          </Reveal>
          {page.subtitle !== null && <LocalizedText className="eyebrow" value={page.subtitle} />}
          <h1 className="display d2 title-measure archive-detail-title" {...fallbackLangProps(page.title)}>
            {page.title.text}
          </h1>
          <ChineseOnlyTag fallback={page.title.fallback || page.body.fallback} style={{ alignSelf: 'flex-start' }} />
          {page.summary !== null && <LocalizedText as="p" className="lede measure" value={page.summary} />}
          {page.updatedOn !== null && (
            <span className="mono tiny">
              {copy.updatedOn} <time dateTime={page.updatedOn}>{formatArchiveDate(page.updatedOn)}</time>
            </span>
          )}
        </div>
      </header>

      <div className="shell archive-detail-body">
        <div className={page.portraitUrl !== null ? 'archive-detail-with-portrait' : undefined}>
          <FramedImage as="figure" className="archive-detail-portrait" url={page.portraitUrl} alt={page.title.text} />
          <div className="measure">
            <ContentBlocks blocks={page.body.blocks} fallback={page.body.fallback} videoTitle={page.title.text} />
          </div>
        </div>
      </div>
    </article>
  );
}
