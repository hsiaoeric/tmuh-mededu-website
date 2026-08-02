import { useEffect, useRef, useState } from 'react';
import { useSite } from '@/context/SiteContext';
import {
  CENTER_ICON,
  CENTER_LINK_ORDER,
  READY_CENTER_PAGES,
  centerById,
} from '@/data/centers';
import { Icon, type IconName } from '@/components/common/Icon';
import { scrollToId } from '@/utils/scroll';

interface NavDropdownProps {
  /** Button label (defaults to org nav string). */
  label?: string;
  /** Section id to scroll to when the label is clicked. */
  scrollTarget?: string;
  /** Optional callback fired when navigating via dropdown. */
  onNavigate?: () => void;
}

/**
 * Nav entry with a hover/click dropdown listing the five centers.
 * Desktop opens on hover; mobile (and any click) toggles it. Clicking the
 * label still scrolls to the linked section.
 */
export function NavDropdown({ label, scrollTarget = 'org', onNavigate }: NavDropdownProps) {
  const { t, isZh, view, enterCenter } = useSite();
  const buttonLabel = label ?? t.navOrg;
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  // Open immediately on enter; close after a short grace period on leave so a
  // brief hover gap between the button and the menu doesn't dismiss it (B).
  const openNow = () => {
    cancelClose();
    setHover(true);
    setOpen(true);
  };
  const scheduleClose = () => {
    cancelClose();
    setHover(false);
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Clear any pending close timer on unmount.
  useEffect(() => cancelClose, []);

  const links = CENTER_LINK_ORDER.map((id) => centerById(id)!).map((c) => ({
    id: c.id,
    name: isZh ? c.zh : c.en,
    iconId: CENTER_ICON[c.id] as IconName,
    externalUrl: c.externalUrl,
    // Centers whose site lives outside this app count as ready too — the entry
    // links straight out rather than to the in-progress placeholder.
    ready: READY_CENTER_PAGES.includes(c.id) || !!c.externalUrl,
  }));

  const handleSelect = (id: (typeof links)[number]['id']) => {
    cancelClose();
    enterCenter(id);
    setOpen(false);
    onNavigate?.();
  };

  return (
    <div
      ref={ref}
      style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') openNow();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') scheduleClose();
      }}
    >
      <button
        onClick={() => {
          scrollToId(scrollTarget);
          setOpen((o) => !o);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 5,
          width: '100%',
          padding: '10px 12px',
          border: 'none',
          background: hover || open ? 'var(--teal-50)' : 'none',
          cursor: 'pointer',
          fontFamily: "'Noto Sans TC', sans-serif",
          fontWeight: 600,
          fontSize: 14,
          color: hover || open ? 'var(--teal)' : 'var(--body)',
          borderRadius: 8,
          transition: 'color .2s,background .2s',
          whiteSpace: 'nowrap',
        }}
      >
        {buttonLabel}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: 13,
            height: 13,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .2s',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            width: '100%',
            paddingTop: 4,
          }}
        >
          <div
            role="menu"
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 14,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lift)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              boxSizing: 'border-box',
            }}
          >
            {links.map((c) => (
              <DropdownItem
                key={c.id}
                name={c.name}
                iconId={c.iconId}
                statusLabel={
                  c.externalUrl
                    ? isZh
                      ? '外部官網'
                      : 'Official site'
                    : c.ready
                      ? isZh
                        ? '進入專頁'
                        : 'Enter page'
                      : isZh
                        ? '建置中'
                        : 'In progress'
                }
                ready={c.ready}
                active={view === c.id}
                href={c.externalUrl}
                onClick={() => {
                  if (c.externalUrl) {
                    cancelClose();
                    setOpen(false);
                    onNavigate?.();
                    return;
                  }
                  handleSelect(c.id);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  name: string;
  iconId: IconName;
  statusLabel: string;
  ready: boolean;
  active: boolean;
  /** When set, the row opens this external site instead of navigating in-app. */
  href?: string;
  onClick: () => void;
}

function DropdownItem({
  name,
  iconId,
  statusLabel,
  ready,
  active,
  href,
  onClick,
}: DropdownItemProps) {
  const [hover, setHover] = useState(false);
  const style = {
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    textAlign: 'left',
    background: hover || active ? 'var(--teal-50)' : 'transparent',
    transition: 'background .18s',
    textDecoration: 'none',
    boxSizing: 'border-box',
  } as const;
  const content = (
    <>
      <span
        style={{
          width: 30,
          height: 30,
          flex: 'none',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'color-mix(in srgb,var(--teal) 14%,transparent)',
          color: 'var(--teal)',
        }}
      >
        <span style={{ width: 17, height: 17, display: 'block' }}>
          <Icon name={iconId} />
        </span>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
        <span
          style={{
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            color: active ? 'var(--teal)' : 'var(--text)',
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 11,
            color: ready ? 'var(--muted)' : 'var(--teal-700)',
            opacity: ready ? 0.85 : 1,
          }}
        >
          {statusLabel}
        </span>
      </span>
    </>
  );

  const hoverProps = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  };

  return href ? (
    <a role="menuitem" href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} style={style} {...hoverProps}>
      {content}
    </a>
  ) : (
    <button role="menuitem" onClick={onClick} style={style} {...hoverProps}>
      {content}
    </button>
  );
}
