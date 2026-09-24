import { isValidElement, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode, type RefObject } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useOptionalAdminAuth } from '@/admin/auth';
import { useSite } from '@/app/site';
import { Icon } from '@/ui/Icon';
import { AdminButton, AdminIconButton } from './AdminButton';
import { InlineNotice, StatusBadge } from './AdminFeedback';
import { getFocusableElements } from './focus';
import { CMS_DOCUMENT_GROUPS, CMS_DOCUMENT_METADATA } from './documents/cmsDocumentMetadata';

const NAV_ITEMS = [
  { id: 'foundation', zh: '基礎與操作', en: 'Foundation & controls', icon: 'skills' },
  { id: 'forms', zh: '雙語表單', en: 'Bilingual forms', icon: 'clipboard' },
  { id: 'states', zh: '狀態與回饋', en: 'States & feedback', icon: 'spark' },
  { id: 'records', zh: '資料與紀錄', en: 'Data & records', icon: 'chart' },
  { id: 'overlays', zh: '覆層與媒體', en: 'Overlays & media', icon: 'image' },
] as const;


type AdminSectionId = (typeof NAV_ITEMS)[number]['id'];

function unexpectedAuthValue(label: string, value: never): never {
  throw new TypeError(`Unexpected administrator auth ${label}: ${JSON.stringify(value)}`);
}

function scrollToAdminSection(main: HTMLElement, id: AdminSectionId): void {
  const section = document.getElementById(id);
  if (section === null) return;
  const top = main.scrollTop + section.getBoundingClientRect().top - main.getBoundingClientRect().top;
  main.scrollTop = top;
}

type AdminSideNavProps = {
  readonly activeId: AdminSectionId;
  readonly drawer: boolean;
  readonly onNavigate?: () => void;
  readonly onSelect: (id: AdminSectionId) => void;
  readonly showcaseNavigation: boolean;
};

function AdminSideNav({ activeId, drawer, onNavigate, onSelect, showcaseNavigation }: AdminSideNavProps) {
  const { isZh } = useSite();
  return (
    <nav className="admin-sidenav" aria-label={isZh ? '管理介面導覽' : 'Admin navigation'} data-drawer={drawer || undefined} tabIndex={drawer ? 0 : undefined}>
      <div className="admin-brand"><span className="admin-brand-mark"><Icon name="admin" /></span><span><strong>{isZh ? '教學部內容管理' : 'Medical Education CMS'}</strong><small className="mono">LIVING TISSUE / ADMIN</small></span></div>
      <div className="admin-nav-group"><NavLink to="/admin" end onClick={onNavigate}><Icon name="chart" /><span>{isZh ? '管理總覽' : 'Dashboard'}</span></NavLink></div>
      {CMS_DOCUMENT_GROUPS.map((group) => (
        <div key={group.id} className="admin-nav-group admin-nav-documents" role="group" aria-label={isZh ? group.label.zh : group.label.en}>
          <span className="admin-nav-label" aria-hidden="true">{isZh ? group.label.zh : group.label.en}</span>
          {group.kinds.map((kind) => {
            const label = CMS_DOCUMENT_METADATA[kind].label;
            return <NavLink key={kind} to={`/admin/content/${kind}`} onClick={onNavigate}><span className="admin-nav-dot" aria-hidden="true" /><span>{isZh ? label.zh : label.en}</span></NavLink>;
          })}
        </div>
      ))}
      {showcaseNavigation ? null : <NavLink className="admin-nav-footer" to="/admin/design-system" onClick={onNavigate}>{isZh ? '元件展示（開發用）' : 'Component showcase (dev)'}</NavLink>}
      {showcaseNavigation ? <><div className="admin-nav-group"><span className="admin-nav-label">{isZh ? '元件展示章節' : 'Showcase sections'}</span>{NAV_ITEMS.map((item, index) => <a key={item.id} href={`#${item.id}`} aria-current={item.id === activeId ? 'location' : undefined} onClick={(event: MouseEvent<HTMLAnchorElement>) => { event.preventDefault(); onSelect(item.id); onNavigate?.(); }}><Icon name={item.icon} /><span>{isZh ? item.zh : item.en}</span><small className="mono" aria-hidden="true">0{index + 1}</small></a>)}</div><div className="admin-sidenav-note"><StatusBadge status="info">SHOWCASE ONLY</StatusBadge><p>{isZh ? '此頁僅展示元件，不提供內容異動。' : 'This page demonstrates primitives without content mutations.'}</p></div></> : null}
    </nav>
  );
}

