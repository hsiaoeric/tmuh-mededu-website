import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from '@/ui/Icon';

export type AdminButtonVariant = 'primary' | 'secondary' | 'quiet' | 'warning';

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: AdminButtonVariant;
  readonly icon?: IconName;
  readonly loading?: boolean;
  readonly success?: boolean;
  readonly children: ReactNode;
};

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(function AdminButton({
  variant = 'secondary',
  icon,
  loading = false,
  success = false,
  disabled,
  children,
  className = '',
  type = 'button',
  ...buttonProps
}, ref) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...buttonProps}
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-variant={variant}
      data-loading={loading || undefined}
      data-success={success || undefined}
      className={`admin-button ${className}`}
    >
      <span className="admin-button-icon" aria-hidden="true">
        {loading ? <span className="admin-loading-mark" /> : success ? <Icon name="check" /> : icon ? <Icon name={icon} /> : null}
      </span>
      <span>{children}</span>
    </button>
  );
});

type AdminIconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  readonly label: string;
  readonly icon: IconName;
  readonly pressed?: boolean;
};

export const AdminIconButton = forwardRef<HTMLButtonElement, AdminIconButtonProps>(function AdminIconButton({
  label,
  icon,
  pressed,
  className = '',
  type = 'button',
  ...buttonProps
}, ref) {
  return (
    <button
      {...buttonProps}
      ref={ref}
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={`admin-icon-button ${className}`}
    >
      <Icon name={icon} />
    </button>
  );
});
