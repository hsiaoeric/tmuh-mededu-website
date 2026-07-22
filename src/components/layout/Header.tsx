import type { ReactNode } from 'react';
import { useSite } from '@/context/SiteContext';
import { Icon } from '@/components/common/Icon';
import { scrollToId } from '@/utils/scroll';
import { NavButton } from './NavButton';
import { NavDropdown } from './NavDropdown';

interface NavItem {
  label: string;
  onClick?: () => void;
  /** When set, renders this node instead of a plain NavButton. */
  custom?: ReactNode;
}

export function Header() {
  const { t, isZh, view, theme, toggleLang, toggleTheme, goHome, setView } =
    useSite();

  const go = (id: string) => () => scrollToId(id);
  const back: NavItem = { label: t.backDept, onClick: () => setView('dept') };

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
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'saturate(1.4) blur(14px)',
        background: 'color-mix(in srgb,var(--surface) 82%,transparent)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '13px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <button
          onClick={goHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(140deg,var(--teal),var(--teal-700))',
              boxShadow: '0 6px 16px var(--teal-glow)',
              flexShrink: 0,
            }}
          >
            <span style={{ display: 'block', width: 23, height: 23, color: '#fff' }}>
              <Icon name="heart" />
            </span>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.22 }}
          >
            <span
              style={{
                fontFamily: "'Noto Sans TC', sans-serif",
                fontWeight: 700,
                fontSize: 15.5,
                color: 'var(--text)',
                letterSpacing: '.01em',
              }}
            >
              {t.brand1}
            </span>
            <span
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 11,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}
            >
              {t.brand2}
            </span>
          </div>
        </button>

        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {navItems.map((item, i) =>
            item.custom ? (
              <span key={i}>{item.custom}</span>
            ) : (
              <NavButton key={i} label={item.label} onClick={item.onClick!} />
            ),
          )}
          <button
            onClick={toggleLang}
            style={{
              marginLeft: 6,
              padding: '7px 13px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: 'pointer',
              borderRadius: 999,
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: 700,
              fontSize: 12.5,
              color: 'var(--teal-700)',
              letterSpacing: '.04em',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {t.langBtn}
          </button>
          <button
            onClick={toggleTheme}
            aria-label="theme"
            style={{
              width: 38,
              height: 38,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: 'pointer',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--body)',
            }}
          >
            <span style={{ display: 'block', width: 18, height: 18 }}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
}
