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
  const { t, isZh, view, theme, toggleLang, toggleTheme, goHome, setView, enterCenter } =
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
    if (view === 'holistic' && !document.getElementById(id)) {
      enterCenter('holistic', id);
      return;
    }
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
        link(isZh ? '健康台灣範疇二' : 'Healthy Taiwan Scope 2', 'scope2'),
        group(isZh ? '中心介紹' : 'About', [
          [isZh ? '關於中心' : 'About the Center', 'h-about'],
          [isZh ? '中心成員' : 'Members', 'h-members'],
        ]),
        group(isZh ? '重點計畫' : 'Programs', [
          [t.navMhfa, 'mhfa'],
          [t.navSeed, 'seed'],
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
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'saturate(1.4) blur(14px)',
        background: 'color-mix(in srgb,var(--surface) 88%,transparent)',
        borderBottom: '1px solid var(--border)',
        width: '100%',
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '8px 16px',
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
          <TmuhLogo size={36} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              lineHeight: 1.18,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                fontFamily: "'Noto Sans TC', 'IBM Plex Sans', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--text)',
                letterSpacing: '.01em',
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
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 10,
                letterSpacing: '.1em',
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
              padding: '5px 9px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: 'pointer',
              borderRadius: 999,
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: 700,
              fontSize: 11.5,
              color: 'var(--teal-700)',
              letterSpacing: '.04em',
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
              width: 32,
              height: 32,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: 'pointer',
              borderRadius: 999,
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
              width: 32,
              height: 32,
              border: '1px solid var(--border)',
              background: menuOpen ? 'var(--teal-50)' : 'var(--surface)',
              color: menuOpen ? 'var(--teal)' : 'var(--text)',
              cursor: 'pointer',
              borderRadius: 8,
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
            right: 16,
            width: 'calc(100vw - 32px)',
            maxWidth: 360,
            marginTop: 6,
            padding: 10,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            boxShadow: '0 16px 36px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 'calc(85vh - 70px)',
            overflowY: 'auto',
            animation: 'fadeInDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
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
