import type { AdminAuthEventPayload } from './adminAuthClient';
import type { AdminAuthState, AdminAuthUser } from './adminAuthState';

export type AdminAuthEventDecision =
  | { readonly kind: 'ignore' }
  | { readonly kind: 'clear-session' }
  | { readonly kind: 'unsupported' }
  | {
      readonly kind: 'verify';
      readonly previouslyAuthorizedUser: AdminAuthUser | null;
    };

function unexpected(value: never): never {
  throw new TypeError(`Unexpected administrator auth event: ${JSON.stringify(value)}`);
}

function authorizedUser(state: AdminAuthState): AdminAuthUser | null {
  switch (state.status) {
    case 'authorized':
    case 'reauthorizing':
      return state.user;
    case 'booting':
    case 'config-error':
    case 'anonymous':
    case 'authenticating':
    case 'signing-out':
    case 'verifying':
    case 'denied':
    case 'expired':
    case 'error':
      return null;
    default:
      return unexpected(state);
  }
}

export function decideAdminAuthEvent(
  state: AdminAuthState,
  payload: AdminAuthEventPayload,
  logoutIntent: boolean,
): AdminAuthEventDecision {
  if (logoutIntent && payload.event !== 'SIGNED_OUT') return { kind: 'ignore' };
  if (!payload.sessionPresent || payload.event === 'SIGNED_OUT') {
    return { kind: 'clear-session' };
  }
  switch (payload.event) {
    case 'INITIAL_SESSION':
    case 'SIGNED_IN':
    case 'TOKEN_REFRESHED':
    case 'USER_UPDATED': {
      const user = authorizedUser(state);
      return {
        kind: 'verify',
        previouslyAuthorizedUser:
          user !== null && payload.sessionUserId === user.id ? user : null,
      };
    }
    case 'PASSWORD_RECOVERY':
    case 'UNSUPPORTED':
      return { kind: 'unsupported' };
    default:
      return unexpected(payload.event);
  }
}
