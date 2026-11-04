import { useEffect, useId, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { publicCenterById, publicCenterExternalUrl, usePublicCenters } from '@/app/publicCenters';
import { useSite } from '@/app/site';
import { useGoToSection } from '@/app/navigation';
import {
  ANNOUNCEMENTS_PATH,
  CENTER_ORDER,
  DEPARTMENT_PATH,
  DIGITAL_MATERIALS_PATH,
  EPORTFOLIO_URL,
  GALLERY_PATH,
  HONORS_PATH,
  RESOURCES_PATH,
  TRAINEES_PATH,
  VIDEOS_PATH,
  centerPath,
  programPath,
} from '@/app/routes';
import { usePublicContentDocument } from '@/content';
import { setScrollLocked } from '@/motion/smoothScroll';
import { assetUrl } from '@/utils/asset';
import { fallbackLangProps } from './content/Localized';
import { CenterLink } from './CenterLink';
import { NavCentersMenu } from './NavCentersMenu';
import { NavMenu, NavMenuItemBody } from './NavMenu';
import { currentProps, isWithin } from './navActive';
import { useNavCopy } from './navCopy';
import { Icon } from './Icon';
import { useMediaQuery } from './useMediaQuery';

/** Pages gathered under 更多 ▾; the trigger lights up on any of them. */
const MORE_SECTIONS = [GALLERY_PATH, VIDEOS_PATH, RESOURCES_PATH] as const;

function SheetGroup({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  const labelId = useId();
  return (
    <div className="sheet-group" role="group" aria-labelledby={labelId}>
      <div id={labelId} className="eyebrow sheet-label">{label}</div>
      {children}
    </div>
  );
}

export function Nav() {
  const { isZh, lang, t, theme, toggleLang, toggleTheme } = useSite();
  const copy = useNavCopy();
  const centers = usePublicCenters(lang);
  const programs = usePublicContentDocument('department_info', 'directory', lang).value.programs;
  const goToSection = useGoToSection();
  const { pathname } = useLocation();
  const narrow = useMediaQuery('(max-width: 780px)');
  const [scrolled, setScrolled] = useState(false);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setScrollLocked(sheet);
    return () => setScrollLocked(false);
  }, [sheet]);

  useEffect(() => {
    setSheet(false);
  }, [pathname]);

  // The sheet only exists in the narrow layout; widening the window closes it.
  useEffect(() => {
    if (!narrow) setSheet(false);
  }, [narrow]);

  const closeSheet = () => setSheet(false);
  const jump = (id: string) => {
    setSheet(false);
    goToSection(id);
  };
  const moreActive = MORE_SECTIONS.some((section) => isWithin(pathname, section));
  const external = `${copy.eportfolio} ${copy.opensInNewTab}`;

  return (
    <>
      <header className="nav" data-scrolled={scrolled}>
        <div className="nav-inner">
          <Link to="/" className="brand" aria-label={t.footBrand}>
            <img className="brand-mark" src={assetUrl('assets/tmuh-logo.svg')} alt="" />
            <span className="brand-text">
              <span className="brand-zh">
                <span className="brand-full">{t.brand1}</span>
                <span className="brand-short">{isZh ? '北醫附醫' : 'TMU Hospital'}</span>
              </span>
              <span className="brand-en">
                {t.brand2}
              </span>
            </span>
          </Link>

          {!narrow && <nav className="nav-links" aria-label={copy.mainMenu}>
            <Link className="nav-link" to={DEPARTMENT_PATH} {...currentProps(pathname, DEPARTMENT_PATH)}>
              {copy.department}
            </Link>
            <NavCentersMenu centers={centers} onNavigate={closeSheet} />
            <Link className="nav-link" to={ANNOUNCEMENTS_PATH} {...currentProps(pathname, ANNOUNCEMENTS_PATH)}>
              {t.navNews}
            </Link>
            <Link className="nav-link" to={TRAINEES_PATH} {...currentProps(pathname, TRAINEES_PATH)}>
              {copy.trainees}
            </Link>
            {/* Below the collapse breakpoint (base.css) this link hides and its twin in 更多 shows. */}
            <Link className="nav-link nav-link-honors" to={HONORS_PATH} {...currentProps(pathname, HONORS_PATH)}>
              {copy.honors}
            </Link>
            <NavMenu
              label={copy.more}
              active={moreActive}
              panelClassName="nav-menu-panel-more"
              onNavigate={closeSheet}
            >
              <Link
                className="nav-menu-item nav-menu-item-honors"
                to={HONORS_PATH}
                {...currentProps(pathname, HONORS_PATH)}
              >
                <NavMenuItemBody title={copy.honors} sub={copy.honorsAlt} />
              </Link>
              <Link className="nav-menu-item" to={GALLERY_PATH} {...currentProps(pathname, GALLERY_PATH)}>
                <NavMenuItemBody title={copy.gallery} sub={copy.galleryAlt} />
              </Link>
              <Link className="nav-menu-item" to={VIDEOS_PATH} {...currentProps(pathname, VIDEOS_PATH)}>
                <NavMenuItemBody title={copy.videos} sub={copy.videosAlt} />
              </Link>
              <Link className="nav-menu-item" to={RESOURCES_PATH} {...currentProps(pathname, RESOURCES_PATH)}>
                <NavMenuItemBody title={copy.resources} sub={copy.resourcesAlt} />
              </Link>
              <a
                className="nav-menu-item"
                href={EPORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={external}
              >
                <NavMenuItemBody title={copy.eportfolio} sub={copy.eportfolioAlt} external />
              </a>
              <button type="button" className="nav-menu-item nav-menu-item-divided" onClick={() => jump('contact')}>
                <NavMenuItemBody title={t.navContact} sub={copy.contactAlt} />
              </button>
            </NavMenu>
          </nav>}

          <div className="nav-tools">
            <button
              className="pill"
              onClick={toggleLang}
              aria-label={isZh ? 'Switch to English' : '切換為中文'}
            >
              {t.langBtn}
            </button>
            <button
              className="pill"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark'
                  ? isZh
                    ? '切換至淺色主題'
                    : 'Switch to light theme'
                  : isZh
                    ? '切換至深色主題'
                    : 'Switch to dark theme'
              }
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            {narrow && <button
              className="pill nav-burger"
              onClick={() => setSheet((s) => !s)}
              aria-expanded={sheet}
              aria-label={copy.menu}
            >
              <Icon name={sheet ? 'close' : 'menu'} />
            </button>}
          </div>
        </div>
      </header>

      {narrow && sheet && (
        <div className="nav-sheet">
          {/*
            Scroll lives on this inner layer, not the fixed shell.
            `data-lenis-prevent` tells Lenis to let native touch scroll through
            while the page behind stays frozen by lenis.stop().
          */}
          <div
            className="nav-sheet-scroller"
            data-lenis-prevent
            data-lenis-prevent-touch
          >
            <nav className="nav-sheet-inner" aria-label={copy.siteMenu}>
              <SheetGroup label={copy.department}>
                <Link
                  className="sheet-main"
                  to={DEPARTMENT_PATH}
                  {...currentProps(pathname, DEPARTMENT_PATH)}
                  onClick={closeSheet}
                >
                  {copy.departmentIntro}
                </Link>
              </SheetGroup>

              <SheetGroup label={copy.centers}>
                {CENTER_ORDER.map((id) => {
                  const c = publicCenterById(centers, id);
                  const externalUrl = publicCenterExternalUrl(c, isZh);
                  return (
                    <CenterLink
                      key={id}
                      id={id}
                      externalUrl={externalUrl}
                      className="sheet-sub"
                      {...(externalUrl === undefined ? currentProps(pathname, centerPath(id)) : {})}
                      onClick={closeSheet}
                    >
                      <span className="dot" style={{ ['--tone' as string]: c.color }} aria-hidden="true" />
                      {isZh ? c.zh : c.en}
                      {externalUrl && ' ↗'}
                    </CenterLink>
                  );
                })}
                <Link
                  className="sheet-sub"
                  to={DIGITAL_MATERIALS_PATH}
                  {...currentProps(pathname, DIGITAL_MATERIALS_PATH)}
                  onClick={closeSheet}
                >
                  <span className="dot" aria-hidden="true" />
                  {copy.digitalMaterials}
                </Link>
              </SheetGroup>

              <SheetGroup label={copy.newsAndHonors}>
                <Link
                  className="sheet-main"
                  to={ANNOUNCEMENTS_PATH}
                  {...currentProps(pathname, ANNOUNCEMENTS_PATH)}
                  onClick={closeSheet}
                >
                  {copy.announcementsFull}
                </Link>
                <Link
                  className="sheet-main"
                  to={HONORS_PATH}
                  {...currentProps(pathname, HONORS_PATH)}
                  onClick={closeSheet}
                >
                  {copy.honors}
                </Link>
              </SheetGroup>

              <SheetGroup label={copy.trainees}>
                <Link
                  className="sheet-main"
                  to={TRAINEES_PATH}
                  aria-current={pathname === TRAINEES_PATH ? 'page' : undefined}
                  data-active={pathname === TRAINEES_PATH}
                  onClick={closeSheet}
                >
                  {copy.traineesHub}
                </Link>
                {programs.map((program) => (
                  <Link
                    key={program.id}
                    className="sheet-sub"
                    to={programPath(program.id)}
                    {...currentProps(pathname, programPath(program.id))}
                    {...fallbackLangProps(program.title)}
                    onClick={closeSheet}
                  >
                    {program.title.text}
                  </Link>
                ))}
              </SheetGroup>

              <SheetGroup label={copy.more}>
                <Link className="sheet-sub" to={GALLERY_PATH} {...currentProps(pathname, GALLERY_PATH)} onClick={closeSheet}>
                  {copy.gallery}
                </Link>
                <Link className="sheet-sub" to={VIDEOS_PATH} {...currentProps(pathname, VIDEOS_PATH)} onClick={closeSheet}>
                  {copy.videos}
                </Link>
                <Link className="sheet-sub" to={RESOURCES_PATH} {...currentProps(pathname, RESOURCES_PATH)} onClick={closeSheet}>
                  {copy.resources}
                </Link>
                <a
                  className="sheet-sub"
                  href={EPORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={external}
                  onClick={closeSheet}
                >
                  {copy.eportfolio} ↗
                </a>
                <Link
                  className="sheet-sub"
                  to="/#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    jump('contact');
                  }}
                >
                  {t.navContact}
                </Link>
              </SheetGroup>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
