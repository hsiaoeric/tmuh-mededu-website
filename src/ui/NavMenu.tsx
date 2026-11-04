import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { Icon } from './Icon';

interface NavMenuProps {
  /** Visible trigger label. */
  readonly label: ReactNode;
  /** The trigger reads as current when the visitor is somewhere inside this menu's pages. */
  readonly active?: boolean;
  /** Extra class on the panel, for per-menu sizing. */
  readonly panelClassName?: string;
  /** Called after any link or button inside the panel is activated. */
  readonly onNavigate?: () => void;
  readonly children: ReactNode;
}

const ITEM_SELECTOR = 'a[href], button:not([disabled])';
const HOVER_CLOSE_DELAY = 140;
const OPEN_EVENT = 'tmuh:nav-menu-open';

/** Panel items that are actually shown (a breakpoint may hide one with `display: none`). */
function visibleItems(panel: HTMLElement | null): HTMLElement[] {
  if (panel === null) return [];
  return Array.from(panel.querySelectorAll<HTMLElement>(ITEM_SELECTOR))
    .filter((item) => window.getComputedStyle(item).display !== 'none');
}

/**
 * A disclosure-style dropdown for the desktop nav row: a real button that toggles a panel of
 * ordinary links (not an ARIA `menu`), so Tab walks the links in reading order as it always has.
 *
 * - The trigger carries `aria-expanded` and `aria-controls`; the panel stays mounted and is
 *   `hidden` while closed, so the reference always resolves.
 * - Pointer: hovering opens it and leaving closes it after a short grace period; a click
 *   toggles it, and a panel opened (or kept open) by a click stays until a press outside it.
 * - Keyboard: Enter/Space toggle; ArrowDown/ArrowUp on the trigger open it on the first/last
 *   link; inside, the arrow keys and Home/End move between links; Escape closes it and returns
 *   focus to the trigger; tabbing out of it closes it.
 */
export function NavMenu({ label, active = false, panelClassName, onNavigate, children }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number>();
  const openedByHover = useRef(false);
  const pendingFocus = useRef<'first' | 'last' | null>(null);

  const close = useCallback((returnFocus = false) => {
    window.clearTimeout(closeTimer.current);
    openedByHover.current = false;
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const openWithFocus = (target: 'first' | 'last') => {
    window.clearTimeout(closeTimer.current);
    openedByHover.current = false;
    pendingFocus.current = target;
    if (open) {
      const items = visibleItems(panelRef.current);
      (target === 'first' ? items[0] : items[items.length - 1])?.focus();
      pendingFocus.current = null;
    } else {
      setOpen(true);
    }
  };

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Once a keyboard open has rendered the panel, move focus into it.
  useEffect(() => {
    if (!open || pendingFocus.current === null) return;
    const items = visibleItems(panelRef.current);
    (pendingFocus.current === 'first' ? items[0] : items[items.length - 1])?.focus();
    pendingFocus.current = null;
  }, [open]);

  // While open: a press anywhere outside closes it, and Escape closes it from anywhere (a
  // hover-opened panel has no focus inside it). Focus returns to the trigger only when it was in
  // the menu, so Escape never yanks focus from elsewhere on the page.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      close(rootRef.current?.contains(document.activeElement) === true);
    };
    // Opening one dropdown closes any other, so a pinned panel never sits under a hovered one.
    const onOtherOpen = (event: Event) => {
      if (event instanceof CustomEvent && event.detail !== panelId) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener(OPEN_EVENT, onOtherOpen);
    document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: panelId }));
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener(OPEN_EVENT, onOtherOpen);
    };
  }, [open, close, panelId]);

  const onMouseEnter = () => {
    window.clearTimeout(closeTimer.current);
    if (!open) {
      openedByHover.current = true;
      setOpen(true);
    }
  };

  // Only a hover-opened panel closes when the pointer leaves; one opened (or kept open) by a click
  // or the keyboard stays until it is dismissed.
  const onMouseLeave = () => {
    if (!openedByHover.current) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => close(), HOVER_CLOSE_DELAY);
  };

  const onTriggerClick = () => {
    // The hover that opened it is usually followed by a click; that click keeps it open.
    // The flag, not `open`, is checked: a touch tap fires mouseenter and click back to back,
    // before the hover's render, so `open` would still read false here.
    if (openedByHover.current) {
      openedByHover.current = false;
      setOpen(true);
      return;
    }
    openedByHover.current = false;
    setOpen((current) => !current);
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openWithFocus('first');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openWithFocus('last');
    }
  };

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = visibleItems(panelRef.current);
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: number | null = null;
    if (event.key === 'ArrowDown') next = index < 0 ? 0 : (index + 1) % items.length;
    else if (event.key === 'ArrowUp') next = index <= 0 ? items.length - 1 : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    if (next === null) return;
    event.preventDefault();
    items[next]?.focus();
  };


  // Tabbing past the last link (or back before the trigger) closes the panel.
  const onRootBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && !rootRef.current?.contains(next)) close();
  };

  const onPanelClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element) || event.target.closest(ITEM_SELECTOR) === null) return;
    close();
    onNavigate?.();
  };

  return (
    <div
      ref={rootRef}
      className="nav-menu"
      data-open={open}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onBlur={onRootBlur}
    >
      <button
        ref={triggerRef}
        type="button"
        className="nav-link nav-menu-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        data-active={active}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKeyDown}
      >
        {label}
        <Icon name="arrowDown" size={11} />
      </button>

      <div
        ref={panelRef}
        id={panelId}
        className={panelClassName === undefined ? 'nav-menu-panel' : `nav-menu-panel ${panelClassName}`}
        hidden={!open}
        onKeyDown={onPanelKeyDown}
        onClick={onPanelClick}
      >
        {children}
      </div>
    </div>
  );
}

interface NavMenuItemBodyProps {
  readonly title: ReactNode;
  /** Secondary line, usually the name in the other language. */
  readonly sub?: ReactNode;
  /** Center colour for the leading dot; omitted items carry no dot. */
  readonly tone?: string;
  /** Marks an item that leaves the site. */
  readonly external?: boolean;
}

/** The inside of one dropdown entry; the caller supplies the link element (`.nav-menu-item`). */
export function NavMenuItemBody({ title, sub, tone, external = false }: NavMenuItemBodyProps) {
  return (
    <>
      {tone !== undefined && <span className="dot" style={{ ['--tone' as string]: tone }} />}
      <span className="nav-menu-item-text">
        <span className="nav-menu-item-title">
          {title}
          {external && <span aria-hidden="true"> ↗</span>}
        </span>
        {sub !== undefined && <span className="nav-menu-item-sub mono">{sub}</span>}
      </span>
    </>
  );
}
