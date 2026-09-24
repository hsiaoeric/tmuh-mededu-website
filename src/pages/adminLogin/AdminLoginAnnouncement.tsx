import type { ReactNode } from 'react';
import type { AdminAuthState } from '@/admin/auth';

type AdminLoginAnnouncementProps = {
  readonly description: ReactNode;
  readonly state: AdminAuthState;
  readonly title: string;
};

function unexpected(state: never): never {
  throw new TypeError(`Unexpected administrator announcement state: ${JSON.stringify(state)}`);
}

export function AdminLoginAnnouncement({
  description,
  state,
  title,
}: AdminLoginAnnouncementProps): ReactNode {
  switch (state.status) {
    case 'authenticating':
    case 'verifying':
    case 'signing-out':
      return <><strong>{title}</strong>{' '}{description}</>;
    case 'booting':
    case 'config-error':
    case 'anonymous':
    case 'authorized':
    case 'reauthorizing':
    case 'denied':
    case 'expired':
    case 'error':
      return null;
    default:
      return unexpected(state);
  }
}
