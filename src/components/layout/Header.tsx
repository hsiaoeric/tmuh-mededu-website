import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useSite } from '@/context/SiteContext';
import { Icon } from '@/components/common/Icon';
import { TmuhLogo } from '@/components/common/TmuhLogo';
import { scrollToId } from '@/utils/scroll';
import { NavDropdown } from './NavDropdown';
import { NavMenuGroup, NavMenuLink, type NavMenuTarget } from './NavMenu';

/**
 * A row in the header menu: a destination, a heading that expands to reveal
 * several destinations, or a bespoke node such as the centers dropdown.
 */
type NavEntry =
  | ({ kind: 'link'; dividerBefore?: boolean } & NavMenuTarget)
  | { kind: 'group'; label: string; items: NavMenuTarget[] }
  | { kind: 'custom'; node: ReactNode };

export function Header() {
  const { t, isZh, view, theme, toggleLang, toggleTheme, goHome, setView } =
    useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false);
    setOpenGroup(null);
    if (restoreFocus) toggleRef.current?.focus();
  };

  const go = (id: string) => () => {
    closeMenu(true);
    scrollToId(id);
  };
  /** Destination row scrolling to a section on the current page. */
  const link = (label: string, id: string): NavEntry => ({
    kind: 'link',
    label,
    onClick: go(id),
  });
  /** Heading row; `sections` are [label, section id] pairs. */
  const group = (label: string, sections: [string, string][]): NavEntry => ({
    kind: 'group',
    label,
    items: sections.map(([itemLabel, id]) => ({ label: itemLabel, onClick: go(id) })),
  });
  const back: NavEntry = {
    kind: 'link',
    label: t.backDept,
    dividerBefore: true,
    onClick: () => {
      closeMenu(true);
      setView('dept');
    },
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu(true);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  let navItems: NavEntry[];
  switch (view) {
    case 'holistic':
      navItems = [
        group(isZh ? '中心介紹' : 'About', [
          [isZh ? '關於中心' : 'About the Center', 'h-about'],
          [isZh ? '中心成員' : 'Members', 'h-members'],
        ]),
        group(isZh ? '重點計畫' : 'Programs', [
          [t.navMhfa, 'mhfa'],
          [t.navSeed, 'seed'],
          [isZh ? '健康台灣範疇二' : 'Healthy Taiwan Scope 2', 'scope2'],
        ]),
        group(isZh ? '教育成果' : 'Outcomes', [
          [isZh ? '全人研討會' : 'Symposia', 'h-symposiums'],
          [isZh ? '師培課程' : 'Faculty Training', 'h-training'],
          [isZh ? '研究成果' : 'Research', 'h-research'],
        ]),
        group(isZh ? '最新動態' : 'Updates', [
          [isZh ? '最新公告' : 'News', 'h-news'],
          [isZh ? '近期活動' : 'Activities', 'h-activities'],
        ]),
        link(t.navContact, 'h-contact'),
        back,
      ];
      break;
    case 'ebm':
      navItems = [
        link(isZh ? '中心簡介' : 'About', 'ebm-about'),
        group(isZh ? '業務與課程' : 'Missions & Courses', [
          [isZh ? '四大核心任務' : 'Four Core Missions', 'ebm-missions'],
          [isZh ? '訓練課程' : 'Courses', 'ebm-courses'],
        ]),
        group(isZh ? '成果與歷程' : 'Achievements', [
          [isZh ? '競賽成就' : 'Awards', 'ebm-awards'],
          [isZh ? '推動歷程' : 'Journey', 'ebm-journey'],
        ]),
        link(t.navContact, 'ebm-contact'),
        back,
      ];
      break;
    case 'facdev':
      navItems = [
        group(isZh ? '中心介紹' : 'About', [
          [isZh ? '中心簡介' : 'About the Center', 'fd-about'],
          [isZh ? '中心成員' : 'Members', 'fd-members'],
        ]),
        group(isZh ? '業務與組織' : 'Services & Structure', [
          [isZh ? '四大核心業務' : 'Four Core Services', 'fd-services'],
          [isZh ? '六大培育小組' : 'Six Cultivation Groups', 'fd-groups'],
        ]),
        link(isZh ? '最新動態' : 'Updates', 'fd-news'),
        link(t.navContact, 'fd-contact'),
        back,
      ];
      break;
    case 'dept':
      // Left flat: only six rows, and the centers dropdown already supplies the
      // expandable behaviour a grouped menu would add.
      navItems = [
        link(t.navNews, 'news'),
        link(t.navAbout, 'about'),
        {
          kind: 'custom',
          node: (
            <NavDropdown
              label={isZh ? '五大中心' : 'Centers'}
              scrollTarget="org"
              onNavigate={() => closeMenu(true)}
            />
          ),
        },
        link(t.navOrg, 'org'),
        link(isZh ? '品質與成果' : 'Impact', 'impact'),
        link(t.navContact, 'contact'),
      ];
      break;
    default:
      navItems = [back];
  }

  return (
    <header
      ref={headerRef}
      style={{
        // Fixed, not sticky: the cards below are themselves fixed, so there is
        // no scrolling flow for a sticky element to stick within.
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--header-h)',
        zIndex: 9100,
        backdropFilter: 'blur(12px)',
        background: 'color-mix(in srgb,var(--bg) 84%,transparent)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          height: '100%',
          margin: '0 auto',
          padding: '0 clamp(16px,4vw,40px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <button
          onClick={() => {
            closeMenu();
            goHome();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            flexShrink: 1,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <TmuhLogo size={30} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              lineHeight: 1.2,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 13.5,
                color: 'var(--text)',
                letterSpacing: '-.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {!isZh ? (
                <>
                  <span className="tmuh-full-title">Taipei Medical University Hospital</span>
                  <span className="tmuh-short-title">TMUH</span>
                </>
              ) : (
                t.brand1
              )}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9.5,
                letterSpacing: '.24em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {t.brand2}
            </span>
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <button
            onClick={toggleLang}
            title="Language"
            style={{
              height: 30,
              padding: '0 10px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontWeight: 500,
              fontSize: 11,
              color: 'var(--text)',
              letterSpacing: '.14em',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {t.langBtn}
          </button>
          <button
            onClick={toggleTheme}
            aria-label="theme"
            title="Theme"
            style={{
              width: 30,
              height: 30,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--body)',
              flexShrink: 0,
            }}
          >
            <span style={{ display: 'block', width: 15, height: 15 }}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </span>
          </button>

          {/* Collapsible Navigation Toggle Button */}
          <button
            ref={toggleRef}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle Navigation Menu"
            title={isZh ? '選單' : 'Menu'}
            style={{
              width: 30,
              height: 30,
              border: `1px solid ${menuOpen ? 'var(--volt)' : 'var(--border)'}`,
              background: menuOpen ? 'var(--volt)' : 'var(--surface)',
              color: menuOpen ? 'var(--volt-ink)' : 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ display: 'block', width: 16, height: 16, flexShrink: 0 }}>
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </span>
          </button>
        </div>
      </div>

      {/* Collapsible Menu Overlay Card */}
      {menuOpen && (
        <nav
          aria-label={isZh ? '主選單' : 'Main navigation'}
          style={{
            position: 'absolute',
            top: '100%',
            right: 'clamp(16px,4vw,40px)',
            width: 'calc(100vw - 32px)',
            maxWidth: 340,
            marginTop: -1,
            padding: 6,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderTop: '2px solid var(--volt)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            maxHeight: 'calc(100svh - var(--header-h) - var(--hud-h) - 24px)',
            overflowY: 'auto',
            animation: 'nx-menu-in 0.22s var(--ease-silk)',
            zIndex: 100,
            boxSizing: 'border-box',
          }}
        >
          {navItems.map((item, i) => (
            <div
              key={i}
              style={{
                width: '100%',
                ...(item.kind === 'link' && item.dividerBefore
                  ? { borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 4 }
                  : null),
              }}
            >
              {item.kind === 'custom' ? (
                <div style={{ padding: '2px 0' }}>{item.node}</div>
              ) : item.kind === 'group' ? (
                <NavMenuGroup
                  label={item.label}
                  items={item.items}
                  open={openGroup === item.label}
                  onToggle={() =>
                    setOpenGroup((current) => (current === item.label ? null : item.label))
                  }
                />
              ) : (
                <NavMenuLink label={item.label} onClick={item.onClick} />
              )}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}
