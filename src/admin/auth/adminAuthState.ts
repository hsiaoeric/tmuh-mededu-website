export type AdminAuthUser = {
  readonly id: string;
  readonly email: string | null;
};

export type AdminAuthConfigurationFailure =
  | { readonly kind: 'disabled' }
  | { readonly kind: 'invalid'; readonly reason: 'partial' | 'invalid' };

export type AdminAuthOperationFailure =
  | 'client-unavailable'
  | 'sign-in-failed'
  | 'identity-check-failed'
  | 'allowlist-check-failed'
  | 'sign-out-failed'
  | 'unsupported-auth-event';

export type AdminAuthState =
  | { readonly status: 'booting' }
  | {
      readonly status: 'config-error';
      readonly failure: AdminAuthConfigurationFailure;
    }
  | { readonly status: 'anonymous' }
  | { readonly status: 'authenticating' }
  | { readonly status: 'signing-out' }
  | { readonly status: 'verifying' }
  | { readonly status: 'authorized'; readonly user: AdminAuthUser }
  | { readonly status: 'reauthorizing'; readonly user: AdminAuthUser }
  | { readonly status: 'denied' }
  | { readonly status: 'expired' }
  | { readonly status: 'error'; readonly failure: AdminAuthOperationFailure };

export type AdminAuthAction =
  | { readonly type: 'boot' }
  | {
      readonly type: 'configuration-failed';
      readonly failure: AdminAuthConfigurationFailure;
    }
  | { readonly type: 'session-cleared' }
  | { readonly type: 'sign-in-started' }
  | { readonly type: 'sign-out-started' }
  | { readonly type: 'verification-started' }
  | { readonly type: 'reauthorization-started'; readonly user: AdminAuthUser }
  | {
      readonly type: 'authorization-granted';
      readonly user: AdminAuthUser;
    }
  | { readonly type: 'authorization-denied' }
  | { readonly type: 'session-expired' }
  | {
      readonly type: 'operation-failed';
      readonly failure: AdminAuthOperationFailure;
    };

export const INITIAL_ADMIN_AUTH_STATE: AdminAuthState = { status: 'booting' };

function unexpectedAction(action: never): never {
  throw new TypeError(`Unexpected administrator auth action: ${JSON.stringify(action)}`);
}

export function reduceAdminAuthState(
  _state: AdminAuthState,
  action: AdminAuthAction,
): AdminAuthState {
  switch (action.type) {
    case 'boot':
      return INITIAL_ADMIN_AUTH_STATE;
    case 'configuration-failed':
      return { status: 'config-error', failure: action.failure };
    case 'session-cleared':
      return { status: 'anonymous' };
    case 'sign-in-started':
      return { status: 'authenticating' };
    case 'sign-out-started':
      return { status: 'signing-out' };
    case 'verification-started':
      return { status: 'verifying' };
    case 'reauthorization-started':
      return { status: 'reauthorizing', user: action.user };
    case 'authorization-granted':
      return { status: 'authorized', user: action.user };
    case 'authorization-denied':
      return { status: 'denied' };
    case 'session-expired':
      return { status: 'expired' };
    case 'operation-failed':
      return { status: 'error', failure: action.failure };
    default:
      return unexpectedAction(action);
  }
}
