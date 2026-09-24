import type { AdminAuthClient } from './adminAuthClient';
import { captureAsync } from './adminAuthSafety';
import type { AdminAuthAction } from './adminAuthState';

export async function verifyAdminAccess(
  client: AdminAuthClient,
  isCurrent: () => boolean,
  expectedUserId: string | null,
): Promise<AdminAuthAction | null> {
  const userOutcome = await captureAsync(() => client.getAuthenticatedUser());
  if (!isCurrent()) return null;
  if (userOutcome.kind === 'failure') {
    return { type: 'operation-failed', failure: 'identity-check-failed' };
  }
  const userResult = userOutcome.value;
  switch (userResult.kind) {
    case 'expired':
      return { type: 'session-expired' };
    case 'error':
      return { type: 'operation-failed', failure: 'identity-check-failed' };
    case 'authenticated':
      break;
  }
  if (expectedUserId !== null && userResult.user.id !== expectedUserId) {
    return { type: 'session-cleared' };
  }

  const allowlistOutcome = await captureAsync(() => client.checkAdminAllowlist());
  if (!isCurrent()) return null;
  if (allowlistOutcome.kind === 'failure') {
    return { type: 'operation-failed', failure: 'allowlist-check-failed' };
  }
  switch (allowlistOutcome.value.kind) {
    case 'allowed':
      return { type: 'authorization-granted', user: userResult.user };
    case 'denied':
      return { type: 'authorization-denied' };
    case 'error':
      return { type: 'operation-failed', failure: 'allowlist-check-failed' };
  }
}
