import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSite } from '@/app/site';
import { useGoToSection } from '@/app/navigation';
import { ANNOUNCEMENTS_PATH, CENTER_ORDER, DIGITAL_MATERIALS_PATH, centerPath } from '@/app/routes';
import { centerById } from '@/data/centers';
import { setScrollLocked } from '@/motion/smoothScroll';
import { assetUrl } from '@/utils/asset';
import { CenterLink } from './CenterLink';
import { Icon } from './Icon';

interface SectionItem {
  id: string;
  zh: string;
  en: string;
  path?: string;
}

const SECTIONS: SectionItem[] = [
  { id: 'about', zh: '關於', en: 'About' },
  { id: 'organisation', zh: '組織', en: 'Structure' },
  { id: 'news', zh: '公告', en: 'News', path: ANNOUNCEMENTS_PATH },
  { id: 'honors', zh: '榮譽', en: 'Honors' },
  { id: 'contact', zh: '聯絡', en: 'Contact' },
];

function CentersMenu({ onNavigate }: { onNavigate: () => void }) {
  const { isZh } = useSite();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number>();

  const schedule = (next: boolean) => {
    window.clearTimeout(closeTimer.current);
    if (next) setOpen(true);
    else closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => schedule(true)}
      onMouseLeave={() => schedule(false)}
    >
      <button
        className="nav-link"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
      >
        {isZh ? '五大中心' : 'Centers'}
        <Icon name="arrowDown" size={11} />
      </button>

      <div
        onFocus={() => schedule(true)}
        onBlur={() => schedule(false)}
        style={{
          position: 'absolute',
          top: 'calc(100% + 14px)',
          left: '50%',
          translate: '-50% 0',
          width: 420,
          padding: 8,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--line)',
          background: 'color-mix(in srgb, var(--surface) 94%, transparent)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: 'var(--shadow-lg)',
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          transform: open ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity .32s ease, transform .42s cubic-bezier(.16,1,.3,1), visibility .32s',
        }}
      >
        {CENTER_ORDER.map((id) => {
          const c = centerById(id)!;
          return (
            <CenterLink
              key={id}
              id={id}
              onClick={() => {
                setOpen(false);
                onNavigate();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 12px',
                borderRadius: 'var(--radius)',
                transition: 'background .25s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-veil)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="dot" style={{ ['--tone' as string]: c.color }} />
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: "'Noto Sans TC', sans-serif",
                    fontSize: '0.86rem',
                    fontWeight: 500,
                    color: 'var(--ink)',
                  }}
                >
                  {isZh ? c.zh : c.en}
                </span>
                <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--faint)', letterSpacing: '.1em' }}>
                  {isZh ? c.en : c.zh}
                  {c.externalUrl && ' ↗'}
                </span>
              </span>
            </CenterLink>
          );
        })}
      </div>
    </div>
  );
}

export function Nav() {
  const { isZh, t, theme, toggleLang, toggleTheme } = useSite();
  const goToSection = useGoToSection();
  const { pathname } = useLocation();
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
              <span className="brand-zh">{isZh ? t.brand1 : 'TMU Hospital'}</span>
              <span className="brand-en">
                {isZh ? '教學部 Medical Education' : 'Dept. of Medical Education'}
              </span>
            </span>
          </Link>

          <nav className="nav-links" aria-label={isZh ? '主選單' : 'Main menu'}>
            {SECTIONS.slice(0, 2).map((s) => (
              <button key={s.id} className="nav-link" onClick={() => jump(s.id)}>
                {isZh ? s.zh : s.en}
              </button>
            ))}
            <CentersMenu onNavigate={() => setSheet(false)} />
            <Link
              className="nav-link"
              to={DIGITAL_MATERIALS_PATH}
              data-active={pathname === DIGITAL_MATERIALS_PATH}
            >
              {isZh ? '數位教材室' : 'Digital Materials'}
            </Link>
            {SECTIONS.slice(2).map((s) =>
              s.path ? (
                <Link key={s.id} className="nav-link" to={s.path} data-active={pathname === s.path}>
                  {isZh ? s.zh : s.en}
                </Link>
              ) : (
                <button key={s.id} className="nav-link" onClick={() => jump(s.id)}>
                  {isZh ? s.zh : s.en}
                </button>
              ),
            )}
          </nav>

          <div className="nav-tools">
            <button
              className="pill"
              onClick={toggleLang}
              aria-label={isZh ? 'Switch to English' : '切換為中文'}
            >
              {isZh ? 'EN' : '中'}
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
            <button
              className="pill nav-burger"
              onClick={() => setSheet((s) => !s)}
              aria-expanded={sheet}
              aria-label={isZh ? '選單' : 'Menu'}
            >
              <Icon name={sheet ? 'close' : 'menu'} />
            </button>
          </div>
        </div>
      </header>

      {sheet && (
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
              {SECTIONS.slice(0, 2).map((s) => (
                <a
                  key={s.id}
                  className="sheet-main"
                  href={`/#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    jump(s.id);
                  }}
                >
                  {isZh ? s.zh : s.en}
                </a>
              ))}

              <div className="eyebrow sheet-label">{isZh ? '五大中心' : 'The Five Centers'}</div>
              {CENTER_ORDER.map((id) => {
                const c = centerById(id)!;
                return (
                  <CenterLink
                    key={id}
                    id={id}
                    className="sheet-sub"
                    data-active={pathname === centerPath(id)}
                    onClick={() => setSheet(false)}
                  >
                    {isZh ? c.zh : c.en}
                    {c.externalUrl && ' ↗'}
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

              {SECTIONS.slice(2).map((s) =>
                s.path ? (
                  <Link
                    key={s.id}
                    className="sheet-main"
                    to={s.path}
                    data-active={pathname === s.path}
                    onClick={() => setSheet(false)}
                  >
                    {isZh ? s.zh : s.en}
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
                    {isZh ? s.zh : s.en}
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
