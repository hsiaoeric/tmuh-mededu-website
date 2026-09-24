import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { publicCenterById, publicCenterExternalUrl, usePublicCenters } from '@/app/publicCenters';
import { useSite } from '@/app/site';
import { useGoToSection } from '@/app/navigation';
import { ANNOUNCEMENTS_PATH, CENTER_ORDER, DIGITAL_MATERIALS_PATH, HONORS_PATH, centerPath } from '@/app/routes';
import { setScrollLocked } from '@/motion/smoothScroll';
import { assetUrl } from '@/utils/asset';
import { CenterLink } from './CenterLink';
import { NavCentersMenu } from './NavCentersMenu';
import { Icon } from './Icon';
import { useMediaQuery } from './useMediaQuery';

interface SectionItem {
  readonly id: string;
  readonly label: string;
  readonly path?: string;
}

export function Nav() {
  const { isZh, lang, t, theme, toggleLang, toggleTheme } = useSite();
  const centers = usePublicCenters(lang);
  const goToSection = useGoToSection();
  const { pathname } = useLocation();
  const narrow = useMediaQuery('(max-width: 780px)');
  const [scrolled, setScrolled] = useState(false);
  const [sheet, setSheet] = useState(false);
  const sections: readonly SectionItem[] = [
    { id: 'about', label: t.navAbout },
    { id: 'organisation', label: t.navOrg },
    { id: 'news', label: t.navNews, path: ANNOUNCEMENTS_PATH },
    { id: 'honors', label: isZh ? '榮譽' : 'Honors', path: HONORS_PATH },
    { id: 'contact', label: t.navContact },
  ];

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

  const jump = (id: string) => {
    setSheet(false);
    goToSection(id);
  };

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

          {!narrow && <nav className="nav-links" aria-label={isZh ? '主選單' : 'Main menu'}>
            {sections.slice(0, 2).map((s) => (
              <button key={s.id} className="nav-link" onClick={() => jump(s.id)}>
                {s.label}
              </button>
            ))}
              <NavCentersMenu centers={centers} onNavigate={() => setSheet(false)} />
            <Link
              className="nav-link"
              to={DIGITAL_MATERIALS_PATH}
              data-active={pathname === DIGITAL_MATERIALS_PATH}
            >
              {isZh ? '數位教材室' : 'Digital Materials'}
            </Link>
            {sections.slice(2).map((s) =>
              s.path ? (
                <Link key={s.id} className="nav-link" to={s.path} data-active={pathname === s.path}>
                  {s.label}
                </Link>
              ) : (
                <button key={s.id} className="nav-link" onClick={() => jump(s.id)}>
                  {s.label}
                </button>
              ),
            )}
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
              aria-label={isZh ? '選單' : 'Menu'}
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
            <div className="nav-sheet-inner">
              {sections.slice(0, 2).map((s) => (
                <a
                  key={s.id}
                  className="sheet-main"
                  href={`/#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    jump(s.id);
                  }}
                >
                  {s.label}
                </a>
              ))}

              <div className="eyebrow sheet-label">{isZh ? '五大中心' : 'The Five Centers'}</div>
              {CENTER_ORDER.map((id) => {
                const c = publicCenterById(centers, id);
                const externalUrl = publicCenterExternalUrl(c, isZh);
                return (
                  <CenterLink
                    key={id}
                    id={id}
                    externalUrl={externalUrl}
                    className="sheet-sub"
                    data-active={pathname === centerPath(id)}
                    onClick={() => setSheet(false)}
                  >
                    {isZh ? c.zh : c.en}
                    {externalUrl && ' ↗'}
                  </CenterLink>
                );
              })}

              <Link
                className="sheet-main"
                to={DIGITAL_MATERIALS_PATH}
                data-active={pathname === DIGITAL_MATERIALS_PATH}
                onClick={() => setSheet(false)}
              >
                {isZh ? '數位教材室' : 'Digital Materials'}
              </Link>

              {sections.slice(2).map((s) =>
                s.path ? (
                  <Link
                    key={s.id}
                    className="sheet-main"
                    to={s.path}
                    data-active={pathname === s.path}
                    onClick={() => setSheet(false)}
                  >
                    {s.label}
                  </Link>
                ) : (
                  <a
                    key={s.id}
                    className="sheet-main"
                    href={`/#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      jump(s.id);
                    }}
                  >
                    {s.label}
                  </a>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
