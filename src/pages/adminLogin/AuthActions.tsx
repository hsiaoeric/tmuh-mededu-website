import { AdminButton } from '@/admin/AdminButton';
import type { AdminAuthPresentationActionItem } from '@/admin/auth';

function unexpected(action: never): never {
  throw new TypeError(`Unexpected administrator login action: ${JSON.stringify(action)}`);
}

type AuthActionsProps = {
  readonly actions: readonly AdminAuthPresentationActionItem[];
  readonly busy: boolean;
  readonly busyLabel: string;
  readonly onRetry: () => Promise<void>;
  readonly onSignOut: () => Promise<void>;
};

export function AuthActions({
  actions,
  busy,
  busyLabel,
  onRetry,
  onSignOut,
}: AuthActionsProps) {
  return actions.map((item) => {
    switch (item.action) {
      case 'signIn':
        return (
          <AdminButton
            key={item.action}
            type="submit"
            variant="primary"
            loading={busy}
          >
            {busy ? busyLabel : item.label}
          </AdminButton>
        );
      case 'retry':
        return (
          <AdminButton
            key={item.action}
            variant="primary"
            icon="refresh"
            onClick={() => void onRetry()}
          >
            {item.label}
          </AdminButton>
        );
      case 'signOut':
        return (
          <AdminButton
            key={item.action}
            variant="secondary"
            onClick={() => void onSignOut()}
          >
            {item.label}
          </AdminButton>
        );
      default:
        return unexpected(item.action);
    }
  });
}
