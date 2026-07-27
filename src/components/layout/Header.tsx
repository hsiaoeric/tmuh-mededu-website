import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useSite } from '@/context/SiteContext';
import { Icon } from '@/components/common/Icon';
import { TmuhLogo } from '@/components/common/TmuhLogo';
import { scrollToId } from '@/utils/scroll';
import { NavDropdown } from './NavDropdown';

interface NavItem {
  label: string;
  onClick?: () => void;
  /** When set, renders this node instead of a plain button. */
  custom?: ReactNode;
}

export function Header() {
  const { t, isZh, view, theme, toggleLang, toggleTheme, goHome, setView } =
    useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  };

  const go = (id: string) => () => {
    closeMenu(true);
    scrollToId(id);
  };
  const back: NavItem = {
    label: t.backDept,
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

  let navItems: NavItem[];
  switch (view) {
    case 'holistic':
      navItems = [
        { label: t.navAbout, onClick: go('h-about') },
        { label: t.navMhfa, onClick: go('mhfa') },
        { label: t.navSeed, onClick: go('seed') },
        { label: isZh ? '研討會與成果' : 'Symposia', onClick: go('h-symposiums') },
        { label: isZh ? '健康台灣' : 'Healthy Taiwan', onClick: go('scope2') },
        { label: isZh ? '最新公告' : 'News', onClick: go('h-news') },
        { label: isZh ? '近期活動' : 'Activities', onClick: go('h-activities') },
        { label: t.navContact, onClick: go('h-contact') },
        back,
      ];
      break;
    case 'ebm':
      navItems = [
        { label: isZh ? '中心簡介' : 'About', onClick: go('ebm-about') },
        { label: isZh ? '核心任務' : 'Missions', onClick: go('ebm-missions') },
        { label: isZh ? '競賽成就' : 'Awards', onClick: go('ebm-awards') },
        { label: isZh ? '推動歷程' : 'Journey', onClick: go('ebm-journey') },
        { label: isZh ? '訓練課程' : 'Courses', onClick: go('ebm-courses') },
        { label: t.navContact, onClick: go('ebm-contact') },
        back,
      ];
      break;
    case 'facdev':
      navItems = [
        { label: isZh ? '中心簡介' : 'About', onClick: go('fd-about') },
        { label: isZh ? '中心成員' : 'Members', onClick: go('fd-members') },
        { label: isZh ? '核心業務' : 'Services', onClick: go('fd-services') },
        { label: isZh ? '六大培育小組' : 'Groups', onClick: go('fd-groups') },
        { label: isZh ? '最新公告' : 'News', onClick: go('fd-news') },
        { label: t.navContact, onClick: go('fd-contact') },
        back,
      ];
      break;
    case 'dept':
      navItems = [
        { label: t.navNews, onClick: go('news') },
        { label: t.navAbout, onClick: go('about') },
        {
          label: isZh ? '五大中心' : 'Centers',
          custom: (
            <NavDropdown
              label={isZh ? '五大中心' : 'Centers'}
              scrollTarget="centers"
              onNavigate={() => closeMenu(true)}
            />
          ),
        },
        { label: t.navOrg, onClick: go('org') },
        { label: isZh ? '品質與成果' : 'Impact', onClick: go('impact') },
        { label: t.navContact, onClick: go('contact') },
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
          <TmuhLogo
            size={36}
            style={{ filter: 'drop-shadow(0 3px 8px var(--teal-glow))', flexShrink: 0 }}
          />
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
            <div key={i} style={{ width: '100%' }}>
              {item.custom ? (
                <div style={{ padding: '2px 0' }}>{item.custom}</div>
              ) : (
                <button
                  onClick={item.onClick}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'var(--text)',
                    transition: 'background 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--teal-50)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span>{item.label}</span>
                  <span style={{ width: 14, height: 14, opacity: 0.5 }}>
                    <Icon name="arrow" />
                  </span>
                </button>
              )}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}
