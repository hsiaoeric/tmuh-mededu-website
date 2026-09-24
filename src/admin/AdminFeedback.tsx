import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/ui/Icon';
import { AdminButton } from './AdminButton';

export type AdminStatus = 'info' | 'success' | 'warning' | 'error' | 'disabled';

const STATUS_ICONS: Readonly<Record<AdminStatus, IconName>> = {
  info: 'spark',
  success: 'check',
  warning: 'alert',
  error: 'alert',
  disabled: 'minus',
};

type StatusBadgeProps = { readonly status: AdminStatus; readonly children: ReactNode };

export function StatusBadge({ status, children }: StatusBadgeProps) {
  return <span className="admin-status" data-status={status}><Icon name={STATUS_ICONS[status]} />{children}</span>;
}

export function AdminLiveRegion({ children, className }: { readonly children: ReactNode; readonly className: string }) {
  return <span className={`sr-only ${className}`} role="status" aria-live="polite" aria-atomic="true">{children}</span>;
}

type InlineNoticeProps = {
  readonly status: AdminStatus;
  readonly title: ReactNode;
  readonly children?: ReactNode;
  readonly action?: ReactNode;
  readonly lang?: string;
};

export function InlineNotice({ status, title, children, action, lang }: InlineNoticeProps) {
  return (
    <div className="admin-notice" data-status={status} role={status === 'error' ? 'alert' : 'status'} lang={lang}>
      <Icon name={STATUS_ICONS[status]} />
      <div className="admin-notice-copy"><strong>{title}</strong>{children ? <p>{children}</p> : null}</div>
      {action ? <div className="admin-notice-action">{action}</div> : null}
    </div>
  );
}

export type StateKind = 'loading' | 'empty' | 'filtered-empty' | 'error' | 'success' | 'disabled';
type StatePanelProps = {
  readonly kind: StateKind;
  readonly title: string;
  readonly description: ReactNode;
  readonly descriptionLang?: string;
  readonly announceLoading?: boolean;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
};

const STATE_STATUS: Readonly<Record<StateKind, AdminStatus>> = {
  loading: 'info',
  empty: 'disabled',
  'filtered-empty': 'warning',
  error: 'error',
  success: 'success',
  disabled: 'disabled',
};

export function StatePanel({ kind, title, description, descriptionLang, announceLoading = true, actionLabel, onAction }: StatePanelProps) {
  const status = STATE_STATUS[kind];
  return (
    <section className="admin-state-panel" data-state={kind} aria-live={kind === 'loading' && announceLoading ? 'polite' : undefined}>
      <span className="admin-state-icon"><Icon name={STATUS_ICONS[status]} /></span>
      <div><h3>{title}</h3><p lang={descriptionLang}>{description}</p></div>
      {actionLabel && onAction ? <AdminButton variant="secondary" icon="refresh" onClick={onAction}>{actionLabel}</AdminButton> : null}
    </section>
  );
}
