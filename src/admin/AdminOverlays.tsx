import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/ui/Icon';
import { AdminButton, AdminIconButton } from './AdminButton';
import type { AdminStatus } from './AdminFeedback';
import { getFocusableElements } from './focus';

type AdminDialogProps = {
  readonly open: boolean;
  readonly title: string;
  readonly description: string;
  readonly onClose: () => void;
  readonly triggerRef?: RefObject<HTMLElement>;
  readonly children: ReactNode;
  readonly actions?: ReactNode;
  readonly dismissible?: boolean;
  readonly closeLabel?: string;
};

export function AdminDialog({ open, title, description, onClose, triggerRef, children, actions, dismissible = true, closeLabel = '關閉對話框' }: AdminDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = `${useId()}-title`;
  const descriptionId = `${titleId}-description`;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    returnFocusRef.current = triggerRef?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => {
      const first = getFocusableElements(panel)[0];
      (first ?? panel).focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusableElements(panel);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        panel.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const returnFocus = triggerRef?.current ?? returnFocusRef.current;
      returnFocusRef.current = null;
      returnFocus?.focus();
    };
  }, [dismissible, open, triggerRef]);

  if (!open) return null;
  return createPortal(
    <div className="admin-dialog-layer">
      <button className="admin-dialog-backdrop" type="button" aria-label={closeLabel} tabIndex={-1} onClick={dismissible ? onClose : undefined} />
      <div ref={panelRef} className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1}>
        <header><div><h2 id={titleId}>{title}</h2><p id={descriptionId}>{description}</p></div>{dismissible ? <AdminIconButton icon="close" label={closeLabel} onClick={onClose} /> : null}</header>
        <div className="admin-dialog-body">{children}</div>
        {actions ? <footer className="admin-dialog-actions">{actions}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}

type ConfirmDialogProps = Omit<AdminDialogProps, 'children' | 'actions'> & {
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly onConfirm: () => void;
  readonly confirming?: boolean;
  readonly warning?: boolean;
  readonly body?: string;
  /** Extra content under the body, such as a summary of what the action changes. */
  readonly details?: ReactNode;
};

export function ConfirmDialog({ confirmLabel, cancelLabel, onConfirm, onClose, confirming = false, warning = false, body = '請先確認這項操作的影響，再決定是否繼續。', details, ...dialogProps }: ConfirmDialogProps) {
  return <AdminDialog {...dialogProps} onClose={onClose} actions={<><AdminButton disabled={confirming} onClick={onClose}>{cancelLabel}</AdminButton><AdminButton variant={warning ? 'warning' : 'primary'} loading={confirming} onClick={onConfirm}>{confirmLabel}</AdminButton></>}><p>{body}</p>{details}</AdminDialog>;
}

type AdminToastProps = {
  readonly status: AdminStatus;
  readonly title: string;
  readonly description?: ReactNode;
  readonly onDismiss?: () => void;
  readonly dismissLabel?: string;
};

export function AdminToast({ status, title, description, onDismiss, dismissLabel = '關閉通知' }: AdminToastProps) {
  return (
    <div className="admin-toast" data-status={status} role={status === 'error' ? 'alert' : 'status'}>
      <Icon name={status === 'success' ? 'check' : status === 'disabled' ? 'minus' : status === 'info' ? 'spark' : 'alert'} />
      <div><strong>{title}</strong>{description ? <p>{description}</p> : null}</div>
      {onDismiss ? <AdminIconButton icon="close" label={dismissLabel} onClick={onDismiss} /> : null}
    </div>
  );
}
