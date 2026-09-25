import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { AdminIconName } from './AdminIcon';
import { AdminIconButton } from './AdminButton';

type AdminPopoverProps = {
  readonly label: string;
  readonly icon: AdminIconName;
  /** Receives `close`, for actions that hand off to a dialog, and the trigger to return focus to. */
  readonly children: (close: () => void, triggerRef: RefObject<HTMLButtonElement>) => ReactNode;
};

/** A non-modal panel under an icon button; closes on Escape or a click elsewhere. */
export function AdminPopover({ label, icon, children }: AdminPopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || rootRef.current?.contains(event.target) !== true) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="admin-popover">
      <AdminIconButton ref={triggerRef} icon={icon} label={label} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((current) => !current)} />
      <div id={panelId} className="admin-popover-panel" hidden={!open}>
        {children(() => setOpen(false), triggerRef)}
      </div>
    </div>
  );
}