type AdminHeaderProps = { readonly onOpenDrawer: () => void; readonly drawerTriggerRef: RefObject<HTMLButtonElement>; readonly eyebrow: string; readonly title: ReactNode; readonly status: ReactNode; readonly sessionAction: ReactNode };

export type AdminSaveState = 'ready' | 'saving' | 'error';
const SAVE_STATUS_ICON: Readonly<Record<AdminSaveState, 'check' | 'refresh' | 'alert'>> = {
  ready: 'check',
  saving: 'refresh',
  error: 'alert',
};

export function AdminSaveStatus({ state, children }: { readonly state: AdminSaveState; readonly children: ReactNode }) {
  return <span className="admin-save-status" data-save-state={state} role={state === 'error' ? 'alert' : 'status'}><Icon name={SAVE_STATUS_ICON[state]} />{children}</span>;
}

function AdminHeader({ onOpenDrawer, drawerTriggerRef, eyebrow, title, status, sessionAction }: AdminHeaderProps) {
  const { isZh, theme, toggleLang, toggleTheme } = useSite();
  return (
    <header className="admin-header">
      <div className="admin-header-location"><AdminIconButton ref={drawerTriggerRef} className="admin-menu-trigger" icon="menu" label={isZh ? '開啟導覽' : 'Open navigation'} onClick={onOpenDrawer} /><b className="admin-mobile-label">{isZh ? '管理' : 'Admin'}</b><span><small className="mono">{eyebrow}</small><strong>{title}</strong></span></div>
      <div className="admin-header-tools">{status === null ? null : isValidElement(status) ? status : <AdminSaveStatus state="ready">{status}</AdminSaveStatus>}{sessionAction}<AdminButton variant="quiet" onClick={toggleLang}>{isZh ? 'EN' : '中'}</AdminButton><AdminIconButton icon={theme === 'dark' ? 'sun' : 'moon'} label={isZh ? '切換明暗主題' : 'Toggle theme'} onClick={toggleTheme} /></div>
    </header>
  );
}

export type AdminShellNotice = { readonly status: 'warning' | 'error'; readonly title: ReactNode; readonly description: ReactNode };
type AdminAppShellProps = { readonly children: ReactNode; readonly notices?: readonly AdminShellNotice[]; readonly eyebrow?: string; readonly title?: ReactNode; readonly status?: ReactNode; readonly showcaseNavigation?: boolean };

export function AdminAppShell({ children, notices = [], eyebrow = 'ADMIN / DESIGN SYSTEM', title, status, showcaseNavigation = true }: AdminAppShellProps) {
  const { isZh } = useSite();
  const auth = useOptionalAdminAuth();
  const location = useLocation();
  const [activeId, setActiveId] = useState<AdminSectionId>('foundation');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const headerTitle = title ?? (isZh ? '管理元件展示' : 'Admin primitive showcase');
  const headerStatus = status === undefined ? (isZh ? '展示資料已就緒' : 'Showcase ready') : status;
  let sessionAction: ReactNode = null;
  let sessionNotice: ReactNode = null;
  if (auth !== null) {
    const state = auth.state;
    switch (state.status) {
      case 'authorized':
      // A refreshed session is re-verified in place; the protected layout already pauses mutations.
      case 'reauthorizing':
        sessionAction = <AdminButton variant="quiet" onClick={() => void auth.signOut()}>{isZh ? '登出' : 'Sign out'}</AdminButton>;
        break;
      case 'signing-out':
        sessionAction = <AdminButton variant="quiet" loading>{isZh ? '登出' : 'Sign out'}</AdminButton>;
        break;
      case 'error': {
        const failure = state.failure;
        switch (failure) {
          case 'sign-out-failed':
            sessionAction = <AdminButton variant="quiet" onClick={() => void auth.signOut()}>{isZh ? '登出' : 'Sign out'}</AdminButton>;
            sessionNotice = (
              <InlineNotice
                status="error"
                title={isZh ? '無法登出' : 'Unable to sign out'}
                lang={isZh ? 'zh-Hant' : 'en'}
                action={<AdminButton variant="secondary" onClick={() => void auth.signOut()}>{isZh ? '重試登出' : 'Retry sign out'}</AdminButton>}
              >
                {isZh ? '請再試一次；目前工作內容仍保留。' : 'Please try again. Your current work remains available.'}
              </InlineNotice>
            );
            break;
          case 'client-unavailable':
          case 'sign-in-failed':
          case 'identity-check-failed':
          case 'allowlist-check-failed':
          case 'unsupported-auth-event':
            break;
          default:
            unexpectedAuthValue('failure', failure);
        }
        break;
      }
      case 'booting':
      case 'config-error':
      case 'anonymous':
      case 'authenticating':
      case 'verifying':
      case 'denied':
      case 'expired':
        break;
      default:
        unexpectedAuthValue('state', state);
    }
  }
  const selectSection = (id: AdminSectionId) => {
    const main = mainRef.current;
    setActiveId(id);
    if (main !== null) scrollToAdminSection(main, id);
    window.history.replaceState(null, '', `#${id}`);
  };
  useEffect(() => {
    const main = mainRef.current;
    if (main === null) return;
    const updateActiveSection = () => {
      const activationLine = main.getBoundingClientRect().top + Math.min(main.clientHeight * 0.3, 160);
      let nextActiveId: AdminSectionId = NAV_ITEMS[0].id;
      for (const item of NAV_ITEMS) {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= activationLine) nextActiveId = item.id;
      }
      setActiveId(nextActiveId);
    };
    const initialFrame = window.requestAnimationFrame(() => {
      const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
      const hashItem = NAV_ITEMS.find((item) => item.id === hash);
      if (hashItem !== undefined) {
        scrollToAdminSection(main, hashItem.id);
        setActiveId(hashItem.id);
        return;
      }
      updateActiveSection();
    });
    main.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    return () => {
      window.cancelAnimationFrame(initialFrame);
      main.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [location.hash]);
  useLayoutEffect(() => {
    const main = mainRef.current;
    if (main === null) return;
    const heading = main.querySelector<HTMLElement>('h1');
    (heading ?? main).focus({ preventScroll: true });
  }, [location.pathname]);
  useEffect(() => {
    if (!drawerOpen || !drawerRef.current) return;
    const drawer = drawerRef.current;
    getFocusableElements(drawer)[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
      if (event.key !== 'Tab') return;
      const items = getFocusableElements(drawer);
      const first = items[0];
      const last = items[items.length - 1];
      if (first && last && event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (first && last && !event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); drawerTriggerRef.current?.focus(); };
  }, [drawerOpen, drawerRef, drawerTriggerRef]);
  return (
    <div className="admin-shell">
      <div className="admin-skip-slot"><a className="skip-link" href="#admin-main">{isZh ? '跳到管理內容' : 'Skip to admin content'}</a></div>
      <div className="admin-desktop-nav"><AdminSideNav activeId={activeId} drawer={false} onSelect={selectSection} showcaseNavigation={showcaseNavigation} /></div>
      <div className="admin-shell-column"><AdminHeader onOpenDrawer={() => setDrawerOpen(true)} drawerTriggerRef={drawerTriggerRef} eyebrow={eyebrow} title={headerTitle} status={headerStatus} sessionAction={sessionAction} />{notices.length || sessionNotice ? <div className="admin-shell-notices">{sessionNotice}{notices.map((notice, index) => <InlineNotice key={`${notice.status}-${index}`} status={notice.status} title={notice.title} lang={isZh ? 'zh-Hant' : 'en'}>{notice.description}</InlineNotice>)}</div> : null}<main ref={mainRef} id="admin-main" className="admin-main" tabIndex={-1} data-lenis-prevent>{children}</main></div>
      {drawerOpen ? <div className="admin-drawer-layer"><button type="button" className="admin-drawer-backdrop" aria-label={isZh ? '關閉導覽' : 'Close navigation'} onClick={() => setDrawerOpen(false)} /><div ref={drawerRef} className="admin-drawer" role="dialog" aria-modal="true" aria-label={isZh ? '管理介面導覽' : 'Admin navigation'}><div className="admin-drawer-header"><AdminIconButton icon="close" label={isZh ? '關閉導覽' : 'Close navigation'} onClick={() => setDrawerOpen(false)} /></div><AdminSideNav activeId={activeId} drawer onNavigate={() => setDrawerOpen(false)} onSelect={selectSection} showcaseNavigation={showcaseNavigation} /></div></div> : null}
    </div>
  );
}

type AdminPageHeaderProps = { readonly eyebrow: string; readonly title: ReactNode; readonly description: ReactNode; readonly descriptionLang?: string; readonly actions?: ReactNode };

export function AdminPageHeader({ eyebrow, title, description, descriptionLang, actions }: AdminPageHeaderProps) {
  return <header className="admin-page-header"><div><span className="admin-page-eyebrow mono">{eyebrow}</span><h1 tabIndex={-1}>{title}</h1><p lang={descriptionLang}>{description}</p></div>{actions ? <div className="admin-cluster">{actions}</div> : null}</header>;
}

export function AdminToolbar({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return <div className="admin-toolbar" role="toolbar" aria-label={label}>{children}</div>;
}
